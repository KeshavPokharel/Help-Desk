# Help Desk System

A comprehensive full-stack help desk ticketing system built with FastAPI backend and React frontends, featuring real-time messaging, role-based access control, and interactive analytics.

## 🏗️ System Architecture

```
Help Desk System/
├── backend/                 # FastAPI Python backend
├── admin-frontend/          # React admin interface  
├── user-frontend/          # React user interface
└── README.md               # This file
```

## 🚀 Features

### Core Functionality
- **Multi-role System**: Admin, Agent, and User roles with specific permissions
- **Ticket Management**: Create, assign, transfer, and track support tickets
- **Real-time Messaging**: WebSocket-powered chat between users and agents
- **Category Management**: Organize tickets by categories and subcategories
- **Agent Assignment**: Automatic and manual ticket assignment to agents
- **Interactive Analytics**: Chart.js powered dashboard with ticket statistics

### Advanced Features
- **JWT Authentication**: Secure token-based authentication
- **File Upload Support**: Cloudinary integration for attachments
- **Database Migrations**: Alembic-powered database schema management
- **Responsive Design**: TailwindCSS for modern, mobile-first UI
- **Real-time Updates**: Live notifications and message updates
- **Role-based Access Control**: Granular permissions system
- **WebRTC Video/Audio Calling**: Real-time voice and video calls between users and agents
  - Audio and video call support
  - In-call controls (mute, video toggle, end call)
  - Incoming call notifications with accept/reject options
  - Dynamic video upgrade (start audio-only, switch to video mid-call)
  - Call duration timer
  - Picture-in-picture local video preview
  - Minimizable call modal

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt/passlib
- **WebSockets**: FastAPI WebSocket support (messaging + WebRTC signaling)
- **File Storage**: Cloudinary
- **Server**: Uvicorn

### Frontend (Both Admin & User)
- **Framework**: React 19.1.1
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4.1.13
- **Charts**: Chart.js 4.5.0 + react-chartjs-2
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM 7.9.1
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios
- **WebSockets**: react-use-websocket
- **WebRTC**: Native RTCPeerConnection API for peer-to-peer calls
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **PostgreSQL 12+** database server
- **Git** for version control

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Help Desk"
```

### 2. Database Setup
```bash
# Install PostgreSQL and create database
createdb helpdesk

# Or using PostgreSQL commands:
psql -U postgres
CREATE DATABASE helpdesk;
\q
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Edit .env file with your database credentials:
DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/helpdesk

# Run database migrations
alembic upgrade head

# Start the backend server
python main.py
```

The backend will be available at: http://localhost:8000

### 4. Admin Frontend Setup
```bash
cd admin-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The admin frontend will be available at: http://localhost:5173

### 5. User Frontend Setup
```bash
cd user-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The user frontend will be available at: http://localhost:5174

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql+psycopg2://username:password@host:port/database_name

# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=2880

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Database Configuration

The system uses PostgreSQL as the primary database. Default configuration:

- **Host**: localhost
- **Port**: 5432 (or 5566 in development)
- **Database**: helpdesk
- **User**: postgres

Update the `DATABASE_URL` in your `.env` file or `backend/app/database.py` for different configurations.

## 👥 User Roles & Permissions

### Admin
- **Dashboard**: View system-wide analytics and charts
- **User Management**: Create, edit, delete users and agents
- **Category Management**: Manage ticket categories and subcategories
- **Agent Assignment**: Assign agents to categories
- **System Configuration**: Access to all system settings

### Agent
- **Ticket Management**: View and manage assigned tickets
- **Messaging**: Chat with users on assigned tickets
- **Ticket Operations**: Close, reopen, transfer tickets
- **Category Access**: Only tickets in assigned categories

### User
- **Ticket Creation**: Create new support tickets
- **Ticket Tracking**: View own ticket status and history
- **Messaging**: Chat with assigned agents
- **Profile Management**: Update personal information

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts with role-based access
- **categories**: Ticket categories for organization
- **subcategories**: Subcategory classification
- **tickets**: Main ticket entities with status tracking
- **messages**: Real-time chat messages
- **ticket_transfers**: Ticket transfer history
- **agent_category_assignments**: Agent-category mappings

### Key Relationships
- Users can create multiple tickets
- Agents are assigned to specific categories
- Tickets belong to categories and have assigned agents
- Messages are linked to tickets and users

## 🔌 API Endpoints

### Authentication
```
POST /auth/login          # User login
POST /auth/register       # User registration
```

### User Management
```
GET  /users/              # List all users (Admin)
POST /users/add_user      # Create new user (Admin)
GET  /users/{user_id}     # Get user details
PUT  /users/{user_id}     # Update user
```

### Ticket Management
```
GET  /tickets/            # List tickets
POST /tickets/            # Create ticket
GET  /tickets/{id}        # Get ticket details
PUT  /tickets/{id}/close  # Close ticket
POST /tickets/{id}/reopen # Reopen ticket
```

### Messaging
```
WS   /messages/ws/{ticket_id}  # Real-time chat WebSocket
GET  /messages/{ticket_id}     # Get message history
```

### WebRTC Calling
```
WS   /calls/ws/{ticket_id}     # WebRTC signaling WebSocket
                                # Supports: offer, answer, ICE candidates
                                # Peer connection notifications
```
GET  /messages/{ticket_id}     # Get ticket messages
POST /messages/               # Send message
WS   /messages/ws             # WebSocket connection
```

### Analytics
```
GET  /tickets/stats/enhanced  # Dashboard statistics
```

## 🌐 WebSocket Integration

The system uses WebSocket connections for real-time features:

