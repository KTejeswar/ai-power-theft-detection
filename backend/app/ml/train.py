import os
import sys
import logging
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from xgboost import XGBClassifier
import joblib

# Set up pathing to import app modules if running directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.ml.preprocess import preprocess_features, FEATURES

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ml_train")

def find_dataset():
    """Dynamically finds the dataset path in parent directories."""
    paths_to_check = [
        "Electricity_consumption_data.csv",
        "../Electricity_consumption_data.csv",
        "../../Electricity_consumption_data.csv",
        "D:/TEJAA/AI Based Power Theft Detection in Electrical System/Electricity_consumption_data.csv"
    ]
    for p in paths_to_check:
        if os.path.exists(p):
            logger.info(f"Dataset found at: {os.path.abspath(p)}")
            return p
    raise FileNotFoundError("Could not find Electricity_consumption_data.csv in standard workspace folders.")

def train_model():
    # 1. Load dataset
    try:
        csv_path = find_dataset()
        df = pd.read_csv(csv_path)
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        return False
        
    logger.info(f"Loaded dataset containing {df.shape[0]} rows and {df.shape[1]} columns.")
    
    # 2. Extract features and label
    X = preprocess_features(df)
    
    if "theft_label" not in df.columns:
        logger.error("Dataset is missing required target column: 'theft_label'")
        return False
        
    y = df["theft_label"].astype(int)
    
    # 3. Split into Train & Test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    logger.info(f"Split data into training ({X_train.shape[0]} samples) and testing ({X_test.shape[0]} samples).")
    
    # 4. Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    logger.info("Successfully scaled features.")
    
    # 5. Train XGBoost Model
    logger.info("Training XGBoost Classifier...")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        use_label_encoder=False,
        eval_metric="logloss"
    )
    model.fit(X_train_scaled, y_train)
    logger.info("Model training complete.")
    
    # 6. Evaluate
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    
    logger.info("========================================")
    logger.info("MODEL EVALUATION RESULTS (Test Set):")
    logger.info(f"Accuracy:  {accuracy:.4f}")
    logger.info(f"Precision: {precision:.4f}")
    logger.info(f"Recall:    {recall:.4f}")
    logger.info(f"F1-Score:  {f1:.4f}")
    logger.info(f"ROC-AUC:   {roc_auc:.4f}")
    logger.info("========================================")
    
    # 7. Save Model & Scaler
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, "xgboost_theft_model.json")
    scaler_path = os.path.join(model_dir, "scaler.joblib")
    
    model.save_model(model_path)
    joblib.dump(scaler, scaler_path)
    
    logger.info(f"Saved trained model to: {os.path.abspath(model_path)}")
    logger.info(f"Saved scaler state to: {os.path.abspath(scaler_path)}")
    return True

if __name__ == "__main__":
    train_model()
