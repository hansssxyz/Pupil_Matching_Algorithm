from dataclasses import dataclass, field
import dataclasses
from typing import Optional, List
from datetime import datetime
import dacite


@dataclass
class UserFollowingModel:
    followDate: Optional[datetime] = None


@dataclass
class UserFriendModel:
    msg: Optional[str] = None
    type: Optional[str] = None
    date: Optional[datetime] = None


@dataclass
class UserPrivateModel:
    email: str = ""
    dob: datetime = datetime.today()
    pushTokens: List[str] = field(default_factory=list)


@dataclass
class FollowingType:
    uid: Optional[str] = None
    followDate: Optional[datetime] = None


@dataclass
class InterestType:
    causes: List[str] = field(default_factory=list)
    field: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return dataclasses.asdict(self)


@dataclass
class ExperienceDateType:
    start: datetime = datetime.now()
    end: Optional[datetime] = None


@dataclass
class EducationType(ExperienceDateType):
    major: str = ""
    school: str = ""


@dataclass
class ExperienceType(ExperienceDateType):
    company: str = ""
    title: str = ""


@dataclass
class UserRolesModel:
    institution: bool = False
    mentee: bool = False
    mentor: bool = False


@dataclass
class ExperienceList:
    education: List[EducationType] = field(default_factory=list)
    experiences: List[ExperienceType] = field(default_factory=list)
    socialCauses: List[ExperienceType] = field(default_factory=list)
    interests: InterestType = InterestType()


@dataclass
class UserLastActive:
    lastActive: Optional[datetime] = None


OnboardingState = (
    "email",
    "name",
    "profile",
    "education",
    "educationBackground",
    "experience",
    "complete",
)


@dataclass
class UserProfileImages:
    profile: Optional[str] = None
    background: Optional[str] = None


@dataclass
class UserProfile:
    name: str = ""
    bio: str = ""
    headline: str = ""
    educationTags: List[str] = field(default_factory=list)
    images: UserProfileImages = UserProfileImages()


@dataclass
class User:
    roles: UserRolesModel = UserRolesModel()
    onboardingState: str = "completed"
    profile: UserProfile = UserProfile()
    experiences: ExperienceList = ExperienceList()
    uid: str = ""

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)

    def from_dict(data: dict) -> "User":
        return dacite.from_dict(User, data)
