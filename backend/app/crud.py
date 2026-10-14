from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models, schemas
import hashlib
import base64
import json
import os
import shutil

SALT = "my_salt_2024"

def hash_password(password):
    return base64.b64encode(hashlib.sha256((SALT + password).encode()).digest()).decode()

def verify_password(password, hashed):
    return hash_password(password) == hashed

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    try:
        print(f"📝 ایجاد کاربر: {user.username}")
        hashed = hash_password(user.password)
        db_user = models.User(username=user.username, password_hash=hashed)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"✅ کاربر ایجاد شد: ID={db_user.id}")
        return db_user
    except Exception as e:
        print(f"❌ خطا در create_user: {e}")
        db.rollback()
        raise

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def get_companies_by_user(db: Session, user_id: int):
    return db.query(models.Company).filter(models.Company.user_id == user_id).all()

def create_company(db: Session, company: schemas.CompanyCreate, user_id: int):
    try:
        print(f"📝 ایجاد شرکت: {company.name} برای کاربر {user_id}")
        db_company = models.Company(name=company.name, user_id=user_id)
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        print(f"✅ شرکت ایجاد شد: ID={db_company.id}")
        return db_company
    except Exception as e:
        print(f"❌ خطا در create_company: {e}")
        db.rollback()
        raise

def delete_company(db: Session, company_id: int, user_id: int):
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.user_id == user_id
    ).first()
    if company:
        db.delete(company)
        db.commit()
    return company

def get_folders_by_company(db: Session, company_id: int, user_id: int):
    return db.query(models.Folder).filter(
        models.Folder.company_id == company_id,
        models.Folder.user_id == user_id
    ).all()

def create_folder(db: Session, folder: schemas.FolderCreate, user_id: int):
    try:
        print(f"📝 ایجاد پوشه: {folder.name} برای شرکت {folder.company_id}")
        company = db.query(models.Company).filter(
            models.Company.id == folder.company_id,
            models.Company.user_id == user_id
        ).first()
        if not company:
            raise ValueError("شرکت یافت نشد")
        db_folder = models.Folder(
            name=folder.name,
            company_id=folder.company_id,
            user_id=user_id
        )
        db.add(db_folder)
        db.commit()
        db.refresh(db_folder)
        company_folder = f"{company.id}_{company.name.replace(' ', '_')}"
        folder_path = os.path.join("uploads", "companies", company_folder, folder.name.replace(' ', '_'))
        os.makedirs(folder_path, exist_ok=True)
        print(f"✅ پوشه ایجاد شد: ID={db_folder.id}")
        return db_folder
    except Exception as e:
        print(f"❌ خطا در create_folder: {e}")
        db.rollback()
        raise

def delete_folder(db: Session, folder_id: int, user_id: int):
    folder = db.query(models.Folder).filter(
        models.Folder.id == folder_id,
        models.Folder.user_id == user_id
    ).first()
    if folder:
        company = db.query(models.Company).filter(models.Company.id == folder.company_id).first()
        if company:
            company_folder = f"{company.id}_{company.name.replace(' ', '_')}"
            folder_path = os.path.join("uploads", "companies", company_folder, folder.name.replace(' ', '_'))
            if os.path.exists(folder_path):
                try:
                    shutil.rmtree(folder_path)
                except:
                    pass
        db.delete(folder)
        db.commit()
    return folder

def copy_folder_to_companies(db: Session, folder_id: int, company_ids: list, user_id: int):
    folder = db.query(models.Folder).filter(
        models.Folder.id == folder_id,
        models.Folder.user_id == user_id
    ).first()
    if not folder:
        return None
    created_folders = []
    for company_id in company_ids:
        company = db.query(models.Company).filter(
            models.Company.id == company_id,
            models.Company.user_id == user_id
        ).first()
        if not company:
            continue
        existing = db.query(models.Folder).filter(
            models.Folder.company_id == company_id,
            models.Folder.name == folder.name,
            models.Folder.user_id == user_id
        ).first()
        if existing:
            continue
        new_folder = models.Folder(
            name=folder.name,
            company_id=company_id,
            user_id=user_id
        )
        db.add(new_folder)
        db.commit()
        db.refresh(new_folder)
        target_company_folder = f"{company.id}_{company.name.replace(' ', '_')}"
        target_path = os.path.join("uploads", "companies", target_company_folder, folder.name.replace(' ', '_'))
        os.makedirs(target_path, exist_ok=True)
        created_folders.append(new_folder)
    return created_folders

