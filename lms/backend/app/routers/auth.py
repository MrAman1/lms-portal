from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.models.models import User, UserRole
from app.schemas.schemas import UserCreate, UserOut, Token, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def seed_admin_if_missing(db: Session) -> None:
    """
    Ensures the hardcoded admin account exists in the database on auth requests.
    Credentials: admin@gmail.com / admin12
    """
    admin_email = "admin@gmail.com"
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        admin_user = User(
            name="System Admin",
            email=admin_email,
            hashed_password=hash_password("admin12"),
            role=UserRole.ADMIN if hasattr(UserRole, "ADMIN") else "admin",
            is_approved=True,  # Admin is pre-approved
        )
        db.add(admin_user)
        db.commit()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Validates JWT token and retrieves the current authenticated user.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_teacher(user: User = Depends(get_current_user)) -> User:
    """
    Dependency guard restricting access to approved teachers only.
    """
    if user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Teacher access required")
    if not getattr(user, "is_approved", True):
        raise HTTPException(status_code=403, detail="Teacher account pending approval")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """
    Dependency guard restricting access strictly to admin users.
    """
    admin_role = UserRole.ADMIN if hasattr(UserRole, "ADMIN") else "admin"
    if user.role != admin_role:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user. 
    Students are auto-approved (is_approved=True).
    Teachers are set to pending (is_approved=False) until admin grants access.
    """
    seed_admin_if_missing(db)

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Determine user role
    if payload.role == "teacher":
        role = UserRole.TEACHER
        is_approved = False  # Requires Admin Approval
    else:
        role = UserRole.STUDENT
        is_approved = True

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=role,
        is_approved=is_approved,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If account is pending approval, throw status 202 message instead of returning active session token
    if not user.is_approved:
        raise HTTPException(
            status_code=202,
            detail="Teacher registration request submitted successfully. Awaiting admin approval."
        )

    token = create_access_token({"sub": user.id, "role": user.role.value if hasattr(user.role, "value") else user.role})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates users and blocks unapproved teacher access.
    Automatically seeds admin@gmail.com / admin12 if missing.
    """
    seed_admin_if_missing(db)

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Block teacher if request is still pending
    if not getattr(user, "is_approved", True):
        raise HTTPException(
            status_code=403, 
            detail="Your teacher account request is pending admin approval."
        )

    user_role_str = user.role.value if hasattr(user.role, "value") else user.role
    token = create_access_token({"sub": user.id, "role": user_role_str})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    """
    Returns the current authenticated user details.
    """
    return user