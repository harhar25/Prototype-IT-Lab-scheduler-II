#!/usr/bin/env python3
"""
Enterprise Task Manager - Main Application Entry Point
"""

import os
from app import create_app, db
from flask_migrate import Migrate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = create_app()
migrate = Migrate(app, db)

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'app': app
    }

@app.cli.command("create-admin")
def create_admin():
    """Create an admin user"""
    from app.models.user import User
    from app.utils.security import hash_password
    import getpass
    
    username = input("Enter admin username: ")
    email = input("Enter admin email: ")
    password = getpass.getpass("Enter admin password: ")
    
    # Check if user already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        print(f"User '{username}' already exists!")
        return
    
    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        print(f"Email '{email}' already exists!")
        return
    
    admin_user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        first_name="Admin",
        last_name="User",
        is_admin=True
    )
    
    try:
        db.session.add(admin_user)
        db.session.commit()
        print(f"Admin user '{username}' created successfully!")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating admin user: {e}")

@app.cli.command("seed-data")
def seed_data():
    """Seed the database with sample data"""
    from app.models.user import User
    from app.models.task import Task, TaskStatus, TaskPriority
    from app.utils.security import hash_password
    from datetime import datetime, timedelta
    
    try:
        # Create sample user if it doesn't exist
        user = User.query.filter_by(username="demo_user").first()
        if not user:
            user = User(
                username="demo_user",
                email="demo@example.com",
                password_hash=hash_password("demopassword123"),
                first_name="Demo",
                last_name="User"
            )
            db.session.add(user)
            db.session.flush()  # Get user ID without committing
        
        # Clear existing tasks for this user
        Task.query.filter_by(user_id=user.id).delete()
        
        # Create sample tasks
        sample_tasks = [
            {
                'title': 'Complete project documentation',
                'description': 'Write comprehensive documentation for the new feature',
                'status': TaskStatus.IN_PROGRESS,
                'priority': TaskPriority.HIGH,
                'due_date': datetime.utcnow() + timedelta(days=2)
            },
            {
                'title': 'Team meeting preparation',
                'description': 'Prepare agenda and materials for weekly team meeting',
                'status': TaskStatus.PENDING,
                'priority': TaskPriority.MEDIUM,
                'due_date': datetime.utcnow() + timedelta(days=1)
            },
            {
                'title': 'Code review',
                'description': 'Review pull requests from the development team',
                'status': TaskStatus.COMPLETED,
                'priority': TaskPriority.HIGH,
                'due_date': datetime.utcnow() - timedelta(days=1),
                'completed_at': datetime.utcnow() - timedelta(hours=5)
            },
            {
                'title': 'Update dependencies',
                'description': 'Update project dependencies to latest versions',
                'status': TaskStatus.PENDING,
                'priority': TaskPriority.LOW,
                'due_date': datetime.utcnow() + timedelta(days=7)
            },
            {
                'title': 'Client presentation',
                'description': 'Prepare and practice client presentation for new project',
                'status': TaskStatus.IN_PROGRESS,
                'priority': TaskPriority.URGENT,
                'due_date': datetime.utcnow() + timedelta(hours=6)
            }
        ]
        
        for task_data in sample_tasks:
            task = Task(user_id=user.id, **task_data)
            db.session.add(task)
        
        db.session.commit()
        print("Sample data seeded successfully!")
        
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding data: {e}")

@app.cli.command("check-config")
def check_config():
    """Display current configuration"""
    print("Current Configuration:")
    print(f"DEBUG: {app.config['DEBUG']}")
    print(f"TESTING: {app.config['TESTING']}")
    print(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"Secret Key Set: {'Yes' if app.config['SECRET_KEY'] else 'No'}")
    print(f"JWT Secret Key Set: {'Yes' if app.config['JWT_SECRET_KEY'] else 'No'}")

if __name__ == '__main__':
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Run the application
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )