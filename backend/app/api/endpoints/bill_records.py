from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import BillRecord, Flower, User
from app.schemas.hierarchy import BillRecordCreate, BillRecord as BillRecordSchema, TransactionOut, MarkPrintedPayload

router = APIRouter()

@router.get("/transactions", response_model=List[TransactionOut])
def get_all_transactions(db: Session = Depends(get_db)):
    records = (
        db.query(BillRecord, Flower, User)
        .join(Flower, BillRecord.flower_id == Flower.id)
        .join(User, Flower.user_id == User.id)
        .order_by(BillRecord.date.desc())
        .all()
    )
    
    result = []
    for br, f, u in records:
        result.append({
            "id": br.id,
            "date": br.date,
            "weight": br.weight,
            "van": br.van,
            "rate": br.rate,
            "laggage": br.laggage,
            "collie": br.collie,
            "print_taken": br.print_taken,
            "flower_name": f.name,
            "client_name": u.name
        })
    return result

@router.post("/", response_model=BillRecordSchema)
def create_bill_record(record: BillRecordCreate, db: Session = Depends(get_db)):
    flower = db.query(Flower).filter(Flower.id == record.flower_id).first()
    if not flower:
        raise HTTPException(status_code=404, detail="Flower not found")
    
    van_val = record.van.strip() if record.van and record.van.strip() else "v1"
    
    db_record = BillRecord(
        flower_id=record.flower_id,
        date=record.date,
        weight=record.weight,
        van=van_val,
        rate=record.rate,
        laggage=record.laggage or 0.0,
        collie=record.collie or 0.0,
        print_taken=record.print_taken or False
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.put("/mark_printed", response_model=dict)
def mark_records_printed(payload: MarkPrintedPayload, db: Session = Depends(get_db)):
    if not payload.record_ids:
        return {"updated_count": 0}
    
    records = db.query(BillRecord).filter(BillRecord.id.in_(payload.record_ids)).all()
    for rec in records:
        rec.print_taken = payload.status
    
    db.commit()
    return {"updated_count": len(records)}

@router.put("/{record_id}", response_model=BillRecordSchema)
def update_bill_record(record_id: int, record: BillRecordCreate, db: Session = Depends(get_db)):
    db_record = db.query(BillRecord).filter(BillRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    van_val = record.van.strip() if record.van and record.van.strip() else "v1"
    
    db_record.flower_id = record.flower_id
    db_record.date = record.date
    db_record.weight = record.weight
    db_record.van = van_val
    db_record.rate = record.rate
    db_record.laggage = record.laggage or 0.0
    db_record.collie = record.collie or 0.0
    if record.print_taken is not None:
        db_record.print_taken = record.print_taken
    
    db.commit()
    db.refresh(db_record)
    return db_record

@router.delete("/{record_id}")
def delete_bill_record(record_id: int, db: Session = Depends(get_db)):
    db_record = db.query(BillRecord).filter(BillRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(db_record)
    db.commit()
    return {"detail": "Record deleted"}
