from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .user import UserOut

class TicketNoteCreate(BaseModel):
    note: str
    
    
class TicketNoteUpdate(BaseModel):
    note: Optional[str] = None


#out

class TicketNoteOut(BaseModel):
    id: int
    note_content: str
    ticket_id: int
    agent_id: int
    agent: UserOut
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
