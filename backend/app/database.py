from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# این خط باعث می‌شود پوشه data در کنار پروژه ساخته شود (برای حالت لوکال)
os.makedirs("data", exist_ok=True)

# این خط بررسی می‌کند که آیا آدرس دیتابیس ابری تنظیم شده یا نه
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # اگر روی سرور بودیم، از دیتابیس ابری استفاده کن
    print("Connecting to PostgreSQL database...")
    engine = create_engine(DATABASE_URL)
else:
    # اگر روی سیستم خودت بودی، از همان SQLite قدیمی استفاده کن
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