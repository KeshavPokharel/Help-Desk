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

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt/passlib
- **WebSockets**: FastAPI WebSocket support
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
- **Global**: `ws://localhost:8000/messages/ws?token=<jwt_token>`
- **Ticket-specific**: `ws://localhost:8000/messages/room/{ticket_id}?token=<jwt_token>`

### Message Types
- **message**: New chat message
- **user_joined**: User joined chat
- **user_left**: User left chat
- **notification**: System notifications

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
- Create an issue in the repository

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added real-time messaging
- **v1.2.0**: Interactive charts and analytics dashboard
- **v1.3.0**: Enhanced WebSocket implementation and UI improvements

---
