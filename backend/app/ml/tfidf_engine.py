"""TF-IDF recommendation engine."""
import os
import pickle
from typing import Any
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore[import-untyped]
from sklearn.metrics.pairwise import cosine_similarity  # type: ignore[import-untyped]
import numpy as np

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"

_vectorizer: Any = None
_tfidf_matrix: Any = None
_destination_ids: list[str] | None = None


def load_tfidf_models():
    global _vectorizer, _tfidf_matrix, _destination_ids
    vec_path = MODELS_DIR / "tfidf_vectorizer.pkl"
    mat_path = MODELS_DIR / "tfidf_matrix.pkl"
    ids_path = MODELS_DIR / "destination_ids.pkl"

    if vec_path.exists() and mat_path.exists() and ids_path.exists():
        with open(vec_path, "rb") as f:
            _vectorizer = pickle.load(f)
        with open(mat_path, "rb") as f:
            _tfidf_matrix = pickle.load(f)
        with open(ids_path, "rb") as f:
            _destination_ids = pickle.load(f)
        print("[TF-IDF] Models loaded successfully.")
    else:
        print("[TF-IDF] Model files not found. Run train.py first.")


def get_recommendations(query_text: str, top_n: int = 20):
    """Return list of (destination_id, similarity_score) tuples."""
    if _vectorizer is None or _tfidf_matrix is None or _destination_ids is None:
        return []
    query_vec = _vectorizer.transform([query_text])
    similarities = cosine_similarity(query_vec, _tfidf_matrix).flatten()
    top_indices = np.argsort(similarities)[::-1][:top_n]
    results = []
    for idx in top_indices:
        if similarities[idx] > 0:
            results.append((_destination_ids[idx], float(similarities[idx])))
    return results


def train_tfidf(destinations: list[dict]):
    """Train and save TF-IDF model from destination data."""
    global _vectorizer, _tfidf_matrix, _destination_ids
    os.makedirs(MODELS_DIR, exist_ok=True)

    corpus = []
    ids = []
    for d in destinations:
        text_parts = [
            str(d.get("name", "")),
            str(d.get("description", "")),
            str(d.get("category", "")),
            " ".join(d.get("tags", [])) if d.get("tags") else "",
            " ".join(d.get("highlights", [])) if d.get("highlights") else "",
            str(d.get("best_season", "")),
            str(d.get("region", "")),
            str(d.get("difficulty", "")),
        ]
        corpus.append(" ".join(text_parts))
        ids.append(str(d["id"]))

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2), stop_words="english", max_features=5000
    )
    matrix = vectorizer.fit_transform(corpus)

    with open(MODELS_DIR / "tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open(MODELS_DIR / "tfidf_matrix.pkl", "wb") as f:
        pickle.dump(matrix, f)
    with open(MODELS_DIR / "destination_ids.pkl", "wb") as f:
        pickle.dump(ids, f)

    _vectorizer = vectorizer
    _tfidf_matrix = matrix
    _destination_ids = ids
    print(f"[TF-IDF] Trained on {len(corpus)} destinations.")
    return len(corpus)
