from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import Place, Year
from app.schemas.hierarchy import PlaceCreate, Place as PlaceSchema

router = APIRouter()

@router.post("/", response_model=PlaceSchema)
def create_place(place: PlaceCreate, db: Session = Depends(get_db)):
    place_name = place.name.strip()
    req_lower = place_name.lower()
    
    # Python-level strict check
    existing_places = db.query(Place).filter(Place.year_id == place.year_id).all()
    for ep in existing_places:
        if ep.name and ep.name.strip().lower() == req_lower:
            raise HTTPException(status_code=400, detail=f"Group '{place_name}' is already created.")
            
    db_place = Place(name=place_name, year_id=place.year_id)
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place

@router.get("/", response_model=List[PlaceSchema])
def list_places(
    year_id: int | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Place)
    if year_id is not None:
        query = query.filter(Place.year_id == year_id)
    if search:
        query = query.filter(Place.name.ilike(f"%{search}%"))
    return query.order_by(Place.name).all()

@router.get("/{place_id}", response_model=PlaceSchema)
def get_place(place_id: int, db: Session = Depends(get_db)):
    pl = db.query(Place).filter(Place.id == place_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Place not found")
    return pl

@router.put("/{place_id}", response_model=PlaceSchema)
def update_place(place_id: int, place: PlaceCreate, db: Session = Depends(get_db)):
    db_place = db.query(Place).filter(Place.id == place_id).first()
    if not db_place:
        raise HTTPException(status_code=404, detail="Place not found")
        
    place_name = place.name.strip()
    req_lower = place_name.lower()
    
    # Python-level strict check
    existing_places = db.query(Place).filter(Place.year_id == place.year_id, Place.id != place_id).all()
    for ep in existing_places:
        if ep.name and ep.name.strip().lower() == req_lower:
            raise HTTPException(status_code=400, detail=f"Group '{place_name}' is already created.")
            
    db_place.name = place_name
    db_place.year_id = place.year_id
    db.commit()
    db.refresh(db_place)
    return db_place

@router.delete("/{place_id}")
def delete_place(place_id: int, db: Session = Depends(get_db)):
    pl = db.query(Place).filter(Place.id == place_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Place not found")
    db.delete(pl)
    db.commit()
    return {"detail": "Place deleted"}
