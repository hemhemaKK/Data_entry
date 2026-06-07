import sqlite3
import os

db_path = "sql_app.db"
if not os.path.exists(db_path):
    print("DB not found at", db_path)
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE bill_records ADD COLUMN upload_id INTEGER")
    conn.commit()
    print("Migration successful")
except Exception as e:
    print("Migration error (maybe already applied?):", e)
finally:
    conn.close()
