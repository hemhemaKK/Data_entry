import pandas as pd
import numpy as np
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.dialects.mysql import insert

def import_yesterday():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return

    print("Connecting to TiDB...")
    engine = create_engine(db_url)
    
    export_dir = "render_export"
    yesterday = "2026-07-05"
    
    file = "bill_records.csv"
    filepath = os.path.join(export_dir, file)
    
    if os.path.exists(filepath):
        df = pd.read_csv(filepath)
        col = 'date'
        filtered = df[df[col].astype(str).str.startswith(yesterday)]
        
        if not filtered.empty:
            print(f"Found {len(filtered)} rows for {yesterday} in {file}")
            
            # Convert NaNs to None for SQL NULL compatibility
            filtered = filtered.replace({np.nan: None})
            
            table_name = "bill_records"
            data = filtered.to_dict(orient='records')
            
            from sqlalchemy import Table, MetaData
            metadata = MetaData()
            metadata.reflect(bind=engine)
            
            if table_name in metadata.tables:
                table = metadata.tables[table_name]
                with engine.begin() as conn:
                    stmt = insert(table).values(data)
                    stmt = stmt.prefix_with("IGNORE")
                    res = conn.execute(stmt)
                    print(f"Inserted {res.rowcount} rows into {table_name}")
            else:
                print(f"Table {table_name} does not exist in TiDB. Creating and appending...")
                filtered.to_sql(table_name, engine, if_exists='append', index=False)
                print(f"Inserted {len(filtered)} rows into {table_name}")
        else:
            print(f"No records found for {yesterday} in {file}")

if __name__ == "__main__":
    import_yesterday()
