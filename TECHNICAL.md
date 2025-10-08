# Help Desk System - Technical Documentation

## 🏗️ System Architecture

### Overview
The Help Desk System is a full-stack application with a microservices-like architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   User Portal   │    │   Backend API   │
│   (React SPA)   │    │   (React SPA)   │    │   (FastAPI)     │
│   Port: 5173    │    │   Port: 5174    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   Port: 5432    │
                    └─────────────────┘
```

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │       │  Categories │       │   Tickets   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)     │──┐    │ id (PK)     │
│ name        │  │    │ name        │  │    │ title       │
│ email       │  │    │ description │  │    │ description │
│ password    │  │    │ created_at  │  │    │ status      │
│ role        │  │    └─────────────┘  │    │ priority    │
│ created_at  │  │                     │    │ user_id(FK)─┼──┘
└─────────────┘  │    ┌─────────────┐  │    │ agent_id(FK)│
                 │    │Subcategories│  │    │ category_id │
                 │    ├─────────────┤  │    │ created_at  │
                 │    │ id (PK)     │  │    └─────────────┘
                 │    │ name        │  │
                 │    │ category_id─┼──┘
                 │    │ created_at  │
                 │    └─────────────┘
                 │
                 │    ┌─────────────┐       ┌─────────────┐
                 │    │  Messages   │       │Ticket Notes │
                 │    ├─────────────┤       ├─────────────┤
                 └────┼─sender_id   │       │ id (PK)     │
                      │ ticket_id   │       │ ticket_id   │
                      │ content     │       │ note        │
                      │ timestamp   │       │ created_by  │
                      └─────────────┘       │ created_at  │
                                           └─────────────┘
```

### Table Definitions

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'agent', 'admin')),
    profile_photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tickets Table
```sql
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    user_id INTEGER REFERENCES users(id),
    agent_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Backend Architecture

### Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── auth.py                    # Authentication router
│   ├── database.py                # Database configuration
│   ├── dependencies.py            # FastAPI dependencies
│   ├── cli/
│   │   └── create_admin.py        # Admin creation CLI
│   ├── core/
│   │   ├── constants.py           # Application constants
│   │   ├── security.py            # Security utilities
│   │   └── seed_category.py       # Database seeding
│   ├── models/                    # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── ticket.py
│   │   ├── category.py
│   │   ├── message.py
│   │   └── ...
│   ├── operations/                # Business logic
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── ticket.py
│   │   └── ...
│   ├── routers/                   # API endpoints
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── ticket.py
│   │   ├── message_ws.py          # WebSocket handlers
│   │   └── ...
│   └── schemas/                   # Pydantic models
│       ├── user.py
│       ├── ticket.py
│       └── ...
├── alembic/                       # Database migrations
├── migrations/                    # Alternative migration setup
├── main.py                        # Application entry point
├── requirements.txt               # Python dependencies
└── alembic.ini                    # Alembic configuration
```

### Key Components

#### Authentication System
- **JWT Token Based**: Uses python-jose for token generation/validation
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access**: Three roles with different permissions
- **Token Expiration**: Configurable token lifetime

#### WebSocket Manager
```python
# app/websocket_manager.py
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.ticket_rooms: Dict[int, List[WebSocket]] = {}
    
    async def connect_global(self, websocket: WebSocket, user_id: int, username: str, role: str):
        # Global connection management
    
    async def broadcast_global(self, message: dict):
        # Broadcast to all connected clients
    
    async def broadcast_to_ticket_room(self, ticket_id: int, message: dict):
        # Broadcast to specific ticket room
```

#### Database Operations
- **CRUD Operations**: Centralized in `operations/` directory
- **Query Optimization**: Uses SQLAlchemy ORM with relationship loading
- **Transaction Management**: Automatic rollback on errors
- **Connection Pooling**: Configured for concurrent access

## 💻 Frontend Architecture

### React Application Structure
```
src/
├── components/
│   ├── charts/                    # Chart.js components
│   │   ├── PieChart.jsx
│   │   ├── BarChart.jsx
│   │   ├── LineChart.jsx
│   │   └── DoughnutChart.jsx
│   ├── layout/                    # Layout components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   └── common/                    # Reusable components
├── context/                       # React Context providers
│   ├── AuthContext.jsx
│   └── WebSocketContext.jsx
├── pages/                         # Main application pages
├── services/                      # API service layer
├── hooks/                         # Custom React hooks
├── utils/                         # Utility functions
└── App.jsx                        # Main application component
```

### State Management Strategy

