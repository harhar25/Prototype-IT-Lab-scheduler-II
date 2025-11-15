from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app import limiter

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        user, message = AuthService.register_user(data)
        
        if not user:
            return jsonify({
                'success': False,
                'message': message
            }), 400
        
        return jsonify({
            'success': True,
            'message': message,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        result, message = AuthService.login_user(data)
        
        if not result:
            return jsonify({
                'success': False,
                'message': message
            }), 401
        
        return jsonify({
            'success': True,
            'message': message,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Login failed'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("10 per minute")
def refresh():
    try:
        data = request.get_json()
        
        if not data or not data.get('refresh_token'):
            return jsonify({
                'success': False,
                'message': 'Refresh token is required'
            }), 400
        
        result, message = AuthService.refresh_token(data['refresh_token'])
        
        if not result:
            return jsonify({
                'success': False,
                'message': message
            }), 401
        
        return jsonify({
            'success': True,
            'message': message,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Token refresh failed'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # With JWT, logout is handled on the client side by removing tokens
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    }), 200