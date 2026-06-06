from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.log_event import LogEvent, UserId
# pyrefly: ignore [missing-import]
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
import random
import string
import datetime

# Database imports
from sqlalchemy.orm import Session
from app.database import engine, Base, UserDB, get_db
    
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

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.dashboard_connections: List[Dict] = []

    async def connect(self, device_id: str, websocket: WebSocket):
        await websocket.accept()
        if device_id not in self.active_connections:
            self.active_connections[device_id] = []
        self.active_connections[device_id].append(websocket)

    def disconnect(self, device_id: str, websocket: WebSocket):
        if device_id in self.active_connections:
            if websocket in self.active_connections[device_id]:
                self.active_connections[device_id].remove(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]

    async def connect_dashboard(self, websocket: WebSocket, user_id: Optional[str] = None):
        self.dashboard_connections.append({"ws": websocket, "userId": user_id})

    def disconnect_dashboard(self, websocket: WebSocket):
        self.dashboard_connections = [c for c in self.dashboard_connections if c["ws"] != websocket]

    async def broadcast_to_device(self, device_id: str, message: dict):
        if device_id in self.active_connections:
            for connection in self.active_connections[device_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_to_dashboards(self, log_data: dict):
        for connection in self.dashboard_connections:
            ws = connection["ws"]
            u_id = connection["userId"]
            if u_id and u_id != "admin" and log_data.get("deviceId") != u_id:
                continue
            try:
                await ws.send_json({
                    "type": "log_event",
                    "payload": log_data
                })
            except Exception:
                pass

manager = ConnectionManager()

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
        user_id=user_id,
        logs=[]
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

@app.get("/logout")
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

@app.websocket("/devices/{device_id}/stream")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    await manager.connect(device_id, websocket)
    try:
        while True:
            # Keep connection alive and receive any client message (like heartbeat)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(device_id, websocket)

@app.post("/logs")
async def log_event(item: LogEvent, db: Session = Depends(get_db)):
    # Compute geocoded address before storing
    address = "Unknown Location"
    if item.latitude is not None and item.longitude is not None:
        try:
            geo_data = reverse_geocode(item.latitude, item.longitude)
            address = geo_data.get("address", f"Coords: {item.latitude}, {item.longitude}")
        except Exception:
            address = f"Coords: {item.latitude}, {item.longitude}"

    # Build log entry dict
    log_entry = {
        "deviceId": item.deviceId,
        "sessionId": item.sessionId,
        "sessionStartedAt": item.sessionStartedAt,
        "level": item.level,
        "message": item.message,
        "timestamp": item.timestamp,
        "browser": item.browser,
        "browserVersion": item.browserVersion,
        "deviceName": item.deviceName,
        "os": item.os,
        "latitude": item.latitude,
        "longitude": item.longitude,
        "url": item.url,
        "location": address
    }

    # Find user to associate logs with (use deviceId as user_id if possible)
    user = db.query(UserDB).filter(UserDB.user_id == item.deviceId).first()
    if not user:
        # Fallback to first user (should exist)
        user = db.query(UserDB).first()
    if not user:
        raise HTTPException(status_code=500, detail="No user found to store logs")
    
    # JSONB column: must reassign the whole list for SQLAlchemy to detect the change
    current_logs = list(user.logs or [])
    current_logs.append(log_entry)
    user.logs = current_logs
    db.add(user)
    db.commit()
    db.refresh(user)

    # Broadcast log event to websocket clients (same payload as before)
    await manager.broadcast_to_device(item.deviceId, log_entry)
    await manager.broadcast_to_dashboards(log_entry)

    return {"status": "success"}


@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket, userId: Optional[str] = None):
    await websocket.accept()
    await manager.connect_dashboard(websocket, userId)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_dashboard(websocket)

@app.post("/devices/{device_id}/logs")
async def log_event_for_device(device_id: str, item: LogEvent, db: Session = Depends(get_db)):
    item.deviceId = device_id
    return await log_event(item, db)

