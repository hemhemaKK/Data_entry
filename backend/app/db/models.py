from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Float, Date, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

# Existing Upload and ValidationError models (unchanged)
class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), index=True)
    original_file_name = Column(String(255))
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="PENDING")  # PENDING, VALID, INVALID, ERROR
    error_count = Column(Integer, default=0)
    file_path = Column(String(500))
    report_path = Column(String(500), nullable=True)
    file_hash = Column(String(64), index=True, nullable=True)

    errors = relationship("ValidationError", back_populates="upload", cascade="all, delete-orphan")

class ValidationError(Base):
    __tablename__ = "validation_errors"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    row_number = Column(Integer, nullable=True)
    column_name = Column(String(255), nullable=True)
    error_message = Column(String(1000))
    sheet_name = Column(String(255), nullable=True)  # Name of the user sheet where error occurred

    upload = relationship("Upload", back_populates="errors")

# New hierarchical models
class Year(Base):
    __tablename__ = "years"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, unique=True, nullable=False)
    places = relationship("Place", back_populates="year", cascade="all, delete-orphan")

class Place(Base):
    __tablename__ = "places"
    __table_args__ = (UniqueConstraint('name', 'year_id', name='uq_place_name_year'),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    year_id = Column(Integer, ForeignKey("years.id"), index=True)
    year = relationship("Year", back_populates="places")
    users = relationship("User", back_populates="place", cascade="all, delete-orphan")
    advance_entries = relationship("AdvanceEntry", back_populates="place", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint('name', 'place_id', name='uq_user_name_place'),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    contact_number = Column(String(50), nullable=True)
    place_id = Column(Integer, ForeignKey("places.id"), index=True)
    place = relationship("Place", back_populates="users")
    flowers = relationship("Flower", back_populates="user", cascade="all, delete-orphan")
    advance_entries = relationship("AdvanceEntry", back_populates="user", cascade="all, delete-orphan")

class AdvanceEntry(Base):
    __tablename__ = "advance_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    date = Column(Date, nullable=False)
    advance_amount = Column(Float, default=0.0)
    deduction_amount = Column(Float, default=0.0)
    notes = Column(String(1000), nullable=True)
    
    user = relationship("User", back_populates="advance_entries")
    place = relationship("Place", back_populates="advance_entries")

class Flower(Base):
    __tablename__ = "flowers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user = relationship("User", back_populates="flowers")
    bill_records = relationship("BillRecord", back_populates="flower", cascade="all, delete-orphan")

class BillRecord(Base):
    __tablename__ = "bill_records"

    id = Column(Integer, primary_key=True, index=True)
    flower_id = Column(Integer, ForeignKey("flowers.id"), index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=True)
    date = Column(Date, nullable=True, index=True)
    weight = Column(Float, nullable=True)
    van = Column(String(255), nullable=True, index=True)
    rate = Column(Float, nullable=True)
    laggage = Column(Float, nullable=True, default=0.0)
    collie = Column(Float, nullable=True, default=0.0)
    print_taken = Column(Boolean, default=False)

    flower = relationship("Flower", back_populates="bill_records")
    upload = relationship("Upload", backref="bill_records")

class ExportHistory(Base):
    __tablename__ = "export_history"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    export_date = Column(DateTime, default=datetime.utcnow)
    filters_used = Column(String(1000), nullable=True)
    file_path = Column(String(500), nullable=False)
