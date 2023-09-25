from dataclasses import dataclass, asdict, field
from typing import List


@dataclass
class RecommendationEntry:
    weight: float = 0.0
    userId: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Recommendation:
    entries: List[RecommendationEntry] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)
