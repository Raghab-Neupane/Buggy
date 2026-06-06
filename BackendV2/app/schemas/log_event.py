
# export interface LogEvent {
#     deviceId: string;
#     sessionId: string;
#     sessionStartedAt?: string;
#     level: "debug" | "info" | "warn" | "error";
#     message: string;

#     timestamp: string;

#     browser: string;
#     browserVersion?: string;

#     deviceName?: string;
#     os?: string;

#     latitude?: number;
#     longitude?: number;

#     url: string;
# }


# make the schemas defination for the typescript in python
from pydantic import BaseModel
from typing import Optional


class LogEvent(BaseModel):
    deviceId: str
    sessionId: str
    sessionStartedAt: Optional[str] = None
    level: str
    message: str
    timestamp: str
    browser: str
    browserVersion: Optional[str] = None
    deviceName: Optional[str] = None
    os: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    url: str