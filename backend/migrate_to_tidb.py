import pandas as pd
from sqlalchemy import create_engine, text
from app.db.database import engine as tidb_engine, Base
from app.core.config import settings

LOCAL_DB_URL = "sqlite:///./sql_app.db"

def migrate():
    # 1. Create tables in TiDB
    print("Creating tables in TiDB...")
    Base.metadata.create_all(bind=tidb_engine)
    
    # 2. Connect to local SQLite
    print("Connecting to local SQLite...")
    sqlite_engine = create_engine(LOCAL_DB_URL)
    
    # List of tables to migrate
    table_names = [
        "uploads",
        "validation_errors",
        "years",
        "places",
        "users",
        "flowers",
        "bill_records",
        "advance_entries",
        "export_history"
    ]
    
    # Disable foreign key checks for bulk import
    with tidb_engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
        
    for table in table_names:
        print(f"Migrating {table}...")
        try:
            df = pd.read_sql_table(table, con=sqlite_engine)
            if not df.empty:
                df.to_sql(table, con=tidb_engine, if_exists='append', index=False)
                print(f"Migrated {len(df)} records into {table}.")
            else:
                print(f"No records in {table}.")
        except Exception as e:
            print(f"Error migrating {table}: {e}")
            
    # Re-enable foreign key checks
    with tidb_engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
        
    print("Migration complete!")

if __name__ == '__main__':
    migrate()
