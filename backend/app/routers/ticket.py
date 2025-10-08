from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user # Assuming you have a general get_current_user
from app.operations import ticket as ticket_ops
from app.schemas import ticket as ticket_schema
from app.schemas import ticket_note_create


from app.models import user as user_model
from app.models.user import UserRole
from app.models.category import Category
from app.models.subcategory import Subcategory
from app.models.ticket_transfer import TicketTransfer, TransferStatus
from app.models.ticket import TicketPriority, TicketStatus
from app.models.ticket_note import TicketNote

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.get("/", response_model=List[ticket_schema.TicketOut])
def read_tickets_for_user(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """
    Retrieves tickets based on the user's role:
    - Admin: Sees all tickets.
    - Agent: Sees tickets assigned to them.
    - User: Sees tickets they created.
    """
    if current_user.role == UserRole.admin:
        return ticket_ops.get_tickets(db, skip=skip, limit=limit)
    elif current_user.role == UserRole.agent:
        return ticket_ops.get_tickets(db, agent_id=current_user.id, skip=skip, limit=limit)
    else: # UserRole.user
        return ticket_ops.get_tickets(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{ticket_id}", response_model=ticket_schema.TicketOut)
def get_ticket_by_id(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """
    Get a single ticket by ID.
    Users can only see their own tickets.
    Agents can see tickets assigned to them.
    Admins can see all tickets.
    """
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check authorization
    if current_user.role == UserRole.admin:
        # Admin can see all tickets
        pass
    elif current_user.role == UserRole.agent:
        # Agent can see tickets assigned to them
        if db_ticket.agent_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    else:  # UserRole.user
        # User can only see their own tickets
        if db_ticket.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
    
    return db_ticket


@router.get("/stats/dashboard", response_model=ticket_schema.DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """
    Get dashboard statistics for admin users.
    Returns total tickets, resolved tickets, and pending tickets.
    """
    # Only allow admin users to access dashboard stats
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access dashboard statistics"
        )
    
    return ticket_ops.get_dashboard_stats(db)


@router.get("/stats/agent", response_model=ticket_schema.DashboardStats)
def get_agent_statistics(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """
    Get dashboard statistics for agent users.
    Returns agent's assigned tickets, resolved tickets, and pending tickets.
    """
    # Allow both admin and agent users to access agent stats
    if current_user.role not in [UserRole.agent, UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and agent users can access agent statistics"
        )
    
    return ticket_ops.get_agent_stats(db, current_user.id)


@router.get("/stats/enhanced")
def get_enhanced_dashboard_stats(
    days_back: int = 30,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """
    Get enhanced dashboard statistics with detailed analytics and charts data.
    Only accessible by admin users.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access enhanced statistics"
        )
    
    return ticket_ops.get_enhanced_dashboard_stats(db, days_back)


#create ticket if jwt is valid under user's id acquired from jwt


@router.patch("/{ticket_id}/status", response_model=ticket_schema.Ticket)
def update_ticket_status(
    ticket_id: int,
    status_update: ticket_schema.TicketUpdateStatus,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows Creator, Agent, or Admin to change a ticket's status."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Permission check: User must be admin, assigned agent, or creator
    is_admin = current_user.role == UserRole.admin
    is_assigned_agent = db_ticket.agent_id == current_user.id
    is_creator = db_ticket.user_id == current_user.id

    if not (is_admin or is_assigned_agent or is_creator):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this ticket")

    return ticket_ops.update_ticket_status(db, db_ticket=db_ticket, status=status_update.status)


@router.patch("/{ticket_id}/assign", response_model=ticket_schema.Ticket)
def admin_assign_ticket(
    ticket_id: int,
    assignment_data: dict,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows an admin to manually assign/reassign a ticket to an agent (override capability)."""
    # Only admins can use this override function
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manually assign tickets"
        )
    
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    agent_id = assignment_data.get("assigned_to")
    if agent_id is not None:
        # Validate that the assigned user is actually an agent
        agent = db.query(user_model.User).filter(
            user_model.User.id == agent_id,
            user_model.User.role == UserRole.agent
        ).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
    
    return ticket_ops.admin_assign_ticket(db, db_ticket=db_ticket, agent_id=agent_id)


#create ticket  
@router.post("/", response_model=ticket_schema.Ticket)
def create_ticket(
    ticket_data: ticket_schema.TicketCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows a user to create a new ticket."""
    if not db.query(Category).filter(Category.id == ticket_data.category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    
    return ticket_ops.create_ticket(db, ticket_data, current_user.id)


@router.post("/{ticket_id}/request/reopen", response_model=ticket_schema.Ticket)
def request_reopen_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows a user to reopen a closed ticket."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if db_ticket.status != TicketStatus.closed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket is not closed")
    
    return ticket_ops.request_reopen_ticket(db, db_ticket)

@router.get("/reopen/requests")
def get_reopen_requests(
    user_email: str | None = None,
    username: str | None = None,
    ticket_title: str | None = None,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can get reopen requests",
        )

    # Combine filters if needed
    search_query = user_email or username or ticket_title
    return ticket_ops.get_all_reopen_requests(db, search_query)


@router.post("/{ticket_id}/reopen", response_model=ticket_schema.Ticket)
def reopen_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows an admin to reopen a closed ticket."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)

    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Only admins can approve reopen requests
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can approve reopen requests")

    if db_ticket.status != TicketStatus.requested_reopen:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket is not requested to reopen")
        
    # Admin approves the reopen request
    return ticket_ops.accept_reopen_ticket(db, db_ticket)


@router.get("/search", response_model=List[ticket_schema.Ticket])
def search_tickets(
    search_query: str,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Search for tickets by title or user's name."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can search tickets")
    return ticket_ops.search_tickets(db, search_query)


@router.post("/{ticket_id}/note")
def create_ticket_note(
    ticket_id: int,
    note: ticket_note_create.TicketNoteCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows a agent to create a note for a ticket."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    if current_user.role != UserRole.agent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only agents can create notes")
    ticket_note = TicketNote(ticket_id=ticket_id, agent_id=current_user.id, note_content=note.note)
    return ticket_ops.create_ticket_note(db, ticket_note)


@router.get("/{ticket_id}/notes", response_model=List[ticket_note_create.TicketNoteOut])
def get_ticket_notes(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Get all notes for a ticket. Only accessible by agents."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    if current_user.role != UserRole.agent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only agents can view notes")
    
    return ticket_ops.get_ticket_notes(db, ticket_id)


@router.post("/{ticket_id}/request-resolution")
def request_ticket_resolution(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows an agent to request ticket resolution from admin."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Only the assigned agent can request resolution
    if current_user.role != UserRole.agent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only agents can request resolution")
    
    if db_ticket.agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned agent can request resolution")
    
    if db_ticket.status == TicketStatus.resolved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket is already resolved")
    
    # Update ticket status to indicate resolution requested
    return ticket_ops.request_ticket_resolution(db, db_ticket)


@router.post("/{ticket_id}/resolve")
def resolve_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows an admin to resolve a ticket."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Only admins can resolve tickets
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can resolve tickets")
    
    if db_ticket.status == TicketStatus.resolved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket is already resolved")
    
    # Resolve the ticket
    return ticket_ops.resolve_ticket(db, db_ticket, current_user.id)


@router.post("/{ticket_id}/close")
def close_ticket(
    ticket_id: int,
    resolution_note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows an assigned agent to close a ticket after resolving the issue."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Only assigned agent or admin can close tickets
    is_admin = current_user.role == UserRole.admin
    is_assigned_agent = db_ticket.agent_id == current_user.id
    
    if not (is_admin or is_assigned_agent):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only assigned agent or admin can close tickets")
    
    # Check if ticket is in a valid state to be closed
    valid_statuses = [TicketStatus.assigned, TicketStatus.in_progress, TicketStatus.transferred, TicketStatus.reopened]
    if db_ticket.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Ticket cannot be closed from status: {db_ticket.status.value}"
        )
    
    # Close the ticket
    return ticket_ops.close_ticket(db, db_ticket, current_user.id, resolution_note)


@router.post("/{ticket_id}/reopen")
def reopen_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """Allows an admin to reopen a resolved ticket."""
    db_ticket = ticket_ops.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Only admins can reopen tickets
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can reopen tickets")
    
    if db_ticket.status != TicketStatus.resolved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only resolved tickets can be reopened")
    
    # Reopen the ticket
    return ticket_ops.reopen_ticket(db, db_ticket)
   
