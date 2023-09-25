from util.db import db
from models.user import User

users = {}

for user in db.collection("users").limit(100).where("roles.mentor", "==", True).stream():
    user = User.from_dict(user.to_dict())
    
    users[user.uid] = {"weight": 1.0, "interests": user.experiences.interests.to_dict()}
    
db.document("settings/globalRecommendations").set({
    "data": users
})

