from sqlalchemy.orm import Session,joinedload
from sqlalchemy import func, or_, String, and_, desc
from app.models import user as user_model
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.ticket_transfer import TicketTransfer, TransferStatus
from app.operations import notification as notification_ops
import random
from datetime import datetime, timedelta 

from app.models.ticket import Ticket as ticket_model
from app.models.user import User
from app.schemas.ticket import Ticket as ticket_schema, DashboardStats, EnhancedDashboardStats, TicketsByStatus, TicketsByPriority, TicketsByCategory, TicketTrend, AgentPerformance, TimeBasedStats
from app.models.category import Category
from app.models.subcategory import Subcategory
from app.models.ticket_note import TicketNote
from typing import Optional



def get_ticket(db: Session, ticket_id: int):
    """Gets a single ticket by its ID with all related data."""
    return db.query(ticket_model).options(
        joinedload(ticket_model.user),
        joinedload(ticket_model.agent),
        joinedload(ticket_model.category),
        joinedload(ticket_model.subcategory)
    ).filter(ticket_model.id == ticket_id).first()
    

def get_transfer_request(db: Session, ticket_transfer_id: int):
    return db.query(TicketTransfer).options(
        joinedload(TicketTransfer.ticket).joinedload(Ticket.agent),
        joinedload(TicketTransfer.ticket).joinedload(Ticket.category),
        joinedload(TicketTransfer.from_agent),
        joinedload(TicketTransfer.to_agent),
        joinedload(TicketTransfer.resolved_by_admin)
    ).filter(ticket_transfer_id == TicketTransfer.id).first()

from sqlalchemy.orm import joinedload

def get_transfer_requests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(TicketTransfer).options(
        joinedload(TicketTransfer.ticket).joinedload(Ticket.agent),
        joinedload(TicketTransfer.ticket).joinedload(Ticket.category),
        joinedload(TicketTransfer.from_agent),
        joinedload(TicketTransfer.to_agent),
        joinedload(TicketTransfer.resolved_by_admin)
    ).offset(skip).limit(limit).all()

def get_agent_transfer_requests(db: Session, agent_id: int, skip: int = 0, limit: int = 100):
    """Get transfer requests related to a specific agent (both sent and received)."""
    from sqlalchemy import or_
    return db.query(TicketTransfer).options(
        joinedload(TicketTransfer.ticket).joinedload(Ticket.agent),
        joinedload(TicketTransfer.ticket).joinedload(Ticket.category),
        joinedload(TicketTransfer.from_agent),
        joinedload(TicketTransfer.to_agent),
        joinedload(TicketTransfer.resolved_by_admin)
    ).filter(
        or_(
            TicketTransfer.from_agent_id == agent_id,  # Requests they made
            TicketTransfer.to_agent_id == agent_id     # Requests made to them
        )
    ).offset(skip).limit(limit).all()

def get_tickets(db: Session, user_id: int = None, agent_id: int = None, skip: int = 0, limit: int = 100):
    """
    Gets a list of tickets.
    - If user_id is provided, filters for that user's created tickets.
    - If agent_id is provided, filters for that agent's assigned tickets.
    - If neither is provided, returns all tickets (for admins).
    """
    query = db.query(ticket_model)
    
    if user_id:
        query = query.filter(ticket_model.user_id == user_id)
    
    if agent_id:
        query = query.filter(ticket_model.agent_id == agent_id)
        
    return query.offset(skip).limit(limit).all()

def update_ticket_status(db: Session, db_ticket: ticket_model, status: TicketStatus):
    """Updates the status of a given ticket."""
    old_status = db_ticket.status
    db_ticket.status = status
    db.commit()
    db.refresh(db_ticket)
    
    # Create notifications for status changes
    try:
        if old_status != status:
            notification_ops.notify_ticket_status_changed(db, db_ticket, old_status.value, status.value)
    except Exception as e:
        # Don't fail status update if notifications fail
        print(f"Notification error: {e}")
    
    return db_ticket


