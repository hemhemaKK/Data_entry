from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import Flower, User
from app.schemas.hierarchy import FlowerCreate, Flower as FlowerSchema

router = APIRouter()

@router.post("/", response_model=FlowerSchema)
def create_flower(flower: FlowerCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == flower.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db_flower = Flower(name=flower.name, user_id=flower.user_id)
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
    fl.name = flower.name
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
