from scripts.generator import generate_mentee, generate_mentor
from scripts.fake_data import globalDict
from models.settings import Settings
from util.db import db


if __name__ == "__main__":
    globalDict["settings"] = Settings.from_dict(
        db.document("settings/tags").get().to_dict()
    )

    batch = db.batch()

    for _ in range(100):
        user = generate_mentee()
        batch.create(db.collection("users").document(user.uid), user.to_dict())
        batch.create(db.document(f"matches/{user.uid}"), {})

    for _ in range(50):
        user = generate_mentor()
        batch.create(db.collection("users").document(user.uid), user.to_dict())
        batch.create(db.document(f"matches/{user.uid}"), {})

    batch.commit()
