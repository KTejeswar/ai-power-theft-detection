import os
import sys

# Get the absolute path to the backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_path = os.path.join(project_root, "backend")

# Insert backend path to sys.path so that the real app package is importable
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Update PYTHONPATH in environment so subprocesses (like uvicorn) can find backend/app
os.environ["PYTHONPATH"] = backend_path + (os.path.pathsep + os.environ.get("PYTHONPATH", "") if os.environ.get("PYTHONPATH") else "")

# Now import the real FastAPI app from backend/app/main.py
from app.main import app

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings
    
    # Prioritize OS PORT env var (injected by Render) and fallback to settings.PORT
    port = int(os.environ.get("PORT", settings.PORT))
    print(f"[Root Redirect] Redirecting python -m app.main to backend/app/main.py")
    print(f"[Root Redirect] Starting uvicorn server on host 0.0.0.0 and port {port}")
    
    # Run uvicorn pointing to the real app
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
