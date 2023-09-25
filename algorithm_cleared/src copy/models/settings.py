from dataclasses import dataclass, field
from typing import List

import dacite


@dataclass
class Settings:
    causes: List[str] = field(default_factory=list)
    interests: List[str] = field(default_factory=list)
    education: List[str] = field(default_factory=list)

    def from_dict(data: dict) -> "Settings":
        return dacite.from_dict(Settings, data)