def get_dashboard_stats(db: Session) -> DashboardStats:
    """Calculates and returns dashboard statistics."""
    from app.models import user as user_model
    
    # Get user statistics
    total_users = db.query(func.count(user_model.User.id)).scalar()
    
    # Get ticket statistics
    total_tickets = db.query(func.count(ticket_model.id)).scalar()
    
    resolved_statuses = [TicketStatus.resolved, TicketStatus.closed]
    resolved_tickets = db.query(func.count(ticket_model.id)).filter(ticket_model.status.in_(resolved_statuses)).scalar()
    
    pending_tickets = total_tickets - resolved_tickets
    
    return DashboardStats(
        total_users=total_users,
        total_tickets=total_tickets,
        resolved_tickets=resolved_tickets,
        pending_tickets=pending_tickets
    )


def get_enhanced_dashboard_stats(db: Session, days_back: int = 30) -> EnhancedDashboardStats:
    """Get comprehensive dashboard analytics with charts data."""
    try:
        # Get basic stats
        basic_stats = get_dashboard_stats(db)
        
        # Get tickets by status with colors
        status_colors = {
            'open': '#ef4444',
            'in_progress': '#f59e0b', 
            'resolved': '#10b981',
            'closed': '#6b7280',
            'requested_reopen': '#8b5cf6',
            'reopened': '#3b82f6',
            'assigned': '#3b82f6',
            'transferred': '#9333ea'
        }
        
        tickets_by_status = []
        # Temporarily exclude 'transferred' status until database is migrated
        valid_statuses = [status for status in TicketStatus if status.value != 'transferred']
        
        for status in valid_statuses:
            try:
                count = db.query(func.count(ticket_model.id)).filter(ticket_model.status == status).scalar() or 0
                if count > 0:
                    tickets_by_status.append(TicketsByStatus(
                        status=status.value,
                        count=count,
                        color=status_colors.get(status.value, '#6b7280')
                    ))
            except Exception as e:
                print(f"Error querying status {status.value}: {e}")
                continue
        
        # Get tickets by priority with colors  
        priority_colors = {
            'low': '#10b981',
            'medium': '#f59e0b',
            'high': '#ef4444',
            'urgent': '#dc2626'
        }
        
        tickets_by_priority = []
        for priority in TicketPriority:
            try:
                count = db.query(func.count(ticket_model.id)).filter(ticket_model.priority == priority).scalar() or 0
                if count > 0:
                    tickets_by_priority.append(TicketsByPriority(
                        priority=priority.value,
                        count=count,
                        color=priority_colors.get(priority.value, '#6b7280')
                    ))
            except Exception as e:
                print(f"Error querying priority {priority.value}: {e}")
                continue
        
        # Get tickets by category
        tickets_by_category = []
        total_tickets_with_category = db.query(func.count(ticket_model.id)).filter(ticket_model.category_id.isnot(None)).scalar() or 0
        
        if total_tickets_with_category > 0:
            try:
                category_stats = db.query(
                    Category.name,
                    func.count(ticket_model.id).label('count')
                ).join(ticket_model, Category.id == ticket_model.category_id).group_by(Category.name).all()
                
                for category_name, count in category_stats:
                    percentage = (count / total_tickets_with_category) * 100
                    tickets_by_category.append(TicketsByCategory(
                        category_name=category_name,
                        count=count,
                        percentage=round(percentage, 1)
                    ))
            except Exception as e:
                print(f"Error fetching category stats: {e}")
        
        # Get ticket trends (simplified)
        ticket_trends = []
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=min(days_back, 30))  # Limit to 30 days max
            
            for i in range(min(days_back, 30)):
                date = start_date + timedelta(days=i)
                date_str = date.strftime('%Y-%m-%d')
                
                created_count = db.query(func.count(ticket_model.id)).filter(
                    func.date(ticket_model.created_at) == date.date()
                ).scalar() or 0
                
                resolved_count = db.query(func.count(ticket_model.id)).filter(
                    and_(
                        func.date(ticket_model.updated_at) == date.date(),
                        ticket_model.status.in_([TicketStatus.resolved, TicketStatus.closed])
                    )
                ).scalar() or 0
                
                ticket_trends.append(TicketTrend(
                    date=date_str,
                    created=created_count,
                    resolved=resolved_count
                ))
        except Exception as e:
            print(f"Error fetching ticket trends: {e}")
        
        # Get agent performance
        agent_performance = []
        try:
            agents = db.query(user_model.User).filter(user_model.User.role == 'agent').all()
            
            for agent in agents:
                agent_tickets = db.query(func.count(ticket_model.id)).filter(ticket_model.agent_id == agent.id).scalar() or 0
                agent_resolved = db.query(func.count(ticket_model.id)).filter(
                    and_(
                        ticket_model.agent_id == agent.id,
                        ticket_model.status.in_([TicketStatus.resolved, TicketStatus.closed])
                    )
                ).scalar() or 0
                
                performance_score = (agent_resolved / agent_tickets * 100) if agent_tickets > 0 else 0
                
                if agent_tickets > 0:  # Only include agents with tickets
                    agent_performance.append(AgentPerformance(
                        agent_name=agent.name,
                        agent_id=agent.id,
                        total_tickets=agent_tickets,
                        resolved_tickets=agent_resolved,
                        performance_score=round(performance_score, 1)
                    ))
        except Exception as e:
            print(f"Error fetching agent performance: {e}")
        
        # Get time-based stats (last 7 days by day)
        time_based_stats = []
        try:
            for i in range(7):
                date = datetime.now() - timedelta(days=6-i)
                day_name = date.strftime('%a')  # Mon, Tue, etc.
                
                created_count = db.query(func.count(ticket_model.id)).filter(
                    func.date(ticket_model.created_at) == date.date()
                ).scalar() or 0
                
                resolved_count = db.query(func.count(ticket_model.id)).filter(
                    and_(
                        func.date(ticket_model.updated_at) == date.date(),
                        ticket_model.status.in_([TicketStatus.resolved, TicketStatus.closed])
                    )
                ).scalar() or 0
                
                time_based_stats.append(TimeBasedStats(
                    period='day',
                    label=day_name,
                    tickets_created=created_count,
                    tickets_resolved=resolved_count
                ))
        except Exception as e:
            print(f"Error fetching time-based stats: {e}")
        
        return EnhancedDashboardStats(
            basic_stats=basic_stats,
            tickets_by_status=tickets_by_status,
            tickets_by_priority=tickets_by_priority,
            tickets_by_category=tickets_by_category,
            ticket_trends=ticket_trends,
            agent_performance=agent_performance,
            time_based_stats=time_based_stats
        )
    except Exception as e:
        print(f"Error in get_enhanced_dashboard_stats: {e}")
        # Return empty data on error
        return EnhancedDashboardStats(
            basic_stats=get_dashboard_stats(db),
            tickets_by_status=[],
            tickets_by_priority=[],
            tickets_by_category=[],
            ticket_trends=[],
            agent_performance=[],
            time_based_stats=[]
        )

