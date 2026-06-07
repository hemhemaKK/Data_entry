import os

class Settings:
    PROJECT_NAME: str = "Excel Validation API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    UPLOAD_DIR: str = "uploads"
    REPORTS_DIR: str = "reports"

    def __init__(self):
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.REPORTS_DIR, exist_ok=True)

settings = Settings()
