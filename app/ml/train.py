import os
import sys

# Get the absolute path to the backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(app_dir)
backend_path = os.path.join(project_root, "backend")

# Insert backend path to sys.path
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Update PYTHONPATH
os.environ["PYTHONPATH"] = backend_path + (os.path.pathsep + os.environ.get("PYTHONPATH", "") if os.environ.get("PYTHONPATH") else "")

# Now import the real train_model function and run it
from app.ml.train import train_model

if __name__ == "__main__":
    print("[Root Redirect] Redirecting python -m app.ml.train to backend/app/ml/train.py")
    success = train_model()
    if not success:
        sys.exit(1)
