
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .category import CategoryNameOnlyOut, SubcategoryNameOnlyOut, Category, Subcategory

from .user import UserOut # Assuming you have a UserOut schema in schemas/user.py
from app.models.ticket import TicketStatus, TicketPriority # Import enums from the model

class TicketBase(BaseModel):
    title: str
    initial_description: str

class TicketCreate(TicketBase):
    category_id: int
    subcategory_id: Optional[int] = None

class TicketUpdateStatus(BaseModel):
    status: TicketStatus

class TicketTransferRequestCreate(BaseModel):
    to_agent_id: int
    reason: Optional[str] = None

class Ticket(TicketBase):
    id: int
    ticket_uid: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime
    user: UserOut
    agent: Optional[UserOut] = None
    category: Category
    subcategory: Optional[Subcategory] = None
    
    model_config = ConfigDict(from_attributes=True)

# Schema for the Admin Dashboard
class DashboardStats(BaseModel):
    total_users: int
    total_tickets: int
    resolved_tickets: int
    pending_tickets: int

# Enhanced Analytics Schemas
class TicketsByStatus(BaseModel):
    status: str
    count: int
    color: str

class TicketsByPriority(BaseModel):
    priority: str
    count: int
    color: str

class TicketsByCategory(BaseModel):
    category_name: str
    count: int
    percentage: float

class TicketTrend(BaseModel):
    date: str
    created: int
    resolved: int

class AgentPerformance(BaseModel):
    agent_name: str
    agent_id: int
    total_tickets: int
    resolved_tickets: int
    avg_resolution_time: Optional[float] = None
    performance_score: float

class TimeBasedStats(BaseModel):
    period: str  # 'hour', 'day', 'week', 'month'
    label: str
    tickets_created: int
    tickets_resolved: int

class EnhancedDashboardStats(BaseModel):
    basic_stats: DashboardStats
    tickets_by_status: List[TicketsByStatus]
    tickets_by_priority: List[TicketsByPriority]
    tickets_by_category: List[TicketsByCategory]
    ticket_trends: List[TicketTrend]
    agent_performance: List[AgentPerformance]
    time_based_stats: List[TimeBasedStats]

#out

#messages

class TicketOut(TicketBase):
    id: int
    ticket_uid: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime
    user: UserOut
    agent: Optional[UserOut] = None
    category: CategoryNameOnlyOut
    subcategory: Optional[SubcategoryNameOnlyOut] = None
    
    class Config:
        from_attributes = True
