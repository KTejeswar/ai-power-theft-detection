import os
import sys
import pytest
import httpx
from unittest.mock import patch
from mongomock import MongoClient as MockMongoClient

# Add parent path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.main import app

# Config mock database fixture
@pytest.fixture
def mock_db():
    mock_client = MockMongoClient()
    return mock_client["test_db_async"]

# Mark all tests in this file as async
pytestmark = pytest.mark.asyncio

@patch("app.api.auth.get_database")
@patch("app.api.consumers.get_database")
@patch("app.api.readings.get_database")
async def test_complete_grid_integration_flow(
    mock_readings_db, 
    mock_consumers_db, 
    mock_auth_db, 
    mock_db
):
    """
    Test the full data flow asynchronously:
    1. Register Operator
    2. Authenticate & Obtain Token
    3. Register Consumer Node
    4. Submit Normal Electrical Parameters -> Verify normal risk score
    5. Submit Tampered / Anomalous parameters -> Verify risk score exceeds threshold and alert is raised
    """
    # Configure mock database return values
    mock_auth_db.return_value = mock_db
    mock_consumers_db.return_value = mock_db
    mock_readings_db.return_value = mock_db

    async with httpx.AsyncClient(app=app, base_url="http://testserver") as ac:
        
        # 1. Register Operator User
        reg_payload = {
            "username": "operator_steve",
            "email": "steve@gridsecurity.com",
            "password": "supersecurepassword777",
            "role": "operator"
        }
        reg_response = await ac.post("/api/auth/register", json=reg_payload)
        assert reg_response.status_code == 201
        
        # 2. Login Operator User
        login_response = await ac.post("/api/auth/login", json=reg_payload)
        assert login_response.status_code == 200
        token_data = login_response.json()
        assert "access_token" in token_data
        
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        
        # 3. Register a Consumer Node
        consumer_payload = {
            "consumer_number": "1122334455",
            "name": "Acme Industrial Unit",
            "address": "45 Power Grid Sector, Industrial Zone",
            "meter_serial_number": "MTR-88992211"
        }
        cons_response = await ac.post("/api/consumers/", json=consumer_payload, headers=headers)
        assert cons_response.status_code == 201
        consumer_data = cons_response.json()
        assert consumer_data["risk_category"] == "Normal"
        consumer_id = consumer_data["_id"]
        
        # 4. Ingest Normal Telemetry
        normal_telemetry = {
            "consumer_id": consumer_id,
            "voltage_v": 230.2,
            "current_a": 10.5,
            "power_factor": 0.96,
            "energy_consumption_kwh": 2.4,
            "peak_load_kw": 2.5,
            "hour_of_day": 14,
            "meter_reading_kwh": 1025.4,
            "anomaly_score": 5.0
        }
        normal_response = await ac.post("/api/readings/predict", json=normal_telemetry, headers=headers)
        assert normal_response.status_code == 201
        normal_result = normal_response.json()
        assert normal_result["alert_raised"] is False
        assert normal_result["status"] == "Normal"
        assert normal_result["risk_score"] < 0.75

        # 5. Ingest Anomalous / Tampered Telemetry (indicating bypass)
        # Low voltage / low energy consumption, but high peak load / high current math anomaly
        tampered_telemetry = {
            "consumer_id": consumer_id,
            "voltage_v": 220.0,
            "current_a": 30.5,
            "power_factor": 0.95,
            "energy_consumption_kwh": 0.001,  # Massive mathematical mismatch with 30A current!
            "peak_load_kw": 6.7,
            "hour_of_day": 14,
            "meter_reading_kwh": 1025.4,
            "anomaly_score": 85.0  # High meter anomaly score
        }
        tampered_response = await ac.post("/api/readings/predict", json=tampered_telemetry, headers=headers)
        assert tampered_response.status_code == 201
        tampered_result = tampered_response.json()
        assert tampered_result["alert_raised"] is True
        assert tampered_result["status"] == "Suspicious"
        assert tampered_result["risk_score"] >= 0.75
        assert tampered_result["alert_id"] is not None
