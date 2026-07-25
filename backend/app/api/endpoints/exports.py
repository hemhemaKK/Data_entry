from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import json
import zipfile
import pandas as pd
from app.db.database import get_db
from app.db.models import BillRecord, Flower, User, Place, ExportHistory
from app.core.config import settings

router = APIRouter()

EXPORTS_DIR = "exports"
os.makedirs(EXPORTS_DIR, exist_ok=True)

class ExportRequest(BaseModel):
    year_id: int
    place_id: Optional[int] = None
    user_id: Optional[int] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    month: Optional[str] = None  # Format: "YYYY-MM"

class ExportHistoryResponse(BaseModel):
    id: int
    filename: str
    export_date: datetime
    filters_used: Optional[str]
    
    class Config:
        from_attributes = True

def generate_export_file(req: ExportRequest, db: Session, timestamp_str: str) -> tuple[str, str]:
    query = (
        db.query(BillRecord, Flower, User, Place)
        .join(Flower, BillRecord.flower_id == Flower.id)
        .join(User, BillRecord.user_id == User.id)
        .join(Place, User.place_id == Place.id)
    )
    
    query = query.filter(Place.year_id == req.year_id)
    
    if req.place_id:
        query = query.filter(Place.id == req.place_id)
    if req.user_id:
        query = query.filter(User.id == req.user_id)
    
    if req.date_from and req.date_to:
        query = query.filter(BillRecord.date >= req.date_from, BillRecord.date <= req.date_to)
    elif req.month:
        # SQLite substr for YYYY-MM
        query = query.filter(func.substr(func.date(BillRecord.date), 1, 7) == req.month)
        
    records = query.order_by(Place.name, User.name, BillRecord.date).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="No records found for the given filters")
        
    # Group by place then by user
    grouped_data = {}
    for br, f, u, p in records:
        if p.name not in grouped_data:
            grouped_data[p.name] = {}
        if u.name not in grouped_data[p.name]:
            grouped_data[p.name][u.name] = []
            
        grouped_data[p.name][u.name].append({
            "Date": br.date.strftime("%Y-%m-%d") if br.date else "",
            "Flower": f.name,
            "Van": br.van,
            "Weight": br.weight,
            "Rate": br.rate,
            "Laggage": br.laggage,
            "Collie": br.collie
        })
        
    files_generated = []
    
    for place_name, users_data in grouped_data.items():
        safe_place_name = "".join(c for c in place_name if c.isalnum() or c in " -_").strip()
        filename = f"{safe_place_name}.xlsx"
        file_path = os.path.join(EXPORTS_DIR, f"{safe_place_name}_{timestamp_str}.xlsx")
        
        with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
            for user_name, rows in users_data.items():
                safe_sheet_name = "".join(c for c in user_name if c.isalnum() or c in " -_").strip()[:31]
                if not safe_sheet_name:
                    safe_sheet_name = "Sheet1"
                df = pd.DataFrame(rows)
                df.to_excel(writer, sheet_name=safe_sheet_name, index=False)
                
        files_generated.append((filename, file_path))
        
    # If multiple files, zip them
    if len(files_generated) > 1:
        zip_filename = f"BulkExport_{timestamp_str}.zip"
        zip_path = os.path.join(EXPORTS_DIR, zip_filename)
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for fname, fpath in files_generated:
                zipf.write(fpath, arcname=fname)
                
        return zip_filename, zip_path
    else:
        return files_generated[0][0], files_generated[0][1]


@router.post("/generate", response_model=ExportHistoryResponse)
def generate_export(req: ExportRequest, db: Session = Depends(get_db)):
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    final_filename, final_filepath = generate_export_file(req, db, timestamp_str)
        
    # Record history
    history = ExportHistory(
        filename=final_filename,
        file_path=final_filepath,
        filters_used=json.dumps(req.dict())
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    
    return history

@router.get("/history", response_model=List[ExportHistoryResponse])
def get_history(db: Session = Depends(get_db)):
    return db.query(ExportHistory).order_by(ExportHistory.id.desc()).all()

@router.get("/download/{history_id}")
def download_export(history_id: int, db: Session = Depends(get_db)):
    history = db.query(ExportHistory).filter(ExportHistory.id == history_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="Export not found")
        
    if not os.path.exists(history.file_path):
        if not history.filters_used:
            raise HTTPException(status_code=404, detail="File has been deleted from server and cannot be regenerated.")
        try:
            req_data = json.loads(history.filters_used)
            req = ExportRequest(**req_data)
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            new_filename, new_filepath = generate_export_file(req, db, timestamp_str)
            history.file_path = new_filepath
            history.filename = new_filename
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to regenerate file: {str(e)}")
        
    return FileResponse(history.file_path, filename=history.filename)
