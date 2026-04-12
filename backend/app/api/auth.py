"""Auth API routes: login, me, logout."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, verify_password, hash_password
from app.models.progress import Activity
from app.models.user import User
from app.schemas.auth import LoginRequest, MessageResponse, TokenResponse, UserResponse, UserProfileUpdate, UserPasswordUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, login_req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email/password and return JWT + user data."""
    result = await db.execute(select(User).where(User.email == login_req.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(login_req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    # Log activity
    activity = Activity(
        user_id=user.id,
        type="login",
        description=f"User logged in from {request.client.host if request.client else 'unknown'}",
        metadata_json={"ip": request.client.host if request.client else None}
    )
    db.add(activity)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint (handled mostly client-side by deleting token)."""
    return MessageResponse(message="Successfully logged out")


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_req: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update personal information."""
    if profile_req.name is not None:
        current_user.name = profile_req.name
    if profile_req.phone is not None:
        current_user.phone = profile_req.phone
    if profile_req.license is not None:
        current_user.license = profile_req.license
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/password", response_model=MessageResponse)
async def update_password(
    password_req: UserPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user password."""
    if not verify_password(password_req.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
        
    current_user.password = hash_password(password_req.new_password)
    db.add(current_user)
    await db.commit()
    return MessageResponse(message="Password updated successfully")
