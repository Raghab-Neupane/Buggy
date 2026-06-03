from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class LogBase(BaseModel):
  level: str
  message: str
  timestamp: str
  sessionId: str = Field(..., serialization_alias="sessionId", validation_alias="sessionId")
  url: Optional[str] = None
  stackTrace: Optional[str] = Field(None, serialization_alias="stackTrace", validation_alias="stackTrace")

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }

class LogEventSchema(LogBase):
  id: str
  sdkVersion: str = Field(..., serialization_alias="sdkVersion", validation_alias="sdkVersion")
  appVersion: str = Field(..., serialization_alias="appVersion", validation_alias="appVersion")
  userAgent: str = Field(..., serialization_alias="userAgent", validation_alias="userAgent")

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }

class LogResponse(BaseModel):
  id: str
  deviceId: str = Field(..., serialization_alias="deviceId")
  level: str
  message: str
  timestamp: datetime
  url: Optional[str] = None
  stackTrace: Optional[str] = Field(None, serialization_alias="stackTrace")
  sessionId: str = Field(..., serialization_alias="sessionId")
  created_at: datetime

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }
