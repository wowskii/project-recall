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


@app.get("/roles/{role_id}")
def get_role(role_id: int):
    """Get a specific role by ID"""
    with Session(engine) as session:
        role = session.get(Role, role_id)
        if not role:
            return {"error": "Role not found"}
        return {"role": role}


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


@app.get("/roles/{role_id}/projects")
def get_projects_by_role(role_id: int):
    """Retrieve all projects for a specific role"""
    with Session(engine) as session:
        projects = session.exec(select(Project).where(Project.role_id == role_id)).all()
        return {"projects": projects}


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

# PROJECT ENDPOINTS

@app.get("/projects")
def get_all_projects():
    """Retrieve all projects"""
    with Session(engine) as session:
        projects = session.exec(select(Project)).all()
        return {"projects": projects}


@app.post("/projects")
def create_project(title: str = Form(...), description: str = Form(None), role_id: int = Form(...)):
    """Create a new project"""
    with Session(engine) as session:
        project = Project(title=title, description=description, role_id=role_id)
        session.add(project)
        session.commit()
        session.refresh(project)
        return {"project": project}
    
@app.get("/projects/{project_id}")
def get_project(project_id: int):
    """Get a specific project by ID"""
    with Session(engine) as session:
        project = session.get(Project, project_id)
        if not project:
            return {"error": "Project not found"}
        return {"project": project}
    
@app.patch("/projects/{project_id}")
def update_project_status(project_id: int, project_status: str = Body(...)):
    """Update project status (active or inactive)"""
    with Session(engine) as session:
        project = session.get(Project, project_id)
        if not project:
            return {"error": "Project not found"}
        project.project_status = project_status
        session.commit()
        session.refresh(project)
        return {"project": project}

@app.delete("/projects/{project_id}")
def delete_project(project_id: int):
    """Delete a project by ID"""
    with Session(engine) as session:
        project = session.get(Project, project_id)
        if not project:
            return {"error": "Project not found"}
        session.delete(project)
        session.commit()
        return {"message": "Project deleted"}

# ============================================