from pydantic import BaseModel
from typing import List, Optional
import datetime
from datetime import datetime as dt

class YearBase(BaseModel):
    year: int

class YearCreate(YearBase):
    pass

class Year(YearBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class PlaceBase(BaseModel):
    name: str
    year_id: int

class PlaceCreate(PlaceBase):
    pass

class Place(PlaceBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class UserBase(BaseModel):
    name: str
    place_id: int
    contact_number: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class BillRecordBase(BaseModel):
    date: Optional[datetime.date] = None
    weight: Optional[float] = None
    van: Optional[str] = None
    rate: Optional[float] = None
    laggage: Optional[float] = None
    collie: Optional[float] = None
    print_taken: Optional[bool] = False

class MarkPrintedPayload(BaseModel):
    record_ids: List[int]
    status: bool = True

class BillRecordCreate(BillRecordBase):
    flower_id: int

class TransactionOut(BillRecordBase):
    id: int
    flower_name: str
    client_name: str

    class Config:
        orm_mode = True
        from_attributes = True

class BillRecord(BillRecordBase):
    id: int
    flower_id: int

    class Config:
        orm_mode = True
        from_attributes = True

class FlowerBase(BaseModel):
    name: str
    user_id: int

class FlowerCreate(FlowerBase):
    pass

class Flower(FlowerBase):
    id: int
    bill_records: List[BillRecord] = []

    class Config:
        orm_mode = True
        from_attributes = True
