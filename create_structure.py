import os

def create_directory_structure():
    """Create the complete directory structure for the Flask app"""
    
    directories = [
        'app/models',
        'app/routes',
        'app/services',
        'app/utils',
        'static/css/components',
        'static/js/utils',
        'static/js/components',
        'static/images',
        'static/fonts',
        'templates/components',
        'migrations',
        'logs'
    ]
    
    files = {
        'app/__init__.py': '',
        'app/config.py': '',
        'app/models/__init__.py': '',
        'app/models/user.py': '',
        'app/models/task.py': '',
        'app/routes/__init__.py': '',
        'app/routes/auth.py': '',
        'app/routes/tasks.py': '',
        'app/routes/api.py': '',
        'app/services/__init__.py': '',
        'app/services/auth_service.py': '',
        'app/utils/__init__.py': '',
        'app/utils/security.py': '',
        'templates/base.html': '',
        'templates/index.html': '',
        'static/css/style.css': '',
        'static/js/app.js': '',
        'static/js/utils/api.js': '',
        'static/js/utils/helpers.js': '',
        'static/js/components/notification.js': '',
        'static/js/components/modal.js': '',
        'run.py': '',
        'requirements.txt': '',
        '.env': '',
        '.gitignore': ''
    }
    
    # Create directories
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")
    
    # Create files
    for file_path in files:
        with open(file_path, 'w') as f:
            f.write(files[file_path])
        print(f"Created file: {file_path}")
    
    print("\nDirectory structure created successfully!")
    print("\nNext steps:")
    print("1. Copy the file contents provided above")
    print("2. Run: pip install -r requirements.txt")
    print("3. Run: flask db init")
    print("4. Run: flask db migrate -m 'Initial migration'")
    print("5. Run: flask db upgrade")
    print("6. Run: python run.py")

if __name__ == '__main__':
    create_directory_structure()