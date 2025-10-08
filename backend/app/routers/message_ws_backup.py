#websocket message router

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.operations import message as message_ops
from app.schemas.messages import MessageCreate, MessageCreateRequest
from app.models.user import User, UserRole
from app.models.ticket import Ticket
from app.models.message import Message
from fastapi import WebSocket, status
from jose import JWTError, jwt
from app.core import security

#http exception
from fastapi import HTTPException

from app.dependencies import get_current_user, get_current_agent, get_current_admin

from fastapi import WebSocket

router = APIRouter(prefix="/messages", tags=["Messages"])

#load all messages for ticket_id 

@router.get("/{ticket_id}")
def get_messages(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Only allow access to:
    # 1. The user who created the ticket
    # 2. The agent assigned to the ticket
    # 3. Admins are NOT allowed to see private messages between users and agents
    if current_user.role == UserRole.user and ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this ticket.")
    if current_user.role == UserRole.agent and ticket.agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this ticket.")
    if current_user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot view private messages between users and agents.")
    
    return message_ops.get_old_messages_for_ticket_id(db, ticket.id)


# HTTP POST endpoint for sending messages
@router.post("/")
def send_message(message_data: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify the user has access to this ticket
    ticket = db.query(Ticket).filter(Ticket.id == message_data.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check permissions - only users and agents can send messages, not admins
    if current_user.role == UserRole.user and ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this ticket.")
    if current_user.role == UserRole.agent and ticket.agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this ticket.")
    if current_user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot send messages in private conversations.")
    
    # Create the message with the current user as sender
    message_create = MessageCreate(
        ticket_id=message_data.ticket_id,
        content=message_data.content,
        sender_id=current_user.id
    )
    
    return message_ops.create_message(db, message_create)


# HTTP POST endpoint for sending messages
@router.post("/")
def send_message(
    message_request: MessageCreateRequest,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Check if ticket exists and user has permission
    ticket = db.query(Ticket).filter(Ticket.id == message_request.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check if ticket is assigned to an agent
    if not ticket.agent_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send messages to unassigned tickets")
    
    # Check permissions - only users and agents can send messages, not admins
    if current_user.role == UserRole.user and ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this ticket.")
    if current_user.role == UserRole.agent and ticket.agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this ticket.")
    if current_user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot send messages in private conversations.")
    
    # Create the message with the current user as sender
    message_create = MessageCreate(
        ticket_id=message_request.ticket_id,
        content=message_request.content,
        sender_id=current_user.id
    )
    
    return message_ops.create_message(db, message_create)


# @router.websocket("/{ticket_id}")
# async def websocket_endpoint(websocket: WebSocket, ticket_id: int, message_data: MessageCreate, db: Session = Depends(get_db), ):
#     await websocket.accept()
#     while True:
#         data = await websocket.receive_text()
       
#         await websocket.send_text(f"Message text was: {data}")  


@router.websocket("/{ticket_id}")
async def websocket_endpoint(websocket: WebSocket, ticket_id: int, db: Session = Depends(get_db)):
    await websocket.accept()

    # Get token from query params or headers
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    # Use your existing token verification logic
    try:
        payload = security.decode_access_token(token)
        user_id: int | None = payload.get("sub")
        if user_id is None:
            await websocket.close(code=1008)
            return
       
    except JWTError:
        await websocket.close(code=1008)
        return

    # Get current_user manually (reuse DB + user_id)
    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        await websocket.close(code=1008)
        return

    # Fetch ticket and check authorization
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    print("Ticket:", ticket.ticket_uid)
    if not ticket:
        
        await websocket.close(code=1008)
        return

    if current_user.role == UserRole.user and ticket.user_id != current_user.id:
        
        await websocket.close(code=1008)
        return
    if current_user.role == UserRole.agent and ticket.agent_id != current_user.id:
        
        await websocket.close(code=1008)
        return
    # Admins pass automatically

    while True:
        try:
            data = await websocket.receive_json()
            message = MessageCreate(**data)

            if message.ticket_id != ticket.id:
                print("Ticket ID mismatch")
                break

            new_message = Message(
                ticket_id=message.ticket_id,
                content=message.content,
                sender_id=current_user.id,
                )
            
            db.add(new_message)
            db.commit()
            db.refresh(new_message)
            await websocket.send_json({"message": new_message.content, "sender_name": current_user.name, "sender_id": current_user.id})
        except Exception as e:
            print(f"WebSocket error: {e}")
            break
