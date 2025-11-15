from flask import Blueprint, jsonify, render_template
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User

api_bp = Blueprint('api', __name__)

@api_bp.route('/')
def index():
    """Serve the main application"""
    return render_template('index.html')

@api_bp.route('/api')
def api_index():
    """API Home"""
    return jsonify({
        'success': True,
        'message': 'IT Lab Scheduler API',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'register': 'POST /auth/register',
                'login': 'POST /auth/login',
                'refresh': 'POST /auth/refresh',
                'logout': 'POST /auth/logout'
            },
            'labs': {
                'list': 'GET /api/labs',
                'create': 'POST /api/labs',
                'reservations': 'GET /api/reservations',
                'create_reservation': 'POST /api/reservations',
                'schedule': 'GET /api/schedule',
                'stats': 'GET /api/stats'
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
        'service': 'IT Lab Scheduler API'
    })