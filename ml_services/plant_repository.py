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
import json
from typing import List, Tuple, Dict, Any

from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql
import psycopg2.extras as extras


load_dotenv('.env')


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

    def top_k_by_embedding(self, embedding: List[float], user_id: int, k: int = 10) -> List[Dict[str, Any]]:
        """Return top-k plants with their fields and cosine similarity.

        Excludes plants that are already in user's favorites or my_plants.
        
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
        # Exclude plants that are in user's favorites or my_plants
        print (user_id)
        query = sql.SQL(
            "SELECT p.id, p.name, p.features, 1 - (p.embedding <=> {vec}::vector) AS cosine_similarity "
            "FROM public.plants p "
            "WHERE p.embedding IS NOT NULL "
            "AND NOT EXISTS (SELECT 1 FROM user_plants up WHERE up.plant_id = p.id AND up.user_id = {user_id} AND (up.favorite = TRUE OR up.my_plant = TRUE)) "
            "ORDER BY cosine_similarity DESC LIMIT {limit};"
        ).format(vec=sql.Literal(arr_literal), user_id=sql.Literal(user_id), limit=sql.Literal(k))

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

    def register_user(
        self, 
        name: str, 
        email: str, 
        encoded_password: str, 
        features: Dict[str, Any], 
        embedding: List[float], 
        created_at, 
        updated_at
    ) -> Tuple[int, str]:
        """Register a new user and set token.

        Returns a tuple of (user_id, token) where token is the JWT token to be set.
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Insert user and get ID
                cur.execute("""
                    INSERT INTO users (name, email, password, created_at, updated_at, features, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (
                    name,
                    email,
                    encoded_password,
                    created_at,
                    updated_at,
                    json.dumps(features),
                    embedding
                ))

                user_id = cur.fetchone()[0]
                conn.commit()

        return user_id

    def update_user_token(self, user_id: int, token: str) -> None:
        """Update user token in database."""
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET token = %s WHERE id = %s", (token, user_id))
                conn.commit()

    def get_user_by_email(self, email: str) -> Tuple[int, str] | None:
        """Get user ID and password by email.
        
        Returns a tuple of (user_id, password) or None if user not found.
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, password FROM users WHERE email = %s", (email,))
                row = cur.fetchone()
                return row

    def get_user_info(self, user_id: int) -> Dict[str, Any] | None:
        """Get user info by ID.
        
        Returns a dict with user data or None if user not found.
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, name, email, created_at, updated_at, features, embedding
                    FROM users
                    WHERE id = %s
                """, (user_id,))
                row = cur.fetchone()
                
                if not row:
                    return None
                
                return {
                    "id": row[0],
                    "name": row[1],
                    "email": row[2],
                    "created_at": row[3],
                    "updated_at": row[4],
                    "features": row[5],
                    "embedding": row[6],
                }

    def check_user_plant_exists(self, user_id: int, plant_id: int) -> bool:
        """Check if user already has this plant in any category."""
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 1 FROM user_plants
                    WHERE user_id = %s AND plant_id = %s
                """, (user_id, plant_id))
                return cur.fetchone() is not None

    def add_user_plant_favorite(self, user_id: int, plant_id: int) -> None:
        """Add plant to user's favorites."""
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO user_plants (user_id, plant_id, favorite, my_plant, score, comment)
                    VALUES (%s, %s, TRUE, FALSE, 0.0, NULL)
                """, (user_id, plant_id))
                conn.commit()

    def add_or_update_user_my_plant(self, user_id: int, plant_id: int) -> str:
        """Add or update user's own plant.
        
        Returns a message describing what was done.
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Check if record exists
                cur.execute("""
                    SELECT favorite, my_plant FROM user_plants
                    WHERE user_id = %s AND plant_id = %s
                """, (user_id, plant_id))
                
                existing_record = cur.fetchone()
                
                if existing_record:
                    # Update existing record
                    cur.execute("""
                        UPDATE user_plants
                        SET 
                          my_plant = TRUE,
                          favorite = FALSE
                        WHERE user_id = %s AND plant_id = %s
                    """, (user_id, plant_id))
                    message = "Растение добавлено в мои растения"
                else:
                    # Insert new record
                    cur.execute("""
                        INSERT INTO user_plants (user_id, plant_id, favorite, my_plant, score, comment)
                        VALUES (%s, %s, FALSE, TRUE, 0.0, NULL)
                    """, (user_id, plant_id))
                    message = "Растение добавлено в мои растения"
                
                conn.commit()
                return message

    def get_user_plants_by_flag(self, user_id: int, flag_column: str) -> List[Dict[str, Any]]:
        """Get user plants by flag (favorite or my_plant).
        
        Args:
            user_id: User ID
            flag_column: Column name ('favorite' or 'my_plant')
        
        Returns:
            List of plant dicts with id, name, and features.
        """
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
                cur.execute(f"""
                    SELECT p.id, p.name, p.features
                    FROM user_plants up
                    JOIN plants p ON p.id = up.plant_id
                    WHERE up.user_id = %s AND up.{flag_column} = TRUE
                """, (user_id,))
                
                rows = cur.fetchall()
                
                results = []
                for r in rows:
                    plant = {
                        "id": int(r['id']),
                        "name": r.get('name'),
                        "features": r.get('features'),
                    }
                    results.append(plant)
                
                return results

    def remove_user_plant_flag(self, user_id: int, plant_id: int, flag: str) -> str:
        """Remove plant from user's collection by setting flag to FALSE.
        
        If both favorite and my_plant are FALSE and score is 0, delete the record entirely.
        
        Args:
            user_id: User ID
            plant_id: Plant ID
            flag: Flag name ('favorite' or 'my_plant')
        
        Returns:
            Message describing the action.
            
        Raises:
            ValueError: If flag is not 'favorite' or 'my_plant'
            Exception: If plant record doesn't exist
        """
        if flag not in ['favorite', 'my_plant']:
            raise ValueError(f"Invalid flag: {flag}. Must be 'favorite' or 'my_plant'")
        
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Check if record exists
                cur.execute("""
                    SELECT favorite, my_plant, score FROM user_plants
                    WHERE user_id = %s AND plant_id = %s
                """, (user_id, plant_id))
                
                record = cur.fetchone()
                if not record:
                    raise Exception(f"Plant record not found for user_id={user_id}, plant_id={plant_id}")
                
                # Set flag to FALSE
                cur.execute(f"""
                    UPDATE user_plants
                    SET {flag} = FALSE
                    WHERE user_id = %s AND plant_id = %s
                """, (user_id, plant_id))
                
                # Check if record is now "empty" (both flags False and score 0)
                cur.execute("""
                    SELECT favorite, my_plant, score FROM user_plants
                    WHERE user_id = %s AND plant_id = %s
                """, (user_id, plant_id))
                
                updated_record = cur.fetchone()
                favorite, my_plant, score = updated_record
                
                # Delete if both flags are False and score is 0
                if not favorite and not my_plant and (score is None or score == 0.0):
                    cur.execute("""
                        DELETE FROM user_plants
                        WHERE user_id = %s AND plant_id = %s
                    """, (user_id, plant_id))
                    message = "Растение полностью удалено из коллекции"
                else:
                    message = "Растение удалено из " + ("избранного" if flag == "favorite" else "моих растений")
                
                conn.commit()
                return message

    def update_plant_score(self, user_id: int, plant_id: int, score: float) -> None:
        """Update score for a plant in user_plants table.
        
        Args:
            user_id: User ID
            plant_id: Plant ID
            score: Score value to set
        
        Raises:
            Exception: If plant record doesn't exist for user
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Check if record exists
                cur.execute("""
                    SELECT 1 FROM user_plants
                    WHERE user_id = %s AND plant_id = %s
                """, (user_id, plant_id))
                
                if not cur.fetchone():
                    raise Exception(f"Plant record not found for user_id={user_id}, plant_id={plant_id}")
                
                # Update score
                cur.execute("""
                    UPDATE user_plants
                    SET score = %s
                    WHERE user_id = %s AND plant_id = %s
                """, (float(score), user_id, plant_id))
                
                conn.commit()

    def get_plants_rating(self) -> List[Dict[str, Any]]:
        """Get aggregated plant ratings sorted by average score (highest first).
        
        Calculates average score for each plant from all user ratings,
        orders by score descending, and returns with ranking position.
        
        Returns:
            List of dicts with keys: `id`, `name`, `features`, `avg_score`, `rating_position`
        """
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        p.id,
                        p.name,
                        p.features,
                        AVG(up.score) as avg_score,
                        COUNT(up.user_id) as rating_count
                    FROM plants p
                    LEFT JOIN user_plants up ON p.id = up.plant_id
                    GROUP BY p.id, p.name, p.features
                    ORDER BY avg_score DESC NULLS LAST, p.id ASC
                """)
                
                rows = cur.fetchall()
        
        # Convert to list of dicts with ranking position
        results: List[Dict[str, Any]] = []
        for index, r in enumerate(rows, start=1):
            results.append({
                'id': int(r['id']),
                'name': r.get('name'),
                'features': r.get('features'),
                'avg_score': float(r.get('avg_score')) if r.get('avg_score') is not None else 0.0,
                'rating_count': int(r.get('rating_count')) if r.get('rating_count') is not None else 0,
                'rating_position': index,
            })
        
        return results
