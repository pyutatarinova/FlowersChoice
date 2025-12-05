"""Создаёт эмбеддинги (intfloat/multilingual-e5-base) для строк таблицы `plants`
и сохраняет их в колонку `embeddings` типа `vector` (pgvectors).

Как это работает:
- подключается к PostgreSQL (использует переменные окружения, те же, что и app/db/db_connection.py)
- читает все строки из public.plants, объединяет все столбцы (кроме `id` и `embeddings`) в один текст
- получает batched эмбеддинги из SentenceTransformer
- создаёт расширение pgvectors и колонку embeddings если их нет
- записывает эмбеддинги обратно в таблицу

Запуск:
    python creating_embed.py --batch-size 64

"""
from __future__ import annotations

import os
import sys
import argparse
import math
from typing import List, Tuple

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from tqdm import tqdm


load_dotenv()

# DB конфиг (по умолчанию берётся тот же, что и в app/db/db_connection.py)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "mysite")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "12345")


def get_connection():
    dsn = (
        f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASS}"
    )
    return psycopg2.connect(dsn)


def fetch_all_rows(conn) -> Tuple[List[str], List[dict]]:
    """Возвращает список колонок и список строк (dict) из public.plants"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='plants' ORDER BY ordinal_position;")
        cols = [r["column_name"] for r in cur.fetchall()]

        cur.execute("SELECT * FROM public.plants;")
        rows = cur.fetchall()

    return cols, rows


def make_combined_text_from_row(columns: List[str], row: dict) -> str:
    parts = []
    for c in columns:
        # пропускаем служебные поля
        if c.lower() in ("id", "embeddings", "embedding"):
            continue

        v = row.get(c)
        if v is None:
            continue
        s = str(v).strip()
        if s == "" or s.lower() == "nan":
            continue

        parts.append(f"{c}: {s}")

    return ". ".join(parts)


def ensure_pgvector_and_column(conn, dim: int) -> None:
    """Попытаться создать расширение и колонку embeddings vector(dim) если их нет"""
    with conn.cursor() as cur:
        try:
            # Создаст расширение, если возможно
            cur.execute("CREATE EXTENSION IF NOT EXISTS pgvectors;")
        except Exception:
            # Не фатально — может потребовать привилегий
            print("⚠️  Не удалось создать расширение pgvectors (возможно недостаточно прав). Продолжаю...")

        # Проверяем существование колонки
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='plants' AND column_name='embeddings';")
        if cur.fetchone() is None:
            print(f"➕ Колонка embeddings не найдена — добавляю vector({dim})")
            cur.execute(f"ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS embeddings vector({dim});")
        else:
            print("ℹ️  Колонка embeddings уже существует — пропускаю создание")

    conn.commit()


def update_embeddings(conn, pk_column: str, ids: List, embeddings: np.ndarray, batch_commit: bool = False) -> None:
    """Обновляет записи embeddings (embeddings колонка) по списку id.

    Ожидается: embeddings.shape == (len(ids), dim)
    Запись использует литерал строки '[v1,v2,...]' и каст -> %s::vector
    """
    n = len(ids)
    with conn.cursor() as cur:
        for i, _id in enumerate(ids):
            emb = embeddings[i]
            # Форматируем в строку — постгресный вектор ожидает что-то вроде '[0.1,0.2,...]'
            arr_literal = '[' + ','.join(f"{float(x):.6f}" for x in emb.tolist()) + ']'
            cur.execute("UPDATE public.plants SET embeddings = %s::vector WHERE " + pk_column + " = %s;", (arr_literal, _id))

    if batch_commit:
        conn.commit()


def main(batch_size: int = 128, dry_run: bool = False):
    print("🔃 Загружаю модель intfloat/multilingual-e5-base — это может занять время...")
    model = SentenceTransformer("intfloat/multilingual-e5-base")
    print("✅ Модель загружена успешно!")

    conn = get_connection()

    try:
        columns, rows = fetch_all_rows(conn)
        if not rows:
            print("⚠️  В таблице public.plants нет строк — завершаю")
            return

        # Определяем PK столбец (ищем id, plant_id или первый столбец)
        pk_candidates = [c for c in columns if c.lower() in ("id", "plant_id", "pk")]
        pk_column = pk_candidates[0] if pk_candidates else columns[0]

        print(f"ℹ️  Всего строк: {len(rows)} — использую PK столбец: {pk_column}")

        # Собираем тексты
        prompts = []
        ids = []
        for r in rows:
            combined = make_combined_text_from_row(columns, r)
            if combined.strip() == "":
                # если нет данных кроме id — пропускаем
                combined = r.get(pk_column, "") or ""

            prompts.append("passage: " + combined)
            ids.append(r.get(pk_column))

        # Подсчёт и батчинг
        total = len(prompts)
        print(f"ℹ️  Получаю эмбеддинги для {total} записей (batch_size={batch_size})")

        # Получаем embeddings батчами
        all_embeddings = []
        for i in tqdm(range(0, total, batch_size), desc="Encoding batches"):
            batch_prompts = prompts[i : i + batch_size]
            emb = model.encode(batch_prompts, normalize_embeddings=True, show_progress_bar=False)
            all_embeddings.append(emb)

        all_embeddings = np.vstack(all_embeddings)

        # Определим размерность и подготовим колонку
        dim = int(all_embeddings.shape[1])
        ensure_pgvector_and_column(conn, dim)

        if dry_run:
            print("✅ dry-run: сгенерированы эмбеддинги, но не записаны в БД")
            return

        # Применяем обновления маленькими батчами, коммит в конце
        commit_every = max(50, batch_size)
        for i in tqdm(range(0, total, commit_every), desc="Updating DB"):
            segment_ids = ids[i : i + commit_every]
            segment_embs = all_embeddings[i : i + commit_every]
            update_embeddings(conn, pk_column, segment_ids, segment_embs)
            conn.commit()

        print("✅ Всё готово — эмбеддинги записаны в колонку embeddings (pgvectors)")

    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create embeddings for plants table and save into pgvector column")
    parser.add_argument("--batch-size", type=int, default=128, help="SentenceTransformer batch size for encoding")
    parser.add_argument("--dry-run", action="store_true", help="Only compute embeddings but don't write to DB")
    args = parser.parse_args()

    main(batch_size=args.batch_size, dry_run=args.dry_run)
