import asyncio
import sys
sys.path.insert(0, '.')

async def main():
    import sqlalchemy.ext.asyncio as sa
    from sqlalchemy import text
    
    engine = sa.create_async_engine('postgresql+asyncpg://postgres:SAh16ITU$530@localhost:5432/aerolearn')
    SessionLocal = sa.async_sessionmaker(engine, class_=sa.AsyncSession, expire_on_commit=False)
    
    async with SessionLocal() as s:
        print("LESSON PROGRESS:")
        r = await s.execute(text('SELECT lesson_id, video_duration, watched_seconds, watch_percent, completed FROM lesson_progress'))
        for row in r.fetchall():
            print(f"lesson_id={row[0]} video_duration={row[1]} watched_seconds={row[2]} watch_percent={row[3]} completed={row[4]}")
        
        print("\nLESSONS:")
        r2 = await s.execute(text('SELECT id, title, duration FROM lessons'))
        for row in r2.fetchall():
            print(f"lesson_id={row[0]} title='{row[1]}' duration='{row[2]}'")

asyncio.run(main())
