import time
import logging
from flask import Blueprint, request, jsonify
from backend.config import get_firebase_admin
from backend.ml.lstm_model import lstm_engine
from backend.services.seed_data import generate_historical_series
from backend.middleware.auth import require_role

logger = logging.getLogger("TrafficTwin.Routes.ML")
ml_bp = Blueprint("ml_bp", __name__)

@ml_bp.route("/predict", methods=["POST"])
@require_role("controller")
def train_and_predict():
    data = request.get_json() or {}
    district_id = data.get("districtId", "chennai").lower()
    include_weather = bool(data.get("includeWeather", True))
    epochs = int(data.get("epochs", 8))
    
    _, db_mod, _ = get_firebase_admin()
    historical_series = []
    if db_mod:
        try:
            hist_ref = db_mod.reference(f"HistoricalData/{district_id}").get()
            if hist_ref and isinstance(hist_ref, list):
                historical_series = hist_ref
        except Exception as e:
            logger.warning(f"Error reading historical data for {district_id}: {e}")
            
    # Fallback to dynamic synthetic generation if empty
    if not historical_series or len(historical_series) < 20:
        historical_series = generate_historical_series(district_id, days=30)
        if db_mod:
            try:
                db_mod.reference(f"HistoricalData/{district_id}").set(historical_series)
            except Exception as e:
                logger.debug(f"Historical cache write error: {e}")
                
    result = lstm_engine.train_and_evaluate(
        historical_series=historical_series,
        include_weather=include_weather,
        epochs=epochs
    )
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 400
        
    result["districtId"] = district_id
    
    # Save predictions to Firebase Predictions node
    if db_mod:
        try:
            pred_id = f"pred_{district_id}_{int(time.time())}"
            db_mod.reference(f"Predictions/{pred_id}").set({
                "districtId": district_id,
                "modelType": result["modelType"],
                "includeWeather": include_weather,
                "overallScore": result["overallScore"],
                "futureForecasts": result["futureForecasts"],
                "timestamp": int(time.time())
            })
        except Exception as e:
            logger.warning(f"Error saving predictions to DB: {e}")
            
    return jsonify(result)
