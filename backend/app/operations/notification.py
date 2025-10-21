from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.ticket import Ticket
from app.schemas.notification import NotificationCreate, NotificationOut, NotificationStats
from typing import List, Optional
from datetime import datetime

def create_notification(db: Session, notification_data: NotificationCreate) -> Notification:
    """Create a new notification."""
    db_notification = Notification(**notification_data.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_user_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 50, unread_only: bool = False) -> List[Notification]:
    """Get notifications for a specific user."""
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    return query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Mark a notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    
    return notification

def mark_all_notifications_as_read(db: Session, user_id: int) -> int:
    """Mark all notifications as read for a user."""
    updated_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({Notification.is_read: True})
    
    db.commit()
    return updated_count

def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Delete a notification."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if notification:
        db.delete(notification)
        db.commit()
        return True
    
    return False

def get_notification_stats(db: Session, user_id: int) -> NotificationStats:
    """Get notification statistics for a user."""
    total = db.query(func.count(Notification.id)).filter(Notification.user_id == user_id).scalar()
    unread = db.query(func.count(Notification.id)).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).scalar()
    
    return NotificationStats(
        total_notifications=total,
        unread_notifications=unread
    )

# Notification creation helpers for different events

def notify_ticket_created(db: Session, ticket: Ticket) -> None:
    """Create notification when a ticket is created."""
    # Notify all agents and admins
    agents_and_admins = db.query(User).filter(User.role.in_(['agent', 'admin'])).all()
    
    for user in agents_and_admins:
        notification = NotificationCreate(
            user_id=user.id,
            ticket_id=ticket.id,
            type=NotificationType.TICKET_CREATED,
            title="New Ticket Created",
            message=f"New ticket #{ticket.ticket_uid}: {ticket.title}"
        )
        create_notification(db, notification)

def notify_ticket_assigned(db: Session, ticket: Ticket, agent: User) -> None:
    """Create notification when a ticket is assigned."""
    # Notify the assigned agent
    notification = NotificationCreate(
        user_id=agent.id,
        ticket_id=ticket.id,
        type=NotificationType.TICKET_ASSIGNED,
        title="Ticket Assigned to You",
        message=f"You have been assigned ticket #{ticket.ticket_uid}: {ticket.title}"
    )
    create_notification(db, notification)

def notify_ticket_status_changed(db: Session, ticket: Ticket, old_status: str, new_status: str) -> None:
    """Create notification when ticket status changes."""
    # Notify the ticket creator
    notification = NotificationCreate(
        user_id=ticket.user_id,
        ticket_id=ticket.id,
        type=NotificationType.TICKET_STATUS_CHANGED,
        title="Ticket Status Updated",
        message=f"Your ticket #{ticket.ticket_uid} status changed from {old_status} to {new_status}"
    )
    create_notification(db, notification)
    
    # Also notify the assigned agent if different from creator
    if ticket.agent_id and ticket.agent_id != ticket.user_id:
        agent_notification = NotificationCreate(
            user_id=ticket.agent_id,
            ticket_id=ticket.id,
            type=NotificationType.TICKET_STATUS_CHANGED,
            title="Assigned Ticket Status Updated",
            message=f"Ticket #{ticket.ticket_uid} status changed from {old_status} to {new_status}"
        )
        create_notification(db, agent_notification)

def notify_ticket_reopened(db: Session, ticket: Ticket) -> None:
    """Create notification when a ticket is reopened."""
    # Notify the assigned agent and admins
    users_to_notify = []
    
    if ticket.agent_id:
        users_to_notify.append(ticket.agent_id)
    
    # Also notify admins
    admins = db.query(User).filter(User.role == 'admin').all()
    for admin in admins:
        if admin.id not in users_to_notify:
            users_to_notify.append(admin.id)
    
    for user_id in users_to_notify:
        notification = NotificationCreate(
            user_id=user_id,
            ticket_id=ticket.id,
            type=NotificationType.TICKET_REOPENED,
            title="Ticket Reopened",
            message=f"Ticket #{ticket.ticket_uid}: {ticket.title} has been reopened"
        )
        create_notification(db, notification)

def notify_note_added(db: Session, ticket: Ticket, agent: User) -> None:
    """Create notification when a note is added."""
    # Notify other agents working on this ticket and admins
    agents_and_admins = db.query(User).filter(
        User.role.in_(['agent', 'admin']),
        User.id != agent.id  # Don't notify the person who added the note
    ).all()
    
    for user in agents_and_admins:
        notification = NotificationCreate(
            user_id=user.id,
            ticket_id=ticket.id,
            type=NotificationType.NOTE_ADDED,
            title="New Note Added",
            message=f"A new note was added to ticket #{ticket.ticket_uid} by {agent.name}"
        )
        create_notification(db, notification)

