import random
from util.db import db
from models.user import User
from models.recommendation import Recommendation, RecommendationEntry

if __name__ == "__main__":
    # Get a list of all mentors
    mentors = []
    for doc in db.collection("users").where("roles.mentor", "==", True).stream():
        mentors.append(User.from_dict(doc.to_dict()))
    # Get a list of all mentees
    mentees = []
    for doc in db.collection("users").where("roles.mentee", "==", True).stream():
        mentees.append(User.from_dict(doc.to_dict()))

    batch = db.batch()

    # Run some matching algorithm
    for mentee in mentees:
        recommendations = Recommendation()
        for mentor in mentors:
            entry = RecommendationEntry()
            entry.userId = mentor.uid
            entry.weight = random.randint(0, 100) / 100

            recommendations.entries.append(entry)

        batch.create(
            db.collection("recommendations").document(mentee.uid),
            recommendations.to_dict(),
        )

    batch.commit()
