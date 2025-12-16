"""Repository layer for accessing plants and performing pgvector searches.

This module provides a small, testable `PlantRepository` class that encapsulates
database access and the pgvector nearest-neighbour query. The repository is
kept minimal on purpose and avoids ORM dependencies so it can be used in
scripts and web apps alike.

Usage:
    repo = PlantRepository()
    results = repo.top_k_by_embedding(embedding_list, k=10)

Results: list of tuples `(id: int, distance: float)` ordered by distance (asc).
"""
from __future__ import annotations

import os
from typing import List, Tuple, Dict, Any

from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql
import psycopg2.extras as extras


load_dotenv()


def _get_dsn() -> str:
    host = os.getenv("DB_HOST") or "localhost"
    port = int(os.getenv("DB_PORT"))
    dbname = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASS")

    return f"host={host} port={port} dbname={dbname} user={user} password={password}"


class PlantRepository:
    """Simple repository to query plants and run vector nearest-neighbour search.

    This class uses psycopg2 directly and keeps SQL explicit so the behaviour
    is easy to inspect and test. It expects a `embedding` column of type
    `vector` to exist on `public.plants` (pgvector extension).
    """

    def __init__(self, dsn: str | None = None) -> None:
        self._dsn = dsn or _get_dsn()

    def _get_connection(self):
        return psycopg2.connect(self._dsn)

    def top_k_by_embedding(self, embedding: List[float], k: int = 10) -> List[Dict[str, Any]]:
        """Return top-k plants with their fields and cosine similarity.

        Returns a list of dicts with keys: `id`, `name`, `features` and
        `cosine_similarity` (higher == more similar). The `features` field is
        returned as a Python object (decoded from JSONB).
        """
        if not embedding:
            return []

        # Format embedding as Postgres vector literal like '[0.1,0.2,...]'
        arr_literal = '[' + ','.join(f"{float(x):.10f}" for x in embedding) + ']'

        # Compose SQL with Literal to avoid param-formatting issues when
        # embedding literal contains characters that confused param substitution.
        # features добавить
        query = sql.SQL(
            "SELECT id, name, features, 1 - (embedding <=> {vec}::vector) AS cosine_similarity "
            "FROM public.plants WHERE embedding IS NOT NULL "
            "ORDER BY cosine_similarity DESC LIMIT {limit};"
        ).format(vec=sql.Literal(arr_literal), limit=sql.Literal(k))

        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
                cur.execute(query)
                rows = cur.fetchall()

        # rows are RealDictRow -> convert to plain dicts and ensure types
        results: List[Dict[str, Any]] = []
        for r in rows:
            results.append({
                'id': int(r['id']),
                'name': r.get('name'),
                'features': r.get('features'),
                'cosine_similarity': float(r.get('cosine_similarity')) if r.get('cosine_similarity') is not None else None,
            })

        return results
