from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5433/buggy"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    user_id = Column(String, unique=True, index=True, nullable=False)  # 4-character unique key
    # Store logs as a JSON array per user
    logs = Column(JSONB, default=list)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
