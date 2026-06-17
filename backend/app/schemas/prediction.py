from datetime import datetime
from pydantic import BaseModel, Field

class PredictionBase(BaseModel):
    reading_id: str
    risk_score: float = Field(..., description="Probability score of power theft (0.0 to 1.0)")
    status: str = Field(..., description="Status classification: Normal or Suspicious")

class PredictionCreate(PredictionBase):
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PredictionOut(PredictionBase):
    id: str = Field(..., alias="_id")
    timestamp: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
