from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import User, Place
from app.schemas.hierarchy import UserCreate, User as UserSchema

router = APIRouter()

@router.post("/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Ensure the referenced place exists
    place = db.query(Place).filter(Place.id == user.place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    # Enforce unique name per place
    dup = db.query(User).filter(User.name == user.name, User.place_id == user.place_id).first()
    if dup:
        raise HTTPException(status_code=400, detail="User name already exists in this place")
    db_user = User(name=user.name, place_id=user.place_id, contact_number=getattr(user, "contact_number", None))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserSchema])
def list_users(place_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if place_id:
        query = query.filter(User.place_id == place_id)
    return query.order_by(User.id.desc()).all()

@router.get("/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db)):
    usr = db.query(User).filter(User.id == user_id).first()
    if not usr:
        raise HTTPException(status_code=404, detail="User not found")
    return usr

@router.put("/{user_id}", response_model=UserSchema)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    usr = db.query(User).filter(User.id == user_id).first()
    if not usr:
        raise HTTPException(status_code=404, detail="User not found")
    # Ensure target place exists
    place = db.query(Place).filter(Place.id == user.place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    # Check for duplicate name in the target place (excluding self)
    dup = (
        db.query(User)
        .filter(User.name == user.name, User.place_id == user.place_id, User.id != user_id)
        .first()
    )
    if dup:
        raise HTTPException(status_code=400, detail="User name already exists in this place")
    usr.name = user.name
    usr.place_id = user.place_id
    usr.contact_number = getattr(user, "contact_number", usr.contact_number)
    db.commit()
    db.refresh(usr)
    return usr

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    usr = db.query(User).filter(User.id == user_id).first()
    if not usr:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(usr)
    db.commit()
    return {"detail": "User deleted"}
