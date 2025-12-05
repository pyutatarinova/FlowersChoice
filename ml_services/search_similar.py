"""Search service for finding similar plants in the DB using pgvector.

This module provides a lightweight, testable PlantSearchService class that:
- accepts raw `user_answers` (dict or list) and formats them for the model
- computes an embedding using intfloat/multilingual-e5-base
- queries Postgres (pgvector) to get nearest neighbours by cosine distance

The exported function `find_similar_plants(user_answers, top_k=10)` returns the
top-K plant ids (and distances) ordered by cosine distance (smallest -> most similar).

Usage example (from a Flask route):

    from backend.ml_services.search_similar import PlantSearchService

    service = PlantSearchService()
    ids_and_scores = service.find_similar_plants(user_answers, top_k=10)

"""
from __future__ import annotations

from typing import Any, Dict, Iterable, List, Tuple, Union

import numpy as np
from sentence_transformers import SentenceTransformer

# from backend.app.db.plant_repository import PlantRepository


class PlantSearchService:
    """Service that turns user answers into a model prompt and finds similar plants.

    Responsibilities:
    - convert arbitrary `user_answers` into a model-friendly multi-line text
    - compute a normalized embedding using a cached SentenceTransformer model
    - use PlantRepository to perform a pgvector nearest-neighbor query

    The service is stateless and the model is loaded lazily (cached on the class).
    """

    _model: SentenceTransformer | None = None

    def __init__(self, model_name: str = "intfloat/multilingual-e5-base") -> None:
        self.model_name = model_name
        self.repo = PlantRepository()

    @classmethod
    def _get_model(cls, model_name: str) -> SentenceTransformer:
        if cls._model is None:
            cls._model = SentenceTransformer(model_name)
        return cls._model

    def _format_user_answers(self, user_answers: Union[Dict[str, Any], Iterable[Any], str]) -> str:
        """Turn user_answers into a clear prompt for the encoder.

        The strategy is simple and robust:
        - if `user_answers` is a dict: produce `key: value` lines
        - if an iterable (list/tuple): enumerate lines as `answer_{i+1}: ...`
        - if a string: use it directly

        The final string begins with `query:` to match the same format used for
        plant passages in the embedding pipeline.
        """
        if isinstance(user_answers, str):
            text = user_answers.strip()
        elif isinstance(user_answers, dict):
            parts: List[str] = []
            for k, v in user_answers.items():
                if v is None:
                    continue
                s = str(v).strip()
                if not s:
                    continue
                # Add keys in a readable manner, keep it concise
                parts.append(f"{k}: {s}")
            text = "\n".join(parts)
        else:
            # iterable like list/tuple
            parts = []
            for i, v in enumerate(user_answers):
                if v is None:
                    continue
                s = str(v).strip()
                if not s:
                    continue
                parts.append(f"answer_{i+1}: {s}")
            text = "\n".join(parts)

        # Minimal prefix to keep paragraph consistent with other parts
        if not text.startswith("query:"):
            text = "query: " + text

        return text

    def _embed(self, text: str) -> np.ndarray:
        """Return a single normalized embedding vector as a 1D numpy array.

        The model is loaded lazily and embeddings are normalized to unit length
        (this typically produces best results for cosine distance comparisons).
        """
        model = self._get_model(self.model_name)
        emb = model.encode([text], normalize_embeddings=True, show_progress_bar=False)
        emb = np.asarray(emb[0], dtype=float)
        return emb

    def find_similar_plants(self, user_answers: Union[Dict[str, Any], Iterable[Any], str], top_k: int = 10) -> List[Tuple[int, float]]:
        """Compute embedding for user_answers, query DB and return top-K (id, distance).

        - Returns distances using pgvector's cosine distance (smaller == more similar).
        - The repository returns a list of (id, distance) tuples to keep client code explicit.
        """
        text = self._format_user_answers(user_answers)
        embedding = self._embed(text)

        # Query repository which delegates nearest-neighbour work to Postgres/pgvector.
        results = self.repo.top_k_by_embedding(embedding.tolist(), k=top_k)
        return results


# Small convenience wrapper for importing from other modules (e.g. routes)
def find_similar_plants(user_answers: Union[Dict[str, Any], Iterable[Any], str], top_k: int = 10) -> List[Tuple[int, float]]:
    """Module-level helper returning top_k (id, distance) pairs.

    This keeps calling code concise and avoids re-instantiating the service in
    simple scripts or tests.
    """
    service = PlantSearchService()
    return service.find_similar_plants(user_answers, top_k=top_k)


if __name__ == "__main__":
    # Quick manual behaviour test: reads a JSON-like string from argv or uses a sample list
    import json
    import sys

    if len(sys.argv) > 1:
        raw = sys.argv[1]
        try:
            user_answers = json.loads(raw)
        except Exception:
            user_answers = raw
    else:
        user_answers = {
            "leaf_shape": "ovate",
            "flower_color": "pink",
            "sun_exposure": "full sun to partial shade",
            "notes": "small shrub, fragrant flowers"
        }

    print("⏳ generating top-10 similar plants for:")
    print(user_answers)
    matches = find_similar_plants(user_answers, top_k=10)
    print("✅ results (id, distance):")
    print(matches)

