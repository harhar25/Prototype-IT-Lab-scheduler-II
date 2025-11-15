from app import db
from app.models.user import User, UserRole
from app.utils.security import hash_password, verify_password
from flask import current_app
import re

class AuthService:
    @staticmethod
    def validate_email(email):
        if not email:
            return False
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password):
        if not password or len(password) < 8:
            return False, "Password must be at least 8 characters long"
        if not any(char.isdigit() for char in password):
            return False, "Password must contain at least one digit"
        if not any(char.isupper() for char in password):
            return False, "Password must contain at least one uppercase letter"
        if not any(char.islower() for char in password):
            return False, "Password must contain at least one lowercase letter"
        return True, "Password is valid"
    
    @staticmethod
    def register_user(data):
        try:
            # Validate input
            if not data:
                return None, "No data provided"
                
            if not data.get('username') or not data.get('email') or not data.get('password'):
                return None, "Username, email, and password are required"
            
            username = data['username'].strip()
            email = data['email'].strip().lower()
            password = data['password']
            
            if not AuthService.validate_email(email):
                return None, "Invalid email format"
            
            is_valid, message = AuthService.validate_password(password)
            if not is_valid:
                return None, message
            
            # Validate role
            valid_roles = [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT]
            role = data.get('role', UserRole.STUDENT)
            if role not in valid_roles:
                return None, "Invalid user role"
            
            # Check if user exists
            if User.query.filter_by(username=username).first():
                return None, "Username already exists"
            
            if User.query.filter_by(email=email).first():
                return None, "Email already exists"
            
            # Create user
            user = User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                role=role
            )
            
            db.session.add(user)
            db.session.commit()
            
            return user, "User registered successfully"
            
        except Exception as e:
            db.session.rollback()
            print(f"Registration error: {str(e)}")  # Debug logging
            return None, f"Registration failed: {str(e)}"
    
    @staticmethod
    def login_user(data):
        try:
            if not data or not data.get('login') or not data.get('password'):
                return None, "Login and password are required"
            
            login = data['login'].strip()
            password = data['password']
            
            # Find user by username or email
            user = User.query.filter(
                (User.username == login) | (User.email == login)
            ).first()
            
            if not user or not verify_password(password, user.password_hash):
                return None, "Invalid credentials"
            
            if not user.is_active:
                return None, "Account is deactivated"
            
            # Import here to avoid circular imports
            from app.utils.security import generate_jwt_token
            
            # Create tokens
            access_token = generate_jwt_token(user.id, 'access')
            refresh_token = generate_jwt_token(user.id, 'refresh')
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict()
            }, "Login successful"
            
        except Exception as e:
            print(f"Login error: {str(e)}")  # Debug logging
            return None, f"Login failed: {str(e)}"