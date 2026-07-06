import time, os, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# We have to add backend to sys.path so we can import app
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.models import BillRecord

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
Session = sessionmaker(bind=engine)
session = Session()

start = time.time()
db_record = BillRecord(flower_id=1, date=datetime.date.today(), weight=10, van="v1", rate=10, laggage=0, collie=0, print_taken=False)
session.add(db_record)
session.commit()
session.refresh(db_record)
print("Insert Time taken:", time.time() - start)

# clean up
session.delete(db_record)
session.commit()
