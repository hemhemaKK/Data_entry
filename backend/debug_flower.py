from app.db.database import SessionLocal
from app.db.models import Flower, BillRecord
from app.schemas.hierarchy import Flower as FlowerSchema
import json

db = SessionLocal()
try:
    flowers = db.query(Flower).all()
    print("Found", len(flowers), "flowers")
    for f in flowers:
        try:
            print(f"Flower ID: {f.id}, Name: {f.name}, BillRecords count: {len(f.bill_records)}")
            schema_f = FlowerSchema.from_orm(f)
            print("Serialized successfully:", schema_f.dict())
        except Exception as e:
            print(f"Error serializing flower {f.id}:", str(e))
            import traceback
            traceback.print_exc()
finally:
    db.close()
