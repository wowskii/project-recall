from sqlmodel import create_engine, SQLModel

# Replace with your actual DB credentials later
sqlite_url = "sqlite:///database.db" # temporary for development; switch to PostgreSQL in production
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)