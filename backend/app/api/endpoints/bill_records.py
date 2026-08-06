from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.db.database import get_db
from app.db.models import BillRecord, Flower, User, Place
from app.schemas.hierarchy import BillRecordCreate, BillRecord as BillRecordSchema, TransactionOut, MarkPrintedPayload

router = APIRouter()

@router.get("/transactions", response_model=List[TransactionOut])
def get_all_transactions(
    search: Optional[str] = Query(None),
    place_name: Optional[str] = Query(None),
    flower_name: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    limit: int = Query(500),
    db: Session = Depends(get_db)
):
    # If no complex cross-table filters are applied, use the fast path with selectinload
    if not any([search, place_name, flower_name, date_from, date_to, month]):
        from sqlalchemy.orm import selectinload
        records = db.query(BillRecord).options(
            selectinload(BillRecord.flower), selectinload(BillRecord.user).selectinload(User.place)
        ).order_by(BillRecord.id.desc()).limit(limit).all()
    else:
        # If filters are applied, use joins
        query = db.query(BillRecord).join(Flower, BillRecord.flower_id == Flower.id).join(User, BillRecord.user_id == User.id).join(Place, User.place_id == Place.id)
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Flower.name.ilike(search_term),
                    User.name.ilike(search_term),
                    Place.name.ilike(search_term),
                    BillRecord.van.ilike(search_term)
                )
            )
        
        if place_name:
            query = query.filter(Place.name == place_name)
        if flower_name:
            query = query.filter(Flower.name == flower_name)
        if date_from:
            query = query.filter(BillRecord.date >= date_from)
        if date_to:
            query = query.filter(BillRecord.date <= date_to)
        if month:
            from sqlalchemy import func
            query = query.filter(func.substr(func.date(BillRecord.date), 1, 7) == month)
            
        from sqlalchemy.orm import selectinload
        records = query.options(
            selectinload(BillRecord.flower), selectinload(BillRecord.user).selectinload(User.place)
        ).order_by(BillRecord.id.desc()).limit(limit).all()

    result = []
    for br in records:
        f = br.flower
        u = br.user
        p = u.place if u else None
        result.append({
            "id": br.id,
            "user_id": br.user_id,
            "flower_id": br.flower_id,
            "date": br.date,
            "weight": br.weight,
            "van": br.van,
            "rate": br.rate,
            "laggage": br.laggage,
            "collie": br.collie,
            "print_taken": br.print_taken,
            "flower_name": f.name if f else "",
            "client_name": u.name if u else "",
            "place_name": p.name if p else "",
            "client_id": u.id if u else None,
            "place_id": p.id if p else None
        })
    return result

@router.post("/", response_model=BillRecordSchema)
def create_bill_record(record: BillRecordCreate, db: Session = Depends(get_db)):
    van_val = record.van.strip() if record.van and record.van.strip() else "v1"
    laggage_val = record.laggage or 0.0
    collie_val = record.collie or 0.0
    

    
    db_record = BillRecord(
        user_id=record.user_id,
        flower_id=record.flower_id,
        date=record.date,
        weight=record.weight,
        van=van_val,
        rate=record.rate,
        laggage=laggage_val,
        collie=collie_val,
        print_taken=record.print_taken or False
    )
    db.add(db_record)
    db.flush()
    
    resp = {
        "id": db_record.id,
        "user_id": db_record.user_id,
        "flower_id": db_record.flower_id,
        "date": db_record.date,
        "weight": db_record.weight,
        "van": db_record.van,
        "rate": db_record.rate,
        "laggage": db_record.laggage,
        "collie": db_record.collie,
        "print_taken": db_record.print_taken
    }
    
    db.commit()
    return resp

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
    laggage_val = record.laggage or 0.0
    collie_val = record.collie or 0.0
    

    
    db_record.user_id = record.user_id
    db_record.flower_id = record.flower_id
    db_record.date = record.date
    db_record.weight = record.weight
    db_record.van = van_val
    db_record.rate = record.rate
    db_record.laggage = laggage_val
    db_record.collie = collie_val
    if record.print_taken is not None:
        db_record.print_taken = record.print_taken
    
    db.flush()
    resp = {
        "id": db_record.id,
        "user_id": db_record.user_id,
        "flower_id": db_record.flower_id,
        "date": db_record.date,
        "weight": db_record.weight,
        "van": db_record.van,
        "rate": db_record.rate,
        "laggage": db_record.laggage,
        "collie": db_record.collie,
        "print_taken": db_record.print_taken
    }
    
    db.commit()
    return resp

@router.delete("/{record_id}")
def delete_bill_record(record_id: int, db: Session = Depends(get_db)):
    db_record = db.query(BillRecord).filter(BillRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(db_record)
    db.commit()
    return {"detail": "Record deleted"}
