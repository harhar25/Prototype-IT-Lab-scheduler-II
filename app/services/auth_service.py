from app import db, jwt
from app.models.user import User
from app.utils.security import hash_password, verify_password
from flask import jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
import re

class AuthService:
    @staticmethod
    def validate_email(email):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password):
        if len(password) < 8:
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
        # Validate input
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return None, "All fields are required"
        
        if not AuthService.validate_email(data['email']):
            return None, "Invalid email format"
        
        is_valid, message = AuthService.validate_password(data['password'])
        if not is_valid:
            return None, message
        
        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return None, "Username already exists"
        
        if User.query.filter_by(email=data['email']).first():
            return None, "Email already exists"
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=hash_password(data['password']),
            first_name=data.get('first_name'),
            last_name=data.get('last_name')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return user, "User registered successfully"
    
    @staticmethod
    def login_user(data):
        if not data.get('login') or not data.get('password'):
            return None, "Login and password are required"
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == data['login']) | (User.email == data['login'])
        ).first()
        
        if not user or not verify_password(data['password'], user.password_hash):
            return None, "Invalid credentials"
        
        if not user.is_active:
            return None, "Account is deactivated"
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }, "Login successful"