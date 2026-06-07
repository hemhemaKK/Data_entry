from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Upload, ValidationError
from app.schemas.schemas import DashboardStats

router = APIRouter()

@router.get("/", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_uploads = db.query(Upload).count()
    processed_files = db.query(Upload).filter(Upload.status.in_(["VALID", "INVALID"])).count()
    total_errors = db.query(ValidationError).count()
    recent_uploads = db.query(Upload).order_by(Upload.upload_date.desc()).limit(5).all()
    
    return {
        "total_uploads": total_uploads,
        "processed_files": processed_files,
        "total_errors": total_errors,
        "recent_uploads": recent_uploads
    }
