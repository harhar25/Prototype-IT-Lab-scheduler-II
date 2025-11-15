from app import db
from datetime import datetime
import uuid

class Lab(db.Model):
    __tablename__ = 'labs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False, unique=True)
    location = db.Column(db.String(200))
    capacity = db.Column(db.Integer, default=30)
    equipment = db.Column(db.Text)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    admin_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    reservations = db.relationship('Reservation', backref='lab', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'capacity': self.capacity,
            'equipment': self.equipment,
            'description': self.description,
            'is_active': self.is_active,
            'admin_id': self.admin_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Lab {self.name}>'

class ReservationStatus:
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'

class Reservation(db.Model):
    __tablename__ = 'reservations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    instructor_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    lab_id = db.Column(db.String(36), db.ForeignKey('labs.id'), nullable=False)
    
    # Course information
    course_code = db.Column(db.String(20), nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    section = db.Column(db.String(10), nullable=False)
    student_count = db.Column(db.Integer, default=0)
    
    # Timing
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    
    # Status and notes
    status = db.Column(db.String(20), default=ReservationStatus.PENDING, nullable=False)
    purpose = db.Column(db.Text)
    admin_notes = db.Column(db.Text)
    rejection_reason = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'instructor_id': self.instructor_id,
            'lab_id': self.lab_id,
            'course_code': self.course_code,
            'course_name': self.course_name,
            'section': self.section,
            'student_count': self.student_count,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'purpose': self.purpose,
            'admin_notes': self.admin_notes,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'instructor_name': self.instructor.full_name if self.instructor else 'Unknown',
            'lab_name': self.lab.name if self.lab else 'Unknown'
        }
    
    def __repr__(self):
        return f'<Reservation {self.course_code} {self.section}>'