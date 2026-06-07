from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import Place, Year
from app.schemas.hierarchy import PlaceCreate, Place as PlaceSchema

router = APIRouter()

@router.post("/", response_model=PlaceSchema)
def create_place(place: PlaceCreate, db: Session = Depends(get_db)):
    # Ensure the referenced year exists
    year = db.query(Year).filter(Year.id == place.year_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Year not found")
    db_place = Place(name=place.name, year_id=place.year_id)
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
    pl = db.query(Place).filter(Place.id == place_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Place not found")
    pl.name = place.name
    pl.year_id = place.year_id
    db.commit()
    db.refresh(pl)
    return pl

@router.delete("/{place_id}")
def delete_place(place_id: int, db: Session = Depends(get_db)):
    pl = db.query(Place).filter(Place.id == place_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Place not found")
    db.delete(pl)
    db.commit()
    return {"detail": "Place deleted"}
