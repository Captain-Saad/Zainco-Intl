"""Pydantic schemas for authentication requests and responses."""

from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    """POST /api/auth/login request body."""
    email: str
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Strip whitespace and lowercase the email for case-insensitive matching."""
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserResponse(BaseModel):
    """User object returned in auth responses — matches frontend User interface."""
    id: UUID
    email: str
    name: str
    role: str
    license: str | None = None
    phone: str | None = None
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """POST /api/auth/login response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str

class UserProfileUpdate(BaseModel):
    """PUT /api/auth/profile request body."""
    name: str | None = None
    phone: str | None = None
    license: str | None = None

class UserPasswordUpdate(BaseModel):
    """PUT /api/auth/password request body."""
    current_password: str
    new_password: str
