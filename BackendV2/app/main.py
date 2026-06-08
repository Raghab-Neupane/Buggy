from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from app.schemas.log_event import LogEvent, UserId
import random
import string
from datetime import datetime, timezone, timedelta
import asyncio
import secrets
import hashlib

# Database imports
from sqlalchemy.orm import Session
from app.database import engine, Base, UserDB, PasswordResetToken, get_db
    
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
from app.service.log_manager import LogManager

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.device_listeners: Dict[str, List[WebSocket]] = {}
        self.dashboard_connections: List[Dict] = []
        self.last_heartbeat: Dict[str, datetime] = {}
        self.connected_at: Dict[str, datetime] = {}

    async def connect(self, device_id: str, websocket: WebSocket, is_dashboard: bool = False):
        await websocket.accept()
        if is_dashboard:
            if device_id not in self.device_listeners:
                self.device_listeners[device_id] = []
            self.device_listeners[device_id].append(websocket)
        else:
            previously_online = self.is_device_online(device_id)

            if device_id not in self.active_connections:
                self.active_connections[device_id] = []
            self.active_connections[device_id].append(websocket)

            # Register connection timestamps
            now = datetime.now(timezone.utc)
            self.last_heartbeat[device_id] = now
            self.connected_at[device_id] = now

            if not previously_online:
                await self.broadcast_status_to_dashboards(device_id, True)

    async def disconnect(self, device_id: str, websocket: WebSocket):
        # Remove from device listeners if present
        if device_id in self.device_listeners:
            if websocket in self.device_listeners[device_id]:
                self.device_listeners[device_id].remove(websocket)
            if not self.device_listeners[device_id]:
                del self.device_listeners[device_id]

        was_online = self.is_device_online(device_id)

        # Remove from active connections if present
        if device_id in self.active_connections:
            if websocket in self.active_connections[device_id]:
                self.active_connections[device_id].remove(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]
                if device_id in self.last_heartbeat:
                    del self.last_heartbeat[device_id]
                if device_id in self.connected_at:
                    del self.connected_at[device_id]

        if was_online and not self.is_device_online(device_id):
            await self.broadcast_status_to_dashboards(device_id, False)

    async def update_heartbeat(self, device_id: str):
        was_online = self.is_device_online(device_id)
        self.last_heartbeat[device_id] = datetime.now(timezone.utc)
        if not was_online and self.is_device_online(device_id):
            await self.broadcast_status_to_dashboards(device_id, True)

    async def force_disconnect(self, device_id: str):
        was_online = self.is_device_online(device_id)
        if device_id in self.active_connections:
            websockets = list(self.active_connections[device_id])
            for ws in websockets:
                try:
                    await ws.close()
                except Exception:
                    pass
            del self.active_connections[device_id]
        if device_id in self.last_heartbeat:
            del self.last_heartbeat[device_id]
        if device_id in self.connected_at:
            del self.connected_at[device_id]
        if was_online:
            await self.broadcast_status_to_dashboards(device_id, False)

    def is_device_online(self, device_id: str) -> bool:
        if device_id not in self.active_connections:
            return False
        if device_id not in self.last_heartbeat:
            return False
        now = datetime.now(timezone.utc)
        return (now - self.last_heartbeat[device_id]).total_seconds() < 90

    def get_last_seen(self, device_id: str) -> Optional[str]:
        if device_id in self.last_heartbeat:
            return self.last_heartbeat[device_id].isoformat().replace("+00:00", "Z")
        return None

    def get_connected_at(self, device_id: str) -> Optional[str]:
        if device_id in self.connected_at:
            return self.connected_at[device_id].isoformat().replace("+00:00", "Z")
        return None

    async def broadcast_status_to_dashboards(self, device_id: str, online: bool):
        for connection in self.dashboard_connections:
            ws = connection["ws"]
            u_id = connection["userId"]
            if u_id and u_id != "admin" and device_id != u_id:
                continue
            try:
                await ws.send_json({
                    "type": "status_change",
                    "payload": {
                        "deviceId": device_id,
                        "online": online
                     }
                })
            except Exception:
                pass

    async def connect_dashboard(self, websocket: WebSocket, user_id: Optional[str] = None):
        self.dashboard_connections.append({"ws": websocket, "userId": user_id})

    def disconnect_dashboard(self, websocket: WebSocket):
        self.dashboard_connections = [c for c in self.dashboard_connections if c["ws"] != websocket]

    async def broadcast_to_device(self, device_id: str, message: dict):
        targets = []
        if device_id in self.active_connections:
            targets.extend(self.active_connections[device_id])
        if device_id in self.device_listeners:
            targets.extend(self.device_listeners[device_id])
        for connection in targets:
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
log_manager = LogManager(max_buffer_size=1000)

