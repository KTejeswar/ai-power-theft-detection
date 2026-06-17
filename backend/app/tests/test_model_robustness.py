import os
import sys
import numpy as np
import pytest

# Add parent path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.ml.predict import predictor

def test_model_handles_missing_fields_gracefully():
    """Verify that predicting with partially missing fields does not crash."""
    partial_telemetry = {
        "consumer_id": "test_id",
        "voltage_v": 230.0,
        # current_a is missing
        # power_factor is missing
        "energy_consumption_kwh": 1.5,
        "peak_load_kw": 1.8
    }
    
    # Executing the prediction should succeed and return (risk, status)
    risk_score, status = predictor.predict_theft_risk(partial_telemetry)
    assert isinstance(risk_score, float)
    assert status in ["Normal", "Suspicious"]

def test_model_handles_nans_gracefully():
    """Verify that predicting with NaN values replaces them and executes safely."""
    nan_telemetry = {
        "consumer_id": "test_id",
        "voltage_v": np.nan,
        "current_a": None,
        "power_factor": np.nan,
        "energy_consumption_kwh": 0.5,
        "peak_load_kw": 0.8,
        "hour_of_day": 12,
        "meter_reading_kwh": np.nan,
        "anomaly_score": 5.0
    }
    
    risk_score, status = predictor.predict_theft_risk(nan_telemetry)
    assert isinstance(risk_score, float)
    assert status in ["Normal", "Suspicious"]

def test_model_handles_out_of_bounds_parameters():
    """Verify that invalid boundary parameters (e.g., negative or excessive values) are sanitized or handled by fallback."""
    corrupted_telemetry = {
        "consumer_id": "test_id",
        "voltage_v": -10.0,  # Negative voltage (corrupted)
        "current_a": 999.0,  # Physically impossible current
        "power_factor": 1.5, # Out of range (PF must be <= 1.0)
        "energy_consumption_kwh": -50.0, # Negative consumption
        "peak_load_kw": 0.0,
        "hour_of_day": 99,  # Invalid hour
        "meter_reading_kwh": -1000.0,
        "anomaly_score": 500.0
    }
    
    # Prediction should handle it (either preprocess caps/cleans it, or the rule-based model processes it)
    risk_score, status = predictor.predict_theft_risk(corrupted_telemetry)
    assert isinstance(risk_score, float)
    assert status in ["Normal", "Suspicious"]

def test_empty_input_fallback():
    """Verify that completely empty inputs execute with default fallback values."""
    empty_dict = {}
    risk_score, status = predictor.predict_theft_risk(empty_dict)
    assert isinstance(risk_score, float)
    assert status in ["Normal", "Suspicious"]
