from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId

from app.db.mongodb import get_database
from app.schemas.reading import ReadingCreate, ReadingOut
from app.api.auth import get_current_user
from app.ml.predict import predictor

router = APIRouter(prefix="/api/readings", tags=["Meter Readings & ML Predictions"])

@router.post("/predict", status_code=status.HTTP_201_CREATED)
def record_reading_and_predict(
    reading_in: ReadingCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """
    Ingests live meter parameters, evaluates power theft risk using the XGBoost model,
    saves the reading, prediction, and raises alerts if suspicious activity is found.
    """
    # 1. Verify consumer exists
    try:
        oid = ObjectId(reading_in.consumer_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid consumer ID format."
        )
        
    consumer = db["consumers"].find_one({"_id": oid})
    if not consumer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consumer not found."
        )

    # 2. Prepare and save meter reading
    reading_dict = reading_in.dict()
    if not reading_dict.get("timestamp"):
        reading_dict["timestamp"] = datetime.utcnow()
    
    reading_result = db["meter_readings"].insert_one(reading_dict)
    reading_id = str(reading_result.inserted_id)

    # 3. ML Inference pipeline
    try:
        risk_score, prediction_status = predictor.predict_theft_risk(reading_dict)
    except Exception as ex:
        # Fallback to rule-based logic in predictor
        risk_score, prediction_status = predictor._rule_based_fallback(reading_dict)

    # 4. Save prediction result
    prediction_dict = {
        "reading_id": reading_id,
        "consumer_id": reading_in.consumer_id,
        "risk_score": risk_score,
        "status": prediction_status,
        "timestamp": datetime.utcnow()
    }
    prediction_result = db["predictions"].insert_one(prediction_dict)
    prediction_id = str(prediction_result.inserted_id)

    alert_id = None
    # 5. Handle Suspicious alert raising
    if prediction_status == "Suspicious":
        # Update consumer status
        db["consumers"].update_one(
            {"_id": oid},
            {"$set": {"risk_category": "Suspicious"}}
        )
        
        # Create alert entry
        alert_dict = {
            "prediction_id": prediction_id,
            "consumer_id": reading_in.consumer_id,
            "risk_score": risk_score,
            "status": "Active",
            "created_at": datetime.utcnow(),
            "resolved_at": None,
            "resolved_by": None
        }
        alert_result = db["alerts"].insert_one(alert_dict)
        alert_id = str(alert_result.inserted_id)
        
    return {
        "reading_id": reading_id,
        "prediction_id": prediction_id,
        "risk_score": risk_score,
        "status": prediction_status,
        "alert_raised": prediction_status == "Suspicious",
        "alert_id": alert_id
    }

@router.get("/", response_model=List[ReadingOut])
def list_readings(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    readings = list(db["meter_readings"].find().sort("timestamp", -1))
    for reading in readings:
        reading["_id"] = str(reading["_id"])
    return readings

@router.get("/consumer/{consumer_id}", response_model=List[ReadingOut])
def get_consumer_readings(
    consumer_id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    readings = list(db["meter_readings"].find({"consumer_id": consumer_id}).sort("timestamp", -1))
    for reading in readings:
        reading["_id"] = str(reading["_id"])
    return readings
