from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ConsumerBase(BaseModel):
    consumer_number: str = Field(..., min_length=5, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5, max_length=250)
    meter_serial_number: str = Field(..., min_length=5, max_length=50)

class ConsumerCreate(ConsumerBase):
    pass

class ConsumerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = Field(None, min_length=5, max_length=250)
    meter_serial_number: Optional[str] = Field(None, min_length=5, max_length=50)
    risk_category: Optional[str] = Field(None, description="Normal, Suspicious, or High-Risk")

class ConsumerOut(ConsumerBase):
    id: str = Field(..., alias="_id")
    risk_category: str = Field("Normal")
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
