from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Upload, ValidationError
from app.schemas.schemas import DashboardStats

router = APIRouter()

@router.get("/", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func, case
    
    upload_stats = db.query(
        func.count(Upload.id).label("total"),
        func.sum(case((Upload.status.in_(["VALID", "INVALID"]), 1), else_=0)).label("processed")
    ).first()
    
    total_uploads = upload_stats.total if upload_stats and upload_stats.total else 0
    processed_files = upload_stats.processed if upload_stats and upload_stats.processed else 0
    total_errors = db.query(ValidationError).count()
    recent_uploads = db.query(Upload).order_by(Upload.upload_date.desc()).limit(5).all()
    
    return {
        "total_uploads": total_uploads,
        "processed_files": processed_files,
        "total_errors": total_errors,
        "recent_uploads": recent_uploads
    }
