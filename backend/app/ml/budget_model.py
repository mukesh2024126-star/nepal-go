"""Budget prediction model using Linear Regression."""
import os
import pickle
from typing import Any
from pathlib import Path
import numpy as np
from sklearn.linear_model import LinearRegression  # type: ignore[import-untyped]
from sklearn.preprocessing import StandardScaler  # type: ignore[import-untyped]
from sklearn.model_selection import train_test_split  # type: ignore[import-untyped]
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score  # type: ignore[import-untyped]

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"

_budget_model: Any = None
_budget_scaler: Any = None
_model_r2 = 0.0


def load_budget_model():
    global _budget_model, _budget_scaler, _model_r2
    model_path = MODELS_DIR / "budget_model.pkl"
    scaler_path = MODELS_DIR / "budget_scaler.pkl"

    if model_path.exists() and scaler_path.exists():
        with open(model_path, "rb") as f:
            _budget_model = pickle.load(f)
        with open(scaler_path, "rb") as f:
            _budget_scaler = pickle.load(f)
        # Try to load R² score
        r2_path = MODELS_DIR / "budget_r2.pkl"
        if r2_path.exists():
            with open(r2_path, "rb") as f:
                _model_r2 = pickle.load(f)
        print("[Budget] Model loaded successfully.")
    else:
        print("[Budget] Model files not found. Run train.py first.")


def get_confidence():
    if _model_r2 >= 0.85:
        return "high"
    elif _model_r2 >= 0.70:
        return "medium"
    return "low"


def predict_budget(
    num_days: int,
    hotel_type: str,
    activity_count: int,
    travel_month: str,
    destination_base_price: int,
    num_travellers: int = 1,
) -> dict:
    """Predict total trip budget."""
    if _budget_model is None or _budget_scaler is None:
        # Fallback: rule-based estimate
        hotel_map = {"Budget": 0, "Mid-Range": 1, "Luxury": 2}
        hotel_enc = hotel_map.get(hotel_type, 1)
        hotel_costs = [1500, 3500, 8000]
        total = (hotel_costs[hotel_enc] * num_days + activity_count * 1000
                 + num_days * 1500 + num_days * 800) * num_travellers
        return _build_breakdown(int(total))

    hotel_map = {"Budget": 0, "Mid-Range": 1, "Luxury": 2}
    hotel_enc = hotel_map.get(hotel_type, 1)

    month_num = _month_to_int(travel_month)
    if month_num in [3, 4, 5, 9, 10, 11]:
        season_enc = 2  # Peak
    elif month_num in [6, 7, 8]:
        season_enc = 0  # Monsoon
    else:
        season_enc = 1  # Shoulder

    features = np.array([[
        num_days, hotel_enc, activity_count,
        season_enc, destination_base_price, num_travellers
    ]])
    features_scaled = _budget_scaler.transform(features)
    predicted = _budget_model.predict(features_scaled)[0]
    predicted = max(int(predicted), 5000)  # Floor

    return _build_breakdown(predicted)


def _build_breakdown(total: int) -> dict:
    """Break down total into hotel/activity/transport/meals."""
    hotels = int(total * 0.30)
    activities = int(total * 0.29)
    transport = int(total * 0.26)
    meals = total - hotels - activities - transport
    return {
        "predicted_total": total,
        "breakdown": {
            "hotels": hotels,
            "activities": activities,
            "transport": transport,
            "meals": meals,
        },
        "currency": "NPR",
        "model_confidence": get_confidence(),
    }


def _month_to_int(month_str: str) -> int:
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }
    return months.get(month_str.lower(), 10)


def train_budget_model(data_path: str):
    """Train LinearRegression from users_synthetic.csv."""
    global _budget_model, _budget_scaler, _model_r2
    import pandas as pd  # type: ignore[import-untyped]
    os.makedirs(MODELS_DIR, exist_ok=True)

    df = pd.read_csv(data_path)
    feature_cols = [
        "num_days", "hotel_type_encoded", "activity_count",
        "season_encoded", "destination_base_price", "num_travellers"
    ]
    X = df[feature_cols].values
    y = df["total_cost_npr"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = LinearRegression()
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"[Budget] RMSE: {rmse:.2f}")
    print(f"[Budget] MAE: {mae:.2f}")
    print(f"[Budget] R²: {r2:.4f}")

    with open(MODELS_DIR / "budget_model.pkl", "wb") as f:
        pickle.dump(model, f)
    with open(MODELS_DIR / "budget_scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open(MODELS_DIR / "budget_r2.pkl", "wb") as f:
        pickle.dump(r2, f)

    _budget_model = model
    _budget_scaler = scaler
    _model_r2 = r2
    return {"rmse": rmse, "mae": mae, "r2": r2}