### Connection Endpoints
- **Messaging**: `ws://localhost:8000/messages/ws?token=<jwt_token>`
- **Ticket Chat**: `ws://localhost:8000/messages/room/{ticket_id}?token=<jwt_token>`
- **WebRTC Signaling**: `ws://localhost:8000/calls/ws/{ticket_id}?token=<jwt_token>`

### Message Types

#### Messaging WebSocket
- **message**: New chat message
- **user_joined**: User joined chat
- **user_left**: User left chat
- **notification**: System notifications

#### WebRTC Signaling WebSocket
- **connected**: WebSocket connection established
- **peer-connected**: Another user joined the call
- **peer-disconnected**: Another user left the call
- **offer**: WebRTC offer (SDP)
- **answer**: WebRTC answer (SDP)
- **ice-candidate**: ICE candidate for NAT traversal
- **call-rejected**: Call was declined by recipient

## 📞 WebRTC Calling Feature

### How It Works
1. **Call Initiation**: User/Agent clicks call button on ticket detail page
2. **WebSocket Connection**: Establishes signaling channel via WebSocket
3. **Incoming Call**: Recipient sees modal with accept/decline options
4. **WebRTC Handshake**: Exchange of SDP offers/answers and ICE candidates
5. **P2P Connection**: Direct peer-to-peer audio/video stream
6. **In-Call Controls**: Mute, video toggle, end call, minimize modal

### Requirements
- **Microphone**: Required for audio calls
- **Camera**: Optional for video calls
- **Browser Support**: Modern browsers with WebRTC support (Chrome, Firefox, Edge, Safari)
- **Network**: STUN server for NAT traversal (using Google's public STUN servers)

### Features
- ✅ Audio-only calls
- ✅ Video calls with camera
- ✅ Mid-call video upgrade (start audio, enable video later)
- ✅ Mute/unmute microphone
- ✅ Enable/disable video
- ✅ Call duration timer (MM:SS format)
- ✅ Incoming call notifications
- ✅ Accept/reject incoming calls
- ✅ Minimizable call window
- ✅ Picture-in-picture local video

### Technical Details
- **Signaling**: WebSocket-based signaling server
- **NAT Traversal**: STUN servers (stun.l.google.com:19302)
- **Media Constraints**: Audio always enabled, video optional
- **Peer Connection**: RTCPeerConnection API
- **Audio/Video Tracks**: MediaStream API


## 📊 Chart & Analytics Features

The admin dashboard includes interactive charts powered by Chart.js:

### Available Charts
- **Pie Chart**: Ticket distribution by status
- **Bar Chart**: Tickets by category
- **Line Chart**: Ticket trends over time
- **Doughnut Chart**: Priority distribution

### Chart Components
Located in `admin-frontend/src/components/charts/`:
- `PieChart.jsx`
- `BarChart.jsx`
- `LineChart.jsx`
- `DoughnutChart.jsx`

## 🛠️ Development Commands

### Backend Commands
```bash
# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1

# Create admin user
python -m app.cli.create_admin

# Run development server
python main.py

# Run with hot reload
uvicorn main:app --reload
```

### Frontend Commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🚀 Production Deployment

### Backend Deployment
1. Set production environment variables
2. Use a production WSGI server (Gunicorn + Uvicorn)
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates
5. Use production database

### Frontend Deployment
1. Build the applications: `npm run build`
2. Serve static files with web server
3. Configure environment-specific API URLs
4. Set up CDN for static assets

### Docker Deployment (Optional)
Create Dockerfiles for each service and use Docker Compose for orchestration.

## 🔍 Troubleshooting

### Common Issues

**Backend won't start**
- Check database connection string
- Ensure PostgreSQL is running
- Verify virtual environment is activated

**Frontend build errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are installed

**WebSocket connection fails**
- Verify backend is running on correct port
- Check CORS configuration
- Ensure JWT token is valid
- For WebRTC calls: Check browser permissions for microphone/camera

**WebRTC calling issues**
- **No microphone found**: Connect a USB microphone or headset
- **Permission denied**: Allow browser access to microphone/camera in settings
- **Connection fails**: Check firewall settings, ensure STUN server is accessible
- **No incoming call notification**: Verify both users are viewing the same ticket
- **Video not working**: Check camera permissions and hardware availability
- Check backend server is running
- Verify JWT token is valid
- Check browser console for errors

**Database migration errors**
- Check database permissions
- Verify Alembic configuration
- Review migration scripts for conflicts

## 📝 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/swagger
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest
```

### Frontend Testing
```bash
cd admin-frontend  # or user-frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Check the following documentation files:
  - `CALLING_FEATURE.md` - WebRTC calling implementation details
  - `INCOMING_CALL_FEATURE.md` - Incoming call notifications guide
  - `CAMERA_PERMISSION_GUIDE.md` - Hardware and permission setup
  - `SETUP.md` - Detailed setup instructions
  - `TECHNICAL.md` - Technical architecture details

## 📚 Additional Documentation

- **CALLING_FEATURE.md**: Complete WebRTC calling feature documentation
- **INCOMING_CALL_FEATURE.md**: Messenger-like incoming call system
- **INCOMING_CALL_FIX.md**: WebSocket connection troubleshooting
- **CAMERA_PERMISSION_GUIDE.md**: Microphone/camera setup guide
- **CALL_BUTTON_DEBUG.md**: Call button visibility debugging
- **device-checker.html**: Standalone device testing tool
- Create an issue in the repository

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added real-time messaging
- **v1.2.0**: Interactive charts and analytics dashboard
- **v1.3.0**: Enhanced WebSocket implementation and UI improvements

---
