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

print("Testing hybrid approach (fetch IDs first then in_ with joins)...")
start = time.time()
top_ids_res = db.query(BillRecord.id).order_by(BillRecord.id.desc()).limit(500).all()
top_ids = [r[0] for r in top_ids_res]

# We need the same tuple format: (BillRecord, Flower, User, Place) to avoid rewriting the serialization logic
records = (
    db.query(BillRecord, Flower, User, Place)
    .join(Flower, BillRecord.flower_id == Flower.id)
    .join(User, Flower.user_id == User.id)
    .join(Place, User.place_id == Place.id)
    .filter(BillRecord.id.in_(top_ids))
    .order_by(BillRecord.id.desc())
    .all()
)

print("Time taken:", time.time() - start)
print("Count:", len(records))

print("Testing direct selectinload approach...")
start = time.time()
from sqlalchemy.orm import selectinload
# fetch bill records with selectinload (it does IN queries automatically under the hood)
records2 = db.query(BillRecord).options(
    selectinload(BillRecord.flower).selectinload(Flower.user).selectinload(User.place)
).order_by(BillRecord.id.desc()).limit(500).all()
print("Time taken:", time.time() - start)
print("Count:", len(records2))
