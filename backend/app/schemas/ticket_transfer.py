from pydantic import BaseModel, validator
from app.models.ticket_transfer import TransferStatus
from datetime import datetime
from typing import Optional
from app.schemas.user import UserOut
from app.schemas.ticket import TicketOut

#ticket transfer 
class TicketTransferRequest(BaseModel):
    id: int
    ticket_id: int
    from_agent_id: int
    to_agent_id: int
    request_reason: str
    status: TransferStatus
    requested_at: Optional[datetime] = None
    resolved_by_admin_id: Optional[int] = None
    resolved_at: Optional[datetime] = None
    
    # Related objects
    ticket: Optional[TicketOut] = None
    from_agent: Optional[UserOut] = None
    to_agent: Optional[UserOut] = None
    resolved_by_admin: Optional[UserOut] = None
    
    # For frontend compatibility
    requested_by: Optional[UserOut] = None
    reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        
    @validator('requested_by', pre=False, always=True)
    def set_requested_by(cls, v, values):
        return values.get('from_agent')
        
    @validator('reason', pre=False, always=True)  
    def set_reason(cls, v, values):
        return values.get('request_reason')
        
    @validator('created_at', pre=False, always=True)
    def set_created_at(cls, v, values):
        return values.get('requested_at')


class TicketTransferRequestUpdate(BaseModel):
    status: TransferStatus

    class Config:
        orm_mode = True
