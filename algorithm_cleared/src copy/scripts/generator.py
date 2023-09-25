from typing import Optional, Tuple
from faker import Faker
from faker_education import SchoolProvider
from models.user import EducationType, ExperienceType, InterestType, User
from datetime import datetime, timedelta
from scripts.fake_data import globalDict, majors
import random

fake = Faker()
fake.add_provider(SchoolProvider)


def addExperienceDates(
    experience, toAdd: timedelta
) -> Tuple[datetime, Optional[datetime]]:
    start_date: datetime = fake.date_time_this_century()
    end_date: datetime = start_date + toAdd

    experience.start = start_date
    experience.end = (end_date.now() - end_date).days > 0 and end_date or None


def generateEducationType() -> EducationType:
    education = EducationType()
    addExperienceDates(education, timedelta(days=365 * 4))
    education.major = random.choice(majors)
    education.school = fake.school_name()
    return education


def generateExperienceType() -> ExperienceType:
    experience = ExperienceType()
    addExperienceDates(experience, timedelta(days=random.randint(365, 365 * 10)))
    experience.company = fake.company()
    experience.title = fake.job()
    return experience


def generateInterestType() -> InterestType:
    interest = InterestType()
    interest.causes = [
        random.choice(globalDict["settings"].causes)
        for _ in range(random.randint(1, 3))
    ]
    interest.field = [
        random.choice(globalDict["settings"].interests)
        for _ in range(random.randint(1, 3))
    ]
    return interest


def generate_user():
    user = User()

    user.profile.name = fake.name()
    user.profile.headline = fake.sentence(7)
    user.profile.educationTags = [random.choice(globalDict["settings"].education)]
    user.profile.bio = fake.paragraph(3)
    user.profile.images.profile = (
        f"https://picsum.photos/id/{random.randint(1, 1000)}/500/500"
    )
    user.uid = fake.uuid4()

    user.experiences.education = [
        generateEducationType() for _ in range(random.randint(1, 2))
    ]
    user.experiences.experiences = [
        generateExperienceType() for _ in range(random.randint(1, 3))
    ]
    user.experiences.socialCauses = [
        generateExperienceType() for _ in range(random.randint(1, 2))
    ]
    user.experiences.interests = generateInterestType()

    return user


def generate_mentee():
    user = generate_user()
    user.roles.mentee = True
    return user


def generate_mentor():
    user = generate_user()
    user.roles.mentor = True
    return user
