from fastapi import FastAPI
from app.schemas.log_event import LogEvent
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, be more specific
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logs = []    


@app.post("/logs")
def log_event(item: LogEvent = logs):
    logs.append(item)
    return logs



@app.get("/logs")
def get_logs():
    return logs
