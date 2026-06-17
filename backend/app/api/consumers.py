from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId

from app.db.mongodb import get_database
from app.schemas.consumer import ConsumerCreate, ConsumerUpdate, ConsumerOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/consumers", tags=["Consumers"])

@router.post("/", response_model=ConsumerOut, status_code=status.HTTP_201_CREATED)
def create_consumer(
    consumer_in: ConsumerCreate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    # Check if consumer_number already exists
    if db["consumers"].find_one({"consumer_number": consumer_in.consumer_number}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consumer number already exists."
        )
        
    consumer_dict = consumer_in.dict()
    consumer_dict["risk_category"] = "Normal"
    consumer_dict["created_at"] = datetime.utcnow()
    
    result = db["consumers"].insert_one(consumer_dict)
    
    created_consumer = db["consumers"].find_one({"_id": result.inserted_id})
    created_consumer["_id"] = str(created_consumer["_id"])
    return created_consumer

@router.get("/", response_model=List[ConsumerOut])
def list_consumers(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    consumers = list(db["consumers"].find())
    for consumer in consumers:
        consumer["_id"] = str(consumer["_id"])
    return consumers

@router.get("/{consumer_id}", response_model=ConsumerOut)
def get_consumer(
    consumer_id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    try:
        oid = ObjectId(consumer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid consumer ID format.")
        
    consumer = db["consumers"].find_one({"_id": oid})
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found.")
        
    consumer["_id"] = str(consumer["_id"])
    return consumer

@router.put("/{consumer_id}", response_model=ConsumerOut)
def update_consumer(
    consumer_id: str,
    consumer_in: ConsumerUpdate,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    try:
        oid = ObjectId(consumer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid consumer ID format.")
        
    consumer = db["consumers"].find_one({"_id": oid})
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found.")
        
    update_data = {k: v for k, v in consumer_in.dict().items() if v is not None}
    
    if update_data:
        db["consumers"].update_one({"_id": oid}, {"$set": update_data})
        
    updated_consumer = db["consumers"].find_one({"_id": oid})
    updated_consumer["_id"] = str(updated_consumer["_id"])
    return updated_consumer

@router.delete("/{consumer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_consumer(
    consumer_id: str,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    try:
        oid = ObjectId(consumer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid consumer ID format.")
        
    consumer = db["consumers"].find_one({"_id": oid})
    if not consumer:
        raise HTTPException(status_code=404, detail="Consumer not found.")
        
    db["consumers"].delete_one({"_id": oid})
    return None
