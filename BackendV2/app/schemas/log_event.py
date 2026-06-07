# make the schemas defination for the typescript in python
from pydantic import BaseModel
from typing import Optional


class UserId(BaseModel):
    key: str


class LogEvent(BaseModel):
    deviceId: Optional[str] = None
    sessionId: Optional[str] = None
    sessionStartedAt: Optional[str] = None
    level: str = "info"
    message: str = ""
    timestamp: Optional[str] = None
    browser: Optional[str] = None
    browserVersion: Optional[str] = None
    deviceName: Optional[str] = None
    os: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    url: Optional[str] = None
    isOnline: Optional[bool] = None