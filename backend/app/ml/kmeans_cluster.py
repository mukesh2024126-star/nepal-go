"""K-Means user clustering."""
import os
import pickle
from typing import Any
from pathlib import Path
import numpy as np
from sklearn.cluster import KMeans  # type: ignore[import-untyped]
from sklearn.preprocessing import StandardScaler  # type: ignore[import-untyped]
from sklearn.metrics import silhouette_score  # type: ignore[import-untyped]

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"

_kmeans_model: Any = None
_kmeans_scaler: Any = None
_cluster_labels: dict[int, str] = {}


def load_kmeans_model():
    global _kmeans_model, _kmeans_scaler, _cluster_labels
    model_path = MODELS_DIR / "kmeans_model.pkl"
    scaler_path = MODELS_DIR / "kmeans_scaler.pkl"

    if model_path.exists() and scaler_path.exists():
        with open(model_path, "rb") as f:
            _kmeans_model = pickle.load(f)
        with open(scaler_path, "rb") as f:
            _kmeans_scaler = pickle.load(f)
        _assign_cluster_labels()
        print("[KMeans] Models loaded successfully.")
    else:
        print("[KMeans] Model files not found. Run train.py first.")


def _assign_cluster_labels():
    """Assign labels to clusters based on centroid analysis."""
    global _cluster_labels
    if _kmeans_model is None or _kmeans_scaler is None:
        return

    centroids = _kmeans_model.cluster_centers_
    # Inverse transform to get real-scale centroids
    real_centroids = _kmeans_scaler.inverse_transform(centroids)

    label_options = [
        ("Adventure Backpacker", 0),   # adventure_score index
        ("Cultural Explorer", 1),       # cultural_score index
        ("Nature Enthusiast", 2),       # nature_score index
        ("Luxury Traveller", 3),        # luxury_score index
    ]

    assigned = set()
    _cluster_labels = {}

    for label, feat_idx in sorted(
        label_options,
        key=lambda x: max(real_centroids[:, x[1]]),
        reverse=True
    ):
        best_cluster = None
        best_val = -1
        for c in range(_kmeans_model.n_clusters):
            if c not in assigned and real_centroids[c, feat_idx] > best_val:
                best_val = real_centroids[c, feat_idx]
                best_cluster = c
        if best_cluster is not None:
            _cluster_labels[best_cluster] = label
            assigned.add(best_cluster)

    # Fill remaining clusters
    for c in range(_kmeans_model.n_clusters):
        if c not in _cluster_labels:
            _cluster_labels[c] = f"Traveller Type {c + 1}"


def predict_cluster(features: list[float]) -> tuple[int, str]:
    """Predict cluster for a user. features: [adv, cul, nat, lux, budget, trip_dur]"""
    if _kmeans_model is None or _kmeans_scaler is None:
        return 0, "Unknown"
    arr = np.array([features])
    scaled = _kmeans_scaler.transform(arr)
    cluster_id = int(_kmeans_model.predict(scaled)[0])
    label = _cluster_labels.get(cluster_id, f"Traveller Type {cluster_id}")
    return cluster_id, label


def train_kmeans(data_path: str, n_clusters: int = 4):
    """Train K-Means model from users_synthetic.csv."""
    global _kmeans_model, _kmeans_scaler
    import pandas as pd  # type: ignore[import-untyped]
    os.makedirs(MODELS_DIR, exist_ok=True)

    df = pd.read_csv(data_path)
    feature_cols = [
        "adventure_score", "cultural_score", "nature_score",
        "luxury_score", "budget_level", "trip_duration_preference"
    ]
    X = df[feature_cols].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Elbow method
    inertias = []
    for k in range(2, 11):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(X_scaled)
        inertias.append(km.inertia_)
    print(f"[KMeans] Elbow inertias (k=2..10): {[round(i, 2) for i in inertias]}")

    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    model.fit(X_scaled)

    sil = silhouette_score(X_scaled, model.labels_)
    print(f"[KMeans] Silhouette score (k={n_clusters}): {sil:.4f}")

    with open(MODELS_DIR / "kmeans_model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(MODELS_DIR / "kmeans_scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)

    _kmeans_model = model
    _kmeans_scaler = scaler
    _assign_cluster_labels()
    print(f"[KMeans] Cluster labels: {_cluster_labels}")
    return sil
