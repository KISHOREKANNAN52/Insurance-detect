from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="Insurance Fraud Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model (Graceful fallback to mock if model hasn't been trained)
try:
    model = joblib.load('random_forest_model.pkl')
except FileNotFoundError:
    model = None

class PredictionRequest(BaseModel):
    amount: float
    previous_transactions: int
    balances: float

@app.get("/")
def read_root():
    return {"status": "ML Service is Running", "model_loaded": model is not None}

@app.post("/predict")
def predict_fraud(req: PredictionRequest):
    if not model:
        # Complex mock logic for UI demo
        risk_score = min(100.0, max(0.0, (req.amount / 1000 * 5) + (req.previous_transactions * 3.5)))
        fraud_label = 1 if risk_score > 70 else 0
        return {
            "fraud_label": fraud_label,
            "risk_score": round(risk_score, 2),
            "is_mock": True
        }
        
    # Real Model execution
    try:
        df = pd.DataFrame([req.model_dump()])
        prediction = model.predict(df)[0]
        probabilities = model.predict_proba(df)[0]
        risk_score = round(probabilities[1] * 100, 2)
        
        return {
            "fraud_label": int(prediction),
            "risk_score": float(risk_score),
            "is_mock": False
        }
    except Exception as e:
        return {"error": str(e)}
