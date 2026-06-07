import sqlite3
import os

db_path = "sql_app.db"
if not os.path.exists(db_path):
    print("DB not found at", db_path)
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE uploads ADD COLUMN file_hash VARCHAR")
    cursor.execute("CREATE INDEX ix_uploads_file_hash ON uploads (file_hash)")
    conn.commit()
    print("Migration successful")
except Exception as e:
    print("Migration error (maybe already applied?):", e)
finally:
    conn.close()
