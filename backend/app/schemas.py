from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class TaskPeriod(str, Enum):
    ONCE = "یکبار"
    WEEKLY = "هفتگی"
    MONTHLY = "ماهانه"
    YEARLY = "سالانه"

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

class CompanyBase(BaseModel):
    name: str

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    name: str
    company_id: int

class FolderCreate(FolderBase):
    pass

class Folder(FolderBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CompanyIds(BaseModel):
    company_ids: List[int]

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    is_done: Optional[bool] = False
    done_at: Optional[datetime] = None
    file_path: Optional[str] = ""
    require_upload: Optional[bool] = False
    due_date: Optional[datetime] = None
    reminder_days: Optional[int] = 3
    period: Optional[str] = "یکبار"
    is_template: Optional[bool] = False

class TaskCreate(TaskBase):
    company_id: Optional[int] = None
    folder_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_done: Optional[bool] = None
    done_at: Optional[datetime] = None
    file_path: Optional[str] = None
    require_upload: Optional[bool] = None
    due_date: Optional[datetime] = None
    reminder_days: Optional[int] = None
    period: Optional[str] = None
    is_template: Optional[bool] = None
    folder_id: Optional[int] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    company_id: Optional[int] = None
    folder_id: Optional[int] = None
    company_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class TemplateTaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    period: Optional[str] = "یکبار"
    due_date: Optional[datetime] = None

class NoteCreate(BaseModel):
    title: str
    content: str
    company_id: int
    folder_id: Optional[int] = None
    files: Optional[List[str]] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    files: Optional[List[str]] = None
    company_id: Optional[int] = None
    folder_id: Optional[int] = None

class Note(NoteCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    files: Optional[List[str]] = []
    
    class Config:
        from_attributes = True
