import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.models.user import User, UserRole

async def main():
    settings = get_settings()
    engine = create_async_engine(str(settings.database_url))
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        user = User(
            id='00000000-0000-0000-0000-000000000001',
            name='Mock Rider',
            email='mock@rider.com',
            role=UserRole.RIDER
        )
        session.add(user)
        try:
            await session.commit()
            print('Done')
        except Exception as e:
            print('Skipping insert:', e)

if __name__ == "__main__":
    asyncio.run(main())
