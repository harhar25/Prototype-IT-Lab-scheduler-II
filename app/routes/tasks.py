from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, limiter
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.user import User
from datetime import datetime

# Create the blueprint
tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    """Get all tasks for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        status = request.args.get('status')
        priority = request.args.get('priority')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 10)), 50)  # Limit per_page to 50
        
        # Build query
        query = Task.query.filter_by(user_id=current_user_id)
        
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        
        # Execute query with pagination
        tasks = query.order_by(Task.created_at.desc()).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'tasks': [task.to_dict() for task in tasks.items],
            'pagination': {
                'page': tasks.page,
                'per_page': tasks.per_page,
                'total': tasks.total,
                'pages': tasks.pages
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch tasks'
        }), 500

@tasks_bp.route('/tasks', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_task():
    """Create a new task"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('title'):
            return jsonify({
                'success': False,
                'message': 'Task title is required'
            }), 400
        
        # Create task
        task = Task(
            user_id=current_user_id,
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', TaskPriority.MEDIUM),
            due_date=datetime.fromisoformat(data['due_date'].replace('Z', '+00:00')) if data.get('due_date') else None
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Task created successfully',
            'task': task.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create task'
        }), 500

@tasks_bp.route('/tasks/<task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get a specific task"""
    try:
        current_user_id = get_jwt_identity()
        
        task = Task.query.filter_by(id=task_id, user_id=current_user_id).first()
        
        if not task:
            return jsonify({
                'success': False,
                'message': 'Task not found'
            }), 404
        
        return jsonify({
            'success': True,
            'task': task.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch task'
        }), 500

@tasks_bp.route('/tasks/<task_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("20 per minute")
def update_task(task_id):
    """Update a task"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        task = Task.query.filter_by(id=task_id, user_id=current_user_id).first()
        
        if not task:
            return jsonify({
                'success': False,
                'message': 'Task not found'
            }), 404
        
        # Update fields
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'status' in data:
            task.status = data['status']
            if data['status'] == TaskStatus.COMPLETED and not task.completed_at:
                task.completed_at = datetime.utcnow()
            elif data['status'] != TaskStatus.COMPLETED:
                task.completed_at = None
        if 'priority' in data:
            task.priority = data['priority']
        if 'due_date' in data:
            task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00')) if data.get('due_date') else None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Task updated successfully',
            'task': task.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update task'
        }), 500

@tasks_bp.route('/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a task"""
    try:
        current_user_id = get_jwt_identity()
        
        task = Task.query.filter_by(id=task_id, user_id=current_user_id).first()
        
        if not task:
            return jsonify({
                'success': False,
                'message': 'Task not found'
            }), 404
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Task deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete task'
        }), 500

@tasks_bp.route('/tasks/stats', methods=['GET'])
@jwt_required()
def get_task_stats():
    """Get task statistics for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        total_tasks = Task.query.filter_by(user_id=current_user_id).count()
        completed_tasks = Task.query.filter_by(
            user_id=current_user_id, 
            status=TaskStatus.COMPLETED
        ).count()
        pending_tasks = Task.query.filter_by(
            user_id=current_user_id, 
            status=TaskStatus.PENDING
        ).count()
        in_progress_tasks = Task.query.filter_by(
            user_id=current_user_id, 
            status=TaskStatus.IN_PROGRESS
        ).count()
        
        # Count overdue tasks
        overdue_tasks = Task.query.filter(
            Task.user_id == current_user_id,
            Task.status != TaskStatus.COMPLETED,
            Task.due_date < datetime.utcnow()
        ).count()
        
        # Priority distribution
        priority_stats = {}
        for priority in [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT]:
            count = Task.query.filter_by(
                user_id=current_user_id,
                priority=priority
            ).count()
            priority_stats[priority] = count
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total_tasks,
                'completed': completed_tasks,
                'pending': pending_tasks,
                'in_progress': in_progress_tasks,
                'overdue': overdue_tasks,
                'priority_distribution': priority_stats
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch task statistics'
        }), 500