def _generate_ticket_uid() -> str:
    """Generates a simple, user-friendly unique ticket ID."""
    # In a real-world app, you might want a more robust system
    # like combining timestamp and a random component.
    return f"TICKET-{random.randint(100000, 999999)}"

def _score_priority(title: str, description: str) -> TicketPriority:
    """
    ALGORITHM #1: Keyword-Based Priority Scoring.
    Scans ticket content for keywords to automatically set priority.
    """
    content = f"{title.lower()} {description.lower()}"
    
    # Define keywords and their corresponding priorities
    if any(keyword in content for keyword in ['outage', 'critical', 'down', 'urgent', 'broken']):
        return TicketPriority.urgent
    elif any(keyword in content for keyword in ['error', 'fail', 'slow', 'no internet']):
        return TicketPriority.high
    elif any(keyword in content for keyword in ['question', 'inquiry', 'how to', 'request']):
        return TicketPriority.low
    else:
        return TicketPriority.medium # Default priority

def _find_best_agent(db: Session, category_id: int) -> Optional[int]:
    """
    ENHANCED ALGORITHM: Intelligent Agent Assignment.
    Finds the best available agent for a category based on:
    1. Category expertise (agent must be assigned to this category)
    2. Current workload (fewest active tickets)
    3. Availability status (future enhancement)
    """
    # Find agents assigned to this category
    assigned_agents_query = db.query(user_model.User.id).join(
        user_model.User.assigned_categories
    ).filter(
        user_model.User.role == user_model.UserRole.agent,
        user_model.User.assigned_categories.any(id=category_id)
    )
    
    assigned_agent_ids = [agent_id for agent_id, in assigned_agents_query.all()]
    
    if not assigned_agent_ids:
        # No agent is assigned to this category
        # As fallback, try to find any available agent (optional)
        fallback_agents = db.query(user_model.User.id).filter(
            user_model.User.role == user_model.UserRole.agent
        ).all()
        
        if not fallback_agents:
            return None  # No agents available at all
        
        # For now, return None to enforce category assignments
        # In production, you might want to assign to a general agent
        return None

    # Find the agent among them with the minimum number of active tickets
    # Active statuses are 'assigned' and 'in_progress'
    active_statuses = [TicketStatus.assigned, TicketStatus.in_progress]
    
    # Query to get agent workload
    workload_query = db.query(
        ticket_model.agent_id, 
        func.count(ticket_model.id).label('active_tickets')
    ).filter(
        ticket_model.agent_id.in_(assigned_agent_ids),
        ticket_model.status.in_(active_statuses)
    ).group_by(ticket_model.agent_id).order_by('active_tickets')
    
    result = workload_query.first()
    
    if result:
        # An agent with active tickets was found, return the one with the least
        return result.agent_id
    else:
        # No agents have active tickets, so pick the first available one
        # This ensures even distribution when all agents are free
        return assigned_agent_ids[0]

