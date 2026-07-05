import sqlalchemy

REMOTE_DB = "postgresql://bill_database_user:k8YBpZaPIdc1N0nKaj9J9xiFE7FGTcf7@dpg-d8ige3flk1mc73856sf0-a.oregon-postgres.render.com/bill_database"

def test_conn():
    try:
        engine = sqlalchemy.create_engine(REMOTE_DB, connect_args={'connect_timeout': 5})
        conn = engine.connect()
        print("Successfully connected!")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_conn()