app = FastAPI()

SDK_app = FastAPI()

app.mount("/sdk", SDK_app)

async def cleanup_stale_connections():
    while True:
        await asyncio.sleep(30)
        now = datetime.now(timezone.utc)
        stale_devices = []
        for device_id, hb_time in list(manager.last_heartbeat.items()):
            if (now - hb_time).total_seconds() > 90:
                stale_devices.append(device_id)
        for device_id in stale_devices:
            print(f"Stale device detected: {device_id}. Force disconnecting.", flush=True)
            await manager.force_disconnect(device_id)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_stale_connections())

class PathAwareCORSMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
        self.sdk_cors = CORSMiddleware(
            app=app,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        self.dash_cors = CORSMiddleware(
            app=app,
            allow_origins=[
                "https://buggyfrontend.vercel.app",
            ],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        print("PARENT APP HANDLED REQUEST", flush=True)

        path = scope.get("path", "")
        if path.startswith("/sdk"):
            print("SDK APP HANDLED REQUEST", flush=True)
            await self.sdk_cors(scope, receive, send)
        else:
            print("DASHBOARD APP HANDLED REQUEST", flush=True)
            await self.dash_cors(scope, receive, send)

app.add_middleware(PathAwareCORSMiddleware)


class UserSignup(BaseModel):
    email: str
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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
    
    token = create_access_token(db_user.user_id, item.email, db_user.role, db_user.token_version)
    
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

@app.post("/userid")
def get_userkey(item: UserId, db: Session = Depends(get_db)):
    # Simply verify if this key is assigned to any user
    user = db.query(UserDB).filter(UserDB.user_id == item.key).first()
    if not user:
        raise HTTPException(status_code=404, detail="User Key not found")
    return {"message": "Key exists", "key": item.key}

@SDK_app.websocket("/devices/{device_id}/stream")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    import json
    is_dashboard = websocket.query_params.get("client") == "dashboard"
    await manager.connect(device_id, websocket, is_dashboard=is_dashboard)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                payload = json.loads(data_text)
                if isinstance(payload, dict) and payload.get("type") == "heartbeat":
                    if payload.get("deviceId") == device_id:
                        await manager.update_heartbeat(device_id)
                        print(f"Heartbeat received from {device_id}", flush=True)
                    else:
                        print(f"Mismatched heartbeat deviceId: {payload.get('deviceId')} != {device_id}", flush=True)
            except Exception:
                pass
    except WebSocketDisconnect:
        await manager.disconnect(device_id, websocket)

@SDK_app.post("/logs")
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
        "location": address,
        "isOnline": manager.is_device_online(item.deviceId)
    }

    # Enrich with UUID and normalised timestamp via LogManager
    log_entry = await log_manager.process_log(log_entry)

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

@SDK_app.post("/devices/{device_id}/logs")
async def log_event_for_device(device_id: str, item: LogEvent, db: Session = Depends(get_db)):
    item.deviceId = device_id
    return await log_event(item, db)

@SDK_app.post("/logs/{user_id}")
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
        "location": address,
        "isOnline": manager.is_device_online(item.deviceId or user_id)
    }

    # Enrich with UUID and normalised timestamp via LogManager
    log_entry = await log_manager.process_log(log_entry)

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
            "endpoint": f"https://buggybackend.onrender.com/sdk/logs/{user_id}"
        }
    }
    return snippet

