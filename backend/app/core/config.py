import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

class Settings:
    PROJECT_NAME: str = "Excel Validation API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "reports")
    EXPORTS_DIR: str = os.path.join(BASE_DIR, "exports")

    def __init__(self):
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.REPORTS_DIR, exist_ok=True)
        os.makedirs(self.EXPORTS_DIR, exist_ok=True)

settings = Settings()