def get_tasks(db: Session, company_id: int, user_id: int):
    try:
        return db.query(models.Task).filter(
            models.Task.company_id == company_id,
            models.Task.company.has(user_id=user_id),
            models.Task.is_template == False
        ).all()
    except Exception as e:
        print(f"❌ خطا در get_tasks: {e}")
        return []

def get_all_tasks_by_user(db: Session, user_id: int):
    try:
        tasks = db.query(models.Task).filter(
            models.Task.company.has(user_id=user_id),
            models.Task.is_template == False
        ).all()
        result = []
        for task in tasks:
            task_dict = {
                'id': task.id,
                'title': task.title,
                'description': task.description or '',
                'is_done': bool(task.is_done) if task.is_done is not None else False,
                'done_at': task.done_at,
                'file_path': task.file_path or '',
                'require_upload': bool(task.require_upload) if task.require_upload is not None else False,
                'due_date': task.due_date,
                'reminder_days': task.reminder_days or 3,
                'period': task.period.value if task.period else 'یکبار',
                'is_template': bool(task.is_template) if task.is_template is not None else False,
                'created_at': task.created_at,
                'updated_at': task.updated_at,
                'company_id': task.company_id,
                'company_name': task.company.name if task.company else None,
                'folder_id': task.folder_id
            }
            result.append(task_dict)
        return result
    except Exception as e:
        print(f"❌ خطا در get_all_tasks_by_user: {e}")
        import traceback
        traceback.print_exc()
        return []

def get_task(db: Session, task_id: int, user_id: int):
    try:
        return db.query(models.Task).filter(
            models.Task.id == task_id,
            models.Task.company.has(user_id=user_id)
        ).first()
    except Exception as e:
        print(f"❌ خطا در get_task: {e}")
        return None

def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    try:
        print(f"📝 ایجاد وظیفه: {task.title}")
        company = db.query(models.Company).filter(
            models.Company.id == task.company_id,
            models.Company.user_id == user_id
        ).first()
        if not company:
            raise ValueError("شرکت یافت نشد")
        if task.folder_id:
            folder = db.query(models.Folder).filter(
                models.Folder.id == task.folder_id,
                models.Folder.company_id == task.company_id,
                models.Folder.user_id == user_id
            ).first()
            if not folder:
                raise ValueError("پوشه یافت نشد")
        due_date = task.due_date
        if task.period and task.period != "یکبار":
            if not due_date:
                due_date = calculate_due_date_from_now(task.period)
        db_task = models.Task(
            title=task.title,
            description=task.description or "",
            is_done=task.is_done or False,
            require_upload=task.require_upload or False,
            due_date=due_date,
            reminder_days=task.reminder_days or 3,
            period=task.period if task.period else "یکبار",
            is_template=task.is_template or False,
            company_id=task.company_id,
            folder_id=task.folder_id
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        print(f"✅ وظیفه ایجاد شد: ID={db_task.id}")
        return db_task
    except Exception as e:
        print(f"❌ خطا در create_task: {e}")
        db.rollback()
        raise

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate, user_id: int):
    db_task = get_task(db, task_id, user_id)
    if db_task:
        if task_update.is_done is not None:
            if task_update.is_done:
                task_update.done_at = datetime.now()
            else:
                task_update.done_at = None
        for key, value in task_update.model_dump(exclude_unset=True).items():
            setattr(db_task, key, value)
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int, user_id: int):
    task = get_task(db, task_id, user_id)
    if task:
        db.delete(task)
        db.commit()
    return task

def copy_task_to_companies(db: Session, task_id: int, company_ids: list, user_id: int):
    original_task = get_task(db, task_id, user_id)
    if not original_task:
        return None
    created_tasks = []
    for company_id in company_ids:
        company = db.query(models.Company).filter(
            models.Company.id == company_id,
            models.Company.user_id == user_id
        ).first()
        if not company:
            continue
        new_task = models.Task(
            title=original_task.title,
            description=original_task.description,
            period=original_task.period,
            due_date=original_task.due_date,
            is_template=False,
            is_done=False,
            company_id=company_id,
            require_upload=False,
            reminder_days=original_task.reminder_days
        )
        db.add(new_task)
        created_tasks.append(new_task)
    db.commit()
    for task in created_tasks:
        db.refresh(task)
    return created_tasks

