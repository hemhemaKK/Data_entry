import sqlite3
import os

db_path = "sql_app.db"
if not os.path.exists(db_path):
    print("DB not found at", db_path)
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

indexes_to_create = [
    "CREATE INDEX IF NOT EXISTS ix_places_name ON places (name)",
    "CREATE INDEX IF NOT EXISTS ix_places_year_id ON places (year_id)",
    "CREATE INDEX IF NOT EXISTS ix_users_name ON users (name)",
    "CREATE INDEX IF NOT EXISTS ix_users_place_id ON users (place_id)",
    "CREATE INDEX IF NOT EXISTS ix_flowers_name ON flowers (name)",
    "CREATE INDEX IF NOT EXISTS ix_flowers_user_id ON flowers (user_id)",
    "CREATE INDEX IF NOT EXISTS ix_bill_records_flower_id ON bill_records (flower_id)",
    "CREATE INDEX IF NOT EXISTS ix_bill_records_date ON bill_records (date)",
    "CREATE INDEX IF NOT EXISTS ix_bill_records_van ON bill_records (van)"
]

try:
    for idx_query in indexes_to_create:
        cursor.execute(idx_query)
    conn.commit()
    print("Indexes migration successful")
except Exception as e:
    print("Migration error:", e)
finally:
    conn.close()
