from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import AdvanceEntry, User, Place
from app.schemas.hierarchy import AdvanceEntry as AdvanceEntrySchema, AdvanceEntryCreate, AdvanceEntryOut, BulkDateUpdate

router = APIRouter()

@router.get("/user/{user_id}", response_model=List[AdvanceEntrySchema])
def get_user_advances(user_id: int, db: Session = Depends(get_db)):
    return db.query(AdvanceEntry).filter(AdvanceEntry.user_id == user_id).order_by(AdvanceEntry.date.desc()).all()

@router.get("/place/{place_id}", response_model=List[AdvanceEntrySchema])
def get_place_advances(place_id: int, db: Session = Depends(get_db)):
    return db.query(AdvanceEntry).filter(AdvanceEntry.place_id == place_id).order_by(AdvanceEntry.date.desc()).all()

@router.get("/year/{year_id}", response_model=List[AdvanceEntryOut])
def get_year_advances(year_id: int, db: Session = Depends(get_db)):
    advances = db.query(AdvanceEntry).join(User, AdvanceEntry.user_id == User.id, isouter=True)\
        .join(Place, (AdvanceEntry.place_id == Place.id) | (User.place_id == Place.id))\
        .filter(Place.year_id == year_id).order_by(AdvanceEntry.date.desc()).all()
        
    result = []
    for adv in advances:
        user_name = None
        place_name = None
        if adv.user_id:
            user = db.query(User).filter(User.id == adv.user_id).first()
            if user:
                user_name = user.name
                place = db.query(Place).filter(Place.id == user.place_id).first()
                if place:
                    place_name = place.name
        elif adv.place_id:
            place = db.query(Place).filter(Place.id == adv.place_id).first()
            if place:
                place_name = place.name
        
        adv_dict = AdvanceEntrySchema.from_orm(adv).dict()
        adv_dict["user_name"] = user_name
        adv_dict["place_name"] = place_name
        result.append(adv_dict)
    
    return result

@router.post("/", response_model=AdvanceEntrySchema)
def create_advance(advance: AdvanceEntryCreate, db: Session = Depends(get_db)):
    if not advance.user_id and not advance.place_id:
        raise HTTPException(status_code=400, detail="Must provide user_id or place_id")
    
    if advance.user_id:
        user = db.query(User).filter(User.id == advance.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
    db_advance = AdvanceEntry(**advance.dict())
    db.add(db_advance)
    db.commit()
    db.refresh(db_advance)
    return db_advance

@router.put("/bulk_date")
def bulk_update_date(payload: BulkDateUpdate, db: Session = Depends(get_db)):
    updated_count = db.query(AdvanceEntry).filter(AdvanceEntry.id.in_(payload.entry_ids)).update({"date": payload.date}, synchronize_session=False)
    db.commit()
    return {"detail": f"Updated {updated_count} entries"}

@router.put("/{entry_id}", response_model=AdvanceEntrySchema)
def update_advance(entry_id: int, advance: AdvanceEntryCreate, db: Session = Depends(get_db)):
    db_advance = db.query(AdvanceEntry).filter(AdvanceEntry.id == entry_id).first()
    if not db_advance:
        raise HTTPException(status_code=404, detail="Entry not found")
        
    db_advance.date = advance.date
    db_advance.advance_amount = advance.advance_amount
    db_advance.deduction_amount = advance.deduction_amount
    db_advance.notes = advance.notes
    
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