def _collect_logs(db: Session, user_id: Optional[str] = None) -> list:
    """Return a flat list of log dicts, optionally filtered by user_id."""
    if user_id and user_id != "admin":
        user = db.query(UserDB).filter(UserDB.user_id == user_id).first()
        if user and user.logs:
            res = list(user.logs)
            res.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
            return res
        return []
    users = db.query(UserDB).all()
    all_logs = []
    for u in users:
        if u.logs:
            all_logs.extend(u.logs)
    all_logs.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
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
    
    for l in logs_list:
        d_id = l.get("deviceId")
        if d_id:
            devices_set.add(d_id)
            if (l.get("level") or "").lower() == "error":
                errors_today += 1
            if manager.is_device_online(d_id):
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
                "online": manager.is_device_online(d_id),
                "logCount": 0,
                "errorCount": 0,
                "lastSeen": manager.get_last_seen(d_id) or l.get("timestamp"),
                "connectedAt": manager.get_connected_at(d_id),
                "url": l.get("url") or "",
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
        "last_seen": manager.get_last_seen(device_id) or last_log.get("timestamp"),
        "session_id": last_log.get("sessionId"),
        "user_agent": "Unknown User Agent",
        "url": last_log.get("url") or "http://localhost/",
        "latitude": last_log.get("latitude"),
        "longitude": last_log.get("longitude"),
        "session_started_at": last_log.get("sessionStartedAt") or last_log.get("timestamp"),
        "location": last_log.get("location"),
        "online": manager.is_device_online(device_id),
        "connected_at": manager.get_connected_at(device_id)
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
            "location": l.get("location") or "Unknown Location",
            "isOnline": manager.is_device_online(l.get("deviceId")) if l.get("deviceId") else l.get("isOnline")
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
                "online": manager.is_device_online(d_id),
                "logCount": 0,
                "errorCount": 0,
                "lastSeen": manager.get_last_seen(d_id) or l.get("timestamp"),
                "connectedAt": manager.get_connected_at(d_id),
                "url": l.get("url") or ""
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

# =========================
# PASSWORD RESET ENDPOINTS
# =========================

FRONTEND_URL = "http://localhost:5175"

@app.post("/auth/forgot-password")
async def forgot_password(item: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a secure reset token and email the reset link."""
    user = db.query(UserDB).filter(UserDB.email == item.email).first()

    # Always return success to avoid user enumeration attacks
    if not user:
        return {"status": "success", "message": "If that email exists, a reset link has been sent."}

    # Invalidate all previous unused reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).update({"used": True})
    db.commit()

    # Generate a secure random token
    raw_token = secrets.token_urlsafe(48)

    # Store only the SHA-256 hash in the database
    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

    now_utc = datetime.now(timezone.utc)
    now_naive = now_utc.replace(tzinfo=None)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now_naive + timedelta(minutes=30),
        used=False,
        created_at=now_naive
    )
    db.add(reset_record)
    db.commit()

    # Build reset URL with the raw token (not the hash)
    reset_link = f"{FRONTEND_URL}/reset-password?token={raw_token}"

    return {
        "status": "success",
        "message": "If that email exists, a reset link has been sent.",
        "reset_link": reset_link,
        "token": raw_token
    }


@app.post("/auth/reset-password")
def reset_password(item: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate the reset token and update the user's password."""
    # Hash the incoming token to match against stored hash
    token_hash = hashlib.sha256(item.token.encode('utf-8')).hexdigest()

    # Find matching reset token record
    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False
    ).first()

    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    # Check expiration
    if datetime.now(timezone.utc).replace(tzinfo=None) > reset_record.expires_at:
        reset_record.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    # Find the user
    user = db.query(UserDB).filter(UserDB.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    # Update the user's password using existing hashing mechanism
    user.password_hash = hash_password(item.new_password)
    user.token_version += 1
    db.add(user)

    # Mark this token as used
    reset_record.used = True

    # Invalidate all other active reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).update({"used": True})

    db.commit()

    return {"status": "success", "message": "Password has been reset successfully."}

