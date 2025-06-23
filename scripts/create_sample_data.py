import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def create_sample_data():
    """Create sample users, groups, and expenses for testing"""
    
    # Sample users
    users = [
        {"name": "Alice Johnson", "email": "alice@example.com"},
        {"name": "Bob Smith", "email": "bob@example.com"},
        {"name": "Charlie Brown", "email": "charlie@example.com"},
        {"name": "Diana Prince", "email": "diana@example.com"},
    ]
    
    # Create users
    user_ids = []
    for user in users:
        response = requests.post(f"{BASE_URL}/users", json=user)
        if response.status_code == 200:
            user_data = response.json()
            user_ids.append(user_data["id"])
            print(f"Created user: {user['name']} (ID: {user_data['id']})")
    
    # Sample groups
    groups = [
        {"name": "Weekend Trip", "user_ids": user_ids[:3]},
        {"name": "Roommates", "user_ids": user_ids},
        {"name": "Office Lunch", "user_ids": user_ids[1:4]},
    ]
    
    # Create groups
    group_ids = []
    for group in groups:
        response = requests.post(f"{BASE_URL}/groups", json=group)
        if response.status_code == 200:
            group_data = response.json()
            group_ids.append(group_data["id"])
            print(f"Created group: {group['name']} (ID: {group_data['id']})")
    
    # Sample expenses
    expenses = [
        {
            "group_id": group_ids[0],
            "description": "Hotel booking",
            "amount": 300.00,
            "paid_by": user_ids[0],
            "split_type": "equal",
            "splits": [{"user_id": uid} for uid in user_ids[:3]]
        },
        {
            "group_id": group_ids[0],
            "description": "Dinner at restaurant",
            "amount": 120.00,
            "paid_by": user_ids[1],
            "split_type": "percentage",
            "splits": [
                {"user_id": user_ids[0], "percentage": 40},
                {"user_id": user_ids[1], "percentage": 35},
                {"user_id": user_ids[2], "percentage": 25}
            ]
        },
        {
            "group_id": group_ids[1],
            "description": "Grocery shopping",
            "amount": 85.50,
            "paid_by": user_ids[2],
            "split_type": "equal",
            "splits": [{"user_id": uid} for uid in user_ids]
        },
        {
            "group_id": group_ids[2],
            "description": "Pizza lunch",
            "amount": 45.00,
            "paid_by": user_ids[3],
            "split_type": "equal",
            "splits": [{"user_id": uid} for uid in user_ids[1:4]]
        }
    ]
    
    # Create expenses
    for expense in expenses:
        group_id = expense.pop("group_id")
        response = requests.post(f"{BASE_URL}/groups/{group_id}/expenses", json=expense)
        if response.status_code == 200:
            expense_data = response.json()
            print(f"Created expense: {expense['description']} (ID: {expense_data['id']})")
    
    print("\nSample data created successfully!")
    print("You can now test the application with the created users, groups, and expenses.")

if __name__ == "__main__":
    create_sample_data()