def create_ticket(db: Session, ticket_data: ticket_schema, user_id: int):
    """
    Creates a new ticket, scores its priority, and assigns it to the best agent.
    """

    # if category and or sub category are not exist raise error
  
    
    # 1. Score Priority
    priority = _score_priority(ticket_data.title, ticket_data.initial_description)
    
    # 2. Find Best Agent
    best_agent_id = _find_best_agent(db, ticket_data.category_id)
    
    # Determine initial status based on agent availability
    status = TicketStatus.assigned if best_agent_id else TicketStatus.open
    
    # 3. Create Ticket Record
    db_ticket = ticket_model(
        **ticket_data.model_dump(),
        ticket_uid=_generate_ticket_uid(),
        user_id=user_id,
        agent_id=best_agent_id,
        priority=priority,
        status=status,
    )

    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    # Create notifications
    try:
        # Notify user about ticket creation
        notification_ops.notify_ticket_created(db, db_ticket)
        
        # Notify agent if assigned
        if best_agent_id:
            notification_ops.notify_ticket_assigned(db, db_ticket, best_agent_id)
    except Exception as e:
        # Don't fail ticket creation if notifications fail
        print(f"Notification error: {e}")
    
    return db_ticket

def create_ticket_transfer_request(db: Session, db_ticket: ticket_model, from_agent_id: int, to_agent_id: int, reason: str):
    """Creates a ticket transfer request record."""
    transfer_request = TicketTransfer(
        ticket_id=db_ticket.id,
        from_agent_id=from_agent_id,
        to_agent_id=to_agent_id,
        request_reason=reason,
        status= TransferStatus.pending
    )
    db.add(transfer_request)
    db.commit()
    db.refresh(transfer_request)
    
    # Create notification for transfer request
    try:
        from_agent = db.query(User).filter(User.id == from_agent_id).first()
        to_agent = db.query(User).filter(User.id == to_agent_id).first()
        requester = db.query(User).filter(User.id == from_agent_id).first()  # Usually the same as from_agent
        
        if from_agent and to_agent and requester:
            notification_ops.notify_ticket_transfer_requested(db, db_ticket, from_agent, to_agent, requester)
    except Exception as e:
        print(f"Notification error for transfer request: {e}")
    
    return transfer_request

