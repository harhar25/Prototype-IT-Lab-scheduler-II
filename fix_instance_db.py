import sqlite3
import os

def fix_instance_database():
    db_path = 'instance/enterprise_app.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return
    
    print(f"🔧 Fixing database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add the role column
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student'")
        
        # Also remove the old is_admin column if it exists (to match your User model)
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'is_admin' in columns:
            print("⚠️  Found old 'is_admin' column - this should be replaced by 'role'")
            # Note: We'll keep it for now to avoid data loss
        
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
    fix_instance_database()
    