import time, os, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.models import BillRecord, Flower

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
Session = sessionmaker(bind=engine)
db = Session()

# 1. Existing approach
start = time.time()
flower = db.query(Flower).filter(Flower.id == 658).first()
van_val = "v1"
db_record = BillRecord(
    flower_id=658,
    date=datetime.date.today(),
    weight=10,
    van=van_val,
    rate=10,
    laggage=0,
    collie=0,
    print_taken=False
)
db.add(db_record)
db.commit()
db.refresh(db_record)
print("Existing Insert Time:", time.time() - start)
db.delete(db_record)
db.commit()

# 2. Optimized approach
start = time.time()
db_record2 = BillRecord(
    flower_id=658,
    date=datetime.date.today(),
    weight=10,
    van="v1",
    rate=10,
    laggage=0,
    collie=0,
    print_taken=False
)
db.add(db_record2)
db.commit()
print("Optimized Insert Time:", time.time() - start)
db.delete(db_record2)
db.commit()
