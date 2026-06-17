# GridGuardian: AI-Based Power Theft Detection in Electrical Systems

GridGuardian is a production-ready grid monitoring and anomaly detection system. It combines an **XGBoost Machine Learning Classifier** with **hard physical override rules** (Hybrid AI) to identify electricity theft patterns (such as meter bypass or casing tampering) in smart meter telemetry, alerting grid operators in real-time.

---

## 1. System Architecture & Technology Stack

```text
┌────────────────────────┐      REST API (JSON / JWT)      ┌────────────────────────┐
│  React Dashboard UI    │ ◄─────────────────────────────► │   FastAPI Backend      │
│  (Tailwind, Recharts)  │                                 │  (Python, JWT Security)│
└────────────────────────┘                                 └───────────┬────────────┘
                                                                       │
                                                   ┌───────────────────┴───────────────────┐
                                                   ▼                                       ▼
                                       ┌───────────────────────┐               ┌───────────────────────┐
                                       │   XGBoost ML Model    │               │   MongoDB Database    │
                                       │ (StandardScaler, Joblib)│             │ (Users, Readings, etc)│
                                       └───────────────────────┘               └───────────────────────┘
```

* **Frontend**: React single-page application built using Vite, styled with Tailwind CSS, using Recharts for analytical line plots, and Lucide React for UI iconography.
* **Backend**: FastAPI (Python) web framework enforcing JWT bearer token authentication, Pydantic input schemas, and modular routing.
* **Database**: MongoDB (local client) utilizing collections indexing to accelerate telemetry lookups and guarantee account uniqueness.
* **Machine Learning**: XGBoost Classifier and scikit-learn `StandardScaler` trained on the local `Electricity_consumption_data.csv` dataset.

---

## 2. Core Concepts & System Workflows

### Roles
* **Operator (Utility Officer)**: Grid administrators who register smart meters, analyze consumption charts, and dispatch field crews to fix bypass wires. When a theft is resolved physically, they change the alert status to **Resolved** on the dashboard.
* **Consumer (Grid Node)**: Residential homes, commercial shops, or industrial factories. Their smart meters continuously stream electrical telemetry (Voltage, Current, Power Factor, and hourly Energy Consumption) to the server.

### Hybrid AI Classification
To prevent false negatives on obvious anomalies, the system uses a **Hybrid AI** detection engine:
1. **Physical Overrides (Rule-Based)**: If any basic electrical law is violated (e.g. Current draw $> 5\text{ A}$ but hourly Energy Consumption $< 0.01\text{ kWh}$—indicating a line bypass), the system immediately overrides the ML model and flags the reading as **Suspicious** with a **95% risk score**.
2. **XGBoost Classifier (Statistical Patterns)**: If no hard constraints are violated, the telemetry is normalized and passed to the XGBoost model to evaluate subtle fraud patterns.

### Alert Severity Levels
Alarms are categorized into three levels depending on the calculated risk probability:
* 🔴 **CRITICAL (Risk $\ge 90\%$)**: Clear direct bypass or physical tampering. Requires immediate emergency field crew dispatch.
* 🟠 **WARNING (Risk $80\% - 89\%$)**: Strong suspicion of meter shunt/magnets. Triggers targeted meter audit.
* 🟡 **EVALUATE (Risk $75\% - 79\%$)**: Moderate consumption deviations. Requires database analysis before scheduling field inspections.

---

## 3. Project File Structure

```text
D:/TEJAA/AI Based Power Theft Detection in Electrical System/
├── README.md                              # This document
├── .env.example                           # Config template
├── .env                                   # Active configuration
├── Electricity_consumption_data.csv       # Training dataset
│
├── backend/                               # Python FastAPI Backend
│   ├── requirements.txt                   # Dependency list
│   └── app/
│       ├── main.py                        # Entrypoint server script
│       ├── core/
│       │   ├── config.py                  # Pydantic Settings
│       │   └── security.py                # Hashing and JWT tokens
│       ├── db/
│       │   └── mongodb.py                 # Client setup & indexing
│       ├── schemas/                       # Input/Output validation models
│       │   ├── user.py, consumer.py, reading.py, prediction.py, alert.py
│       ├── ml/
│       │   ├── preprocess.py              # Feature cleaning
│       │   ├── train.py                   # XGBoost trainer
│       │   └── predict.py                 # Inference singleton with overrides
│       ├── api/                           # Modular endpoints
│       │   ├── auth.py, consumers.py, readings.py, alerts.py
│       └── tests/                         # Pytest test suite
│           ├── test_backend.py            # Basic unit tests
│           ├── test_async_integration.py  # Async Client integration tests
│           └── test_model_robustness.py   # Parameter boundary tests
│
└── frontend/                              # Vite + React Frontend
    ├── package.json                       # Package config
    ├── vite.config.js                     # Port and proxy configs
    ├── tailwind.config.js                 # Theme configs
    ├── index.html                         # Entry HTML shell
    └── src/
        ├── index.css                      # Tailwind stylesheet layers
        ├── main.jsx                       # Dom mounting launcher
        ├── api.js                         # Axios configurations and endpoints
        ├── App.jsx                        # Layout container & router
        └── components/                    # UI modular components
            ├── Login.jsx                  # Operator auth panel
            ├── Dashboard.jsx              # Summary stats grid & quick feeds
            ├── AnalyticsChart.jsx         # Telecharts mapping line trends
            ├── ConsumerList.jsx           # Consumer registry & telemetry modal
            └── AlertsPanel.jsx            # Active alarms lists and resolution handlers
```

