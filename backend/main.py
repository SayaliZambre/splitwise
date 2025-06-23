from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import models
import schemas
import crud
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Splitwise Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/groups", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    return crud.create_group(db=db, group=group)

@app.get("/groups/{group_id}", response_model=schemas.GroupDetail)
def get_group(group_id: int, db: Session = Depends(get_db)):
    db_group = crud.get_group(db, group_id=group_id)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group

@app.post("/groups/{group_id}/expenses", response_model=schemas.Expense)
def create_expense(
    group_id: int, 
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(get_db)
):
    return crud.create_expense(db=db, expense=expense, group_id=group_id)

@app.get("/groups/{group_id}/balances")
def get_group_balances(group_id: int, db: Session = Depends(get_db)):
    return crud.get_group_balances(db=db, group_id=group_id)

@app.get("/users/{user_id}/balances")
def get_user_balances(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_balances(db=db, user_id=user_id)

@app.get("/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return crud.get_users(db=db)

@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)

@app.get("/groups", response_model=List[schemas.Group])
def get_groups(db: Session = Depends(get_db)):
    return crud.get_groups(db=db)

@app.post("/chat")
async def chat_query(query: schemas.ChatQuery, db: Session = Depends(get_db)):
    return await crud.process_chat_query(db=db, query=query.query, user_id=query.user_id)
