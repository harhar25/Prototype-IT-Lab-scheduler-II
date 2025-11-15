import bcrypt
import jwt
from datetime import datetime, timedelta
from flask import current_app

def hash_password(password):
    """Hash a password using bcrypt"""
    try:
        if isinstance(password, str):
            password = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password, salt)
        return hashed.decode('utf-8')
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise e

def verify_password(password, hashed_password):
    """Verify a password against its hash"""
    try:
        if isinstance(password, str):
            password = password.encode('utf-8')
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def generate_jwt_token(user_id, token_type='access'):
    """Generate JWT token"""
    try:
        if token_type == 'access':
            expires_delta = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=1))
        else:
            expires_delta = current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', timedelta(days=30))
        
        expires = datetime.utcnow() + expires_delta
        
        payload = {
            'user_id': user_id,
            'type': token_type,
            'exp': expires,
            'iat': datetime.utcnow()
        }
        
        secret_key = current_app.config.get('JWT_SECRET_KEY', 'fallback-secret-key')
        
        return jwt.encode(
            payload, 
            secret_key, 
            algorithm='HS256'
        )
    except Exception as e:
        print(f"JWT generation error: {e}")
        raise e

def verify_jwt_token(token):
    """Verify JWT token"""
    try:
        secret_key = current_app.config.get('JWT_SECRET_KEY', 'fallback-secret-key')
        payload = jwt.decode(
            token, 
            secret_key, 
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError as e:
        raise Exception(f'Invalid token: {str(e)}')
    except Exception as e:
        raise Exception(f'Token verification failed: {str(e)}')