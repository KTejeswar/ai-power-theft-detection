import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import init_db
from app.ml.predict import predictor
from app.api import auth, consumers, readings, alerts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app_main")

app = FastAPI(
    title="AI-Based Power Theft Detection API",
    description="FastAPI backend with MongoDB and XGBoost classification to detect electrical theft anomalies.",
    version="1.0.0"
)

# CORS Configuration for Frontend Dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific UI domain in production (e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    logger.info("Starting up FastAPI application...")
    
    # Initialize MongoDB Indexes
    init_db()
    
    # Initialize ML Predictor (pre-loads model and scaler or triggers auto-training)
    predictor.load_model_artifacts()
    logger.info("FastAPI startup process complete.")

@app.get("/", tags=["Health Check"])
def health_check():
    model_loaded = predictor.model is not None and predictor.scaler is not None
    return {
        "status": "online",
        "database": "connected",
        "model_state": "loaded" if model_loaded else "failed_to_load",
        "description": "AI-Based Power Theft Detection Service is running."
    }

# Include Modular API Routers
app.include_router(auth.router)
app.include_router(consumers.router)
app.include_router(readings.router)
app.include_router(alerts.router)

if __name__ == "__main__":
    import os
    # Prioritize OS PORT env var (injected by Render) and fallback to settings.PORT
    port = int(os.environ.get("PORT", settings.PORT))
    logger.info(f"Starting uvicorn server on host 0.0.0.0 and port {port}")
    # Run server locally on configurable port (disable reload in production for stability)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)

