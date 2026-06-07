import os
import sys
# Ensure the app package can be imported when running this script from the project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import engine, Base


def create_db():
    """Drop existing tables and recreate all tables defined in models."""
    # For development, we drop all to ensure fresh schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database schema created.")

if __name__ == "__main__":
    create_db()
