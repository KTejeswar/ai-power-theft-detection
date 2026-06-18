import logging
import certifi
from pymongo import MongoClient, ASCENDING
from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine Mongo connection options dynamically (Atlas/SSL vs Local)
mongo_kwargs = {}
uri_lower = settings.MONGO_URI.lower()
if settings.MONGO_URI.startswith("mongodb+srv://") or "replicaset" in uri_lower or "ssl=true" in uri_lower or "tls=true" in uri_lower:
    mongo_kwargs["tls"] = True
    mongo_kwargs["tlsAllowInvalidCertificates"] = True
    mongo_kwargs["tlsCAFile"] = certifi.where()
else:
    mongo_kwargs["tls"] = False

client = MongoClient(settings.MONGO_URI, **mongo_kwargs)
db = client[settings.DATABASE_NAME]


def get_database():
    """Dependency helper to get database instance."""
    return db

def init_db():
    """Initializes collections and indexes to enforce schema uniqueness and accelerate lookups."""
    try:
        # 1. Users Indexes
        users_col = db["users"]
        users_col.create_index([("username", ASCENDING)], unique=True)
        users_col.create_index([("email", ASCENDING)], unique=True)
        logger.info("Successfully created unique indexes for 'users' collection.")
        
        # 2. Consumers Indexes
        consumers_col = db["consumers"]
        consumers_col.create_index([("consumer_number", ASCENDING)], unique=True)
        logger.info("Successfully created unique index for 'consumers' collection.")
        
        # 3. Readings Indexes
        readings_col = db["meter_readings"]
        readings_col.create_index([("consumer_id", ASCENDING)])
        readings_col.create_index([("timestamp", ASCENDING)])
        logger.info("Successfully created lookup indexes for 'meter_readings' collection.")

        # 4. Predictions Indexes
        predictions_col = db["predictions"]
        predictions_col.create_index([("reading_id", ASCENDING)])
        predictions_col.create_index([("timestamp", ASCENDING)])
        logger.info("Successfully created lookup indexes for 'predictions' collection.")

        # 5. Alerts Indexes
        alerts_col = db["alerts"]
        alerts_col.create_index([("prediction_id", ASCENDING)])
        alerts_col.create_index([("consumer_id", ASCENDING)])
        alerts_col.create_index([("status", ASCENDING)])
        logger.info("Successfully created lookup indexes for 'alerts' collection.")
        
    except Exception as e:
        logger.error(f"Error initializing database indexes: {e}")
        raise e
