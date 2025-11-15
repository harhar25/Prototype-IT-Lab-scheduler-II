import sqlite3
import os

def check_database():
    db_files = ['enterprise_app.db', 'app.db', 'instance/app.db']
    
    for db_file in db_files:
        if os.path.exists(db_file):
            print(f"🔍 Checking: {db_file}")
            print("=" * 50)
            
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            
            # List all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            print("📋 Tables:")
            for table in tables:
                table_name = table[0]
                print(f"\n{table_name}:")
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = cursor.fetchall()
                for col in columns:
                    print(f"  └─ {col[1]} ({col[2]})")
            
            # Check if we can query the role column
            if 'users' in [t[0] for t in tables]:
                try:
                    cursor.execute("SELECT role FROM users LIMIT 1")
                    print("\n✅ 'role' column is accessible in users table")
                except Exception as e:
                    print(f"\n❌ Cannot access 'role' column: {e}")
            
            conn.close()
            print("\n")

if __name__ == '__main__':
    check_database()