from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import Year
from app.schemas.hierarchy import YearCreate, Year as YearSchema

router = APIRouter()

@router.post("/", response_model=YearSchema)
def create_year(year: YearCreate, db: Session = Depends(get_db)):
    db_year = Year(year=year.year)
    db.add(db_year)
    db.commit()
    db.refresh(db_year)
    return db_year

@router.get("/", response_model=List[YearSchema])
def list_years(db: Session = Depends(get_db)):
    return db.query(Year).order_by(Year.year.desc()).all()

@router.get("/{year_id}", response_model=YearSchema)
def get_year(year_id: int, db: Session = Depends(get_db)):
    yr = db.query(Year).filter(Year.id == year_id).first()
    if not yr:
        raise HTTPException(status_code=404, detail="Year not found")
    return yr

@router.delete("/{year_id}")
def delete_year(year_id: int, db: Session = Depends(get_db)):
    yr = db.query(Year).filter(Year.id == year_id).first()
    if not yr:
        raise HTTPException(status_code=404, detail="Year not found")
    db.delete(yr)
    db.commit()
    return {"detail": "Year deleted"}
@router.put("/{year_id}", response_model=YearSchema)
def update_year(year_id: int, year: YearCreate, db: Session = Depends(get_db)):
    yr = db.query(Year).filter(Year.id == year_id).first()
    if not yr:
        raise HTTPException(status_code=404, detail="Year not found")
    yr.year = year.year
    db.commit()
    db.refresh(yr)
    return yr

