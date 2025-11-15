from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import json
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')
app.secret_key = 'your-secret-key-here'  # Change in production
CORS(app)

# Ensure directories exist
def ensure_directories():
    directories = ['templates', 'static/css', 'static/js']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

ensure_directories()

# In-memory storage (replace with database in production)
users_db = {}
tasks_db = {}

class APIError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code

@app.errorhandler(APIError)
def handle_api_error(error):
    response = jsonify({
        'error': error.message,
        'success': False
    })
    response.status_code = error.status_code
    return response

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found', 'success': False}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Server error: {error}")
    return jsonify({'error': 'Internal server error', 'success': False}), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            raise APIError('Username and password required')
        
        username = data['username'].strip()
        password = data['password']
        
        if len(username) < 3:
            raise APIError('Username must be at least 3 characters')
        if len(password) < 6:
            raise APIError('Password must be at least 6 characters')
        if username in users_db:
            raise APIError('Username already exists')
        
        users_db[username] = {
            'password': password,  # In production, hash the password
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"New user registered: {username}")
        return jsonify({
            'success': True,
            'message': 'User registered successfully'
        })
        
    except APIError as e:
        raise e
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise APIError('Registration failed')

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            raise APIError('Username and password required')
        
        username = data['username']
        password = data['password']
        
        if username not in users_db or users_db[username]['password'] != password:
            raise APIError('Invalid credentials', 401)
        
        session['user'] = username
        logger.info(f"User logged in: {username}")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': username
        })
        
    except APIError as e:
        raise e
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise APIError('Login failed')

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    try:
        if 'user' not in session:
            raise APIError('Authentication required', 401)
        
        user = session['user']
        
        if user not in tasks_db:
            tasks_db[user] = []
        
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'tasks': tasks_db[user]
            })
        
        elif request.method == 'POST':
            data = request.get_json()
            
            if not data or 'title' not in data:
                raise APIError('Task title required')
            
            task = {
                'id': len(tasks_db[user]) + 1,
                'title': data['title'],
                'description': data.get('description', ''),
                'completed': False,
                'created_at': datetime.now().isoformat()
            }
            
            tasks_db[user].append(task)
            logger.info(f"Task created for user {user}: {task['title']}")
            
            return jsonify({
                'success': True,
                'message': 'Task created successfully',
                'task': task
            })
            
    except APIError as e:
        raise e
    except Exception as e:
        logger.error(f"Tasks error: {e}")
        raise APIError('Tasks operation failed')

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
def task_operations(task_id):
    try:
        if 'user' not in session:
            raise APIError('Authentication required', 401)
        
        user = session['user']
        
        if user not in tasks_db:
            tasks_db[user] = []
        
        task_index = next((i for i, t in enumerate(tasks_db[user]) if t['id'] == task_id), None)
        
        if task_index is None:
            raise APIError('Task not found', 404)
        
        if request.method == 'PUT':
            data = request.get_json()
            task = tasks_db[user][task_index]
            
            if 'title' in data:
                task['title'] = data['title']
            if 'description' in data:
                task['description'] = data['description']
            if 'completed' in data:
                task['completed'] = data['completed']
            
            tasks_db[user][task_index] = task
            logger.info(f"Task updated for user {user}: {task['title']}")
            
            return jsonify({
                'success': True,
                'message': 'Task updated successfully',
                'task': task
            })
        
        elif request.method == 'DELETE':
            task = tasks_db[user].pop(task_index)
            logger.info(f"Task deleted for user {user}: {task['title']}")
            
            return jsonify({
                'success': True,
                'message': 'Task deleted successfully'
            })
            
    except APIError as e:
        raise e
    except Exception as e:
        logger.error(f"Task operation error: {e}")
        raise APIError('Task operation failed')

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)