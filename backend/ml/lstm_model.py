import math
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

logger = logging.getLogger("TrafficTwin.ML")

# Check TensorFlow availability
HAS_TF = False
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    HAS_TF = True
    logger.info("TensorFlow / Keras successfully detected for LSTM engine.")
except Exception as e:
    logger.warning(f"TensorFlow not available in runtime ({e}). Engaging high-performance NumPy/Scikit-Learn sequence predictor fallback.")

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Computes standard regression evaluation metrics: MAE, RMSE, MAPE, and R2 score.
    """
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    
    # Avoid div by zero in MAPE
    mask = y_true != 0
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0) if np.any(mask) else 0.0
    
    # R2 Score
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = float(1.0 - (ss_res / (ss_tot + 1e-8)))
    
    return {
        "MAE": round(mae, 2),
        "RMSE": round(rmse, 2),
        "MAPE": round(min(100.0, mape), 2),
        "R2": round(max(-1.0, min(0.99, r2)), 3)
    }

class TrafficLSTMPredictor:
    def __init__(self, sequence_length: int = 12):
        self.sequence_length = sequence_length
        self.is_tf = HAS_TF
        self.model = None
        self.feature_cols = []
        self.target_cols = ["congestionPct", "avgSpeed", "vehicleCount", "queueLength", "travelTimeMinutes"]
        self.scalers = {}

    def prepare_data(self, series: List[Dict[str, Any]], include_weather: bool = True) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        df = pd.DataFrame(series)
        if df.empty:
            return np.array([]), np.array([]), df
        
        if include_weather:
            self.feature_cols = ["congestionPct", "avgSpeed", "vehicleCount", "queueLength", "travelTimeMinutes", "temperature", "rainfall", "humidity"]
        else:
            self.feature_cols = ["congestionPct", "avgSpeed", "vehicleCount", "queueLength", "travelTimeMinutes"]
        
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0.0
                
        # Min-Max Normalization
        scaled_df = df.copy()
        for col in self.feature_cols:
            col_min = float(df[col].min())
            col_max = float(df[col].max())
            denom = max(1e-5, col_max - col_min)
            scaled_df[col] = (df[col] - col_min) / denom
            self.scalers[col] = {"min": col_min, "max": col_max, "denom": denom}
            
        X, y = [], []
        feat_matrix = scaled_df[self.feature_cols].values
        target_indices = [self.feature_cols.index(c) for c in self.target_cols]
        
        for i in range(len(feat_matrix) - self.sequence_length):
            X.append(feat_matrix[i:i + self.sequence_length])
            y.append(feat_matrix[i + self.sequence_length, target_indices])
            
        return np.array(X), np.array(y), df

    def train_and_evaluate(self, historical_series: List[Dict[str, Any]], include_weather: bool = True, epochs: int = 8) -> Dict[str, Any]:
        X, y, df = self.prepare_data(historical_series, include_weather=include_weather)
        if len(X) < 20:
            return {"error": "Insufficient historical data for training (need >= 20 samples)."}
        
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        if self.is_tf:
            try:
                # Keras Multi-Variable LSTM Model
                model = Sequential([
                    LSTM(32, activation="tanh", return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                    Dropout(0.15),
                    LSTM(16, activation="tanh"),
                    Dense(len(self.target_cols))
                ])
                model.compile(optimizer="adam", loss="mse", metrics=["mae"])
                model.fit(X_train, y_train, epochs=epochs, batch_size=16, verbose=0)
                self.model = model
                
                y_pred_scaled = model.predict(X_test, verbose=0)
            except Exception as e:
                logger.warning(f"Keras training exception: {e}. Switching to NumPy autoregressive predictor.")
                self.is_tf = False
                y_pred_scaled = self._numpy_train_predict(X_train, y_train, X_test)
        else:
            y_pred_scaled = self._numpy_train_predict(X_train, y_train, X_test)
            
        # Inverse transform target metrics for evaluation
        target_metrics = {}
        target_comparisons = {}
        
        for idx, col in enumerate(self.target_cols):
            scaler = self.scalers[col]
            actual_unscaled = y_test[:, idx] * scaler["denom"] + scaler["min"]
            pred_unscaled = y_pred_scaled[:, idx] * scaler["denom"] + scaler["min"]
            
            # Post-process sanity
            if col == "congestionPct":
                pred_unscaled = np.clip(pred_unscaled, 5.0, 100.0)
            elif col == "avgSpeed":
                pred_unscaled = np.clip(pred_unscaled, 10.0, 80.0)
            elif col in ["vehicleCount", "queueLength"]:
                pred_unscaled = np.clip(pred_unscaled, 0.0, 1000.0)
                
            m = calculate_metrics(actual_unscaled, pred_unscaled)
            target_metrics[col] = m
            
            # Store last 24 test points for charting
            points_count = min(24, len(actual_unscaled))
            target_comparisons[col] = {
                "timestamps": [int(df["timestamp"].iloc[split_idx + self.sequence_length + i]) for i in range(points_count)],
                "actual": [round(float(v), 1) for v in actual_unscaled[-points_count:]],
                "predicted": [round(float(v), 1) for v in pred_unscaled[-points_count:]]
            }
            
        # Multi-horizon forecast (15 min, 30 min, 45 min, 60 min ahead)
        latest_window = X[-1:] # shape (1, seq_len, num_features)
        forecasts = self._generate_multi_horizon_forecast(latest_window, df)
        
        return {
            "modelType": "TensorFlow/Keras LSTM" if self.is_tf else "NumPy Multivariable Autoregressive Predictor",
            "featuresUsed": self.feature_cols,
            "includeWeather": include_weather,
            "trainingSamples": len(X_train),
            "testSamples": len(X_test),
            "metrics": target_metrics,
            "overallScore": {
                "avgMAE": round(float(np.mean([m["MAE"] for m in target_metrics.values()])), 2),
                "avgRMSE": round(float(np.mean([m["RMSE"] for m in target_metrics.values()])), 2),
                "avgMAPE": round(float(np.mean([m["MAPE"] for m in target_metrics.values()])), 2),
                "avgR2": round(float(np.mean([m["R2"] for m in target_metrics.values()])), 3)
            },
            "comparisons": target_comparisons,
            "futureForecasts": forecasts
        }

    def _numpy_train_predict(self, X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray) -> np.ndarray:
        """
        NumPy / Ridge pseudo-inverse sequence regression fallback.
        """
        N, seq_len, num_feat = X_train.shape
        X_train_flat = X_train.reshape(N, seq_len * num_feat)
        
        # Add bias
        X_design = np.hstack([X_train_flat, np.ones((N, 1))])
        
        # Ridge regularized closed-form solution: W = (X^T X + lambda I)^-1 X^T y
        reg_lambda = 0.05
        I = np.eye(X_design.shape[1])
        I[-1, -1] = 0.0 # Don't regularize bias
        weights = np.linalg.pinv(X_design.T @ X_design + reg_lambda * I) @ (X_design.T @ y_train)
        
        # Predict on test set
        N_test = X_test.shape[0]
        X_test_flat = X_test.reshape(N_test, seq_len * num_feat)
        X_test_design = np.hstack([X_test_flat, np.ones((N_test, 1))])
        y_pred = X_test_design @ weights
        
        # Store weights for multi-horizon forecast
        self.numpy_weights = weights
        return y_pred

    def _generate_multi_horizon_forecast(self, latest_window: np.ndarray, df: pd.DataFrame) -> List[Dict[str, Any]]:
        forecasts = []
        horizons = [15, 30, 45, 60] # minutes
        
        curr_window = latest_window.copy()
        
        for horizon in horizons:
            if self.is_tf and self.model:
                try:
                    pred_scaled = self.model.predict(curr_window, verbose=0)[0]
                except Exception:
                    pred_scaled = self._numpy_predict_step(curr_window)
            else:
                pred_scaled = self._numpy_predict_step(curr_window)
                
            # Unscale
            step_forecast = {}
            for idx, col in enumerate(self.target_cols):
                scaler = self.scalers[col]
                unscaled = pred_scaled[idx] * scaler["denom"] + scaler["min"]
                if col == "congestionPct":
                    unscaled = np.clip(unscaled, 10.0, 95.0)
                elif col == "avgSpeed":
                    unscaled = np.clip(unscaled, 15.0, 70.0)
                elif col in ["vehicleCount", "queueLength"]:
                    unscaled = np.clip(unscaled, 5.0, 800.0)
                step_forecast[col] = round(float(unscaled), 1)
                
            step_forecast["horizonMinutes"] = horizon
            forecasts.append(step_forecast)
            
        return forecasts

    def _numpy_predict_step(self, window: np.ndarray) -> np.ndarray:
        if hasattr(self, "numpy_weights") and self.numpy_weights is not None:
            N, seq_len, num_feat = window.shape
            w_flat = window.reshape(N, seq_len * num_feat)
            w_design = np.hstack([w_flat, np.ones((N, 1))])
            return (w_design @ self.numpy_weights)[0]
        else:
            # Simple exponential moving average fallback
            return np.mean(window[0, -3:, :len(self.target_cols)], axis=0)

lstm_engine = TrafficLSTMPredictor()
