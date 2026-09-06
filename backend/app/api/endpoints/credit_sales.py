from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import get_db
from app.db.models import CreditSalesUser, CreditSalesRecord, Flower

router = APIRouter()

@router.get("/")
def get_credit_sales_data(db: Session = Depends(get_db)):
    users = db.query(CreditSalesUser).all()
    records = db.query(CreditSalesRecord).all()
    flowers = {f.id: f.name for f in db.query(Flower).all()}
    
    users_data = [
        {
            "id": u.id,
            "customer_name": u.customer_name,
            "phone_number": u.phone_number,
            "created_at": u.created_at
        }
        for u in users
    ]
    
    users_dict = {u.id: u.customer_name for u in users}
    
    records_data = [
        {
            "id": r.id,
            "flower_id": r.flower_id,
            "flower_name": flowers.get(r.flower_id, "Unknown"),
            "customer_name": users_dict.get(r.credit_sales_user_id, "Unknown"),
            "date": r.date,
            "weight": r.weight,
            "rate": r.rate,
            "credit": r.credit,
            "debit": r.debit,
            "created_at": r.created_at
        }
        for r in records
    ]
    
    return {
        "users": users_data,
        "records": records_data
    }

from pydantic import BaseModel
from typing import Optional
from datetime import date

class CreditSalesEntrySchema(BaseModel):
    date: date
    flower_id: Optional[int] = None
    customer_name: str
    weight: Optional[float] = None
    rate: Optional[float] = None
    type: str # "Credit" or "Debit"
    amount: float

@router.post("/")
def create_credit_sales_entry(entry: CreditSalesEntrySchema, db: Session = Depends(get_db)):
    # Find or create user
    user = db.query(CreditSalesUser).filter(CreditSalesUser.customer_name == entry.customer_name.strip()).first()
    if not user:
        user = CreditSalesUser(customer_name=entry.customer_name.strip())
        db.add(user)
        db.commit()
        db.refresh(user)
    
    credit = entry.amount if entry.type == "Credit" else None
    debit = entry.amount if entry.type == "Debit" else None
    
    record = CreditSalesRecord(
        credit_sales_user_id=user.id,
        flower_id=entry.flower_id,
        date=entry.date,
        weight=entry.weight,
        rate=entry.rate,
        credit=credit,
        debit=debit
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return {"message": "Entry added successfully", "record_id": record.id}

from fastapi import HTTPException

class BulkUpdateCreditSalesSchema(BaseModel):
    record_ids: List[int]
    date: Optional[date] = None
    weight: Optional[float] = None
    rate: Optional[float] = None

class BulkDeleteCreditSalesSchema(BaseModel):
    record_ids: List[int]

@router.put("/{record_id}")
def update_credit_sales_entry(record_id: int, entry: CreditSalesEntrySchema, db: Session = Depends(get_db)):
    record = db.query(CreditSalesRecord).filter(CreditSalesRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    user = db.query(CreditSalesUser).filter(CreditSalesUser.customer_name == entry.customer_name.strip()).first()
    if not user:
        user = CreditSalesUser(customer_name=entry.customer_name.strip())
        db.add(user)
        db.commit()
        db.refresh(user)
        
    record.credit_sales_user_id = user.id
    record.flower_id = entry.flower_id
    record.date = entry.date
    record.weight = entry.weight
    record.rate = entry.rate
    record.credit = entry.amount if entry.type == "Credit" else None
    record.debit = entry.amount if entry.type == "Debit" else None
    
    db.commit()
    return {"message": "Record updated"}

@router.delete("/{record_id}")
def delete_credit_sales_entry(record_id: int, db: Session = Depends(get_db)):
    record = db.query(CreditSalesRecord).filter(CreditSalesRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}

@router.put("/bulk/update")
def bulk_update_entries(payload: BulkUpdateCreditSalesSchema, db: Session = Depends(get_db)):
    update_data = {}
    if payload.date is not None:
        update_data[CreditSalesRecord.date] = payload.date
    if payload.weight is not None:
        update_data[CreditSalesRecord.weight] = payload.weight
    if payload.rate is not None:
        update_data[CreditSalesRecord.rate] = payload.rate
        
    if not update_data:
        return {"message": "No fields to update"}
        
    db.query(CreditSalesRecord).filter(CreditSalesRecord.id.in_(payload.record_ids)).update(update_data, synchronize_session=False)
    db.commit()
    return {"message": f"Updated {len(payload.record_ids)} records"}

@router.post("/bulk/delete")
def bulk_delete_entries(payload: BulkDeleteCreditSalesSchema, db: Session = Depends(get_db)):
    db.query(CreditSalesRecord).filter(CreditSalesRecord.id.in_(payload.record_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Deleted {len(payload.record_ids)} records"}

class CreditSalesUserUpdate(BaseModel):
    customer_name: str
    phone_number: Optional[str] = None

@router.put('/user/{user_id}')
def update_credit_sales_user(user_id: int, payload: CreditSalesUserUpdate, db: Session = Depends(get_db)):
    user = db.query(CreditSalesUser).filter(CreditSalesUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user.customer_name = payload.customer_name
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    db.commit()
    return {'message': 'User updated successfully'}

@router.delete('/user/{user_id}')
def delete_credit_sales_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(CreditSalesUser).filter(CreditSalesUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    # Let's delete associated records manually or cascade is handled by DB
    db.query(CreditSalesRecord).filter(CreditSalesRecord.credit_sales_user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {'message': 'User and associated records deleted'}