def calculate_due_date_from_now(period):
    now = datetime.now()
    if period == "هفتگی":
        return now + timedelta(days=7)
    elif period == "ماهانه":
        if now.month == 12:
            return now.replace(year=now.year+1, month=1, day=now.day)
        else:
            next_month = now.month + 1
            next_year = now.year
            if next_month > 12:
                next_month = 1
                next_year += 1
            if next_month == 2:
                max_day = 29 if (next_year % 4 == 0 and next_year % 100 != 0) or (next_year % 400 == 0) else 28
            elif next_month in [4, 6, 9, 11]:
                max_day = 30
            else:
                max_day = 31
            day = min(now.day, max_day)
            return now.replace(year=next_year, month=next_month, day=day)
    elif period == "سالانه":
        return now.replace(year=now.year+1)
    else:
        return now + timedelta(days=30)

def get_template_tasks(db: Session, user_id: int):
    try:
        return db.query(models.Task).filter(
            models.Task.is_template == True,
            models.Task.company_id == None
        ).all()
    except Exception as e:
        print(f"❌ خطا در get_template_tasks: {e}")
        return []

def create_template_task(db: Session, template: schemas.TemplateTaskCreate, user_id: int):
    try:
        print(f"📝 ایجاد الگو: {template.title}, دوره: {template.period}")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError(f"کاربر {user_id} یافت نشد")
        db_task = models.Task(
            title=template.title,
            description=template.description or "",
            period=template.period,
            due_date=template.due_date,
            is_template=True,
            is_done=False,
            company_id=None
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        print(f"✅ الگو ایجاد شد: ID={db_task.id}")
        return db_task
    except Exception as e:
        print(f"❌ خطا در create_template_task: {e}")
        db.rollback()
        raise

def delete_template_task(db: Session, template_id: int, user_id: int):
    task = db.query(models.Task).filter(
        models.Task.id == template_id,
        models.Task.is_template == True
    ).first()
    if task:
        db.delete(task)
        db.commit()
    return task

def apply_template_to_companies(db: Session, template_id: int, company_ids: list, user_id: int):
    template = db.query(models.Task).filter(
        models.Task.id == template_id,
        models.Task.is_template == True
    ).first()
    if not template:
        return None
    created_tasks = []
    for company_id in company_ids:
        company = db.query(models.Company).filter(
            models.Company.id == company_id,
            models.Company.user_id == user_id
        ).first()
        if not company:
            continue
        new_task = models.Task(
            title=template.title,
            description=template.description,
            period=template.period,
            due_date=calculate_due_date_from_now(template.period),
            is_template=False,
            is_done=False,
            company_id=company_id,
            require_upload=False,
            reminder_days=3
        )
        db.add(new_task)
        created_tasks.append(new_task)
    db.commit()
    for task in created_tasks:
        db.refresh(task)
    return created_tasks

def get_overdue_tasks(db: Session, user_id: int):
    try:
        now = datetime.now()
        tasks = db.query(models.Task).filter(
            models.Task.is_done == False,
            models.Task.due_date < now,
            models.Task.is_template == False,
            models.Task.company.has(user_id=user_id)
        ).all()
        result = []
        for task in tasks:
            task_dict = {
                'id': task.id,
                'title': task.title,
                'company_id': task.company_id,
                'company_name': task.company.name if task.company else 'بدون شرکت',
                'due_date': task.due_date,
                'period': task.period.value if task.period else 'یکبار',
                'description': task.description or ''
            }
            result.append(task_dict)
        return result
    except Exception as e:
        print(f"❌ خطا در get_overdue_tasks: {e}")
        return []

def get_due_soon_tasks(db: Session, user_id: int, days=3):
    try:
        now = datetime.now()
        soon = now + timedelta(days=days)
        tasks = db.query(models.Task).filter(
            models.Task.is_done == False,
            models.Task.due_date >= now,
            models.Task.due_date <= soon,
            models.Task.is_template == False,
            models.Task.company.has(user_id=user_id)
        ).all()
        result = []
        for task in tasks:
            task_dict = {
                'id': task.id,
                'title': task.title,
                'company_id': task.company_id,
                'company_name': task.company.name if task.company else 'بدون شرکت',
                'due_date': task.due_date,
                'period': task.period.value if task.period else 'یکبار',
                'description': task.description or ''
            }
            result.append(task_dict)
        return result
    except Exception as e:
        print(f"❌ خطا در get_due_soon_tasks: {e}")
        return []

def get_tasks_for_reminder(db: Session, user_id: int):
    try:
        now = datetime.now()
        tasks = db.query(models.Task).filter(
            models.Task.is_done == False,
            models.Task.due_date != None,
            models.Task.due_date >= now,
            models.Task.due_date <= now + timedelta(days=3),
            models.Task.is_template == False,
            models.Task.company.has(user_id=user_id)
        ).all()
        result = []
        for task in tasks:
            task_dict = {
                'id': task.id,
                'title': task.title,
                'company_id': task.company_id,
                'company_name': task.company.name if task.company else 'بدون شرکت',
                'due_date': task.due_date,
                'is_done': task.is_done,
                'period': task.period.value if task.period else 'یکبار',
                'description': task.description or ''
            }
            result.append(task_dict)
        return result
    except Exception as e:
        print(f"❌ خطا در get_tasks_for_reminder: {e}")
        return []

def get_notes_by_company(db: Session, company_id: int, user_id: int):
    try:
        notes = db.query(models.Note).filter(
            models.Note.company_id == company_id,
            models.Note.user_id == user_id
        ).order_by(models.Note.created_at.desc()).all()
        result = []
        for note in notes:
            note_dict = {
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'user_id': note.user_id,
                'company_id': note.company_id,
                'folder_id': note.folder_id,
                'created_at': note.created_at,
                'updated_at': note.updated_at,
                'files': []
            }
            if note.files:
                try:
                    note_dict['files'] = json.loads(note.files)
                except:
                    note_dict['files'] = []
            result.append(note_dict)
        return result
    except Exception as e:
        print(f"❌ خطا در get_notes_by_company: {e}")
        return []

def get_notes_by_user(db: Session, user_id: int):
    try:
        notes = db.query(models.Note).filter(
            models.Note.user_id == user_id
        ).order_by(models.Note.created_at.desc()).all()
        result = []
        for note in notes:
            note_dict = {
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'user_id': note.user_id,
                'company_id': note.company_id,
                'folder_id': note.folder_id,
                'created_at': note.created_at,
                'updated_at': note.updated_at,
                'files': []
            }
            if note.files:
                try:
                    note_dict['files'] = json.loads(note.files)
                except:
                    note_dict['files'] = []
            result.append(note_dict)
        return result
    except Exception as e:
        print(f"❌ خطا در get_notes_by_user: {e}")
        return []

def create_note(db: Session, note: schemas.NoteCreate, user_id: int):
    try:
        print(f"📝 ایجاد توضیح: {note.title} برای شرکت {note.company_id}")
        company = db.query(models.Company).filter(
            models.Company.id == note.company_id,
            models.Company.user_id == user_id
        ).first()
        if not company:
            raise ValueError("شرکت یافت نشد")
        if note.folder_id:
            folder = db.query(models.Folder).filter(
                models.Folder.id == note.folder_id,
                models.Folder.company_id == note.company_id,
                models.Folder.user_id == user_id
            ).first()
            if not folder:
                raise ValueError("پوشه یافت نشد")
        files_json = json.dumps(note.files or [])
        db_note = models.Note(
            title=note.title,
            content=note.content,
            files=files_json,
            user_id=user_id,
            company_id=note.company_id,
            folder_id=note.folder_id
        )
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
        print(f"✅ توضیح ایجاد شد: ID={db_note.id}")
        return db_note
    except Exception as e:
        print(f"❌ خطا در create_note: {e}")
        db.rollback()
        raise

def update_note(db: Session, note_id: int, note_update: schemas.NoteUpdate, user_id: int):
    db_note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == user_id
    ).first()
    if db_note:
        for key, value in note_update.model_dump(exclude_unset=True).items():
            if key == 'files':
                setattr(db_note, key, json.dumps(value))
            else:
                setattr(db_note, key, value)
        db_note.updated_at = datetime.now()
        db.commit()
        db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: int, user_id: int):
    note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.user_id == user_id
    ).first()
    if note:
        db.delete(note)
        db.commit()
    return note
