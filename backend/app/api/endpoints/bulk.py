from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import Place, User, Flower
from app.schemas.hierarchy import BulkPlacesCreate, BulkUsersCreate, BulkFlowersCreate

router = APIRouter()

@router.post("/places")
def create_bulk_places(bulk_data: BulkPlacesCreate, db: Session = Depends(get_db)):
    created_count = 0
    for name in bulk_data.names:
        name = name.strip()
        if not name:
            continue
            
        existing = db.query(Place).filter(Place.name == name, Place.year_id == bulk_data.year_id).first()
        if not existing:
            new_place = Place(name=name, year_id=bulk_data.year_id)
            db.add(new_place)
            created_count += 1
            
    db.commit()
    msg = f"Created {created_count} places." if created_count > 0 else "These places are already created."
    return {"detail": msg}

@router.post("/users")
def create_bulk_users(bulk_data: BulkUsersCreate, db: Session = Depends(get_db)):
    created_count = 0
    for name in bulk_data.names:
        name = name.strip()
        if not name:
            continue
            
        existing = db.query(User).filter(User.name == name, User.place_id == bulk_data.place_id).first()
        if not existing:
            new_user = User(name=name, place_id=bulk_data.place_id)
            db.add(new_user)
            created_count += 1
            
    db.commit()
    msg = f"Created {created_count} users." if created_count > 0 else "These users are already created."
    return {"detail": msg}

@router.post("/flowers")
def create_bulk_flowers(bulk_data: BulkFlowersCreate, db: Session = Depends(get_db)):
    # First get all users in this place
    users = db.query(User).filter(User.place_id == bulk_data.place_id).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found in this place.")
        
    created_count = 0
    
    for user in users:
        for fname in bulk_data.flower_names:
            fname = fname.strip()
            if not fname:
                continue
                
            existing = db.query(Flower).filter(Flower.name == fname, Flower.user_id == user.id).first()
            if not existing:
                new_flower = Flower(name=fname, user_id=user.id)
                db.add(new_flower)
                created_count += 1
                
    db.commit()
    msg = f"Added common flowers. Total {created_count} flower records created across {len(users)} users." if created_count > 0 else "These flowers are already assigned to all users in this place."
    return {"detail": msg}
