import pandas as pd
import numpy as np
import os
from sqlalchemy import create_engine, MetaData
from dotenv import load_dotenv
from sqlalchemy.dialects.mysql import insert

def import_all_bill_records():
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
    file = "bill_records.csv"
    filepath = os.path.join(export_dir, file)
    
    if os.path.exists(filepath):
        df = pd.read_csv(filepath)
        print(f"Total rows in {file}: {len(df)}")
        
        if not df.empty:
            df = df.replace({np.nan: None})
            data = df.to_dict(orient='records')
            
            table_name = "bill_records"
            if table_name in metadata.tables:
                table = metadata.tables[table_name]
                
                # Doing it in chunks to avoid max_allowed_packet or timeout errors
                chunk_size = 1000
                total_inserted = 0
                
                with engine.begin() as conn:
                    for i in range(0, len(data), chunk_size):
                        chunk = data[i:i + chunk_size]
                        stmt = insert(table).values(chunk)
                        stmt = stmt.prefix_with("IGNORE")
                        res = conn.execute(stmt)
                        total_inserted += res.rowcount
                        
                print(f"Cross-check complete! Inserted {total_inserted} previously missing rows (duplicates skipped).")
            else:
                print(f"Table {table_name} does not exist in TiDB. Creating and appending...")
                df.to_sql(table_name, engine, if_exists='append', index=False)
                print(f"Inserted {len(df)} rows into {table_name}")
        else:
            print(f"No records found in {file}")

if __name__ == "__main__":
    import_all_bill_records()
