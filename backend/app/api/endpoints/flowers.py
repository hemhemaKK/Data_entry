from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Flower, User
from app.schemas.hierarchy import FlowerCreate, Flower as FlowerSchema, FlowerOut

router = APIRouter()

@router.post("/", response_model=FlowerSchema)
def create_flower(flower: FlowerCreate, db: Session = Depends(get_db)):
    flower_name = flower.name.strip()
    req_lower = flower_name.lower()
    from sqlalchemy import func
    
    existing = db.query(Flower).filter(func.lower(Flower.name) == req_lower).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Flower '{flower_name}' already exists.")
        
    db_flower = Flower(name=flower_name)
    db.add(db_flower)
    db.commit()
    db.refresh(db_flower)
    return {"id": db_flower.id, "name": db_flower.name, "bill_records": []}

from sqlalchemy.orm import selectinload
from app.db.models import BillRecord

@router.get("/", response_model=List[FlowerSchema])
def list_flowers(user_id: Optional[int] = None, place_id: Optional[int] = None, db: Session = Depends(get_db)):
    flowers = db.query(Flower).order_by(Flower.id.desc()).all()
    
    bills_map = {}
    if user_id or place_id:
        query = db.query(BillRecord)
        if user_id:
            query = query.filter(BillRecord.user_id == user_id)
        if place_id:
            query = query.join(User).filter(User.place_id == place_id)
        for b in query.all():
            bills_map.setdefault(b.flower_id, []).append(b)
            
    result = []
    for fl in flowers:
        result.append({
            "id": fl.id,
            "name": fl.name,
            "bill_records": bills_map.get(fl.id, [])
        })
    return result

@router.get("/{flower_id}", response_model=FlowerSchema)
def get_flower(flower_id: int, db: Session = Depends(get_db)):
    fl = db.query(Flower).filter(Flower.id == flower_id).first()
    if not fl:
        raise HTTPException(status_code=404, detail="Flower not found")
    return {"id": fl.id, "name": fl.name, "bill_records": []}

@router.put("/{flower_id}", response_model=FlowerSchema)
def update_flower(flower_id: int, flower: FlowerCreate, db: Session = Depends(get_db)):
    fl = db.query(Flower).filter(Flower.id == flower_id).first()
    if not fl:
        raise HTTPException(status_code=404, detail="Flower not found")
        
    flower_name = flower.name.strip()
    req_lower = flower_name.lower()
    
    from sqlalchemy import func
    existing = db.query(Flower).filter(Flower.id != flower_id, func.lower(Flower.name) == req_lower).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Flower '{flower_name}' already exists.")
        
    fl.name = flower_name
    db.commit()
    db.refresh(fl)
    return {"id": fl.id, "name": fl.name, "bill_records": []}

@router.delete("/{flower_id}")
def delete_flower(flower_id: int, db: Session = Depends(get_db)):
    fl = db.query(Flower).filter(Flower.id == flower_id).first()
    if not fl:
        raise HTTPException(status_code=404, detail="Flower not found")
    db.delete(fl)
    db.commit()
    return {"detail": "Flower deleted"}
