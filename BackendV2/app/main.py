from fastapi import FastAPI
from app.schemas.log_event import LogEvent
from fastapi.middleware.cors import CORSMiddleware
from app.credintials.credintials import userdetails
# pyrefly: ignore [missing-import]
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

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

details = []

@app.post("/login")
def get_login(item: userdetails = details):
    details.append(item)


conf = ConnectionConfig(
    MAIL_USERNAME = "",  # Mailpit often allows anonymous SMTP in dev
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