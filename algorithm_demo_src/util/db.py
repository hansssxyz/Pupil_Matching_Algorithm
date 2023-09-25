import os
from google.cloud.firestore import Client
from firebase_admin import credentials, firestore, initialize_app

if os.environ.get("ENV") != "PROD":
    os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
    os.environ["FIRESTORE_HOST"] = "http://localhost:8080"

db: Client = firestore.client(
    initialize_app(credentials.Certificate("assets/key.json"))
)
