import os
import sys
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from mongomock import MongoClient as MockMongoClient

# Include pathing to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.main import app
from app.ml.preprocess import preprocess_features, FEATURES
from app.ml.predict import predictor

# Use FastAPI TestClient
client = TestClient(app)

# Use mongomock to simulate MongoDB during unit tests
@pytest.fixture
def mock_db():
    mock_client = MockMongoClient()
    return mock_client["test_database"]

def test_health_check():
    """Verify that the API health check works."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_preprocessing():
    """Verify that the preprocessing function aligns features correctly."""
    sample_data = {
        "voltage_v": 230.5,
        "current_a": 15.2,
        "power_factor": 0.85,
        "energy_consumption_kwh": 1.25,
        "peak_load_kw": 4.5,
        "hour_of_day": 14,
        "meter_reading_kwh": 5002.3,
        "anomaly_score": 12.5
    }
    df = preprocess_features(sample_data)
    assert df.shape == (1, 8)
    assert list(df.columns) == FEATURES
    assert float(df["voltage_v"].iloc[0]) == 230.5
    assert float(df["power_factor"].iloc[0]) == 0.85

def test_fallback_predictor():
    """Verify that the fallback predictor detects major math mismatches."""
    tampered_data = {
        "voltage_v": 230.0,
        "current_a": 12.0,
        "power_factor": 0.95,
        "energy_consumption_kwh": 0.001,  # Suspiciously low energy relative to current
        "peak_load_kw": 2.5,
        "hour_of_day": 14,
        "meter_reading_kwh": 5002.3,
        "anomaly_score": 10.0
    }
    risk, status = predictor._rule_based_fallback(tampered_data)
    assert risk >= 0.75
    assert status == "Suspicious"

    normal_data = {
        "voltage_v": 230.0,
        "current_a": 5.0,
        "power_factor": 0.95,
        "energy_consumption_kwh": 1.15,
        "peak_load_kw": 1.2,
        "hour_of_day": 14,
        "meter_reading_kwh": 5002.3,
        "anomaly_score": 5.0
    }
    risk, status = predictor._rule_based_fallback(normal_data)
    assert risk < 0.50
    assert status == "Normal"

@patch("app.api.auth.get_database")
def test_user_registration(mock_get_db, mock_db):
    """Verify that user registration saves to the database."""
    mock_get_db.return_value = mock_db
    
    payload = {
        "username": "testoperator",
        "email": "operator@test.com",
        "password": "securepassword123",
        "role": "operator"
    }
    
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert data["username"] == "testoperator"
    assert data["email"] == "operator@test.com"
    assert "password" not in data
    assert "_id" in data

    # Verify user exists in mock DB
    user_db = mock_db["users"].find_one({"username": "testoperator"})
    assert user_db is not None
    assert user_db["email"] == "operator@test.com"

@patch("app.api.auth.get_database")
def test_user_login(mock_get_db, mock_db):
    """Verify that user login validates credentials and issues JWT token."""
    mock_get_db.return_value = mock_db
    
    # Pre-register user in mock DB
    from app.core.security import get_password_hash
    mock_db["users"].insert_one({
        "username": "loginuser",
        "email": "login@test.com",
        "hashed_password": get_password_hash("loginpassword"),
        "role": "operator",
        "created_at": "2026-06-16T19:39:05Z"
    })
    
    login_payload = {
        "username": "loginuser",
        "email": "login@test.com",
        "password": "loginpassword",
        "role": "operator"
    }
    
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    
    token_data = response.json()
    assert token_data["token_type"] == "bearer"
    assert "access_token" in token_data
