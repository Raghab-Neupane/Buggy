from fastapi import FastAPI
from app.schema.schema import LogEvent

app = FastAPI()

logs = []

@app.post("/logs")
async def create_log(log: LogEvent):
    logs.append(log.model_dump())
    return {
        "Status": "Sucess"
    }

@app.get("/logs")
async def get_logs():
    return logs