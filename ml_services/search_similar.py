"""Search service for finding similar plants by text prompt.

This module provides a small, testable `PlantSearchService` that converts a
user text prompt to an embedding and delegates the nearest-neighbour search to
`PlantRepository` (pgvector). The public `find_similar_plants(text, k)` helper
returns the top-K (id, distance) tuples ordered by cosine distance (smaller
means more similar).
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Tuple, Dict, Any
import json

import numpy as np
from sentence_transformers import SentenceTransformer

# Support both direct execution and package imports
try:
    from .plant_repository import PlantRepository
except ImportError:
    # Add current directory to path for direct execution
    sys.path.insert(0, str(Path(__file__).parent))
    from plant_repository import PlantRepository


class PlantSearchService:
    """Service that embeds a text prompt and finds nearest plants.

    The model is loaded lazily and cached on the class so repeated calls are
    efficient. The repository can be injected for testing.
    """

    _model: SentenceTransformer | None = None

    def __init__(self, repo: PlantRepository | None = None, model_name: str = "intfloat/multilingual-e5-base") -> None:
        self.model_name = model_name
        self.repo = repo or PlantRepository()

    @classmethod
    def _get_model(cls, model_name: str) -> SentenceTransformer:
        if cls._model is None:
            cls._model = SentenceTransformer(model_name)
        return cls._model

    def _embed_text(self, text: str) -> List[float]:
        """Encode `text` and return a 1D normalized list of floats.

        Normalization is enabled to make cosine-based searches stable.
        """
        model = self._get_model(self.model_name)
        emb = model.encode([text], normalize_embeddings=True, show_progress_bar=False)
        return list(np.asarray(emb[0], dtype=float))

    def find_similar_plants(self, text: str, user_id: int, top_k: int = 10) -> List[Dict[str, Any]]:
        """Return top-k plants (as dicts) for the given text prompt.

        - `text` is encoded using the SentenceTransformer model.
        - Repository returns full plant fields plus `cosine_similarity`.
        - Excludes plants already in user's favorites or my_plants.
        """
        if not isinstance(text, str) or not text.strip():
            return []
        print('Starting embedding computation...')
        embedding = self._embed_text(text.strip())
        print('Embedding computed, querying repository...')
        results = self.repo.top_k_by_embedding(embedding, user_id=user_id, k=top_k)
        return results


# def find_similar_plants(text: str, top_k: int = 10) -> str:
#     """Convenience helper: compute embedding and return JSON string with top-K plants.

#     Returns a single JSON object with key `plants` containing a list of up to
#     `top_k` plant objects. Fields from the `features` JSONB column are promoted
#     to the top level for each plant (so there is no nested `features`). Each
#     plant object includes `id`, `name`, promoted feature fields and
#     `cosine_similarity`.
#     """
#     service = PlantSearchService()
#     results = service.find_similar_plants(text, top_k=top_k)

#     flattened: List[Dict[str, Any]] = []
#     # desired_features = ['light_requirements', 'watering_frequency', 'humidity_preference', 'toxicity']
#     for r in results:
#         features = r.get('features') or {}
#         merged: Dict[str, Any] = {}
#         # for key in desired_features:
#         #     if key in features:
#         #         merged[key] = features[key]
#         if isinstance(features, dict):
#             merged.update(features)
#         # Ensure primary fields override any feature keys
#         merged['id'] = r.get('id')
#         merged['name'] = r.get('name')
#         merged['cosine_similarity'] = r.get('cosine_similarity')
#         flattened.append(merged)

#     return json.dumps({'plants': flattened}, ensure_ascii=False)


# if __name__ == "__main__":
#     import sys

#     prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "small fragrant pink shrub, ovate leaves"
#     print("Generating top-10 similar plants for prompt:\n", prompt)
#     matches = find_similar_plants(prompt, top_k=10)
#     print("Results (id, distance):")
#     print(matches)

