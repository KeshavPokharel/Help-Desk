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
from app.websocket_manager import manager
from datetime import datetime
import json

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
def send_message(message_data: MessageCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify the user has access to this ticket
    ticket = db.query(Ticket).filter(Ticket.id == message_data.ticket_id).first()
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
    
    # Create MessageCreate object with sender_id
    message_create = MessageCreate(
        content=message_data.content,
        ticket_id=message_data.ticket_id,
        sender_id=current_user.id
    )
    
    # Create the message
    new_message = message_ops.create_message(db, message_create)
    
    return new_message

@router.post("/send")
def send_message_request(message_request: MessageCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify the user has access to this ticket
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


# Room-based WebSocket endpoint for ticket-specific messaging
@router.websocket("/room/{ticket_id}")
async def ticket_room_websocket(websocket: WebSocket, ticket_id: int, db: Session = Depends(get_db)):
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return

    # Verify token and get user
    try:
        payload = security.decode_access_token(token)
        user_id: int | None = payload.get("sub")
        if user_id is None:
            await websocket.close(code=1008, reason="Invalid token")
            return
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return

    # Get current user
    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        await websocket.close(code=1008, reason="User not found")
        return

    # Fetch ticket and check authorization
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        await websocket.close(code=1008, reason="Ticket not found")
        return

    # Check permissions - only ticket creator (user) and assigned agent can join
    has_access = False
    if current_user.role == UserRole.user and ticket.user_id == current_user.id:
        has_access = True
    elif current_user.role == UserRole.agent and ticket.agent_id == current_user.id:
        has_access = True
    
    if not has_access:
        await websocket.close(code=1008, reason="Access denied to this ticket room")
        return

    # Join the ticket room
    await manager.join_ticket_room(websocket, ticket_id, current_user.id, current_user.name or current_user.email, current_user.role.value)
    
    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                
                # Validate message content
                if "content" not in message_data or not message_data["content"].strip():
                    continue
                
                # Create message in database
                message_create = MessageCreate(
                    ticket_id=ticket_id,
                    content=message_data["content"],
                    sender_id=current_user.id
                )
                
                new_message = message_ops.create_message(db, message_create)
                
                # Broadcast message to all users in this ticket room
                # new_message is a dictionary, not an object
                broadcast_message = {
                    "type": "message",
                    "id": new_message["id"],
                    "content": new_message["content"],
                    "sender_id": current_user.id,
                    "sender_name": current_user.name or current_user.email,
                    "sender_role": current_user.role.value,
                    "timestamp": new_message["timestamp"].isoformat() if hasattr(new_message["timestamp"], 'isoformat') else str(new_message["timestamp"]),
                    "ticket_id": ticket_id
                }
                
                await manager.broadcast_to_ticket_room(ticket_id, broadcast_message)
                
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                continue
            except Exception as e:
                print(f"Error processing message: {e}")
                continue
                
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        # Leave the ticket room
        manager.leave_ticket_room(websocket, ticket_id)


# Global WebSocket endpoint for real-time messaging across all tickets
@router.websocket("/ws")
async def global_websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return

    # Verify token and get user
    try:
        payload = security.decode_access_token(token)
        user_id: int | None = payload.get("sub")
        if user_id is None:
            await websocket.close(code=1008, reason="Invalid token")
            return
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return

    # Get current user
    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        await websocket.close(code=1008, reason="User not found")
        return

    # Connect to global chat
    await manager.connect_global(websocket, current_user.id, current_user.name or current_user.email, current_user.role.value)
    
    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                
                # Validate message content and ticket_id
                if "content" not in message_data or not message_data["content"].strip():
                    continue
                if "ticket_id" not in message_data:
                    continue
                    
                ticket_id = message_data["ticket_id"]
                
                # Fetch ticket and check authorization
                ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
                if not ticket:
                    continue

                # Check permissions for this specific ticket
                has_access = False
                if current_user.role == UserRole.user and ticket.user_id == current_user.id:
                    has_access = True
                elif current_user.role == UserRole.agent and ticket.agent_id == current_user.id:
                    has_access = True
                # Admins still cannot send messages in private conversations
                
                if not has_access:
                    continue
                
                # Create message in database
                message_create = MessageCreate(
                    ticket_id=ticket_id,
                    content=message_data["content"],
                    sender_id=current_user.id
                )
                
                new_message = message_ops.create_message(db, message_create)
                
                # Broadcast message to all connected users (they will filter by ticket_id on frontend)
                broadcast_message = {
                    "type": "message",
                    "id": new_message.id,
                    "content": new_message.content,
                    "sender_id": current_user.id,
                    "sender_name": current_user.name or current_user.email,
                    "sender_role": current_user.role.value,
                    "timestamp": new_message.created_at.isoformat(),
                    "ticket_id": ticket_id
                }
                
                await manager.broadcast_global(broadcast_message)
                
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                continue
            except Exception as e:
                print(f"Error processing message: {e}")
                continue
                
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        # Disconnect from global chat
        manager.disconnect_global(websocket)


@router.websocket("/{ticket_id}")
async def websocket_endpoint(websocket: WebSocket, ticket_id: int, db: Session = Depends(get_db)):
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing authentication token")
        return

    # Verify token and get user
    try:
        payload = security.decode_access_token(token)
        user_id: int | None = payload.get("sub")
        if user_id is None:
            await websocket.close(code=1008, reason="Invalid token")
            return
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return

    # Get current user
    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        await websocket.close(code=1008, reason="User not found")
        return

    # Fetch ticket and check authorization
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        await websocket.close(code=1008, reason="Ticket not found")
        return

    # Check permissions
    if current_user.role == UserRole.user and ticket.user_id != current_user.id:
        await websocket.close(code=1008, reason="Access denied")
        return
    if current_user.role == UserRole.agent and ticket.agent_id != current_user.id:
        await websocket.close(code=1008, reason="Access denied")
        return
    if current_user.role == UserRole.admin:
        await websocket.close(code=1008, reason="Admins cannot access private conversations")
        return

    # Connect to the chat room
    await manager.connect(websocket, ticket_id, current_user.id, current_user.name or current_user.email, current_user.role.value)
    
    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                
                # Validate message content
                if "content" not in message_data or not message_data["content"].strip():
                    continue
                
                # Create message in database
                message_create = MessageCreate(
                    ticket_id=ticket_id,
                    content=message_data["content"],
                    sender_id=current_user.id
                )
                
                new_message = message_ops.create_message(db, message_create)
                
                # Broadcast message to all users in the ticket
                broadcast_message = {
                    "type": "message",
                    "id": new_message.id,
                    "content": new_message.content,
                    "sender_id": current_user.id,
                    "sender_name": current_user.name or current_user.email,
                    "sender_role": current_user.role.value,
                    "timestamp": new_message.created_at.isoformat(),
                    "ticket_id": ticket_id
                }
                
                await manager.broadcast_to_ticket(ticket_id, broadcast_message)
                
            except json.JSONDecodeError:
                # Invalid JSON, ignore
                continue
            except Exception as e:
                print(f"Error processing message: {e}")
                continue
                
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        # Disconnect from the chat room
        manager.disconnect(websocket, ticket_id)

# Get online users for a ticket
@router.get("/{ticket_id}/online-users")
def get_online_users(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify access to ticket
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check permissions
    if current_user.role == UserRole.user and ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.agent and ticket.agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return manager.get_ticket_users(ticket_id)