def approve_ticket_transfer(db: Session, transfer_request: TicketTransfer):
    """
    Approve a ticket transfer by updating the ticket's assigned agent.
    This actually transfers the ticket from the old agent to the new agent.
    """
    # Get the ticket associated with this transfer request
    ticket = db.query(Ticket).filter(Ticket.id == transfer_request.ticket_id).first()
    
    if not ticket:
        raise ValueError("Ticket not found for transfer request")
    
    # Update the ticket's assigned agent to the target agent
    old_agent_id = ticket.agent_id
    ticket.agent_id = transfer_request.to_agent_id
    
    # Update ticket status to "assigned" since it's now assigned to a new agent
    ticket.status = TicketStatus.assigned
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Create notifications for transfer approval
    try:
        # Notify new agent about ticket assignment
        notification_ops.notify_ticket_assigned(db, ticket, transfer_request.to_agent_id)
        # Notify old agent about transfer completion (if different from requester)
        if old_agent_id and old_agent_id != transfer_request.from_agent_id:
            notification_ops.notify_ticket_transferred(db, ticket, old_agent_id, transfer_request.to_agent_id)
        # Notify requesting agent about transfer approval
        notification_ops.notify_transfer_approved(db, ticket, transfer_request.from_agent_id)
    except Exception as e:
        # Don't fail transfer if notifications fail
        print(f"Notification error: {e}")
    
    print(f"Ticket #{ticket.id} transferred from agent {old_agent_id} to agent {transfer_request.to_agent_id}")
    return ticket

from sqlalchemy import or_

def get_all_reopen_requests(db: Session, search_query: str | None = None):
    query = db.query(Ticket).filter(Ticket.status == TicketStatus.requested_reopen)

    if search_query:
        search = f"%{search_query}%"  # for ILIKE search
        query = query.join(Ticket.user).filter(
            or_(
                Ticket.id.cast(String).ilike(search),
                Ticket.title.ilike(search),
                User.name.ilike(search),
                User.email.ilike(search)
            )
        )

    return query.all()


def request_reopen_ticket(db: Session, ticket: Ticket):
    ticket.status = TicketStatus.requested_reopen
    db.commit()
    db.refresh(ticket)
    return ticket

def search_tickets(db: Session, search_query: str):

    return (
        db.query(Ticket)
        .join(User, Ticket.user_id == User.id)  # join with user table
        .options(joinedload(Ticket.user))       # eager load user data
        .filter(
            or_(
                Ticket.title.ilike(f"%{search_query}%"),
                User.name.ilike(f"%{search_query}%")
            )
        )
        .all()
    )

def accept_reopen_ticket(db: Session, ticket: Ticket):
    ticket.status = TicketStatus.reopened
    db.commit()
    db.refresh(ticket)
    
    # Create notification for ticket reopened
    try:
        notification_ops.notify_ticket_reopened(db, ticket)
    except Exception as e:
        print(f"Notification error for ticket reopen: {e}")
    
    return ticket

def create_ticket_note(db: Session, ticket_note: TicketNote):
    db.add(ticket_note)
    db.commit()
    db.refresh(ticket_note)
    return ticket_note


def get_ticket_notes(db: Session, ticket_id: int):
    """Get all notes for a specific ticket, ordered by creation date."""
    return db.query(TicketNote).options(joinedload(TicketNote.agent)).filter(TicketNote.ticket_id == ticket_id).order_by(TicketNote.created_at.desc()).all()


def admin_assign_ticket(db: Session, db_ticket: ticket_model, agent_id: Optional[int]):
    """
    Admin override function to manually assign/reassign a ticket to an agent.
    If agent_id is None, the ticket becomes unassigned.
    """
    old_agent_id = db_ticket.agent_id
    
    # Update the ticket assignment
    db_ticket.agent_id = agent_id
    
    # Update status based on assignment
    if agent_id is not None:
        # Ticket is being assigned to an agent
        if db_ticket.status == TicketStatus.open:
            db_ticket.status = TicketStatus.assigned
    else:
        # Ticket is being unassigned
        if db_ticket.status == TicketStatus.assigned:
            db_ticket.status = TicketStatus.open
    
    db.commit()
    db.refresh(db_ticket)
    
    # Create notifications for assignment changes
    try:
        if old_agent_id != agent_id:
            # Create update notification for assignment change
            updater = db.query(User).filter(User.id == db_ticket.user_id).first()  # Default to ticket creator
            if agent_id and old_agent_id:
                changes = f"Ticket reassigned from one agent to another"
            elif agent_id:
                changes = f"Ticket assigned to an agent"
            else:
                changes = f"Ticket unassigned from agent"
            
            if updater:
                notification_ops.notify_ticket_updated(db, db_ticket, updater, changes)
            
            if agent_id:
                # Notify new agent about assignment
                notification_ops.notify_ticket_assigned(db, db_ticket, agent_id)
            if old_agent_id:
                # Notify old agent about unassignment
                notification_ops.notify_ticket_unassigned(db, db_ticket, old_agent_id)
    except Exception as e:
        # Don't fail assignment if notifications fail
        print(f"Notification error: {e}")
    
    return db_ticket


