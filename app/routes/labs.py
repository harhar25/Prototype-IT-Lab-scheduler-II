from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.lab import Lab, Reservation, ReservationStatus
from app.models.user import User, UserRole
from datetime import datetime, timedelta

labs_bp = Blueprint('labs', __name__)

@labs_bp.route('/labs', methods=['GET'])
@jwt_required()
def get_labs():
    """Get all labs"""
    try:
        labs = Lab.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'labs': [lab.to_dict() for lab in labs]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch labs'
        }), 500

@labs_bp.route('/labs', methods=['POST'])
@jwt_required()
def create_lab():
    """Create a new lab (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.is_admin():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'Lab name is required'
            }), 400
        
        lab = Lab(
            name=data['name'],
            location=data.get('location', ''),
            capacity=data.get('capacity', 30),
            equipment=data.get('equipment', ''),
            description=data.get('description', ''),
            admin_id=current_user_id
        )
        
        db.session.add(lab)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Lab created successfully',
            'lab': lab.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create lab'
        }), 500

@labs_bp.route('/reservations', methods=['GET'])
@jwt_required()
def get_reservations():
    """Get reservations based on user role"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Build query based on user role
        if user.is_admin():
            reservations = Reservation.query.all()
        elif user.is_instructor():
            reservations = Reservation.query.filter_by(instructor_id=current_user_id).all()
        else:  # Student
            # Students can see all approved reservations
            reservations = Reservation.query.filter_by(status=ReservationStatus.APPROVED).all()
        
        return jsonify({
            'success': True,
            'reservations': [reservation.to_dict() for reservation in reservations]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch reservations'
        }), 500

@labs_bp.route('/reservations', methods=['POST'])
@jwt_required()
def create_reservation():
    """Create a reservation request (Instructors only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.is_instructor():
            return jsonify({
                'success': False,
                'message': 'Instructor access required'
            }), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['lab_id', 'course_code', 'course_name', 'section', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400
        
        # Calculate duration
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        # Check for conflicts
        conflicting_reservation = Reservation.query.filter(
            Reservation.lab_id == data['lab_id'],
            Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.APPROVED]),
            Reservation.start_time < end_time,
            Reservation.end_time > start_time
        ).first()
        
        if conflicting_reservation:
            return jsonify({
                'success': False,
                'message': 'Time slot conflict with existing reservation'
            }), 400
        
        reservation = Reservation(
            instructor_id=current_user_id,
            lab_id=data['lab_id'],
            course_code=data['course_code'],
            course_name=data['course_name'],
            section=data['section'],
            student_count=data.get('student_count', 0),
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            purpose=data.get('purpose', '')
        )
        
        db.session.add(reservation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Reservation request submitted successfully',
            'reservation': reservation.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create reservation'
        }), 500

@labs_bp.route('/reservations/<reservation_id>/approve', methods=['POST'])
@jwt_required()
def approve_reservation(reservation_id):
    """Approve a reservation (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.is_admin():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        reservation = Reservation.query.get(reservation_id)
        if not reservation:
            return jsonify({
                'success': False,
                'message': 'Reservation not found'
            }), 404
        
        reservation.status = ReservationStatus.APPROVED
        reservation.admin_notes = request.get_json().get('admin_notes', '')
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Reservation approved successfully',
            'reservation': reservation.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to approve reservation'
        }), 500

@labs_bp.route('/reservations/<reservation_id>/reject', methods=['POST'])
@jwt_required()
def reject_reservation(reservation_id):
    """Reject a reservation (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user.is_admin():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        reservation = Reservation.query.get(reservation_id)
        if not reservation:
            return jsonify({
                'success': False,
                'message': 'Reservation not found'
            }), 404
        
        data = request.get_json()
        reservation.status = ReservationStatus.REJECTED
        reservation.rejection_reason = data.get('rejection_reason', '')
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Reservation rejected successfully',
            'reservation': reservation.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to reject reservation'
        }), 500

@labs_bp.route('/schedule', methods=['GET'])
def get_schedule():
    """Get schedule for calendar view"""
    try:
        lab_id = request.args.get('lab_id')
        date_str = request.args.get('date')
        
        query = Reservation.query.filter_by(status=ReservationStatus.APPROVED)
        
        if lab_id:
            query = query.filter_by(lab_id=lab_id)
        
        if date_str:
            target_date = datetime.fromisoformat(date_str)
            start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)
            query = query.filter(Reservation.start_time >= start_of_day, Reservation.start_time < end_of_day)
        
        reservations = query.all()
        
        return jsonify({
            'success': True,
            'schedule': [reservation.to_dict() for reservation in reservations]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch schedule'
        }), 500

@labs_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get dashboard statistics"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        stats = {}
        
        if user.is_admin():
            stats = {
                'total_labs': Lab.query.filter_by(is_active=True).count(),
                'total_reservations': Reservation.query.count(),
                'pending_requests': Reservation.query.filter_by(status=ReservationStatus.PENDING).count(),
                'approved_reservations': Reservation.query.filter_by(status=ReservationStatus.APPROVED).count()
            }
        elif user.is_instructor():
            stats = {
                'my_reservations': Reservation.query.filter_by(instructor_id=current_user_id).count(),
                'upcoming_sessions': Reservation.query.filter(
                    Reservation.instructor_id == current_user_id,
                    Reservation.status == ReservationStatus.APPROVED,
                    Reservation.start_time >= datetime.utcnow()
                ).count(),
                'pending_requests': Reservation.query.filter_by(
                    instructor_id=current_user_id,
                    status=ReservationStatus.PENDING
                ).count()
            }
        else:  # Student
            stats = {
                'available_labs': Lab.query.filter_by(is_active=True).count(),
                'scheduled_sessions': Reservation.query.filter_by(status=ReservationStatus.APPROVED).count()
            }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch statistics'
        }), 500