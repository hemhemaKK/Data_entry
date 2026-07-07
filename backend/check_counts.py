import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_db_url_from_env():
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('DATABASE_URL='):
                return line.strip().split('=', 1)[1]
    return "sqlite:///./sql_app.db"

def check_db(db_url):
    print(f"\nChecking DB: {db_url}")
    try:
        connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
        engine = create_engine(db_url, connect_args=connect_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        from app.db.models import BillRecord, Upload, Place, User, Year, AdvanceEntry, Flower
        
        counts = {
            "Years": db.query(Year).count(),
            "Places": db.query(Place).count(),
            "Users": db.query(User).count(),
            "Uploads": db.query(Upload).count(),
            "Flowers": db.query(Flower).count(),
            "BillRecords": db.query(BillRecord).count(),
            "AdvanceEntries": db.query(AdvanceEntry).count()
        }
        for k, v in counts.items():
            print(f"{k}: {v}")
            
        # Check if bills have flowers that have users
        null_flowers = db.query(BillRecord).filter(BillRecord.flower_id == None).count()
        print(f"Bills with null flower: {null_flowers}")
        
        db.close()
    except Exception as e:
        print(f"Error checking {db_url}: {e}")

if __name__ == "__main__":
    check_db(get_db_url_from_env())
    check_db("sqlite:///./deployed_backup.db")
    check_db("sqlite:///./sql_app_old_local.db")
