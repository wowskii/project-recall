from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel

# 1. USER
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    total_xp: int = Field(default=0)
    level: int = Field(default=1)
    
    # Links to roles
    roles: List["Role"] = Relationship(back_populates="user")

# 2. ROLE
class Role(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str  # e.g., "Tank"
    color_hex: str = "#f99e1a"
    icon_name: str = "shield"
    role_status: str = Field(default="active") # active, inactive
    
    user_id: int = Field(foreign_key="user.id")
    user: User = Relationship(back_populates="roles")
    
    # Links to projects
    projects: List["Project"] = Relationship(back_populates="role")

# 3. MISSION
class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    is_active: bool = Field(default=True)

    role_id: int = Field(foreign_key="role.id")
    role: Role = Relationship(back_populates="projects")

    parent_project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    parent_project: Optional["Project"] = Relationship(
        back_populates="subprojects",
        sa_relationship_kwargs={"remote_side": "Project.id"},
    )
    subprojects: List["Project"] = Relationship(back_populates="parent_project")

    # Links to tasks
    tasks: List["Task"] = Relationship(back_populates="project")

# 4. THE MATCH
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    status: str = Field(default="todo") # todo, in_progress, done
    xp_value: int = Field(default=100)
    
    project_id: int = Field(foreign_key="project.id")
    project: Project = Relationship(back_populates="tasks")
    
    # Links to sessions (for stats!)
    sessions: List["WorkSession"] = Relationship(back_populates="task")

# 5. THE TELEMETRY (WorkSession / Pomodoro logs)
class WorkSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_seconds: int = Field(default=0)
    
    task_id: int = Field(foreign_key="task.id")
    task: Task = Relationship(back_populates="sessions")