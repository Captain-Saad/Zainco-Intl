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
            
            # 2. Get Courses to find a lesson ID
            courses_res = await ac.get('/api/courses', headers={'Authorization': f'Bearer {token}'})
            course_id = courses_res.json()[0]['id']
            
            c_detail = await ac.get(f'/api/courses/{course_id}',  headers={'Authorization': f'Bearer {token}'})
            lesson_id = c_detail.json()['lessons_list'][0]['id']
            
            # 3. Request video token
            v_token_res = await ac.post('/api/video/token', json={'lesson_id': lesson_id}, headers={'Authorization': f'Bearer {token}'})
            print("Video Token Response:", v_token_res.json())
            
            stream_url = v_token_res.json()['signed_url']
            
            # 4. Try streaming a small chunk
            print(f"Requesting stream from {stream_url} with Range bytes=0-100")
            stream_res = await ac.get(stream_url, headers={'Range': 'bytes=0-100'})
            print(f"Stream Status: {stream_res.status_code}")
            print(f"Content-Type: {stream_res.headers.get('content-type')}")
            print(f"Content-Range: {stream_res.headers.get('content-range')}")
            print(f"Content-Length: {stream_res.headers.get('content-length')}")
            print(f"Body size: {len(stream_res.content)} bytes")
            
            # 5. Try updating progress
            prog_res = await ac.post('/api/video/progress', json={
                'lesson_id': lesson_id,
                'watch_percent': 95,
                'current_position': 120,
                'completed': True
            }, headers={'Authorization': f'Bearer {token}'})
            print("Progress Update Response:", prog_res.json())
            
    except Exception as e:
        with open("error.txt", "w") as f:
            traceback.print_exc(file=f)

if __name__ == "__main__":
    asyncio.run(run_test())