def request_ticket_resolution(db: Session, db_ticket: ticket_model):
    """
    Agent requests ticket resolution. Sets status to indicate resolution is requested.
    """
    # Update status to indicate resolution requested (can use in_progress or create new status)
    db_ticket.status = TicketStatus.in_progress  # Using in_progress to indicate work is done, awaiting admin approval
    db.commit()
    db.refresh(db_ticket)
    return {"message": "Resolution request submitted. Awaiting admin approval."}


def resolve_ticket(db: Session, db_ticket: ticket_model, admin_id: int):
    """
    Admin resolves a ticket.
    """
    from datetime import datetime
    
    db_ticket.status = TicketStatus.resolved
    db_ticket.closed_at = datetime.now()
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


def close_ticket(db: Session, db_ticket: ticket_model, agent_id: int, resolution_note: str = None):
    """
    Assigned agent closes a ticket after resolving the issue.
    """
    from datetime import datetime
    
    db_ticket.status = TicketStatus.closed
    db_ticket.closed_at = datetime.now()
    
    # If a resolution note is provided, add it as a ticket note
    if resolution_note:
        from app.models.ticket_note import TicketNote
        note = TicketNote(
            ticket_id=db_ticket.id,
            agent_id=agent_id,
            content=f"Resolution: {resolution_note}",
            is_internal=False  # Make it visible to the user
        )
        db.add(note)
    
    db.commit()
    db.refresh(db_ticket)
    
    # Create notifications
    try:
        # Notify about ticket resolution
        agent = db.query(User).filter(User.id == agent_id).first()
        if agent:
            notification_ops.notify_ticket_resolved(db, db_ticket, agent)
        
        # Also notify about status change
        notification_ops.notify_ticket_status_changed(db, db_ticket, "assigned", "closed")
    except Exception as e:
        # Don't fail closure if notifications fail
        print(f"Notification error: {e}")
    
    return db_ticket


def reopen_ticket(db: Session, db_ticket: ticket_model):
    """
    Admin reopens a resolved ticket.
    """
    db_ticket.status = TicketStatus.open
    db_ticket.closed_at = None
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


def get_agent_stats(db: Session, agent_id: int) -> DashboardStats:
    """Calculates and returns statistics for a specific agent."""
    
    # Get agent's tickets
    agent_tickets = db.query(func.count(ticket_model.id)).filter(ticket_model.agent_id == agent_id).scalar()
    
    # Get resolved tickets for this agent
    resolved_statuses = [TicketStatus.resolved, TicketStatus.closed]
    resolved_tickets = db.query(func.count(ticket_model.id)).filter(
        ticket_model.agent_id == agent_id,
        ticket_model.status.in_(resolved_statuses)
    ).scalar()
    
    # Get pending tickets for this agent
    pending_tickets = agent_tickets - resolved_tickets
    
    # Get unique users this agent has worked with
    unique_users_worked_with = db.query(func.count(func.distinct(ticket_model.user_id))).filter(
        ticket_model.agent_id == agent_id
    ).scalar()
    
    return DashboardStats(
        total_users=unique_users_worked_with,  # Number of unique users this agent has worked with
        total_tickets=agent_tickets,
        resolved_tickets=resolved_tickets,
        pending_tickets=pending_tickets
    )