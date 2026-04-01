from fastapi import Body, FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, create_engine, SQLModel, select
from models import User, Role, Project, Task, WorkSession
from database import engine, create_db_and_tables

#Create database tables
create_db_and_tables()

# Create all tables
SQLModel.metadata.create_all(engine)

# Initialize FastAPI app
app = FastAPI(title="Project Recall API")

# ============================================
# STARTUP: Create default user if needed
# ============================================
@app.on_event("startup")
def startup_event():
    """Create a default user on startup if none exists"""
    with Session(engine) as session:
        existing_users = session.exec(select(User)).all()
        if not existing_users:
            default_user = User(username="default_user")
            session.add(default_user)
            session.commit()

# Enable CORS (so your frontend can communicate with this backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to get the default user
def get_default_user():
    """Get the default user (assumes one exists from startup)"""
    with Session(engine) as session:
        user = session.exec(select(User)).first()
        return user.id if user else None

# ============================================
# HEALTH CHECK - Test if the API is running
# ============================================
@app.get("/")
def read_root():
    """Welcome endpoint"""
    return {"message": "Welcome to Project Recall API!"}


# ============================================
# USER ENDPOINTS
# ============================================
@app.get("/users")
def get_all_users():
    """Retrieve all users"""
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return {"users": users}


@app.post("/users")
def create_user(username: str):
    """Create a new user"""
    with Session(engine) as session:
        user = User(username=username)
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"user": user}


@app.get("/users/{user_id}")
def get_user(user_id: int):
    """Get a specific user by ID"""
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            return {"error": "User not found"}
        return {"user": user}


# ============================================
# ROLE ENDPOINTS
# ============================================
@app.get("/roles")
def get_all_roles():
    """Retrieve all roles (active and inactive) for the default user"""
    with Session(engine) as session:
        user_id = get_default_user()
        roles = session.exec(select(Role).where(Role.user_id == user_id)).all()
        return {"roles": roles}


@app.post("/roles")
def create_role(name: str = Form(...), color_hex: str = Form("#f99e1a"), icon_name: str = Form("shield")):
    """Create a new role"""
    with Session(engine) as session:
        user_id = get_default_user()
        if not user_id:
            return {"error": "No user found"}
        
        role = Role(name=name, color_hex=color_hex, icon_name=icon_name, user_id=user_id, role_status="active")
        session.add(role)
        session.commit()
        session.refresh(role)
        return {"role": role}


@app.patch("/roles/{role_id}")
def update_role(role_id: int, role_status: str = Body(...)):
    """Update role status (active or inactive)"""
    with Session(engine) as session:
        role = session.get(Role, role_id)
        if not role:
            return {"error": "Role not found"}
        role.role_status = role_status
        session.commit()
        session.refresh(role)
        return {"role": role}


@app.delete("/roles/{role_id}")
def delete_role(role_id: int):
    """Delete a role by ID"""
    with Session(engine) as session:
        role = session.get(Role, role_id)
        if not role:
            return {"error": "Role not found"}
        session.delete(role)
        session.commit()
        return {"message": "Role deleted"}
@app.get("/tasks")
def get_all_tasks():
    """Retrieve all tasks"""
    with Session(engine) as session:
        tasks = session.exec(select(Task)).all()
        return {"tasks": tasks}


@app.post("/tasks")
def create_task(title: str = Form(...), project_id: int = Form(...), xp_value: int = Form(100)):
    """Create a new task"""
    with Session(engine) as session:
        task = Task(title=title, project_id=project_id, xp_value=xp_value)
        session.add(task)
        session.commit()
        session.refresh(task)
        return {"task": task}


@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    """Get a specific task by ID"""
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return {"error": "Task not found"}
        return {"task": task}


@app.patch("/tasks/{task_id}")
def update_task_status(task_id: int, status: str = Body(...)):
    """Update task status (todo, in_progress, done)"""
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return {"error": "Task not found"}
        task.status = status
        session.commit()
        session.refresh(task)
        return {"task": task}


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    """Delete a task by ID"""
    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            return {"error": "Task not found"}
        session.delete(task)
        session.commit()
        return {"message": "Task deleted"}
