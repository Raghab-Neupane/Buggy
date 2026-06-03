import os
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environmental configs
load_dotenv()

CORE_DB_URL = os.getenv("CORE_DATABASE_URL", "mysql+aiomysql://root@localhost:3306/buggy_core")
LOGS_DB_URL = os.getenv("LOGS_DATABASE_URL", "mysql+aiomysql://root@localhost:3306/buggy_logs")

# Configure core database engine with connection pooling
core_engine = create_async_engine(
    CORE_DB_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    pool_pre_ping=True
)

# Configure logs database engine with larger connection pool
logs_engine = create_async_engine(
    LOGS_DB_URL,
    pool_size=20,
    max_overflow=40,
    pool_recycle=1800,
    pool_pre_ping=True
)

# Create session factories
CoreSessionLocal = sessionmaker(
    bind=core_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

LogsSessionLocal = sessionmaker(
    bind=logs_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

# Async Dependency Generators for FastAPI routes
async def get_core_db():
    async with CoreSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def get_logs_db():
    async with LogsSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
