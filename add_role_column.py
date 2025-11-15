import sqlite3
import os

def fix_database():
    # Use your main database file (adjust the path if needed)
    db_path = 'instance/app.db'  # Common Flask database location
    if not os.path.exists(db_path):
        db_path = 'app.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return
    
    print(f"🔧 Fixing database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add the role column
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student'")
        conn.commit()
        print("✅ Successfully added 'role' column to users table")
        
        # Verify
        cursor.execute("PRAGMA table_info(users)")
        print("\nUpdated schema:")
        for col in cursor.fetchall():
            print(f"  {col[1]} ({col[2]})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database()