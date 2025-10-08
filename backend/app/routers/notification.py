from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies import get_current_user
from app.operations import notification as notification_ops
from app.schemas import notification as notification_schema
from app.models import user as user_model

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[notification_schema.NotificationOut])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Get notifications for the current user."""
    return notification_ops.get_user_notifications(db, current_user.id, skip, limit, unread_only)

@router.get("/stats", response_model=notification_schema.NotificationStats)
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Get notification statistics for the current user."""
    return notification_ops.get_notification_stats(db, current_user.id)

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    notification = notification_ops.mark_notification_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Mark all notifications as read for the current user."""
    updated_count = notification_ops.mark_all_notifications_as_read(db, current_user.id)
    return {"message": f"Marked {updated_count} notifications as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Delete a specific notification."""
    success = notification_ops.delete_notification(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}