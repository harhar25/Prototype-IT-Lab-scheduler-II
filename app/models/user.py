from app import db
from datetime import datetime
import uuid

class UserRole:
    ADMIN = 'admin'
    INSTRUCTOR = 'instructor' 
    STUDENT = 'student'

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role = db.Column(db.String(20), default=UserRole.STUDENT, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reservations = db.relationship('Reservation', backref='instructor', lazy='dynamic', foreign_keys='Reservation.instructor_id')
    managed_labs = db.relationship('Lab', backref='admin', lazy='dynamic', foreign_keys='Lab.admin_id')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'full_name': f"{self.first_name} {self.last_name}".strip()
        }
    
    def is_admin(self):
        return self.role == UserRole.ADMIN
    
    def is_instructor(self):
        return self.role == UserRole.INSTRUCTOR
    
    def is_student(self):
        return self.role == UserRole.STUDENT
    
    def __repr__(self):
        return f'<User {self.username} ({self.role})>'