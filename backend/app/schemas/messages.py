#message base
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    content: str
    ticket_id: int
    
    class Config:
        from_attributes = True

#message create
class MessageCreate(BaseModel):
    content: str
    ticket_id: int
    sender_id: int
    
    class Config:
        from_attributes = True

#message create request from frontend (without sender_id)
class MessageCreateRequest(BaseModel):
    content: str
    ticket_id: int
    
    class Config:
        from_attributes = True

#message out
class MessageOut(BaseModel):
    id: int
    content: str
    ticket_id: int
    sender_id: int
    sender_name: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

#Messages for ticket
#id, content, sender id, sender name,







