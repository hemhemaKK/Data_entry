import pandas as pd
from sqlalchemy import create_engine, MetaData
import os

REMOTE_DB = "postgresql://bill_database_user:k8YBpZaPIdc1N0nKaj9J9xiFE7FGTcf7@dpg-d8ige3flk1mc73856sf0-a.oregon-postgres.render.com/bill_database"

def export_dbs():
    print("Connecting to remote database...")
    try:
        remote_engine = create_engine(REMOTE_DB)
        meta = MetaData()
        print("Reading database schema...")
        meta.reflect(bind=remote_engine)
        
        export_dir = "render_export"
        os.makedirs(export_dir, exist_ok=True)
        
        for table_name in meta.tables:
            print(f"Exporting {table_name} to CSV...")
            try:
                # We do this instead of read_sql_table to avoid some pandas table reading issues,
                # or just use read_sql_table if it works. Let's use read_sql_query.
                df = pd.read_sql_query(f"SELECT * FROM {table_name}", con=remote_engine)
                df.to_csv(os.path.join(export_dir, f"{table_name}.csv"), index=False)
                print(f"Saved {table_name}.csv")
            except Exception as e:
                print(f"Error exporting {table_name}: {e}")
                
        print(f"Data export complete! Saved to {export_dir} folder")
    except Exception as e:
        print(f"Connection/Reflection Error: {e}")

if __name__ == '__main__':
    export_dbs()