---

## 4. Setup & Installation Guide

Ensure you have **Python 3.8+** installed and **MongoDB Community Server** running locally on default port `27017`.

### A. Setup Environment Config
Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=power_theft_db
JWT_SECRET_KEY=4a2b9c7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b
PORT=8000
```

### B. Install and Start Backend
Open a terminal in the `backend/` folder:
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (CMD):
.\venv\Scripts\activate.bat

# Install packages
pip install -r requirements.txt

# Run XGBoost model training
python -m app.ml.train

# Start FastAPI server
python -m app.main
```
*Backend API Docs will launch at: `http://127.0.0.1:8000/docs`*

### C. Install and Start Frontend
Open a new terminal in the `frontend/` folder:
```powershell
# Install node packages
npm install

# Run the development server
npm run dev
```
*Frontend UI will launch at: `http://localhost:3000`*

---

## 5. End-to-End (E2E) Testing Guide

Once both servers are running, follow this step-by-step script to test the E2E lifecycle:

### Step 1: Sign Up
1. Open `http://localhost:3000`.
2. Click **"Don't have an operator profile? Sign Up"** at the bottom of the card.
3. Enter a username (e.g. `operator_jane`), email, and password.
4. Click **"Create Operator Account"**. You will log in immediately.

### Step 2: Register a Consumer
1. Go to the **"Consumer Nodes"** tab.
2. Click **"Register Consumer"**.
3. Create a **Home** consumer:
   - **Consumer ID Number**: `2003004005`
   - **Full Name**: `Robert Henderson`
   - **Meter Serial Number**: `MTR-HOME-99`
   - **Service Address**: `Apt 4B, 742 Evergreen Terrace`
4. Click **"Register Consumer Node"**. They will appear in the table with status **Normal**.

### Step 3: Test a "Normal" Reading
1. Click **"Ingest Telemetry"** next to *Robert Henderson*.
2. Enter these values:
   - **Voltage**: `230`
   - **Current**: `5.0`
   - **Power Factor**: `0.95`
   - **Energy Consumption (kWh)**: `1.1` *(Matches the calculated power: $230\text{V} \times 5\text{A} \times 0.95 \approx 1.09\text{ kW}$)*
   - **Peak Load (kW)**: `1.2`
   - **Hour of Day**: `12`
   - **Cumulative (kWh)**: `5000`
   - **Anomaly Score**: `5.0`
3. Click **"Run Theft Detection Pipeline"**.
4. **Result**: Shows **Status: Normal** with a low theft risk score of **~10% to 15%**.

### Step 4: Test an "Average / Borderline" Reading
1. Click **"Ingest Telemetry"** again.
2. Enter these borderline values:
   - **Voltage**: `225`
   - **Current**: `15.0`
   - **Power Factor**: `0.80`
   - **Energy Consumption (kWh)**: `1.5` *(Calculated draw is $2.7\text{ kW}$, but reported is only $1.5\text{ kWh}$. This is a minor mismatch)*
   - **Peak Load (kW)**: `3.0`
   - **Hour of Day**: `18`
   - **Cumulative (kWh)**: `5000`
   - **Anomaly Score**: `45.0`
3. Click **"Run Theft Detection Pipeline"**.
4. **Result**: Shows **Status: Normal**, but with a medium risk score of **~45% - 55%**. No alerts are raised as it is below the 75% threshold.

### Step 5: Test a "Theft" Reading (Bypass Hook)
1. Click **"Ingest Telemetry"** again.
2. Enter these suspicious bypass values:
   - **Voltage**: `220`
   - **Current**: `32.0` *(Very high current draw)*
   - **Power Factor**: `0.95`
   - **Energy Consumption (kWh)**: `0.001` *(Almost zero recorded consumption!)*
   - **Peak Load (kW)**: `7.0`
   - **Hour of Day**: `14`
   - **Cumulative (kWh)**: `5000`
   - **Anomaly Score**: `85.0`
3. Click **"Run Theft Detection Pipeline"**.
4. **Result**: Instantly flags **Status: Suspicious** with a **95% risk score**. It notes that an active alarm has been generated.

### Step 6: Monitor & Resolve the Incident
1. Close the modal and navigate to the **"Dashboard Control"** tab.
2. Observe that **Active Theft Alerts** has incremented to `1`, and the line chart displays the yellow anomaly spike.
3. Click the **"Incident Alarms"** tab.
4. Locate the active **CRITICAL** alarm for *Robert Henderson*.
5. Click **"Resolve Alert"**. The alert will move to the **"Resolved"** tab, and the consumer's status will reset to green **Normal** in the consumer table!

---

## 6. Running Automated Tests
With your backend virtual environment activated, you can verify routing and ML parameters by executing:
```powershell
cd backend
pytest app/tests/
```
This runs the unit tests, async integration flow tests, and model boundary sanitization tests.
