from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, UserRole

router = APIRouter(prefix="/admin", tags=["admin"])

# Fetch all teacher accounts waiting for approval
@router.get("/pending-teachers")
def get_pending_teachers(db: Session = Depends(get_db)):
    pending = db.query(User).filter(
        (User.role == UserRole.TEACHER) | (User.role == "TEACHER") | (User.role == "teacher"),
        User.is_approved == False
    ).all()
    
    return [
        {
            "id": str(u.id), 
            "name": getattr(u, "name", "") or "Teacher", 
            "email": u.email, 
            "role": u.role.value if hasattr(u.role, "value") else str(u.role)
        } 
        for u in pending
    ]

# Approve a pending teacher account
@router.post("/approve-teacher/{user_id}")
def approve_teacher(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher request not found")
    
    user.is_approved = True
    db.commit()
    return {"message": f"Teacher {user.email} approved successfully."}

# Reject/Delete a teacher registration request
@router.delete("/reject-teacher/{user_id}")
def reject_teacher(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher request not found")
    
    db.delete(user)
    db.commit()
    return {"message": f"Teacher request for {user.email} rejected."}