import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import numpy as np

def generate_dummy_data(n_samples=1000):
    np.random.seed(42)
    # Generate non-fraud
    n_non_fraud = int(n_samples * 0.85)
    amount_nf = np.random.normal(500, 200, n_non_fraud)
    prev_tx_nf = np.random.poisson(2, n_non_fraud)
    bal_nf = np.random.normal(5000, 2000, n_non_fraud)
    
    # Generate fraud
    n_fraud = n_samples - n_non_fraud
    amount_f = np.random.normal(5000, 1500, n_fraud)
    prev_tx_f = np.random.poisson(15, n_fraud)
    bal_f = np.random.normal(1000, 500, n_fraud)
    
    df_nf = pd.DataFrame({'amount': amount_nf, 'previous_transactions': prev_tx_nf, 'balances': bal_nf, 'fraud': 0})
    df_f = pd.DataFrame({'amount': amount_f, 'previous_transactions': prev_tx_f, 'balances': bal_f, 'fraud': 1})
    
    return pd.concat([df_nf, df_f]).sample(frac=1).reset_index(drop=True)

def train_model():
    print("Generating dataset...")
    df = generate_dummy_data(5000)
    
    X = df[['amount', 'previous_transactions', 'balances']]
    y = df['fraud']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    print(classification_report(y_test, y_pred))
    
    print("Saving model to random_forest_model.pkl...")
    joblib.dump(rf, 'random_forest_model.pkl')
    print("Done!")

if __name__ == "__main__":
    train_model()
