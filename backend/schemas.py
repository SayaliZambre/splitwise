from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SplitType(str, Enum):
    EQUAL = "equal"
    PERCENTAGE = "percentage"

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    user_ids: List[int]

class Group(GroupBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class GroupDetail(Group):
    members: List[User]
    total_expenses: float

class ExpenseSplitCreate(BaseModel):
    user_id: int
    percentage: Optional[float] = None

class ExpenseBase(BaseModel):
    description: str
    amount: float
    paid_by: int
    split_type: SplitType
    splits: List[ExpenseSplitCreate]

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseSplit(BaseModel):
    id: int
    user_id: int
    amount: float
    percentage: Optional[float]
    user: User
    
    class Config:
        from_attributes = True

class Expense(ExpenseBase):
    id: int
    group_id: int
    created_at: datetime
    payer: User
    splits: List[ExpenseSplit]
    
    class Config:
        from_attributes = True

class ChatQuery(BaseModel):
    query: str
    user_id: Optional[int] = None
