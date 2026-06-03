from pydantic import BaseModel
from typing import Optional

class LogEvent(BaseModel):
    id: str
    level: str
    message: str
    timestamp: str
    sessionId: str
    ip: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sdkVersion: str
    appVersion: str
    userAgent: str
    url: str
    stackTrace: Optional[str] = None

class LocationResponse(BaseModel):
    ip: str
    country: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None