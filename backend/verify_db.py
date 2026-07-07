import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_db_url_from_env():
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                return line.strip().split('=', 1)[1]
    return "sqlite:///./sql_app.db"

db_url = get_db_url_from_env()
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

from app.db.models import BillRecord
from sqlalchemy import func

count = db.query(BillRecord).count()
oldest = db.query(func.min(BillRecord.date)).scalar()
newest = db.query(func.max(BillRecord.date)).scalar()
total_weight = db.query(func.sum(BillRecord.weight)).scalar()

print(f"Total Records: {count}")
print(f"Oldest Date: {oldest}")
print(f"Newest Date: {newest}")
print(f"Total Weight: {total_weight}")
