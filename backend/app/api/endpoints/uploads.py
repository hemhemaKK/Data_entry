from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Upload, ValidationError, Year, Place, User, Flower, BillRecord
from app.schemas.schemas import UploadOut, UploadDetailOut
from app.core.config import settings
from app.services.excel_validator import validate_excel
import os
import shutil
import uuid
from typing import List
from fastapi.responses import FileResponse
from datetime import datetime
import pandas as pd
import hashlib

router = APIRouter()

def get_or_create_year(db: Session, year_val: int) -> Year:
    year_obj = db.query(Year).filter(Year.year == year_val).first()
    if not year_obj:
        year_obj = Year(year=year_val)
        db.add(year_obj)
        db.commit()
        db.refresh(year_obj)
    return year_obj

def get_or_create_place(db: Session, name: str, year_obj: Year) -> Place:
    place_obj = db.query(Place).filter(Place.name == name, Place.year_id == year_obj.id).first()
    if not place_obj:
        place_obj = Place(name=name, year_id=year_obj.id)
        db.add(place_obj)
        db.commit()
        db.refresh(place_obj)
    return place_obj

def get_or_create_user(db: Session, name: str, place_obj: Place) -> User:
    user_obj = db.query(User).filter(User.name == name, User.place_id == place_obj.id).first()
    if not user_obj:
        user_obj = User(name=name, place_id=place_obj.id)
        db.add(user_obj)
        db.commit()
        db.refresh(user_obj)
    return user_obj

@router.post("/", response_model=UploadOut)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed.")

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            file_hash_md5.update(chunk)
    file_hash = file_hash_md5.hexdigest()

    existing_upload = db.query(Upload).filter(Upload.file_hash == file_hash).first()
    if existing_upload:
        os.remove(file_path)
        raise HTTPException(status_code=409, detail="DUPLICATE_EXCEL")

    db_upload = Upload(
        file_name=unique_filename,
        original_file_name=file.filename,
        file_path=file_path,
        status="PROCESSING",
        file_hash=file_hash,
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)

    report_filename = f"report_{unique_filename}"
    report_path = os.path.join(settings.REPORTS_DIR, report_filename)

    total_errors = 0
    current_year = datetime.utcnow().year
    year_obj = get_or_create_year(db, current_year)
    place_name = os.path.splitext(file.filename)[0]
    default_place = get_or_create_place(db, place_name, year_obj)

    try:
        with pd.ExcelFile(file_path) as xl:
            for sheet_name in xl.sheet_names:
                df = xl.parse(sheet_name=sheet_name)
                user_obj = get_or_create_user(db, sheet_name, default_place)
                
                # Lowercase column names for easier access and validation
                df.columns = [str(c).strip().lower() for c in df.columns]
                
                # Truncate dataframe at the first completely empty row
                empty_row_idx = None
                for idx, row in df.iterrows():
                    row_values = row.dropna().astype(str).str.strip()
                    row_values = row_values[row_values != ""]
                    if len(row_values) == 0:
                        empty_row_idx = idx
                        break
                
                if empty_row_idx is not None:
                    df = df.iloc[:empty_row_idx]
                
                errors_in_sheet = validate_excel_sheet(df, db_upload.id, db, sheet_name)
                total_errors += errors_in_sheet
                if errors_in_sheet == 0:
                    for idx, row in df.iterrows():
                        flower_name = str(row.get("flower")).strip() if pd.notna(row.get("flower")) else "Unknown"
                        
                        # Find or create flower
                        flower = db.query(Flower).filter(Flower.name == flower_name, Flower.user_id == user_obj.id).first()
                        if not flower:
                            flower = Flower(name=flower_name, user_id=user_obj.id)
                            db.add(flower)
                            db.commit()
                            db.refresh(flower)
                        
                        # Parse date safely
                        date_val = None
                        if pd.notna(row.get("date")):
                            try:
                                date_val = pd.to_datetime(row.get("date")).date()
                            except:
                                pass
                        
                        weight_val = float(row.get("weight")) if pd.notna(row.get("weight")) else None
                        van_raw = str(row.get("van")).strip() if pd.notna(row.get("van")) else ""
                        van_val = van_raw if van_raw != "" else "v1"
                        rate_val = float(row.get("rate")) if pd.notna(row.get("rate")) else None
                        laggage_val = float(row.get("laggage")) if "laggage" in df.columns and pd.notna(row.get("laggage")) else 0.0
                        collie_val = float(row.get("collie")) if "collie" in df.columns and pd.notna(row.get("collie")) else 0.0
                        
                        bill_record = BillRecord(
                            flower_id=flower.id,
                            upload_id=db_upload.id,
                            date=date_val,
                            weight=weight_val,
                            van=van_val,
                            rate=rate_val,
                            laggage=laggage_val,
                            collie=collie_val
                        )
                        db.add(bill_record)
                    db.commit()
    except Exception as e:
        # If it fails during parsing
        err = ValidationError(upload_id=db_upload.id, error_message=f"Error parsing Excel file: {str(e)}")
        db.add(err)
        db.commit()
        total_errors += 1

    db_upload.error_count = total_errors
    db_upload.status = "FAILED" if total_errors > 0 else "SUCCESS"
    if total_errors > 0:
        db_upload.report_path = report_path
    db.commit()
    db.refresh(db_upload)
    return db_upload

