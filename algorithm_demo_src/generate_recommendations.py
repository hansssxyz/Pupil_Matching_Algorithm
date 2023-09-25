from util.db import db
from models.user import User

users = {}

for user in db.collection("users").limit(50).where("roles.mentor", "==", True).stream():
    user = User.from_dict(user.to_dict())
    
    if (user.uid == "GsysIERp8d51WL9jn9ns9DDwlgVg"):
        continue
    
    users[user.uid] = {"weight": 1.0, "interests": user.experiences.interests.to_dict()}
    
db.document("matches/GsysIERp8d51WL9jn9ns9DDwlgVg").update({
    "recommendations": users
})

users = {}

for user in db.collection("users").limit(50).where("roles.mentee", "==", True).stream():
    user = User.from_dict(user.to_dict())
    
    if (user.uid == "6UMl4Xy7D50UZSV4k6TUDV1amrw8"):
        continue
    
    users[user.uid] = {"message": "Hello, I am a mentee!"}
    
    
    
db.document("matches/6UMl4Xy7D50UZSV4k6TUDV1amrw8").update({
    "requests": users
})
