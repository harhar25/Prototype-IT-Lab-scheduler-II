from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User

# Create the blueprint
api_bp = Blueprint('api', __name__)

@api_bp.route('/')
def index():
    """API Home"""
    return jsonify({
        'success': True,
        'message': 'Enterprise Task Manager API',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'register': 'POST /auth/register',
                'login': 'POST /auth/login',
                'refresh': 'POST /auth/refresh',
                'logout': 'POST /auth/logout'
            },
            'tasks': {
                'list': 'GET /api/tasks',
                'create': 'POST /api/tasks',
                'get': 'GET /api/tasks/<id>',
                'update': 'PUT /api/tasks/<id>',
                'delete': 'DELETE /api/tasks/<id>',
                'stats': 'GET /api/tasks/stats'
            },
            'api': {
                'profile': 'GET /profile',
                'health': 'GET /health'
            }
        }
    })

@api_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch profile'
        }), 500

@api_bp.route('/health')
def health_check():
    """Health check endpoint"""
    from datetime import datetime
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'service': 'Enterprise Task Manager API'
    })