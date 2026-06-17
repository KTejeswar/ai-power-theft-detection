from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId

from app.db.mongodb import get_database
from app.schemas.alert import AlertOut, AlertResolve
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts History"])

@router.get("/", response_model=List[AlertOut])
def list_alerts(
    status_filter: Optional[str] = None,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Fetches alerts, optionally filtering by status (Active or Resolved)."""
    query = {}
    if status_filter:
        query["status"] = status_filter
        
    alerts = list(db["alerts"].find(query).sort("created_at", -1))
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
    return alerts

@router.get("/active", response_model=List[AlertOut])
def get_active_alerts(
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Fetches all active alerts currently triggered in the system."""
    alerts = list(db["alerts"].find({"status": "Active"}).sort("created_at", -1))
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
    return alerts

@router.put("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(
    alert_id: str,
    resolve_data: AlertResolve,
    db: Database = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Resolves a triggered alert and resets consumer risk level if no other active alerts exist."""
    try:
        oid = ObjectId(alert_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid alert ID format."
        )
        
    alert = db["alerts"].find_one({"_id": oid})
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found."
        )
        
    if alert["status"] == "Resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert is already resolved."
        )
        
    # Update alert status
    db["alerts"].update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "Resolved",
                "resolved_at": datetime.utcnow(),
                "resolved_by": resolve_data.resolved_by
            }
        }
    )
    
    # Check if this consumer has other active alerts
    consumer_id = alert["consumer_id"]
    active_alerts_count = db["alerts"].count_documents({
        "consumer_id": consumer_id,
        "status": "Active"
    })
    
    if active_alerts_count == 0:
        # Reset consumer status back to normal
        try:
            db["consumers"].update_one(
                {"_id": ObjectId(consumer_id)},
                {"$set": {"risk_category": "Normal"}}
            )
        except Exception:
            pass  # Fail-silent if consumer was deleted in between
            
    resolved_alert = db["alerts"].find_one({"_id": oid})
    resolved_alert["_id"] = str(resolved_alert["_id"])
    return resolved_alert
