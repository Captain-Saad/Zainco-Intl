import asyncio
import traceback
from httpx import AsyncClient, ASGITransport
from main import app

async def run_test():
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. Login as Admin
            response = await ac.post('/api/auth/login', json={'email': 'admin@zainco.pk', 'password': 'admin123'})
            token = response.json().get('access_token')
            if not token:
                print("Admin login failed:", response.json())
                return
                
            print("Logged in as Admin.")
            
            # 2. Get Stats
            print("\nFetching Admin Stats...")
            stats_res = await ac.get('/api/admin/stats', headers={'Authorization': f'Bearer {token}'})
            if stats_res.status_code == 200:
                print("Stats:", stats_res.json())
            else:
                print(f"Error fetching stats: {stats_res.text}")
                
            # 3. Get Students
            print("\nFetching Students...")
            stud_res = await ac.get('/api/admin/students', headers={'Authorization': f'Bearer {token}'})
            if stud_res.status_code == 200:
                students = stud_res.json()
                print(f"Found {len(students)} students.")
                if students:
                    student_id = students[0]['id']
                    
                    # 4. Get Student Detail
                    print(f"\nFetching Student Detail for {student_id}...")
                    det_res = await ac.get(f'/api/admin/students/{student_id}', headers={'Authorization': f'Bearer {token}'})
                    if det_res.status_code == 200:
                        det = det_res.json()
                        print(f"Student: {det['email']}, Enrollments: {len(det['enrollments'])}")
                    else:
                        print(f"Error fetching student detail: {det_res.text}")
            else:
                print(f"Error fetching students: {stud_res.text}")
            
    except Exception as e:
        with open("error.txt", "w") as f:
            traceback.print_exc(file=f)

if __name__ == "__main__":
    asyncio.run(run_test())
