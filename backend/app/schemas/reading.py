from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ReadingBase(BaseModel):
    consumer_id: str
    voltage_v: float = Field(..., description="Voltage in Volts")
    current_a: float = Field(..., description="Current in Amperes")
    power_factor: float = Field(..., description="Power Factor (0.0 to 1.0)")
    energy_consumption_kwh: float = Field(..., description="Energy consumed in kWh in this period")
    peak_load_kw: float = Field(..., description="Peak load in kW")
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    meter_reading_kwh: float = Field(..., description="Total cumulative meter reading in kWh")
    anomaly_score: float = Field(0.0, description="Base anomaly score from the meter if any")

class ReadingCreate(ReadingBase):
    timestamp: Optional[datetime] = None

class ReadingOut(ReadingBase):
    id: str = Field(..., alias="_id")
    timestamp: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
