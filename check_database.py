import sqlite3
import os

def check_database():
    # Find database files
    db_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.db') or file.endswith('.sqlite'):
                db_files.append(os.path.join(root, file))
    
    if not db_files:
        print("❌ No database files found!")
        return
    
    print("Found database files:")
    for db_file in db_files:
        print(f"📁 {db_file}")
        
        # Check each database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        try:
            # Check if users table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
            if not cursor.fetchone():
                print("   ❌ No 'users' table found")
                continue
            
            # Check users table schema
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()
            
            print("   Users table columns:")
            column_names = []
            for col in columns:
                print(f"     - {col[1]} ({col[2]})")
                column_names.append(col[1])
            
            # Check for role column
            if 'role' in column_names:
                print("   ✅ 'role' column exists")
            else:
                print("   ❌ 'role' column is MISSING")
                
        except Exception as e:
            print(f"   Error: {e}")
        finally:
            conn.close()
        print()

if __name__ == "__main__":
    check_database()