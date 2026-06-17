import os
import logging
from typing import Tuple, Dict, Any
from xgboost import XGBClassifier
import joblib
import pandas as pd

from app.ml.preprocess import preprocess_features

logger = logging.getLogger("ml_predict")

class TheftPredictor:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(TheftPredictor, cls).__new__(cls, *args, **kwargs)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
        
        self.model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "xgboost_theft_model.json")
        self.scaler_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "scaler.joblib")
        
        self.model = None
        self.scaler = None
        self.initialized = True
        
        # Load immediately
        self.load_model_artifacts()

    def load_model_artifacts(self) -> bool:
        """Loads or trains the model & scaler files."""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            try:
                # Load XGBoost Model
                self.model = XGBClassifier()
                self.model.load_model(self.model_path)
                
                # Load StandardScaler
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Successfully loaded XGBoost model and Scaler from files.")
                return True
            except Exception as e:
                logger.error(f"Error loading model artifacts: {e}. Attempting retrain.")
        
        # If model files are missing or corrupted, trigger self-healing training
        logger.warning("Model or Scaler not found or failed to load. Triggering model training pipeline...")
        try:
            from app.ml.train import train_model
            success = train_model()
            if success and os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = XGBClassifier()
                self.model.load_model(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Successfully trained and loaded XGBoost model and Scaler.")
                return True
            else:
                logger.error("Failed to train model automatically during initialization.")
                return False
        except Exception as ex:
            logger.error(f"Failed to auto-train model: {ex}")
            return False

    def predict_theft_risk(self, reading_data: Dict[str, Any], threshold: float = 0.75) -> Tuple[float, str]:
        """
        Takes real-time meter readings dictionary, runs preprocessing and scaling,
        and uses the trained XGBoost model to return risk score and status classification.
        """
        # Ensure model is loaded
        if self.model is None or self.scaler is None:
            loaded = self.load_model_artifacts()
            if not loaded:
                # Fallback to simple rule-based heuristics if model cannot be loaded
                logger.warning("ML model unavailable. Falling back to rule-based power math logic.")
                return self._rule_based_fallback(reading_data)

        try:
            # 1. Physical Override Rules (Hybrid Protection)
            voltage = float(reading_data.get("voltage_v", 220))
            current = float(reading_data.get("current_a", 0))
            pf = float(reading_data.get("power_factor", 1))
            energy = float(reading_data.get("energy_consumption_kwh", 0))
            anomaly = float(reading_data.get("anomaly_score", 0))

            if anomaly > 75.0 or (current > 5.0 and energy < 0.01) or (voltage < 160.0 and current > 15.0):
                override_score = 0.95 if (current > 5.0 and energy < 0.01) else (0.88 if anomaly > 75.0 else 0.82)
                logger.info(f"Physical override triggered! Flagged Suspicious. Score = {override_score:.4f}")
                return override_score, "Suspicious"

            # 2. Machine Learning XGBoost Inference
            # Preprocess features
            df_features = preprocess_features(reading_data)
            
            # Scale features
            scaled_features = self.scaler.transform(df_features)
            
            # Predict probability
            risk_score = float(self.model.predict_proba(scaled_features)[0, 1])
            status = "Suspicious" if risk_score >= threshold else "Normal"
            
            logger.info(f"Prediction result: Risk Score = {risk_score:.4f}, Status = {status}")
            return risk_score, status
            
        except Exception as e:
            logger.error(f"Prediction pipeline error: {e}. Falling back to rule-based logic.")
            return self._rule_based_fallback(reading_data)

    def _rule_based_fallback(self, data: Dict[str, Any]) -> Tuple[float, str]:
        """Simple rule-based fallback model in case machine learning environment encounters error."""
        voltage = float(data.get("voltage_v", 220))
        current = float(data.get("current_a", 0))
        pf = float(data.get("power_factor", 1))
        energy = float(data.get("energy_consumption_kwh", 0))
        anomaly = float(data.get("anomaly_score", 0))
        
        # Power calculation mismatch or extremely low power factor are key indicators
        calculated_power = (voltage * current * pf) / 1000.0  # in kW
        
        # Rule 1: High anomaly score from meter
        if anomaly > 75.0:
            return 0.85, "Suspicious"
            
        # Rule 2: Apparent math mismatch (voltage/current present but consumption zero)
        if current > 5.0 and energy < 0.01:
            return 0.90, "Suspicious"
            
        # Rule 3: Extreme voltage drop / high current (line bypass indicator)
        if voltage < 160.0 and current > 15.0:
            return 0.80, "Suspicious"
            
        # Default normal
        return 0.15, "Normal"

# Instantiate global predictor instance
predictor = TheftPredictor()
