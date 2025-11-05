# backend/app/routers/call_ws.py
"""
WebRTC Call Signaling Router
Handles WebSocket connections for voice/video calling between agents and users
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.ticket import Ticket
from app.dependencies import get_current_user
from jose import JWTError, jwt
from app.core import security
from typing import Dict, Set
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calls", tags=["Calls"])

# Store active call connections: ticket_id -> {user_ws, agent_ws}
active_calls: Dict[int, Dict[str, WebSocket]] = {}

# Store user to ticket mapping: user_id -> set of ticket_ids
user_tickets: Dict[int, Set[int]] = {}


async def get_current_user_from_token(token: str, db: Session) -> User:
    """Extract and validate user from JWT token"""
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        return user
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except ValueError as e:
        logger.error(f"Invalid user ID format: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")


@router.websocket("/ws/{ticket_id}")
async def call_websocket(
    websocket: WebSocket,
    ticket_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for WebRTC signaling
    Handles offer, answer, and ICE candidate exchange
    """
    await websocket.accept()
    
    try:
        # Authenticate user
        logger.info(f"WebSocket connection attempt for ticket {ticket_id}")
        current_user = await get_current_user_from_token(token, db)
        logger.info(f"User authenticated: {current_user.id} ({current_user.role})")
        
        # Verify ticket exists and user has access
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            logger.warning(f"Ticket {ticket_id} not found")
            await websocket.send_json({"type": "error", "message": "Ticket not found"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Check if ticket is assigned
        if not ticket.agent_id:
            await websocket.send_json({"type": "error", "message": "Ticket not assigned to an agent"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify user has permission (either ticket owner or assigned agent)
        is_user = current_user.role == UserRole.user and ticket.user_id == current_user.id
        is_agent = current_user.role == UserRole.agent and ticket.agent_id == current_user.id
        
        if not (is_user or is_agent):
            await websocket.send_json({"type": "error", "message": "Not authorized for this call"})
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Initialize ticket in active calls if not exists
        if ticket_id not in active_calls:
            active_calls[ticket_id] = {}
        
        # Determine role and store connection
        role = "user" if is_user else "agent"
        active_calls[ticket_id][role] = websocket
        
        # Track user tickets
        if current_user.id not in user_tickets:
            user_tickets[current_user.id] = set()
        user_tickets[current_user.id].add(ticket_id)
        
        logger.info(f"User {current_user.id} ({role}) connected to call for ticket {ticket_id}")
        
        # Notify the other party that someone joined
        other_role = "agent" if role == "user" else "user"
        if other_role in active_calls[ticket_id]:
            await active_calls[ticket_id][other_role].send_json({
                "type": "peer-connected",
                "role": role,
                "userId": current_user.id,
                "userName": current_user.name
            })
        
        # Send connection success
        await websocket.send_json({
            "type": "connected",
            "role": role,
            "ticketId": ticket_id,
            "peerOnline": other_role in active_calls[ticket_id]
        })
        
        # Handle signaling messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            logger.info(f"Received signal from {role}: {message.get('type')}")
            
            # Forward signaling messages to the other peer
            if other_role in active_calls[ticket_id]:
                peer_ws = active_calls[ticket_id][other_role]
                message_data = {
                    **message,
                    "from": role,
                    "fromUserId": current_user.id,
                    "fromUserName": current_user.name
                }
                
                # Add extra metadata for offer messages
                if message.get("type") == "offer":
                    message_data["callerId"] = current_user.id
                    message_data["callerName"] = current_user.name
                    message_data["callerRole"] = role
                    message_data["ticketId"] = ticket_id
                    message_data["callType"] = message.get("callType", "audio")
                
                await peer_ws.send_json(message_data)
            else:
                # Peer not connected
                if message.get("type") in ["offer", "answer", "ice-candidate"]:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Peer not connected"
                    })
    
    except WebSocketDisconnect:
        logger.info(f"User {current_user.id} disconnected from call for ticket {ticket_id}")
    except Exception as e:
        logger.error(f"Error in call websocket: {str(e)}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        # Cleanup
        try:
            if ticket_id in active_calls:
                # Remove this connection
                if "user" in active_calls[ticket_id] and active_calls[ticket_id]["user"] == websocket:
                    del active_calls[ticket_id]["user"]
                    role = "user"
                elif "agent" in active_calls[ticket_id] and active_calls[ticket_id]["agent"] == websocket:
                    del active_calls[ticket_id]["agent"]
                    role = "agent"
                else:
                    role = "unknown"
                
                # Notify the other party
                other_role = "agent" if role == "user" else "user"
                if other_role in active_calls[ticket_id]:
                    try:
                        await active_calls[ticket_id][other_role].send_json({
                            "type": "peer-disconnected",
                            "role": role
                        })
                    except:
                        pass
                
                # Remove ticket if no one is connected
                if not active_calls[ticket_id]:
                    del active_calls[ticket_id]
            
            # Cleanup user tickets
            if current_user.id in user_tickets:
                user_tickets[current_user.id].discard(ticket_id)
                if not user_tickets[current_user.id]:
                    del user_tickets[current_user.id]
        except:
            pass


@router.get("/status/{ticket_id}")
def get_call_status(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current call status for a ticket"""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permissions
    is_user = current_user.role == UserRole.user and ticket.user_id == current_user.id
    is_agent = current_user.role == UserRole.agent and ticket.agent_id == current_user.id
    
    if not (is_user or is_agent):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if call is active
    is_active = ticket_id in active_calls and len(active_calls[ticket_id]) > 0
    participants = list(active_calls.get(ticket_id, {}).keys())
    
    return {
        "ticketId": ticket_id,
        "isActive": is_active,
        "participants": participants,
        "canCall": ticket.agent_id is not None
    }
