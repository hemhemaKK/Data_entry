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
    added_in_batch = set()
    for name in bulk_data.names:
        name = name.strip()
        if not name:
            continue
            
        lower_name = name.lower()
        if lower_name in added_in_batch:
            continue
            
        existing_places = db.query(Place).filter(Place.year_id == bulk_data.year_id).all()
        existing = next((p for p in existing_places if p.name and p.name.strip().lower() == lower_name), None)
        if existing:
            continue
            
        new_place = Place(name=name, year_id=bulk_data.year_id)
        db.add(new_place)
        added_in_batch.add(lower_name)
        created_count += 1
            
    db.commit()
    msg = f"Created {created_count} Group." if created_count > 0 else "These Group Name are already created."
    return {"detail": msg}

@router.post("/users")
def create_bulk_users(bulk_data: BulkUsersCreate, db: Session = Depends(get_db)):
    created_count = 0
    added_in_batch = set()
    for name in bulk_data.names:
        name = name.strip()
        if not name:
            continue
            
        lower_name = name.lower()
        if lower_name in added_in_batch:
            continue
            
        existing_users = db.query(User).filter(User.place_id == bulk_data.place_id).all()
        existing = next((u for u in existing_users if u.name and u.name.strip().lower() == lower_name), None)
        if existing:
            continue
            
        new_user = User(name=name, place_id=bulk_data.place_id)
        db.add(new_user)
        added_in_batch.add(lower_name)
        created_count += 1
            
    db.commit()
    msg = f"Created {created_count} Party Name." if created_count > 0 else "These Party Name are already created."
    return {"detail": msg}

@router.post("/flowers")
def create_bulk_flowers(bulk_data: BulkFlowersCreate, db: Session = Depends(get_db)):
    from sqlalchemy import func
    created_count = 0
    added_in_batch = set()
    
    for fname in bulk_data.flower_names:
        fname = fname.strip()
        if not fname:
            continue
            
        lower_fname = fname.lower()
        if lower_fname in added_in_batch:
            continue
            
        existing = db.query(Flower).filter(Flower.user_id.is_(None), func.lower(Flower.name) == lower_fname).first()
        if existing:
            continue
            
        new_flower = Flower(name=fname, user_id=None)
        db.add(new_flower)
        added_in_batch.add(lower_fname)
        created_count += 1
            
    db.commit()
    msg = f"Added {created_count} global flowers." if created_count > 0 else "These flowers are already created globally."
    return {"detail": msg}

@router.delete("/flowers/{flower_name}")
def delete_bulk_flowers_by_name(flower_name: str, db: Session = Depends(get_db)):
    from sqlalchemy import func
    flower_name = flower_name.strip()
    flowers = db.query(Flower).filter(func.lower(Flower.name) == flower_name.lower()).all()
    if not flowers:
        raise HTTPException(status_code=404, detail="Flower not found")
        
    count = len(flowers)
    for f in flowers:
        db.delete(f)
    db.commit()
    return {"detail": f"Deleted {count} instances of flower '{flower_name}'"}
