from pydantic import BaseModel
from datetime import datetime

class LogEvent(BaseModel):
    level: str
    message: str
    timestamp: datetime