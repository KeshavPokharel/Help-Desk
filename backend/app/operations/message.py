
from app.models.message import Message
from app.models.user import User
from sqlalchemy.orm import Session, joinedload
from app.schemas.messages import MessageCreate, MessageOut, MessageCreateRequest

def message_to_dict(message: Message) -> dict:
    """Convert a Message object to a dictionary with sender_name"""
    return {
        "id": message.id,
        "ticket_id": message.ticket_id,
        "sender_id": message.sender_id,
        "sender_name": message.sender.name if message.sender else "Unknown",
        "content": message.content,
        "timestamp": message.timestamp,
        "created_at": message.timestamp  # For compatibility with frontend
    }

# get old messages for ticket_id 
def get_old_messages_for_ticket_id(db: Session, ticket_id: int):
    messages = db.query(Message).options(joinedload(Message.sender)).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp.asc()).all()
    return [message_to_dict(message) for message in messages]

# create message
def create_message(db: Session, message_data: MessageCreate):
    # Create message with sender_id
    db_message = Message(
        ticket_id=message_data.ticket_id,
        content=message_data.content,
        sender_id=message_data.sender_id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    # Load the sender relationship to get sender name
    db_message = db.query(Message).options(joinedload(Message.sender)).filter(Message.id == db_message.id).first()
    return message_to_dict(db_message)

