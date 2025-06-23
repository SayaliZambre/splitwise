from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
import models
import schemas
from collections import defaultdict
import openai
import os
import json

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = models.Group(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add members to group
    for user_id in group.user_ids:
        membership = models.GroupMember(group_id=db_group.id, user_id=user_id)
        db.add(membership)
    
    db.commit()
    return db_group

def get_group(db: Session, group_id: int):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        return None
    
    # Calculate total expenses
    total_expenses = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.group_id == group_id
    ).scalar() or 0
    
    # Get members
    members = db.query(models.User).join(models.GroupMember).filter(
        models.GroupMember.group_id == group_id
    ).all()
    
    return schemas.GroupDetail(
        id=group.id,
        name=group.name,
        created_at=group.created_at,
        members=members,
        total_expenses=total_expenses
    )

def get_groups(db: Session):
    return db.query(models.Group).all()

def create_expense(db: Session, expense: schemas.ExpenseCreate, group_id: int):
    db_expense = models.Expense(
        description=expense.description,
        amount=expense.amount,
        paid_by=expense.paid_by,
        group_id=group_id,
        split_type=expense.split_type
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Create expense splits
    if expense.split_type == schemas.SplitType.EQUAL:
        # Equal split among all specified users
        split_amount = expense.amount / len(expense.splits)
        for split in expense.splits:
            db_split = models.ExpenseSplit(
                expense_id=db_expense.id,
                user_id=split.user_id,
                amount=split_amount
            )
            db.add(db_split)
    else:  # Percentage split
        for split in expense.splits:
            split_amount = expense.amount * (split.percentage / 100)
            db_split = models.ExpenseSplit(
                expense_id=db_expense.id,
                user_id=split.user_id,
                amount=split_amount,
                percentage=split.percentage
            )
            db.add(db_split)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

def get_group_balances(db: Session, group_id: int):
    # Get all expenses and splits for the group
    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    
    balances = defaultdict(lambda: defaultdict(float))
    
    for expense in expenses:
        payer_id = expense.paid_by
        for split in expense.splits:
            if split.user_id != payer_id:
                balances[split.user_id][payer_id] += split.amount
    
    # Simplify balances (net amounts)
    simplified_balances = []
    processed_pairs = set()
    
    for debtor_id, creditors in balances.items():
        for creditor_id, amount in creditors.items():
            pair = tuple(sorted([debtor_id, creditor_id]))
            if pair in processed_pairs:
                continue
            
            reverse_amount = balances[creditor_id][debtor_id]
            net_amount = amount - reverse_amount
            
            if net_amount > 0:
                debtor = get_user(db, debtor_id)
                creditor = get_user(db, creditor_id)
                simplified_balances.append({
                    "debtor": debtor.name,
                    "creditor": creditor.name,
                    "amount": round(net_amount, 2)
                })
            elif net_amount < 0:
                debtor = get_user(db, creditor_id)
                creditor = get_user(db, debtor_id)
                simplified_balances.append({
                    "debtor": debtor.name,
                    "creditor": creditor.name,
                    "amount": round(abs(net_amount), 2)
                })
            
            processed_pairs.add(pair)
    
    return simplified_balances

def get_user_balances(db: Session, user_id: int):
    # Get all groups the user is part of
    group_memberships = db.query(models.GroupMember).filter(
        models.GroupMember.user_id == user_id
    ).all()
    
    user_balances = []
    
    for membership in group_memberships:
        group_balances = get_group_balances(db, membership.group_id)
        group = db.query(models.Group).filter(models.Group.id == membership.group_id).first()
        user = get_user(db, user_id)
        
        # Filter balances involving this user
        relevant_balances = [
            balance for balance in group_balances 
            if balance["debtor"] == user.name or balance["creditor"] == user.name
        ]
        
        if relevant_balances:
            user_balances.append({
                "group_name": group.name,
                "group_id": group.id,
                "balances": relevant_balances
            })
    
    return user_balances

async def process_chat_query(db: Session, query: str, user_id: int = None):
    try:
        # Get context data
        context = get_chat_context(db, user_id)
        
        # Use OpenAI API (you'll need to set OPENAI_API_KEY environment variable)
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        system_prompt = f"""
        You are a helpful assistant for a Splitwise-like expense tracking app. 
        Answer user queries about expenses, balances, and groups based on the provided context.
        Keep responses concise and friendly.
        
        Context data: {json.dumps(context, indent=2)}
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            max_tokens=300
        )
        
        return {"response": response.choices[0].message.content}
    
    except Exception as e:
        return {"response": f"I'm sorry, I couldn't process your query. Error: {str(e)}"}

def get_chat_context(db: Session, user_id: int = None):
    context = {
        "groups": [],
        "recent_expenses": [],
        "user_balances": []
    }
    
    # Get all groups
    groups = get_groups(db)
    for group in groups:
        group_detail = get_group(db, group.id)
        context["groups"].append({
            "id": group.id,
            "name": group.name,
            "members": [member.name for member in group_detail.members],
            "total_expenses": group_detail.total_expenses
        })
    
    # Get recent expenses
    recent_expenses = db.query(models.Expense).order_by(
        models.Expense.created_at.desc()
    ).limit(10).all()
    
    for expense in recent_expenses:
        context["recent_expenses"].append({
            "description": expense.description,
            "amount": expense.amount,
            "payer": expense.payer.name,
            "group": expense.group.name,
            "date": expense.created_at.isoformat()
        })
    
    # Get user balances if user_id provided
    if user_id:
        user_balances = get_user_balances(db, user_id)
        context["user_balances"] = user_balances
    
    return context
