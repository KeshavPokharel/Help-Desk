from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    user = "user"
    agent = "agent"
    admin = "admin"

# Schema for reading user data
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    profile_photo_url: Optional[str] = None

class UserCreate(UserBase):
    password: str  # Plain password, will be hashed

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    profile_photo_url: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class UserOut(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
