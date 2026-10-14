from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import json
from datetime import datetime, timedelta
import traceback
import jwt
from jose import JWTError
import zipfile
from io import BytesIO

from . import models, schemas, crud, database

SECRET_KEY = "your-secret-key-2024-accounting-manager"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

security = HTTPBearer()

import os as _os
_os.makedirs("data", exist_ok=True)
_os.makedirs("uploads", exist_ok=True)
_os.makedirs("uploads/companies", exist_ok=True)
_os.makedirs("data/calendar", exist_ok=True)

try:
    models.Base.metadata.create_all(bind=database.engine)
    print("✅ جداول دیتابیس با موفقیت ساخته شدند")
except Exception as e:
    print(f"❌ خطا در ساخت دیتابیس: {e}")

app = FastAPI(
    title="سیستم مدیریت وظایف حسابداری",
    description="API پیشرفته برای مدیریت شرکت‌ها و وظایف",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "my-accounting-app-kappa.vercel.app", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"]
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.options("/{path:path}")
async def options_handler(path: str):
    return {"message": "OK"}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(database.get_db)):
    try:
        token = credentials.credentials
        payload = verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="توکن نامعتبر",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="توکن نامعتبر",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="کاربر یافت نشد",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    except Exception as e:
        print(f"❌ خطا در get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"خطا: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.post("/api/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    try:
        print("="*50)
        print("📤 درخواست ثبت‌نام")
        print(f"👤 نام کاربری: {user.username}")
        print("="*50)
        
        existing_user = crud.get_user_by_username(db, user.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="این نام کاربری قبلاً ثبت شده است")
        
        result = crud.create_user(db, user)
        print(f"✅ ثبت‌نام موفق: {result.username}")
        return result
    except Exception as e:
        print(f"❌ خطا در ثبت‌نام: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"خطا: {str(e)}")

@app.post("/api/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    try:
        print("="*50)
        print("📤 درخواست ورود")
        print(f"👤 نام کاربری: {user.username}")
        print("="*50)
        
        db_user = crud.authenticate_user(db, user.username, user.password)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="نام کاربری یا رمز عبور اشتباه است",
            )
        
        access_token = create_access_token(data={"sub": str(db_user.id)})
        print(f"✅ ورود موفق: {db_user.username}")
        return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "username": db_user.username}}
    except Exception as e:
        print(f"❌ خطا در ورود: {e}")
        traceback.print_exc()
        raise

# ===== مدیریت پوشه‌ها =====
@app.get("/api/folders/company/{company_id}", response_model=List[schemas.Folder])
def get_folders_by_company(
    company_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        return crud.get_folders_by_company(db, company_id, current_user.id)
    except Exception as e:
        print(f"❌ خطا در دریافت پوشه‌ها: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/folders", response_model=schemas.Folder)
def create_folder(
    folder: schemas.FolderCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print("📤 درخواست ساخت پوشه")
        print(f"📁 نام: {folder.name}")
        print(f"🏢 شرکت: {folder.company_id}")
        print("="*50)
        
        result = crud.create_folder(db, folder, current_user.id)
        if not result:
            raise HTTPException(status_code=404, detail="شرکت یافت نشد")
        return result
    except Exception as e:
        print(f"❌ خطا در ساخت پوشه: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/folders/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = crud.delete_folder(db, folder_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="پوشه یافت نشد")
    return {"message": "پوشه حذف شد"}

@app.post("/api/folders/copy/{folder_id}")
def copy_folder_to_companies(
    folder_id: int,
    data: schemas.CompanyIds,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print("📤 درخواست کپی پوشه")
        print(f"📁 پوشه: {folder_id}")
        print(f"🏢 شرکت‌ها: {data.company_ids}")
        print("="*50)
        
        result = crud.copy_folder_to_companies(db, folder_id, data.company_ids, current_user.id)
        if result is None:
            raise HTTPException(status_code=404, detail="پوشه یافت نشد")
        return {"message": f"پوشه به {len(result)} شرکت کپی شد", "folders": result}
    except Exception as e:
        print(f"❌ خطا در کپی پوشه: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ===== مدیریت شرکت‌ها =====
@app.get("/api/companies", response_model=List[schemas.Company])
def get_companies(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        return crud.get_companies_by_user(db, current_user.id)
    except Exception as e:
        print(f"❌ خطا در دریافت شرکت‌ها: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/companies", response_model=schemas.Company)
def create_company(
    company: schemas.CompanyCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print("📤 درخواست افزودن شرکت")
        print(f"🏢 نام: {company.name}")
        print(f"👤 کاربر: {current_user.id}")
        print("="*50)
        
        return crud.create_company(db, company, current_user.id)
    except Exception as e:
        print(f"❌ خطا در افزودن شرکت: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = crud.delete_company(db, company_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="شرکت یافت نشد")
    return {"message": "شرکت حذف شد"}

# ===== مدیریت وظایف =====
@app.get("/api/tasks/all", response_model=List[schemas.Task])
def get_all_tasks(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_all_tasks_by_user(db, current_user.id)

@app.get("/api/tasks/{company_id}", response_model=List[schemas.Task])
def get_tasks(
    company_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_tasks(db, company_id, current_user.id)

@app.post("/api/tasks", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print("📤 درخواست افزودن وظیفه")
        print(f"📝 عنوان: {task.title}")
        print(f"🏢 شرکت: {task.company_id}")
        if task.folder_id:
            print(f"📁 پوشه: {task.folder_id}")
        print("="*50)
        
        result = crud.create_task(db, task, current_user.id)
        if not result:
            raise HTTPException(status_code=404, detail="شرکت یا پوشه یافت نشد")
        return result
    except Exception as e:
        print(f"❌ خطا در افزودن وظیفه: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks/copy/{task_id}")
def copy_task(
    task_id: int,
    company_ids: List[int],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print("📤 درخواست کپی وظیفه")
        print(f"📝 وظیفه: {task_id}")
        print(f"🏢 شرکت‌ها: {company_ids}")
        print("="*50)
        
        result = crud.copy_task_to_companies(db, task_id, company_ids, current_user.id)
        if result is None:
            raise HTTPException(status_code=404, detail="وظیفه یافت نشد")
        return {"message": f"{len(result)} وظیفه کپی شد", "tasks": result}
    except Exception as e:
        print(f"❌ خطا در کپی وظیفه: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tasks/{task_id}")
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = crud.update_task(db, task_id, task_update, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="وظیفه یافت نشد")
    return result

@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = crud.delete_task(db, task_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="وظیفه یافت نشد")
    return {"message": "وظیفه حذف شد"}

# ===== مدیریت الگوها =====
@app.get("/api/templates", response_model=List[schemas.Task])
def get_templates(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        result = crud.get_template_tasks(db, current_user.id)
        print(f"📋 دریافت الگوها: {len(result)} مورد")
        return result
    except Exception as e:
        print(f"❌ خطا در دریافت الگوها: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/templates", response_model=schemas.Task)
def create_template(
    template: schemas.TemplateTaskCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print("📤 درخواست افزودن الگو")
        print(f"📝 عنوان: {template.title}")
        print(f"📅 دوره: {template.period}")
        print(f"👤 کاربر: {current_user.id} - {current_user.username}")
        print("="*50)
        
        result = crud.create_template_task(db, template, current_user.id)
        if result is None:
            raise HTTPException(status_code=400, detail="خطا در ایجاد الگو")
        
        print(f"✅ الگو ساخته شد: ID={result.id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ خطا در ایجاد الگو: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"خطا: {str(e)}")

@app.delete("/api/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = crud.delete_template_task(db, template_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="الگو یافت نشد")
    return {"message": "الگو حذف شد"}

@app.post("/api/templates/apply/{template_id}")
def apply_template(
    template_id: int,
    company_ids: List[int],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    tasks = crud.apply_template_to_companies(db, template_id, company_ids, current_user.id)
    if tasks is None:
        raise HTTPException(status_code=404, detail="الگو یافت نشد")
    return {"message": f"{len(tasks)} وظیفه ایجاد شد", "tasks": tasks}

# ===== داشبورد =====
@app.get("/api/dashboard/overdue")
def get_overdue(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    tasks = crud.get_overdue_tasks(db, current_user.id)
    return {"count": len(tasks), "tasks": tasks}

@app.get("/api/dashboard/due-soon")
def get_due_soon(
    days: int = 3,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    tasks = crud.get_due_soon_tasks(db, current_user.id, days)
    return {"count": len(tasks), "tasks": tasks}

@app.get("/api/dashboard/reminders")
def get_reminders(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    tasks = crud.get_tasks_for_reminder(db, current_user.id)
    return {"count": len(tasks), "tasks": tasks}

# ===== آپلود فایل =====
@app.post("/api/upload/{task_id}")
async def upload_file(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print(f"📤 درخواست آپلود فایل برای وظیفه {task_id}")
        print(f"📁 نام فایل: {file.filename}")
        print("="*50)
        
        task = crud.get_task(db, task_id, current_user.id)
        if not task:
            raise HTTPException(status_code=404, detail="وظیفه یافت نشد")
        
        company = db.query(models.Company).filter(models.Company.id == task.company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="شرکت یافت نشد")
        
        company_folder_name = f"{company.id}_{company.name.replace(' ', '_')}"
        company_path = os.path.join("uploads", "companies", company_folder_name)
        os.makedirs(company_path, exist_ok=True)
        
        if task.folder_id:
            folder = db.query(models.Folder).filter(models.Folder.id == task.folder_id).first()
            if folder:
                folder_path = os.path.join(company_path, folder.name.replace(' ', '_'))
                os.makedirs(folder_path, exist_ok=True)
                upload_dir = folder_path
            else:
                upload_dir = company_path
        else:
            upload_dir = company_path
        
        for old_file in os.listdir(upload_dir):
            if old_file.startswith(f"{task_id}_"):
                try:
                    os.remove(os.path.join(upload_dir, old_file))
                except:
                    pass
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = file.filename.replace(" ", "_")
        file_path = os.path.join(upload_dir, f"{task_id}_{timestamp}_{filename}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        relative_path = os.path.relpath(file_path, "uploads")
        task.file_path = relative_path
        db.commit()
        
        file_url = f"/uploads/{relative_path.replace(os.sep, '/')}"
        print(f"✅ فایل آپلود شد: {file_path}")
        
        return {"message": "فایل با موفقیت آپلود شد", "path": relative_path, "url": file_url}
    except Exception as e:
        print(f"❌ خطا در آپلود فایل: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{task_id}")
def download_file(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = crud.get_task(db, task_id, current_user.id)
    if not task or not task.file_path:
        raise HTTPException(status_code=404, detail="فایلی یافت نشد")
    
    full_path = os.path.join("uploads", task.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="فایل روی سرور موجود نیست")
    
    filename = os.path.basename(full_path)
    url = f"/uploads/{task.file_path.replace(os.sep, '/')}"
    return {"file_path": full_path, "url": url, "filename": filename}

# ===== مدیریت توضیحات =====
@app.get("/api/notes/company/{company_id}", response_model=List[schemas.Note])
def get_notes_by_company(
    company_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        notes = crud.get_notes_by_company(db, company_id, current_user.id)
        for note in notes:
            if not isinstance(note.get('files'), list):
                note['files'] = []
        return notes
    except Exception as e:
        print(f"❌ خطا در دریافت توضیحات: {e}")
        traceback.print_exc()
        return []

@app.get("/api/notes/all", response_model=List[schemas.Note])
def get_all_notes(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        notes = crud.get_notes_by_user(db, current_user.id)
        for note in notes:
            if not isinstance(note.get('files'), list):
                note['files'] = []
        return notes
    except Exception as e:
        print(f"❌ خطا در دریافت توضیحات: {e}")
        traceback.print_exc()
        return []

@app.post("/api/notes", response_model=schemas.Note)
def create_note(
    note: schemas.NoteCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print("📤 درخواست افزودن توضیح")
        print(f"📝 عنوان: {note.title}")
        print(f"🏢 شرکت: {note.company_id}")
        if note.folder_id:
            print(f"📁 پوشه: {note.folder_id}")
        print("="*50)
        
        result = crud.create_note(db, note, current_user.id)
        
        if result.files:
            try:
                result.files = json.loads(result.files)
            except:
                result.files = []
        else:
            result.files = []
        
        return result
    except Exception as e:
        print(f"❌ خطا در افزودن توضیح: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/notes/{note_id}")
def update_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = crud.update_note(db, note_id, note_update, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="توضیح یافت نشد")
    return result

@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = crud.delete_note(db, note_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="توضیح یافت نشد")
    return {"message": "توضیح حذف شد"}

@app.post("/api/notes/upload/{note_id}")
async def upload_note_file(
    note_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print(f"📤 درخواست آپلود فایل برای توضیح {note_id}")
        print(f"📁 نام فایل: {file.filename}")
        print("="*50)
        
        note = db.query(models.Note).filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id
        ).first()
        
        if not note:
            raise HTTPException(status_code=404, detail="توضیح یافت نشد")
        
        company = db.query(models.Company).filter(models.Company.id == note.company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="شرکت یافت نشد")
        
        company_folder_name = f"{company.id}_{company.name.replace(' ', '_')}"
        company_path = os.path.join("uploads", "companies", company_folder_name)
        os.makedirs(company_path, exist_ok=True)
        
        if note.folder_id:
            folder = db.query(models.Folder).filter(models.Folder.id == note.folder_id).first()
            if folder:
                folder_path = os.path.join(company_path, folder.name.replace(' ', '_'))
                os.makedirs(folder_path, exist_ok=True)
                upload_dir = folder_path
            else:
                upload_dir = company_path
        else:
            upload_dir = company_path
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = file.filename.replace(" ", "_")
        file_path = os.path.join(upload_dir, f"{note_id}_{timestamp}_{filename}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        files = json.loads(note.files) if note.files else []
        relative_path = os.path.relpath(file_path, "uploads")
        files.append(relative_path)
        note.files = json.dumps(files)
        db.commit()
        
        print(f"✅ فایل آپلود شد: {file_path}")
        
        return {
            "message": "فایل با موفقیت آپلود شد",
            "files": files,
            "url": f"/uploads/{relative_path.replace(os.sep, '/')}"
        }
    except Exception as e:
        print(f"❌ خطا در آپلود فایل: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/notes/file/{note_id}")
def delete_note_file(
    note_id: int,
    file_index: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        note = db.query(models.Note).filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id
        ).first()
        
        if not note:
            raise HTTPException(status_code=404, detail="توضیح یافت نشد")
        
        files = json.loads(note.files) if note.files else []
        if 0 <= file_index < len(files):
            file_path = os.path.join("uploads", files[file_index])
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
            files.pop(file_index)
            note.files = json.dumps(files)
            db.commit()
            return {"message": "فایل با موفقیت حذف شد", "files": files}
        else:
            raise HTTPException(status_code=404, detail="فایل یافت نشد")
    except Exception as e:
        print(f"❌ خطا در حذف فایل: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notes/upload-multiple/{note_id}")
async def upload_multiple_files(
    note_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print("="*50)
        print(f"📤 درخواست آپلود چند فایل برای توضیح {note_id}")
        print(f"📁 تعداد فایل‌ها: {len(files)}")
        print("="*50)
        
        note = db.query(models.Note).filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id
        ).first()
        
        if not note:
            raise HTTPException(status_code=404, detail="توضیح یافت نشد")
        
        company = db.query(models.Company).filter(models.Company.id == note.company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="شرکت یافت نشد")
        
        company_folder_name = f"{company.id}_{company.name.replace(' ', '_')}"
        company_path = os.path.join("uploads", "companies", company_folder_name)
        os.makedirs(company_path, exist_ok=True)
        
        if note.folder_id:
            folder = db.query(models.Folder).filter(models.Folder.id == note.folder_id).first()
            if folder:
                folder_path = os.path.join(company_path, folder.name.replace(' ', '_'))
                os.makedirs(folder_path, exist_ok=True)
                upload_dir = folder_path
            else:
                upload_dir = company_path
        else:
            upload_dir = company_path
        
        saved_files = []
        
        for file in files:
            filename = file.filename.replace(" ", "_")
            file_path = os.path.join(upload_dir, filename)
            
            counter = 1
            base_name = filename
            name_without_ext, ext = os.path.splitext(base_name)
            while os.path.exists(file_path):
                new_name = f"{name_without_ext}_{counter}{ext}"
                file_path = os.path.join(upload_dir, new_name)
                counter += 1
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            relative_path = os.path.relpath(file_path, "uploads")
            saved_files.append(relative_path)
            print(f"✅ فایل ذخیره شد: {file_path}")
        
        existing_files = json.loads(note.files) if note.files else []
        existing_files.extend(saved_files)
        note.files = json.dumps(existing_files)
        db.commit()
        
        print(f"✅ {len(saved_files)} فایل آپلود شد")
        
        return {
            "message": f"{len(saved_files)} فایل با موفقیت آپلود شد",
            "files": existing_files
        }
    except Exception as e:
        print(f"❌ خطا در آپلود چند فایل: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notes/download-zip/{note_id}")
def download_note_files_zip(
    note_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        note = db.query(models.Note).filter(
            models.Note.id == note_id,
            models.Note.user_id == current_user.id
        ).first()
        
        if not note:
            raise HTTPException(status_code=404, detail="توضیح یافت نشد")
        
        files = json.loads(note.files) if note.files else []
        if not files:
            raise HTTPException(status_code=404, detail="هیچ فایلی برای این توضیح وجود ندارد")
        
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in files:
                full_path = os.path.join("uploads", file_path)
                if os.path.exists(full_path):
                    arcname = os.path.basename(full_path)
                    zip_file.write(full_path, arcname)
        
        zip_buffer.seek(0)
        
        from urllib.parse import quote
        safe_title = (note.title or "files").strip() or "files"
        ascii_filename = "files.zip"
        encoded_filename = quote(f"{safe_title}.zip", safe="")
        content_disposition = (
            f'attachment; filename="{ascii_filename}"; filename*=UTF-8''{encoded_filename}'
        )

        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": content_disposition
            }
        )
    except Exception as e:
        print(f"❌ خطا در دانلود ZIP: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ===== تقویم شمسی با داده از time.ir =====
@app.get("/api/calendar/{year}")
async def get_calendar(
    year: int,
    refresh: bool = False,
    current_user: models.User = Depends(get_current_user)
):
    """دریافت تقویم شمسی با کش در سرور - داده‌ها از time.ir"""
    try:
        import jdatetime
        import json as json_lib
        import os as _os
        
        _os.makedirs("data/calendar", exist_ok=True)
        cache_path = f"data/calendar/{year}.json"
        calendar_version = 3  # نسخه جدید با data از time.ir
        
        # بررسی کش
        if not refresh and _os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached_data = json_lib.load(f)
                if cached_data.get("year") == year and cached_data.get("calendar_version") == calendar_version:
                    print(f"📂 استفاده از کش تقویم سال {year}")
                    return cached_data
            except Exception as e:
                print(f"⚠️ خطا در خواندن کش: {e}")
        
        # دریافت داده از time.ir
        print(f"📡 دریافت داده تقویم سال {year} از time.ir...")
        try:
            # تلاش برای استفاده از pytimeir
            import pytimeir
            holidays_df = pytimeir.get_holidays(year)
            events_df = pytimeir.get_events(year)
            
            # تبدیل به فرمت مورد نظر
            holidays_dict = {}
            for _, row in holidays_df.iterrows():
                # فرض: ستون‌ها شامل تاریخ و عنوان هستند
                date_str = f"{row.get('year', year)}/{str(row.get('month', 1)).zfill(2)}/{str(row.get('day', 1)).zfill(2)}"
                holidays_dict[date_str] = row.get('occasion', 'تعطیل رسمی')
            
            # ساخت لیست روزها
            def get_jalali_month_lengths(y):
                try:
                    jdatetime.date(y, 12, 30)
                    return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]
                except ValueError:
                    return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]
            
            months_length = get_jalali_month_lengths(year)
            days = []
            
            for m in range(1, 13):
                for d in range(1, months_length[m-1] + 1):
                    date_str = f"{year}/{m:02d}/{d:02d}"
                    is_holiday = False
                    events = []
                    
                    # بررسی تعطیلات از time.ir
                    if date_str in holidays_dict:
                        is_holiday = True
                        events.append({
                            'description': holidays_dict[date_str],
                            'is_holiday': True
                        })
                    
                    # بررسی جمعه
                    if jdatetime.date(year, m, d).weekday() == 6:
                        is_holiday = True
                        if not any(e.get('is_holiday') for e in events):
                            events.append({
                                'description': 'جمعه',
                                'is_holiday': True
                            })
                    
                    days.append({
                        'date': date_str,
                        'is_holiday': is_holiday,
                        'events': events
                    })
            
            result = {
                'year': year,
                'days': days,
                'source': 'time.ir',
                'calendar_version': calendar_version,
                'synced_at': datetime.now().isoformat(),
                'complete': True
            }
            
        except ImportError:
            # اگر pytimeir نصب نبود، از روش جایگزین استفاده کن
            print("⚠️ pytimeir نصب نیست، از روش جایگزین استفاده می‌شود")
            result = generate_calendar_local(year)
        except Exception as e:
            print(f"⚠️ خطا در دریافت از time.ir: {e}")
            # fallback به روش محلی
            result = generate_calendar_local(year)
        
        # ذخیره در کش
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json_lib.dump(result, f, ensure_ascii=False, indent=2)
            print(f"💾 تقویم سال {year} در کش ذخیره شد")
        except Exception as e:
            print(f"⚠️ خطا در ذخیره کش: {e}")
        
        return result
        
    except Exception as e:
        print(f"❌ خطا در دریافت تقویم: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"خطا در دریافت تقویم: {str(e)}")

def generate_calendar_local(year):
    """روش جایگزین برای تولید تقویم در صورت عدم دسترسی به time.ir"""
    import jdatetime
    import json as json_lib
    
    def get_jalali_month_lengths(y):
        try:
            jdatetime.date(y, 12, 30)
            return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]
        except ValueError:
            return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]
    
    def is_friday(date_str):
        y, m, d = map(int, date_str.split('/'))
        return jdatetime.date(y, m, d).weekday() == 6
    
    months_length = get_jalali_month_lengths(year)
    days = []
    by_date = {}
    
    for m in range(1, 13):
        for d in range(1, months_length[m-1] + 1):
            date_str = f"{year}/{m:02d}/{d:02d}"
            day_data = {
                'date': date_str,
                'is_holiday': False,
                'events': []
            }
            days.append(day_data)
            by_date[date_str] = day_data
    
    # تعطیلات محلی
    local_holidays = [
        (1, 1, "نوروز"), (1, 2, "نوروز"), (1, 3, "نوروز"), (1, 4, "نوروز"),
        (1, 12, "روز جمهوری اسلامی"), (1, 13, "سیزده بدر"),
        (2, 1, "روز کارگر"), (3, 14, "رحلت امام خمینی"), (3, 15, "قیام ۱۵ خرداد"),
        (6, 8, "عید قربان"), (6, 18, "عید مباهله"), (8, 7, "رحلت پیامبر"),
        (8, 8, "شهادت امام حسن"), (8, 15, "ولادت پیامبر"), (9, 16, "ولادت امام علی"),
        (10, 12, "بعثت پیامبر"), (11, 4, "میلاد امام مهدی"), (11, 22, "پیروزی انقلاب"),
        (12, 19, "ولادت امام زمان"), (12, 29, "نیمه شعبان")
    ]
    
    for m, d, name in local_holidays:
        date_str = f"{year}/{m:02d}/{d:02d}"
        try:
            jdatetime.date(year, m, d)
            if date_str in by_date:
                by_date[date_str]['is_holiday'] = True
                by_date[date_str]['events'].append({
                    'description': name,
                    'is_holiday': True
                })
        except:
            pass
    
    for day in days:
        if is_friday(day['date']):
            day['is_holiday'] = True
    
    return {
        'year': year,
        'days': days,
        'source': 'local_fallback',
        'calendar_version': 3,
        'synced_at': datetime.now().isoformat(),
        'complete': True
    }

@app.post("/api/schedule-task/{task_id}")
def schedule_task(
    task_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = crud.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="وظیفه یافت نشد")
    
    if not task.due_date:
        raise HTTPException(status_code=400, detail="این وظیفه تاریخ سررسید ندارد")
    
    try:
        import jdatetime
        due_date_jalali = jdatetime.datetime.fromgregorian(datetime=task.due_date).strftime("%Y/%m/%d")
    except:
        due_date_jalali = task.due_date.strftime("%Y-%m-%d")
    
    company_name = task.company.name if task.company else 'نامشخص'
    
    txt_content = "========================================\n"
    txt_content += "    یادآوری وظیفه: " + task.title + "\n"
    txt_content += "========================================\n\n"
    txt_content += "    شرکت: " + company_name + "\n"
    txt_content += "    تاریخ سررسید: " + due_date_jalali + "\n"
    txt_content += "    زمان یادآوری: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "\n\n"
    txt_content += "    توضیحات: " + (task.description or 'بدون توضیحات') + "\n\n"
    txt_content += "========================================\n"
    
    txt_path = os.path.join(os.getcwd(), f"reminder_{task_id}.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(txt_content)
    
    if os.name == "nt":
        task_name = f"Accounting_Reminder_{task_id}"
        cmd = f'schtasks /create /tn "{task_name}" /tr "notepad.exe \"{txt_path}\"" /sc daily /st 09:00 /f'
        os.system(cmd)
        return {"message": f"✅ وظیفه با موفقیت در Task Scheduler ثبت شد", "task_name": task_name, "file": txt_path}
    else:
        return {"message": "⚠️ این قابلیت فقط در ویندوز پشتیبانی می‌شود"}
