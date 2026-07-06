import time, os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, joinedload
from dotenv import load_dotenv

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.models import BillRecord, Flower, User, Place

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
Session = sessionmaker(bind=engine)
db = Session()

print("Testing joinedload approach...")
start = time.time()
records = db.query(BillRecord).options(
    joinedload(BillRecord.flower).joinedload(Flower.user).joinedload(User.place)
).order_by(BillRecord.id.desc()).limit(500).all()
print("Time taken:", time.time() - start)
print("Count:", len(records))

print("Testing existing approach...")
start = time.time()
query = (
    db.query(BillRecord, Flower, User, Place)
    .join(Flower, BillRecord.flower_id == Flower.id)
    .join(User, Flower.user_id == User.id)
    .join(Place, User.place_id == Place.id)
)
records2 = query.order_by(BillRecord.id.desc()).limit(500).all()
print("Time taken:", time.time() - start)
print("Count:", len(records2))
