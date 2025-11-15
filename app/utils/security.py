import bcrypt
import jwt
from datetime import datetime, timedelta
from flask import current_app

def hash_password(password):
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, hashed_password):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_jwt_token(user_id, token_type='access'):
    """Generate JWT token"""
    if token_type == 'access':
        expires_delta = current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    else:
        expires_delta = current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
    
    expires = datetime.utcnow() + expires_delta
    
    payload = {
        'user_id': user_id,
        'type': token_type,
        'exp': expires,
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(
        payload, 
        current_app.config['JWT_SECRET_KEY'], 
        algorithm='HS256'
    )

def verify_jwt_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(
            token, 
            current_app.config['JWT_SECRET_KEY'], 
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')