def validate_excel_sheet(df: "pd.DataFrame", upload_id: int, db: Session, sheet_name: str) -> int:
    errors: List[ValidationError] = []
    required_columns = ["date", "flower", "weight", "van", "rate"]
    missing_cols = [col for col in required_columns if col not in df.columns]
    for col in missing_cols:
        errors.append(ValidationError(upload_id=upload_id, error_message=f"Missing required column", column_name=col, sheet_name=sheet_name))
    
    if missing_cols:
        for err in errors:
            db.add(err)
        db.commit()
        return len(errors)
        
    for idx, row in df.iterrows():
        row_num = idx + 2 # +2 because index is 0-based and excel header is row 1
        
        # Check date
        if pd.isna(row.get("date")):
            errors.append(ValidationError(upload_id=upload_id, row_number=row_num, column_name="date", error_message="Date is missing", sheet_name=sheet_name))
            
        # Check weight
        weight = row.get("weight")
        if pd.isna(weight):
            errors.append(ValidationError(upload_id=upload_id, row_number=row_num, column_name="weight", error_message="Weight is missing", sheet_name=sheet_name))
        else:
            try:
                float(weight)
            except ValueError:
                errors.append(ValidationError(upload_id=upload_id, row_number=row_num, column_name="weight", error_message="Weight must be a number", sheet_name=sheet_name))
                
        # Check rate
        rate = row.get("rate")
        if pd.isna(rate):
            errors.append(ValidationError(upload_id=upload_id, row_number=row_num, column_name="rate", error_message="Rate is missing", sheet_name=sheet_name))
        else:
            try:
                float(rate)
            except ValueError:
                errors.append(ValidationError(upload_id=upload_id, row_number=row_num, column_name="rate", error_message="Rate must be a number", sheet_name=sheet_name))
    
    for err in errors:
        db.add(err)
    db.commit()
    return len(errors)

@router.get("/", response_model=List[UploadOut])
def list_uploads(db: Session = Depends(get_db)):
    uploads = db.query(Upload).order_by(Upload.upload_date.desc()).all()
    return uploads

@router.get("/{upload_id}", response_model=UploadDetailOut)
def get_upload_details(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload

@router.delete("/{upload_id}")
def delete_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    if os.path.exists(upload.file_path):
        os.remove(upload.file_path)
    if upload.report_path and os.path.exists(upload.report_path):
        os.remove(upload.report_path)
    
    # Delete associated data
    db.query(BillRecord).filter(BillRecord.upload_id == upload_id).delete()
    
    db.delete(upload)
    db.commit()
    return {"detail": "Upload deleted"}

@router.get("/{upload_id}/report")
def download_report(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload or not upload.report_path or not os.path.exists(upload.report_path):
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(upload.report_path, filename=f"report_{upload.original_file_name}")

@router.get("/{upload_id}/download")
def download_excel(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload or not upload.file_path or not os.path.exists(upload.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(upload.file_path, filename=upload.original_file_name)

@router.get("/{upload_id}/data")
def get_excel_data(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload or not upload.file_path or not os.path.exists(upload.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        import json
        with pd.ExcelFile(upload.file_path) as xl:
            data = {}
            for sheet in xl.sheet_names:
                df = xl.parse(sheet_name=sheet)
                json_str = df.to_json(orient='records', date_format='iso')
                data[sheet] = json.loads(json_str)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read excel data: {str(e)}")
