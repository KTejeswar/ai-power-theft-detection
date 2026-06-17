import pandas as pd
import numpy as np
from typing import Union, List

# Define the exact list of feature columns our model expects (ordered)
FEATURES: List[str] = [
    "voltage_v",
    "current_a",
    "power_factor",
    "energy_consumption_kwh",
    "peak_load_kw",
    "hour_of_day",
    "meter_reading_kwh",
    "anomaly_score"
]

def preprocess_features(data: Union[pd.DataFrame, dict]) -> pd.DataFrame:
    """
    Cleans and structures input data (either a DataFrame or a single dict from API)
    into a formatted DataFrame with the exact features required by the model.
    """
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    else:
        df = data.copy()

    # Ensure all required features exist in the data
    for feat in FEATURES:
        if feat not in df.columns:
            # Handle missing fields by default values
            if feat == "voltage_v":
                df[feat] = 220.0
            elif feat == "power_factor":
                df[feat] = 0.9
            elif feat == "hour_of_day":
                df[feat] = 12
            else:
                df[feat] = 0.0

    # Retain only the defined feature columns in the exact order
    df_features = df[FEATURES].astype(float)
    
    # Fill any NaNs with column median/mean or default values
    df_features = df_features.fillna({
        "voltage_v": 220.0,
        "current_a": 0.0,
        "power_factor": 0.9,
        "energy_consumption_kwh": 0.0,
        "peak_load_kw": 0.0,
        "hour_of_day": 12.0,
        "meter_reading_kwh": 0.0,
        "anomaly_score": 0.0
    })
    
    return df_features
