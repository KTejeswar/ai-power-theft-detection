from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AlertBase(BaseModel):
    prediction_id: str
    consumer_id: str
    risk_score: float = Field(..., description="Risk score associated with the alert")
    status: str = Field("Active", description="Alert status: Active or Resolved")

class AlertCreate(AlertBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertResolve(BaseModel):
    resolved_by: str = Field(..., description="Username of the user resolving the alert")

class AlertOut(AlertBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
