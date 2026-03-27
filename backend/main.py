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

# Enable CORS (so your frontend can communicate with this backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
# TASK ENDPOINTS
# ============================================
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