#### Authentication Context
```jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Authentication methods
  const login = async (credentials) => { /* ... */ };
  const logout = () => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### WebSocket Context
```jsx
const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const messageListeners = useRef(new Set());
  
  const connectWebSocket = useCallback(() => {
    // WebSocket connection logic
  }, []);
  
  const addMessageListener = useCallback((listener) => {
    messageListeners.current.add(listener);
    return () => messageListeners.current.delete(listener);
  }, []);
  
  return (
    <WebSocketContext.Provider value={{ isConnected, addMessageListener }}>
      {children}
    </WebSocketContext.Provider>
  );
};
```

### Chart Integration

#### Chart.js Configuration
```jsx
// components/charts/PieChart.jsx
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PieChart = ({ data, title }) => {
  const chartData = {
    labels: data.labels,
    datasets: [{
      data: data.values,
      backgroundColor: [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: title }
    }
  };
  
  return <Pie data={chartData} options={options} />;
};
```

## 🔌 API Design

### RESTful Endpoints

#### Authentication
```
POST   /auth/login           # User authentication
POST   /auth/register        # User registration
POST   /auth/refresh         # Token refresh
```

#### User Management
```
GET    /users/               # List users (Admin only)
POST   /users/add_user       # Create user (Admin only)
GET    /users/{id}           # Get user details
PUT    /users/{id}           # Update user
DELETE /users/{id}           # Delete user (Admin only)
POST   /users/change-password # Change password
```

#### Ticket Operations
```
GET    /tickets/             # List tickets (filtered by role)
POST   /tickets/             # Create new ticket
GET    /tickets/{id}         # Get ticket details
PUT    /tickets/{id}         # Update ticket
PUT    /tickets/{id}/close   # Close ticket
POST   /tickets/{id}/reopen  # Reopen ticket
POST   /tickets/{id}/assign  # Assign to agent
```

#### Messaging
```
GET    /messages/{ticket_id} # Get ticket messages
POST   /messages/            # Send message
WS     /messages/ws          # Global WebSocket
WS     /messages/room/{id}   # Ticket-specific WebSocket
```

#### Analytics
```
GET    /tickets/stats/enhanced  # Dashboard statistics
GET    /tickets/stats/trends    # Trend analysis
GET    /categories/stats        # Category statistics
```

### WebSocket Message Protocol

#### Message Types
```javascript
// New message
{
  type: "message",
  id: 123,
  ticket_id: 456,
  sender_id: 789,
  sender_name: "John Doe",
  sender_role: "user",
  content: "Hello, I need help",
  timestamp: "2023-12-01T10:30:00Z"
}

// User joined
{
  type: "user_joined",
  user_id: 789,
  user_name: "John Doe",
  ticket_id: 456
}

// User left
{
  type: "user_left",
  user_id: 789,
  user_name: "John Doe",
  ticket_id: 456
}

// System notification
{
  type: "notification",
  message: "Ticket assigned to you",
  ticket_id: 456,
  priority: "high"
}
```

## 🔐 Security Implementation

### Authentication Flow
```
1. User submits credentials → /auth/login
2. Server validates credentials
3. Server generates JWT token
4. Client stores token (localStorage/sessionStorage)
5. Client includes token in Authorization header
6. Server validates token on each request
7. Server returns user context
```

### Authorization Middleware
```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

### Role-based Access Control
```python
def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def get_current_agent(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.agent, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Agent access required")
    return current_user
```

## 🧪 Testing Strategy

### Backend Testing
```bash
# Unit tests
pytest tests/test_auth.py
pytest tests/test_tickets.py

# Integration tests
pytest tests/test_api.py

# Database tests
pytest tests/test_models.py
```

### Frontend Testing
```bash
# Component tests
npm test -- components/

# Integration tests
npm test -- pages/

# E2E tests (if configured)
npm run test:e2e
```

## 📊 Performance Considerations

### Database Optimization
- **Indexing**: Primary keys, foreign keys, and query columns
- **Query Optimization**: Use of `joinedload` for relationships
- **Connection Pooling**: SQLAlchemy connection management
- **Pagination**: Implemented on large data sets

### Frontend Optimization
- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Cloudinary integration
- **Caching**: React Query for data caching
- **Bundle Optimization**: Vite build optimization

### WebSocket Optimization
- **Connection Management**: Automatic reconnection logic
- **Message Filtering**: Client-side filtering to reduce processing
- **Room-based Broadcasting**: Targeted message delivery
- **Error Handling**: Graceful degradation on connection issues

## 🚀 Deployment Architecture

### Production Setup
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Docker        │    │   PostgreSQL    │
│ Reverse Proxy   │    │  Containers     │    │   Cluster       │
│   Load Balancer │    │                 │    │   (Primary +    │
│   SSL/TLS       │    │ ┌─────────────┐ │    │    Replica)     │
└─────────────────┘    │ │   FastAPI   │ │    └─────────────────┘
         │              │ │   Backend   │ │
         │              │ └─────────────┘ │
         │              │ ┌─────────────┐ │
         │              │ │   React     │ │
         │              │ │  Frontends  │ │
         │              │ └─────────────┘ │
         │              └─────────────────┘
         │
┌─────────────────┐
│   Monitoring    │
│   Logging       │
│   Analytics     │
└─────────────────┘
```

### Environment Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/helpdesk
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - postgres
  
  frontend:
    build: ./admin-frontend
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
  
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=helpdesk
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## 🔧 Development Tools

### Code Quality
- **ESLint**: JavaScript/React linting
- **Prettier**: Code formatting
- **Black**: Python code formatting
- **mypy**: Python type checking

### Development Workflow
```bash
# Pre-commit hooks
pip install pre-commit
pre-commit install

# Code formatting
black backend/
prettier --write frontend/src/

# Type checking
mypy backend/app/
```

## 📈 Monitoring & Logging

### Application Monitoring
- **Health Checks**: API endpoint monitoring
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Exception monitoring
- **WebSocket Monitoring**: Connection status tracking

### Logging Strategy
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

---
