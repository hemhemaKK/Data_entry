from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import uploads, dashboard, years, places, users, flowers, bill_records, advances, bulk, exports, credit_sales
from app.db.database import engine, Base
import uvicorn

from app.core.config import settings
from sqlalchemy import text

if settings.DATABASE_URL.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE bill_records ADD COLUMN print_taken BOOLEAN DEFAULT FALSE;"))
    except Exception:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE advance_entries ADD COLUMN place_id INTEGER REFERENCES places(id);"))
    except Exception:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE advance_entries ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;"))
    except Exception:
        pass

app = FastAPI(title="Excel Validation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])
app.include_router(years.router, prefix="/api/years", tags=["Years"])
app.include_router(places.router, prefix="/api/places", tags=["Places"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(flowers.router, prefix="/api/flowers", tags=["Flowers"])
app.include_router(bill_records.router, prefix="/api/bill-records", tags=["BillRecords"])
app.include_router(advances.router, prefix="/api/advances", tags=["Advances"])
app.include_router(bulk.router, prefix="/api/bulk", tags=["Bulk"])
app.include_router(exports.router, prefix="/api/exports", tags=["Exports"])
app.include_router(credit_sales.router, prefix="/api/credit-sales", tags=["CreditSales"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
