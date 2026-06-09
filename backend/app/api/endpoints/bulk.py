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
            raise HTTPException(status_code=400, detail=f"Duplicate group name '{name}' found in your list.")
            
        existing_places = db.query(Place).filter(Place.year_id == bulk_data.year_id).all()
        existing = next((p for p in existing_places if p.name and p.name.strip().lower() == lower_name), None)
        if existing:
            raise HTTPException(status_code=400, detail=f"Group '{name}' is already created.")
            
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
            raise HTTPException(status_code=400, detail=f"Duplicate party name '{name}' found in your list.")
            
        existing_users = db.query(User).filter(User.place_id == bulk_data.place_id).all()
        existing = next((u for u in existing_users if u.name and u.name.strip().lower() == lower_name), None)
        if existing:
            raise HTTPException(status_code=400, detail=f"Party '{name}' is already created in this group.")
            
        new_user = User(name=name, place_id=bulk_data.place_id)
        db.add(new_user)
        added_in_batch.add(lower_name)
        created_count += 1
            
    db.commit()
    msg = f"Created {created_count} Party Name." if created_count > 0 else "These Party Name are already created."
    return {"detail": msg}

@router.post("/flowers")
def create_bulk_flowers(bulk_data: BulkFlowersCreate, db: Session = Depends(get_db)):
    # First get all users in this place
    users = db.query(User).filter(User.place_id == bulk_data.place_id).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found in this place.")
        
    created_count = 0
    
    for user in users:
        added_in_batch = set()
        for fname in bulk_data.flower_names:
            fname = fname.strip()
            if not fname:
                continue
                
            lower_fname = fname.lower()
            if lower_fname in added_in_batch:
                raise HTTPException(status_code=400, detail=f"Duplicate flower name '{fname}' found in your list.")
                
            existing_flowers = db.query(Flower).filter(Flower.user_id == user.id).all()
            existing = next((f for f in existing_flowers if f.name and f.name.strip().lower() == lower_fname), None)
            if existing:
                raise HTTPException(status_code=400, detail=f"Flower '{fname}' is already created for party in this group.")
                
            new_flower = Flower(name=fname, user_id=user.id)
            db.add(new_flower)
            added_in_batch.add(lower_fname)
            created_count += 1
                
    db.commit()
    msg = f"Added {created_count} flowers." if created_count > 0 else "These flowers are already assigned to all users in this place."
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
