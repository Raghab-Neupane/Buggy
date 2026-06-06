from pydantic import BaseModel
from typing import Any, Dict, Optional

class LogEvent(BaseModel):
    id: str
    level: str
    message: str
    timestamp: str
    deviceid: str
    location: Optional[Dict[str, Any]] = None
    sdkVersion: str
    appVersion: str
    userAgent: str
    url: str
    stackTrace: Optional[str] = None
