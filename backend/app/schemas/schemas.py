from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ValidationErrorBase(BaseModel):
    row_number: Optional[int] = None
    column_name: Optional[str] = None
    sheet_name: Optional[str] = None
    error_message: str

class ValidationErrorOut(ValidationErrorBase):
    id: int
    upload_id: int

    class Config:
        from_attributes = True

class UploadBase(BaseModel):
    file_name: str
    original_file_name: str
    status: str
    error_count: int

class UploadOut(UploadBase):
    id: int
    upload_date: datetime
    file_path: str
    report_path: Optional[str] = None

    class Config:
        from_attributes = True

class UploadDetailOut(UploadOut):
    errors: List[ValidationErrorOut] = []

class DashboardStats(BaseModel):
    total_uploads: int
    processed_files: int
    total_errors: int
    recent_uploads: List[UploadOut]
