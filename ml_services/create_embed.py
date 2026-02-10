"""Создаёт эмбеддинги (intfloat/multilingual-e5-base) для строк таблицы `plants`
и сохраняет их в колонку `embedding` типа `vector` (pgvector).

Структура таблицы:
    - id: SERIAL PRIMARY KEY
    - name: VARCHAR(255)
    - features: JSONB (содержит все признаки)
    - embedding: VECTOR(768)

Как это работает:
- подключается к PostgreSQL (использует переменные окружения)
- читает все строки из public.plants (id, name, features JSONB)
- объединяет name и все поля из features JSONB в один текст
- получает batched эмбеддинги из SentenceTransformer
- создаёт расширение pgvector и колонку embedding если её нет
- записывает эмбеддинги обратно в таблицу

Запуск:
    python creating_embed.py
При запуске есть параметры, можно указать --batch-size 64

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

load_dotenv('.env')

# DB конфиг
DB_HOST = os.getenv("DB_HOST") or "localhost"
DB_PORT = int(os.getenv("DB_PORT"))
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")


def _validate_db_config():
    missing = []
    if not DB_NAME:
        missing.append("DB_NAME")
    if not DB_USER:
        missing.append("DB_USER")
    if missing:
        print(
            "Error: missing required DB env vars: " + ", ".join(missing) + ".\n"
            "Set them in a .env file or environment before running the script."
        )
        sys.exit(1)


def get_connection():
    dsn = (
        f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASS}"
    )
    return psycopg2.connect(dsn)


def fetch_all_rows(conn) -> Tuple[List[dict], List[int]]:
    """Возвращает список строк с распакованными JSONB и список id из public.plants"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, name, features FROM public.plants;")
        rows = cur.fetchall()

    return rows, [r["id"] for r in rows]


def make_combined_text_from_row(row: dict) -> str:
    """Объединяет name и все поля из JSONB features в один текст"""
    parts = []
    
    # Добавляем name из поля features.plant_name_eng
    features = row.get("features")
    if features and isinstance(features, dict):
        # Получаем английское название растения
        name = features.get("plant_name_eng")
        if name and str(name).strip():
            parts.append(f"name: {name}")
        
        # Фильтруем ключи: либо заканчиваются на _eng, либо входят в разрешенный список
        allowed_keys = {"min_temp", "max_temp", "comfort_temp", "misting", "flowerin", "fragrance"}
        
        for key, value in features.items():
            # Пропускаем plant_name_eng, так как оно уже обработано как name
            if key == "plant_name_eng":
                continue
                
            # Проверяем, подходит ли ключ под критерии
            is_allowed_key = key in allowed_keys or key.endswith("_eng")
            
            if is_allowed_key and value is not None:
                s = str(value).strip()
                if s and s.lower() != "nan":
                    parts.append(f"{key}: {s}")
    
    return ". ".join(parts)  # name: Красная роза. description: Красивая красная роза. price: 250.0


def ensure_pgvector_and_column(conn, dim: int) -> None:
    """Попытаться создать расширение и колонку embedding vector(dim) если её нет"""
    with conn.cursor() as cur:
        try:
            # Создаст расширение, если возможно
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        except Exception:
            print("⚠️  Не удалось создать расширение vector (возможно недостаточно прав). Продолжаю...")

        # Проверяем существование колонки
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='plants' AND column_name='embedding';")
        if cur.fetchone() is None:
            print(f"➕ Колонка embedding не найдена — добавляю vector({dim})")
            cur.execute(f"ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS embedding vector({dim});")
        else:
            print("ℹ️  Колонка embedding уже существует")

    conn.commit()


def update_embeddings(conn, ids: List, embeddings: np.ndarray, batch_commit: bool = False) -> None:
    """Обновляет записи embedding (embedding колонка) по списку id.

    Ожидается: embeddings.shape == (len(ids), dim)
    Запись использует литерал строки '[v1,v2,...]' и каст -> %s::vector
    """
    n = len(ids)
    with conn.cursor() as cur:
        for i, _id in enumerate(ids):
            emb = embeddings[i]
            # Форматируем в строку — постгресный вектор ожидает что-то вроде '[0.1,0.2,...]'
            arr_literal = '[' + ','.join(f"{float(x):.10f}" for x in emb.tolist()) + ']'
            cur.execute("UPDATE public.plants SET embedding = %s::vector WHERE id = %s;", (arr_literal, _id))

    if batch_commit:
        conn.commit()


def main(batch_size: int = 128, dry_run: bool = False):
    print("Загружаю модель intfloat/multilingual-e5-base — это может занять время...")
    model = SentenceTransformer("intfloat/multilingual-e5-base")
    print("Модель загружена успешно!")

    # validate envs before connecting
    _validate_db_config()

    try:
        conn = get_connection()
    except Exception as e:
        print(f"Failed to connect to database {DB_HOST}:{DB_PORT} - {e}")
        raise

    try:
        rows, ids = fetch_all_rows(conn)
        if not rows:
            print("В таблице public.plants нет строк — завершаю")
            return

        print(f"Всего строк: {len(rows)}")

        # Собираем тексты
        prompts = []
        for r in rows:
            combined = make_combined_text_from_row(r)
            if combined.strip() == "":
                combined = r.get("name", "") or ""

            prompts.append("passage: " + combined)

        # Подсчёт и батчинг
        total = len(prompts)
        print(f"Получаю эмбеддинги для {total} записей (batch_size={batch_size})")

        # Получаем embeddings батчами
        all_embeddings = []
        for i in tqdm(range(0, total, batch_size), desc="Encoding batches"):
            batch_prompts = prompts[i : i + batch_size]
            emb = model.encode(batch_prompts, normalize_embeddings=True, show_progress_bar=True)
            all_embeddings.append(emb)

        all_embeddings = np.vstack(all_embeddings)

        # Определим размерность и подготовим колонку
        dim = int(all_embeddings.shape[1])
        ensure_pgvector_and_column(conn, dim)

        if dry_run:
            print("dry-run: сгенерированы эмбеддинги, но не записаны в БД")
            return

        # Применяем обновления маленькими батчами, коммит в конце
        commit_every = max(50, batch_size)
        for i in tqdm(range(0, total, commit_every), desc="Updating DB"):
            segment_ids = ids[i : i + commit_every]
            segment_embs = all_embeddings[i : i + commit_every]
            update_embeddings(conn, segment_ids, segment_embs)
            conn.commit()

        print("[END] Всё готово — эмбеддинги записаны в колонку embedding (pgvector)")

    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create embeddings for plants table and save into pgvector column")
    parser.add_argument("--batch-size", type=int, default=128, help="SentenceTransformer batch size for encoding")
    parser.add_argument("--dry-run", action="store_true", help="Only compute embeddings but don't write to DB")
    args = parser.parse_args()

    main(batch_size=args.batch_size, dry_run=args.dry_run)