def notify_ticket_transferred(db: Session, ticket: Ticket, old_agent_id: int, new_agent_id: int) -> None:
    """Create notification when a ticket is transferred."""
    # Get agent objects
    old_agent = db.query(User).filter(User.id == old_agent_id).first()
    new_agent = db.query(User).filter(User.id == new_agent_id).first()
    
    if not old_agent or not new_agent:
        return
    
    # Notify the new agent
    notification = NotificationCreate(
        user_id=new_agent_id,
        ticket_id=ticket.id,
        type=NotificationType.TICKET_TRANSFER_APPROVED,
        title="Ticket Transferred to You",
        message=f"Ticket #{ticket.ticket_uid} has been transferred to you from {old_agent.name}"
    )
    create_notification(db, notification)
    
    # Notify the old agent
    notification = NotificationCreate(
        user_id=old_agent_id,
        ticket_id=ticket.id,
        type=NotificationType.TICKET_TRANSFER_APPROVED,
        title="Ticket Transfer Completed",
        message=f"Ticket #{ticket.ticket_uid} has been transferred from you to {new_agent.name}"
    )
    create_notification(db, notification)
    
    # Notify admins
    admins = db.query(User).filter(User.role == 'admin').all()
    for admin in admins:
        if admin.id not in [old_agent_id, new_agent_id]:
            notification = NotificationCreate(
                user_id=admin.id,
                ticket_id=ticket.id,
                type=NotificationType.TICKET_TRANSFER_APPROVED,
                title="Ticket Transferred",
                message=f"Ticket #{ticket.ticket_uid} transferred from {old_agent.name} to {new_agent.name}"
            )
            create_notification(db, notification)

def notify_ticket_unassigned(db: Session, ticket: Ticket, old_agent_id: int) -> None:
    """Create notification when a ticket is unassigned."""
    old_agent = db.query(User).filter(User.id == old_agent_id).first()
    if not old_agent:
        return
    
    # Notify the old agent
    notification = NotificationCreate(
        user_id=old_agent_id,
        ticket_id=ticket.id,
        type=NotificationType.TICKET_STATUS_CHANGED,
        title="Ticket Unassigned",
        message=f"Ticket #{ticket.ticket_uid} has been unassigned from you"
    )
    create_notification(db, notification)
    
    # Notify admins
    admins = db.query(User).filter(User.role == 'admin').all()
    for admin in admins:
        notification = NotificationCreate(
            user_id=admin.id,
            ticket_id=ticket.id,
            type=NotificationType.TICKET_STATUS_CHANGED,
            title="Ticket Unassigned",
            message=f"Ticket #{ticket.ticket_uid} has been unassigned from {old_agent.name}"
        )
        create_notification(db, notification)

def notify_ticket_updated(db: Session, ticket: Ticket, updated_by: User, changes: str) -> None:
    """Create notification when ticket details are updated."""
    # Notify the ticket creator (if different from updater)
    if ticket.user_id != updated_by.id:
        notification = NotificationCreate(
            user_id=ticket.user_id,
            ticket_id=ticket.id,
            type=NotificationType.TICKET_UPDATED,
            title="Your Ticket Updated",
            message=f"Your ticket #{ticket.ticket_uid} has been updated: {changes}"
        )
        create_notification(db, notification)
    
    # Notify assigned agent (if different from updater and creator)
    if ticket.agent_id and ticket.agent_id != updated_by.id and ticket.agent_id != ticket.user_id:
        notification = NotificationCreate(
            user_id=ticket.agent_id,
            ticket_id=ticket.id,
            type=NotificationType.TICKET_UPDATED,
            title="Assigned Ticket Updated",
            message=f"Ticket #{ticket.ticket_uid} assigned to you has been updated: {changes}"
        )
        create_notification(db, notification)

def notify_ticket_resolved(db: Session, ticket: Ticket, resolved_by: User) -> None:
    """Create notification when a ticket is resolved."""
    # Notify the ticket creator
    notification = NotificationCreate(
        user_id=ticket.user_id,
        ticket_id=ticket.id,
        type=NotificationType.TICKET_RESOLVED,
        title="Your Ticket Resolved",
        message=f"Your ticket #{ticket.ticket_uid}: {ticket.title} has been resolved by {resolved_by.name}"
    )
    create_notification(db, notification)

def notify_ticket_transfer_requested(db: Session, ticket: Ticket, from_agent: User, to_agent: User, requested_by: User) -> None:
    """Create notification when a ticket transfer is requested."""
    # Notify the target agent
    notification = NotificationCreate(
        user_id=to_agent.id,
        ticket_id=ticket.id,
        type=NotificationType.TICKET_TRANSFER_REQUESTED,
        title="Ticket Transfer Request",
        message=f"Transfer request for ticket #{ticket.ticket_uid} from {from_agent.name}"
    )
    create_notification(db, notification)
    
    # Notify admins
    admins = db.query(User).filter(User.role == 'admin').all()
    for admin in admins:
        if admin.id != requested_by.id:
            notification = NotificationCreate(
                user_id=admin.id,
                ticket_id=ticket.id,
                type=NotificationType.TICKET_TRANSFER_REQUESTED,
                title="Ticket Transfer Request Pending",
                message=f"Transfer request for ticket #{ticket.ticket_uid} from {from_agent.name} to {to_agent.name}"
            )
            create_notification(db, notification)