import os
import sqlite3
import shutil

def complete_database_reset():
    print("🚀 COMPLETE DATABASE RESET")
    print("=" * 50)
    
    # List of possible database files
    db_files = [
        'enterprise_app.db',
        'app.db', 
        'instance/app.db',
        'prototype_it_lab_scheduler.db'
    ]
    
    # Remove all database files
    print("🗑️ Removing existing database files...")
    for db_file in db_files:
        if os.path.exists(db_file):
            os.remove(db_file)
            print(f"   Deleted: {db_file}")
    
    # Remove migrations folder
    if os.path.exists('migrations'):
        shutil.rmtree('migrations')
        print("🗑️ Deleted migrations folder")
    
    # Create a fresh database with all tables
    print("\n🔧 Creating fresh database...")
    
    # Use the main database file name
    db_path = 'enterprise_app.db'
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Create users table with ALL columns including role
        print("👥 Creating users table...")
        cursor.execute('''
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                role TEXT NOT NULL DEFAULT 'student',
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("   ✅ Users table created with role column")
        
        # Create labs table
        print("🏢 Creating labs table...")
        cursor.execute('''
            CREATE TABLE labs (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                location TEXT,
                capacity INTEGER DEFAULT 30,
                equipment TEXT,
                description TEXT,
                is_active BOOLEAN DEFAULT 1,
                admin_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users (id)
            )
        ''')
        print("   ✅ Labs table created")
        
        # Create reservations table
        print("📅 Creating reservations table...")
        cursor.execute('''
            CREATE TABLE reservations (
                id TEXT PRIMARY KEY,
                instructor_id TEXT NOT NULL,
                lab_id TEXT NOT NULL,
                course_code TEXT NOT NULL,
                course_name TEXT NOT NULL,
                section TEXT NOT NULL,
                student_count INTEGER DEFAULT 0,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                duration_minutes INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                purpose TEXT,
                admin_notes TEXT,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES users (id),
                FOREIGN KEY (lab_id) REFERENCES labs (id)
            )
        ''')
        print("   ✅ Reservations table created")
        
        conn.commit()
        
        # Verify the tables were created
        print("\n🔍 Verifying database structure...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("📊 Database tables:")
        for table in tables:
            print(f"   📋 {table[0]}")
            cursor.execute(f"PRAGMA table_info({table[0]});")
            columns = cursor.fetchall()
            for col in columns:
                print(f"      └─ {col[1]} ({col[2]})")
        
        print("\n🎉 DATABASE RESET COMPLETE!")
        print("✅ All tables created successfully")
        print("✅ 'role' column exists in users table")
        print("✅ Ready for registration!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    complete_database_reset()