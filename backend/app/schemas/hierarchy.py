from pydantic import BaseModel, field_validator
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
        from_attributes = True

class PlaceBase(BaseModel):
    name: str
    year_id: int

class PlaceCreate(PlaceBase):
    pass

class Place(PlaceBase):
    id: int
    class Config:
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
        from_attributes = True

class BillRecordBase(BaseModel):
    user_id: int
    flower_id: int
    date: Optional[datetime.date] = None
    weight: Optional[float] = None
    van: Optional[str] = None
    rate: Optional[float] = None
    laggage: Optional[float] = None
    collie: Optional[float] = None
    print_taken: Optional[bool] = False

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, datetime.datetime):
            return v.date()
        if isinstance(v, str):
            return v.split(' ')[0].split('T')[0]
        return v

class MarkPrintedPayload(BaseModel):
    record_ids: List[int]
    status: bool = True

class BillRecordCreate(BillRecordBase):
    pass

class TransactionOut(BillRecordBase):
    id: int
    flower_name: str
    client_name: str
    place_name: str
    client_id: int
    place_id: int

    class Config:
        from_attributes = True

class BillRecord(BillRecordBase):
    id: int

    class Config:
        from_attributes = True

class FlowerBase(BaseModel):
    name: str

class FlowerCreate(FlowerBase):
    pass

class Flower(FlowerBase):
    id: int
    bill_records: List[BillRecord] = []

    class Config:
        from_attributes = True

class FlowerOut(FlowerBase):
    id: int

    class Config:
        from_attributes = True

class AdvanceEntryBase(BaseModel):
    user_id: Optional[int] = None
    place_id: Optional[int] = None
    date: datetime.date
    advance_amount: Optional[float] = 0.0
    deduction_amount: Optional[float] = 0.0
    notes: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, datetime.datetime):
            return v.date()
        if isinstance(v, str):
            return v.split(' ')[0].split('T')[0]
        return v

    @field_validator('created_at', mode='before')
    @classmethod
    def parse_created_at(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str) and ' ' in v and 'T' not in v:
            return v.replace(' ', 'T')
        return v

class AdvanceEntryCreate(AdvanceEntryBase):
    pass

class AdvanceEntry(AdvanceEntryBase):
    id: int
    class Config:
        from_attributes = True

class AdvanceEntryOut(AdvanceEntry):
    user_name: Optional[str] = None
    place_name: Optional[str] = None

class BulkDateUpdate(BaseModel):
    entry_ids: List[int]
    date: datetime.date

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, datetime.datetime):
            return v.date()
        if isinstance(v, str):
            return v.split(' ')[0].split('T')[0]
        return v

class BulkPlacesCreate(BaseModel):
    year_id: int
    names: List[str]

class BulkUsersCreate(BaseModel):
    place_id: int
    names: List[str]

class BulkFlowersCreate(BaseModel):
    place_id: Optional[int] = None
    flower_names: List[str]

