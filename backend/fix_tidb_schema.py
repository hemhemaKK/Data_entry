import pandas as pd
from sqlalchemy import create_engine, text
from app.db.database import engine as tidb_engine, Base
from app.db.models import *  # Ensure all models are loaded
from migrate_to_tidb import migrate

def reset_and_migrate():
    print("Dropping all tables in TiDB to fix schema types...")
    with tidb_engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0;"))
        # Get all table names
        result = conn.execute(text("SHOW TABLES;"))
        tables = [row[0] for row in result]
        for table in tables:
            print(f"Dropping table {table}...")
            conn.execute(text(f"DROP TABLE IF EXISTS {table};"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1;"))
        
    print("All tables dropped. Re-running migration...")
    migrate()

if __name__ == '__main__':
    reset_and_migrate()
