import asyncio
import traceback
from httpx import AsyncClient, ASGITransport
from main import app

async def run_test():
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. Login
            response = await ac.post('/api/auth/login', json={'email': 'student@zainco.pk', 'password': 'pilot123'})
            token = response.json()['access_token']
            
            # 2. Get Courses
            courses_res = await ac.get('/api/courses', headers={'Authorization': f'Bearer {token}'})
            print("Courses Response:")
            print(courses_res.json())
    except Exception as e:
        with open("error.txt", "w") as f:
            traceback.print_exc(file=f)

if __name__ == "__main__":
    asyncio.run(run_test())
