from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import timedelta

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)

def create_app():
    app = Flask(__name__, 
                template_folder='../templates',
                static_folder='../static')
    
    # Load configuration
    app.config.from_object('app.config.Config')
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    CORS(app, supports_credentials=True)
    
    # JWT configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models import user, lab
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.labs import labs_bp
    from app.routes.api import api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(labs_bp, url_prefix='/api')
    app.register_blueprint(api_bp)
    
    # FORCE CREATE ALL TABLES ON STARTUP
    with app.app_context():
        try:
            print("🔄 Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Verify the users table has the role column
            from app.models.user import User
            # This will trigger an error if the column doesn't exist
            test_query = db.session.query(User.role).limit(1)
            print("✅ 'role' column verified in users table!")
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            # If there's still an issue, create tables manually
            import sqlite3
            conn = sqlite3.connect('enterprise_app.db')
            cursor = conn.cursor()
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'")
                conn.commit()
                print("✅ Manually added 'role' column to users table")
            except:
                print("ℹ️ Role column may already exist")
            finally:
                conn.close()
    
    # Configure logging
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('IT Lab Scheduler startup')
    
    return app