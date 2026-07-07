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

from app.db.models import AdvanceEntry, User

advances = db.query(AdvanceEntry.user_id).distinct().all()
advance_user_ids = [a[0] for a in advances if a[0] is not None]

valid_users = db.query(User).filter(User.id.in_(advance_user_ids)).all()
valid_user_ids = [u.id for u in valid_users]

print(f"Total advance user IDs: {len(advance_user_ids)}")
print(f"Valid advance user IDs matching users table: {len(valid_user_ids)}")
if advance_user_ids:
    print(f"First few advance user_ids: {advance_user_ids[:5]}")
