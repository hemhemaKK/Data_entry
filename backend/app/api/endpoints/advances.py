from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import AdvanceEntry, User
from app.schemas.hierarchy import AdvanceEntry as AdvanceEntrySchema, AdvanceEntryCreate

router = APIRouter()

@router.get("/user/{user_id}", response_model=List[AdvanceEntrySchema])
def get_user_advances(user_id: int, db: Session = Depends(get_db)):
    return db.query(AdvanceEntry).filter(AdvanceEntry.user_id == user_id).order_by(AdvanceEntry.date.desc()).all()

@router.get("/place/{place_id}", response_model=List[AdvanceEntrySchema])
def get_place_advances(place_id: int, db: Session = Depends(get_db)):
    return db.query(AdvanceEntry).filter(AdvanceEntry.place_id == place_id).order_by(AdvanceEntry.date.desc()).all()

@router.post("/", response_model=AdvanceEntrySchema)
def create_advance(advance: AdvanceEntryCreate, db: Session = Depends(get_db)):
    if not advance.user_id and not advance.place_id:
        raise HTTPException(status_code=400, detail="Must provide user_id or place_id")
    
    if advance.user_id:
        user = db.query(User).filter(User.id == advance.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
    # Assuming place exists if place_id is given (can also check if needed)
    db_advance = AdvanceEntry(**advance.dict())
    db.add(db_advance)
    db.commit()
    db.refresh(db_advance)
    return db_advance

@router.delete("/{entry_id}")
def delete_advance(entry_id: int, db: Session = Depends(get_db)):
    db_advance = db.query(AdvanceEntry).filter(AdvanceEntry.id == entry_id).first()
    if not db_advance:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_advance)
    db.commit()
    return {"detail": "Entry deleted"}
