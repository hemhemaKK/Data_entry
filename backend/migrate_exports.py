import sqlite3
import os

db_path = "sql_app.db"
if not os.path.exists(db_path):
    print("DB not found at", db_path)
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS export_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename VARCHAR NOT NULL,
            export_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            filters_used VARCHAR,
            file_path VARCHAR NOT NULL
        )
    """)
    conn.commit()
    print("ExportHistory migration successful")
except Exception as e:
    print("Migration error:", e)
finally:
    conn.close()
