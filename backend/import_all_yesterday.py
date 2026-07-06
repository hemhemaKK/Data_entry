import pandas as pd
import numpy as np
import os
from sqlalchemy import create_engine, MetaData
from dotenv import load_dotenv
from sqlalchemy.dialects.mysql import insert

def import_all_missing():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return

    print("Connecting to TiDB...")
    engine = create_engine(db_url)
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    export_dir = "render_export"
    yesterday = "2026-07-05"
    
    date_columns = ['date', 'upload_date', 'export_date']
    
    csv_files = [f for f in os.listdir(export_dir) if f.endswith('.csv')]
    
    for file in csv_files:
        filepath = os.path.join(export_dir, file)
        df = pd.read_csv(filepath)
        
        table_name = file.replace('.csv', '')
        
        # Determine if there's a date column
        col_to_filter = None
        for col in date_columns:
            if col in df.columns:
                col_to_filter = col
                break
                
        if col_to_filter:
            # Filter for yesterday
            df = df[df[col_to_filter].astype(str).str.startswith(yesterday)]
            print(f"[{table_name}] Filtered by '{col_to_filter}' == {yesterday}. Rows to insert: {len(df)}")
        else:
            print(f"[{table_name}] No date column found. Processing all {len(df)} rows for missing data insertion.")
            
        if not df.empty:
            # Replace NaNs with None
            df = df.replace({np.nan: None})
            data = df.to_dict(orient='records')
            
            if table_name in metadata.tables:
                table = metadata.tables[table_name]
                with engine.begin() as conn:
                    stmt = insert(table).values(data)
                    stmt = stmt.prefix_with("IGNORE")
                    res = conn.execute(stmt)
                    print(f"[{table_name}] Inserted {res.rowcount} missing rows (duplicates skipped).")
            else:
                print(f"[{table_name}] Table does not exist in TiDB. Creating and appending...")
                df.to_sql(table_name, engine, if_exists='append', index=False)
                print(f"[{table_name}] Inserted {len(df)} rows.")
        else:
            print(f"[{table_name}] No records to insert.")
        print("-" * 40)

if __name__ == "__main__":
    import_all_missing()
