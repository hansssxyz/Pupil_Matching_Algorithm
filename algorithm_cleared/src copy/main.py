from models.user import User
from models.settings import Settings
from dacite import from_dict
import os

os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
os.environ["FIRESTORE_HOST"] = "http://localhost:8080"


if __name__ == "__main__":
    pass
