import requests
import json

def test_registration():
    print("🧪 Testing Registration API")
    print("=" * 40)
    
    # Test data
    test_user = {
        "username": "testuser_" + str(hash("test")),
        "email": f"test_{hash('test')}@example.com",
        "password": "TestPassword123",
        "first_name": "Test",
        "last_name": "User",
        "role": "student"
    }
    
    try:
        response = requests.post(
            "http://localhost:5000/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ REGISTRATION SUCCESSFUL!")
            data = response.json()
            print(f"User created: {data.get('user', {}).get('username')}")
            print(f"Role: {data.get('user', {}).get('role')}")
        else:
            print("❌ REGISTRATION FAILED")
            data = response.json()
            print(f"Error: {data.get('message')}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == '__main__':
    test_registration()