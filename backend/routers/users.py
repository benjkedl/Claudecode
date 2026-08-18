from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, User
from auth import get_current_user, hash_password
from permissions import can_manage_users
from schemas import UserOut, UserCreate, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Any authenticated user can see the staff directory (needed to pick an
    # assignee for a concern, an advisor, etc); only Admin can edit it.
    return db.query(User).order_by(User.name).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not can_manage_users(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin may create users")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")

    new_user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not can_manage_users(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin may edit users")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(target, field, value)

    db.commit()
    db.refresh(target)
    return target