@app.post("/logs/{user_id}")
async def log_event_for_user(user_id: str, item: LogEvent, db: Session = Depends(get_db)):
    """Accept logs posted to a user-specific endpoint (from npmpackagebuggy init)."""
    # Look up the user by their assigned user_id
    user = db.query(UserDB).filter(UserDB.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    # Compute geocoded address
    address = "Unknown Location"
    if item.latitude is not None and item.longitude is not None:
        try:
            geo_data = reverse_geocode(item.latitude, item.longitude)
            address = geo_data.get("address", f"Coords: {item.latitude}, {item.longitude}")
        except Exception:
            address = f"Coords: {item.latitude}, {item.longitude}"

    # Build log entry — tag it with the user_id as deviceId so it shows up under their dashboard
    log_entry = {
        "deviceId": item.deviceId or user_id,
        "sessionId": item.sessionId,
        "sessionStartedAt": item.sessionStartedAt,
        "level": item.level,
        "message": item.message,
        "timestamp": item.timestamp,
        "browser": item.browser,
        "browserVersion": item.browserVersion,
        "deviceName": item.deviceName,
        "os": item.os,
        "latitude": item.latitude,
        "longitude": item.longitude,
        "url": item.url,
        "location": address
    }

    # Store in user's JSONB logs column
    current_logs = list(user.logs or [])
    current_logs.append(log_entry)
    user.logs = current_logs
    db.add(user)
    db.commit()
    db.refresh(user)

    # Broadcast to websocket clients
    await manager.broadcast_to_device(log_entry["deviceId"], log_entry)
    await manager.broadcast_to_dashboards(log_entry)

    return {"status": "success"}

@app.get("/init/{user_id}")
def get_init_snippet(user_id: str, db: Session = Depends(get_db)):
    """Return npm package init snippet for the given user_id."""
    # Verify user exists (optional)
    user = db.query(UserDB).filter(UserDB.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    snippet = {
        "import": "import { init } from 'npmpackagebuggy'",
        "init": {
            "endpoint": f"http://localhost:8000/logs/{user_id}"
        }
    }
    return snippet

# ---------- Helper: collect all log dicts from UserDB ----------
def _collect_logs(db: Session, user_id: Optional[str] = None) -> list:
    """Return a flat list of log dicts, optionally filtered by user_id."""
    if user_id and user_id != "admin":
        user = db.query(UserDB).filter(UserDB.user_id == user_id).first()
        if user and user.logs:
            return list(user.logs)
        return []
    users = db.query(UserDB).all()
    all_logs = []
    for u in users:
        if u.logs:
            all_logs.extend(u.logs)
    return all_logs

@app.get("/logs")
def get_logs(db: Session = Depends(get_db)):
    return _collect_logs(db)

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    logs_list = _collect_logs(db)
    devices_set = set()
    online_devices_set = set()
    errors_today = 0
    now = datetime.datetime.utcnow()
    
    for l in logs_list:
        d_id = l.get("deviceId")
        if d_id:
            devices_set.add(d_id)
            if (l.get("level") or "").lower() == "error":
                errors_today += 1
            try:
                ts_str = (l.get("timestamp") or "").replace('Z', '')
                ts = datetime.datetime.fromisoformat(ts_str)
                if (now - ts).total_seconds() < 300:
                    online_devices_set.add(d_id)
            except Exception:
                online_devices_set.add(d_id)
                
    return {
        "totalDevices": len(devices_set),
        "onlineDevices": len(online_devices_set),
        "totalLogs": len(logs_list),
        "errorsToday": errors_today
    }

@app.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    logs_list = _collect_logs(db)
    devices_map = {}
    for l in logs_list:
        d_id = l.get("deviceId")
        if not d_id:
            continue
        if d_id not in devices_map:
            devices_map[d_id] = {
                "id": d_id,
                "name": l.get("deviceName") or f"{l.get('os', 'Unknown')} Device",
                "browser": l.get("browser") or "Unknown",
                "os": l.get("os") or "Unknown",
                "online": True,
                "logCount": 0,
                "errorCount": 0,
                "lastSeen": l.get("timestamp"),
                "latitude": l.get("latitude"),
                "longitude": l.get("longitude"),
                "address": l.get("location") or "Unknown Location"
            }
        devices_map[d_id]["logCount"] += 1
        if (l.get("level") or "").lower() == "error":
            devices_map[d_id]["errorCount"] += 1
    return list(devices_map.values())

@app.get("/devices/{device_id}")
def get_device(device_id: str, db: Session = Depends(get_db)):
    logs_list = _collect_logs(db)
    logs = [l for l in logs_list if l.get("deviceId") == device_id]
    if not logs:
        raise HTTPException(status_code=404, detail="Device not found")
    # Sort by timestamp descending
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    last_log = logs[0]
    return {
        "id": device_id,
        "device_name": last_log.get("deviceName") or f"{last_log.get('os', 'Unknown')} Device",
        "browser": last_log.get("browser") or "Unknown",
        "os": last_log.get("os") or "Unknown",
        "browser_version": last_log.get("browserVersion") or "Unknown",
        "last_seen": last_log.get("timestamp"),
        "session_id": last_log.get("sessionId"),
        "user_agent": "Unknown User Agent",
        "url": last_log.get("url") or "http://localhost/",
        "latitude": last_log.get("latitude"),
        "longitude": last_log.get("longitude"),
        "session_started_at": last_log.get("sessionStartedAt") or last_log.get("timestamp"),
        "location": last_log.get("location")
    }

@app.get("/devices/{device_id}/logs")
def get_device_logs(device_id: str, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    logs_list = _collect_logs(db)
    logs = [l for l in logs_list if l.get("deviceId") == device_id]
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    logs = logs[offset:offset+limit]
    return [
        {
            "id": l.get("id"),
            "level": l.get("level"),
            "message": l.get("message"),
            "timestamp": l.get("timestamp"),
            "deviceid": l.get("deviceId"),
            "url": l.get("url"),
            "location": l.get("location") or "Unknown Location",
            "browser": l.get("browser"),
            "browserVersion": l.get("browserVersion"),
            "deviceName": l.get("deviceName"),
            "os": l.get("os"),
            "latitude": l.get("latitude"),
            "longitude": l.get("longitude"),
            "sessionStartedAt": l.get("sessionStartedAt")
        } for l in logs
    ]

@app.get("/main_details")
def get_main_details(userId: Optional[str] = None, db: Session = Depends(get_db)):
    logs_list = _collect_logs(db, user_id=userId)

    # Convert to serializable dicts
    processed_logs = []
    for l in logs_list:
        processed_logs.append({
            "id": l.get("id"),
            "deviceId": l.get("deviceId"),
            "sessionId": l.get("sessionId"),
            "sessionStartedAt": l.get("sessionStartedAt"),
            "level": l.get("level"),
            "message": l.get("message"),
            "timestamp": l.get("timestamp"),
            "browser": l.get("browser"),
            "browserVersion": l.get("browserVersion"),
            "deviceName": l.get("deviceName"),
            "os": l.get("os"),
            "latitude": l.get("latitude"),
            "longitude": l.get("longitude"),
            "url": l.get("url"),
            "location": l.get("location") or "Unknown Location"
        })

    # Compute devices from logs
    devices_map = {}
    for l in processed_logs:
        d_id = l.get("deviceId")
        if not d_id:
            continue
        if d_id not in devices_map:
            devices_map[d_id] = {
                "id": d_id,
                "name": l.get("deviceName") or f"{l.get('os', 'Unknown')} Device",
                "browser": l.get("browser", "Unknown"),
                "os": l.get("os", "Unknown"),
                "online": True,  # Simplification
                "logCount": 0,
                "errorCount": 0,
                "lastSeen": l.get("timestamp")
            }
        devices_map[d_id]["logCount"] += 1
        if (l.get("level") or "").lower() == "error":
            devices_map[d_id]["errorCount"] += 1

    devices_list = list(devices_map.values())

    # Calculate statistics
    total_devices = len(devices_list)
    online_devices = len([d for d in devices_list if d["online"]])
    total_logs = len(processed_logs)
    errors_today = len([l for l in processed_logs if (l.get("level") or "").lower() == "error"])

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