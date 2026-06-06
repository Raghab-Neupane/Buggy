from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.log_event import LogEvent, UserId
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
import random
import string

# Database imports
from sqlalchemy.orm import Session
from app.database import engine, Base, UserDB, LogDB, get_db

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auth and Location imports
from app.service.auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
    admin_required,
    authenticated_user
)
from app.service.location import reverse_geocode

app = FastAPI()

# Configure CORS - MUST allow credentials to accept cookies
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserSignup(BaseModel):
    email: str
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate a unique 4-character userKey
    chars = string.ascii_lowercase + string.digits
    user_id = "".join(random.choice(chars) for _ in range(4))
    while db.query(UserDB).filter(UserDB.user_id == user_id).first():
        user_id = "".join(random.choice(chars) for _ in range(4))

    new_user = UserDB(
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        user_id=user_id
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully", "user_id": user_id}

@app.post("/login")
def login(item: UserLogin, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == item.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(item.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = create_access_token(db_user.user_id, item.email, db_user.role)
    
    # Set JWT in HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600 * 24, # 1 day
        samesite="lax",
        secure=False  # Secure=False for localhost HTTP development
    )
    
    return {
        "status": "success",
        "role": db_user.role,
        "user_id": db_user.user_id
    }

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "success"}

@app.post("/userkey")
def get_userkey(item: UserId, db: Session = Depends(get_db)):
    # Simply verify if this key is assigned to any user
    user = db.query(UserDB).filter(UserDB.user_id == item.key).first()
    if not user:
        raise HTTPException(status_code=404, detail="User Key not found")
    return {"message": "Key exists", "key": item.key}

@app.post("/logs")
def log_event(item: LogEvent, db: Session = Depends(get_db)):
    # Compute geocoded address before saving to PostgreSQL
    address = "Unknown Location"
    if item.latitude is not None and item.longitude is not None:
        try:
            geo_data = reverse_geocode(item.latitude, item.longitude)
            address = geo_data.get("address", f"Coords: {item.latitude}, {item.longitude}")
        except Exception:
            address = f"Coords: {item.latitude}, {item.longitude}"

    new_log = LogDB(
        deviceId=item.deviceId,
        sessionId=item.sessionId,
        sessionStartedAt=item.sessionStartedAt,
        level=item.level,
        message=item.message,
        timestamp=item.timestamp,
        browser=item.browser,
        browserVersion=item.browserVersion,
        deviceName=item.deviceName,
        os=item.os,
        latitude=item.latitude,
        longitude=item.longitude,
        url=item.url,
        location=address
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return {"status": "success", "id": new_log.id}

@app.get("/logs")
def get_logs(db: Session = Depends(get_db)):
    logs_list = db.query(LogDB).all()
    return logs_list

@app.get("/main_details")
def get_main_details(userId: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(LogDB)
    if userId and userId != "admin":
        query = query.filter(LogDB.deviceId == userId)
    
    logs_list = query.all()

    # Convert model objects to dictionaries for JSON return
    processed_logs = []
    for l in logs_list:
        processed_logs.append({
            "id": l.id,
            "deviceId": l.deviceId,
            "sessionId": l.sessionId,
            "sessionStartedAt": l.sessionStartedAt,
            "level": l.level,
            "message": l.message,
            "timestamp": l.timestamp,
            "browser": l.browser,
            "browserVersion": l.browserVersion,
            "deviceName": l.deviceName,
            "os": l.os,
            "latitude": l.latitude,
            "longitude": l.longitude,
            "url": l.url,
            "location": l.location or "Unknown Location"
        })

    # Compute devices from logs
    devices_map = {}
    for l in processed_logs:
        d_id = l["deviceId"]
        if d_id not in devices_map:
            devices_map[d_id] = {
                "id": d_id,
                "name": l.get("deviceName") or f"{l.get('os', 'Unknown')} Device",
                "browser": l.get("browser", "Unknown"),
                "os": l.get("os", "Unknown"),
                "online": True,  # Simplification
                "logCount": 0,
                "errorCount": 0,
                "lastSeen": l["timestamp"]
            }
        devices_map[d_id]["logCount"] += 1
        if l["level"].lower() == "error":
            devices_map[d_id]["errorCount"] += 1

    devices_list = list(devices_map.values())

    # Calculate statistics
    total_devices = len(devices_list)
    online_devices = len([d for d in devices_list if d["online"]])
    total_logs = len(processed_logs)
    errors_today = len([l for l in processed_logs if l["level"].lower() == "error"])

    stats = {
        "totalDevices": total_devices,
        "onlineDevices": online_devices,
        "totalLogs": total_logs,
        "errorsToday": errors_today
    }

    return {
        "logs": processed_logs,
        "devices": devices_list,
        "stats": stats
    }

conf = ConnectionConfig(
    MAIL_USERNAME = "",  # Mailpit allows anonymous SMTP in dev
    MAIL_PASSWORD = "",
    MAIL_FROM = "test@example.com",
    MAIL_PORT = 1025,
    MAIL_SERVER = "localhost",
    MAIL_STARTTLS = False,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = False,
)

@app.post("/send-email")
async def send_email():
    message = MessageSchema(
        subject="Test Email",
        recipients=["recipient@example.com"],
        body="Hello from FastAPI + Mailpit",
        subtype=MessageType.plain
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return {"status": "Email captured by Mailpit"}