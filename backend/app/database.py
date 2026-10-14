from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

os.makedirs("data", exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render گاهی آدرس را با postgres:// می‌دهد که SQLAlchemy جدید نمی‌پسندد
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    print("Connecting to PostgreSQL database...")
    engine = create_engine(DATABASE_URL)
else:
    print("Connecting to local SQLite database...")
    SQLALCHEMY_DATABASE_URL = "sqlite:///data/tasks.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
