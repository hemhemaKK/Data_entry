import pandas as pd
from sqlalchemy import create_engine, MetaData

REMOTE_DB = "postgresql://bill_database_user:k8YBpZaPIdc1N0nKaj9J9xiFE7FGTcf7@dpg-d8ige3flk1mc73856sf0-a.oregon-postgres.render.com/bill_database"
LOCAL_DB = "sqlite:///./deployed_backup.db"

def sync_dbs():
    print("Connecting to remote database...")
    remote_engine = create_engine(REMOTE_DB)
    local_engine = create_engine(LOCAL_DB)
    
    meta = MetaData()
    print("Reading database schema...")
    meta.reflect(bind=remote_engine)
    
    for table_name in meta.tables:
        print(f"Exporting {table_name}...")
        df = pd.read_sql_table(table_name, con=remote_engine)
        # Handle timezone-aware datetimes for SQLite compatibility
        for col in df.select_dtypes(include=['datetime64[ns, UTC]']).columns:
            df[col] = df[col].dt.tz_localize(None)
        
        df.to_sql(table_name, con=local_engine, if_exists='replace', index=False)
        print(f"Saved {table_name} to local file")
        
    print("Data download complete! Saved as deployed_backup.db")

if __name__ == '__main__':
    sync_dbs()
