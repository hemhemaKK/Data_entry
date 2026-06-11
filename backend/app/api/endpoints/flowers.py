from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Flower, User
from app.schemas.hierarchy import FlowerCreate, Flower as FlowerSchema

router = APIRouter()

@router.post("/", response_model=FlowerSchema)
def create_flower(flower: FlowerCreate, db: Session = Depends(get_db)):
    if flower.user_id is not None:
        user = db.query(User).filter(User.id == flower.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
    flower_name = flower.name.strip()
    req_lower = flower_name.lower()
    from sqlalchemy import func
    
    if flower.user_id is not None:
        existing_flowers = db.query(Flower).filter(Flower.user_id == flower.user_id).all()
        for ef in existing_flowers:
            if ef.name and ef.name.strip().lower() == req_lower:
                raise HTTPException(status_code=400, detail=f"Flower '{flower_name}' is already created for this party.")
    else:
        existing = db.query(Flower).filter(Flower.user_id.is_(None), func.lower(Flower.name) == req_lower).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Flower '{flower_name}' is already created globally.")
        
    db_flower = Flower(name=flower_name, user_id=flower.user_id)
    db.add(db_flower)
    db.commit()
    db.refresh(db_flower)
    return db_flower

@router.get("/", response_model=List[FlowerSchema])
def list_flowers(user_id: Optional[int] = None, place_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Flower)
    if user_id:
        query = query.filter(Flower.user_id == user_id)
    if place_id:
        query = query.join(User).filter(User.place_id == place_id)
    return query.order_by(Flower.id.desc()).all()

@router.get("/{flower_id}", response_model=FlowerSchema)
def get_flower(flower_id: int, db: Session = Depends(get_db)):
    fl = db.query(Flower).filter(Flower.id == flower_id).first()
    if not fl:
        raise HTTPException(status_code=404, detail="Flower not found")
    return fl

@router.put("/{flower_id}", response_model=FlowerSchema)
def update_flower(flower_id: int, flower: FlowerCreate, db: Session = Depends(get_db)):
    fl = db.query(Flower).filter(Flower.id == flower_id).first()
    if not fl:
        raise HTTPException(status_code=404, detail="Flower not found")
        
    flower_name = flower.name.strip()
    req_lower = flower_name.lower()
    
    existing_flowers = db.query(Flower).filter(Flower.user_id == flower.user_id, Flower.id != flower_id).all()
    for ef in existing_flowers:
        if ef.name and ef.name.strip().lower() == req_lower:
            raise HTTPException(status_code=400, detail=f"Flower '{flower_name}' is already created for party in this group.")
        
    fl.name = flower_name
    fl.user_id = flower.user_id
    db.commit()
    db.refresh(fl)
    return fl

@router.delete("/{flower_id}")
def delete_flower(flower_id: int, db: Session = Depends(get_db)):
    fl = db.query(Flower).filter(Flower.id == flower_id).first()
    if not fl:
        raise HTTPException(status_code=404, detail="Flower not found")
    db.delete(fl)
    db.commit()
    return {"detail": "Flower deleted"}
