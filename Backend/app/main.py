from fastapi import FastAPI, Request
from typing import List, Union
from app.schema.schema import LogEvent, LocationResponse
from fastapi.middleware.cors import CORSMiddleware
from app.services.location import resolve_location

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logs = []

@app.get("/location", response_model=LocationResponse)
async def get_location(request: Request):
    # Extract client IP address from proxy headers if present, falling back to connection host
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            client_ip = real_ip.strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

    location_data = await resolve_location(client_ip)
    return location_data

def enrich_log_event(event: LogEvent, ip: str, loc: dict):
    event.ip = ip
    event.country = loc.get("country", "unknown")
    event.city = loc.get("city", "unknown")
    event.region = loc.get("region", "unknown")
    event.latitude = loc.get("latitude")
    event.longitude = loc.get("longitude")

@app.post("/logs")
async def create_log(log: Union[LogEvent, List[LogEvent]], request: Request):
    # Extract client IP address from proxy headers if present, falling back to connection host
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            client_ip = real_ip.strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

    location_data = await resolve_location(client_ip)

    if isinstance(log, list):
        for event in log:
            enrich_log_event(event, client_ip, location_data)
            logs.append(event.model_dump())
    else:
        enrich_log_event(log, client_ip, location_data)
        logs.append(log.model_dump())

    return {
        "Status": "Sucess"
    }

@app.get("/logs")
async def get_logs():
    return logs