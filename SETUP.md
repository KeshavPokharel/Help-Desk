# 🚀 Help Desk System - Quick Setup Guide

This guide will get your Help Desk system up and running in minutes.

## ⚡ Prerequisites Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ and npm installed
- [ ] PostgreSQL 12+ installed and running
- [ ] Git installed

## 🎯 Quick Installation (5 Minutes)

### Step 1: Database Setup
```bash
# Create database (using psql command line)
createdb helpdesk

# Or using PostgreSQL client (alternative method):
psql -U postgres -c "CREATE DATABASE helpdesk;"

# Verify database was created:
psql -U postgres -l | grep helpdesk
```

### 🚀 EASY SETUP (Windows Users)

For Windows users, we've created an automated setup script:

```cmd
# Navigate to backend folder
cd backend

# Run the automated setup (handles everything!)
setup_and_run.bat
```

This script will:
✅ Check Python installation  
✅ Create virtual environment  
✅ Install all dependencies  
✅ Create .env template  
✅ Test database connection  
✅ Run migrations  
✅ Create admin user  
✅ Start the server  

### 🔧 MANUAL SETUP (All Platforms)

### Step 2: Manual Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd "Help Desk"

# Setup backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Create environment file with proper configuration
# Replace YOUR_PASSWORD and YOUR_PORT with your PostgreSQL settings
echo DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:YOUR_PORT/helpdesk > .env

# IMPORTANT: Verify database connection before proceeding
python -c "from app.database import engine; print('Database connection successful!') if engine.connect() else print('Database connection failed!')"

# Initialize database schema
alembic upgrade head

# Create initial admin user (REQUIRED)
python -m app.cli.create_admin

# Start backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
✅ Backend running at: http://localhost:8000

#### Verify Backend is Working
```bash
# Check API is responding (should return JSON)
curl http://localhost:8000/health

# Or open in browser:
# http://localhost:8000/swagger - API documentation
# http://localhost:8000/health - Health check
```

### Step 3: Admin Frontend Setup
```bash
# Open new terminal
cd admin-frontend
npm install
npm run dev
```
✅ Admin panel running at: http://localhost:5173

### Step 4: User Frontend Setup
```bash
# Open new terminal
cd user-frontend
npm install
npm run dev
```
✅ User portal running at: http://localhost:5174

## 🔑 Create Your First Admin User

```bash
cd backend
python -m app.cli.create_admin
# Follow prompts to create admin account
```

## 🎉 You're Ready!

### Access Points:
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/swagger
- **Admin Panel**: http://localhost:5173
- **User Portal**: http://localhost:5174

### Default Credentials:
Use the admin account you just created to log into the admin panel.

## 🛠️ Development Workflow

### Daily Development Workflow

#### Pre-Start Checklist
```bash
# 1. Verify PostgreSQL is running
pg_ctl status
# or check Windows service: net start postgresql-x64-14

# 2. Activate virtual environment
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 3. Test database connection
python -c "from app.database import engine; engine.connect().close(); print('✅ Database OK')"

# 4. Check migrations are up to date
alembic current
alembic heads
```

#### Start Development Servers
```bash
# Terminal 1: Backend (MUST start first)
cd backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Admin Frontend
cd admin-frontend  
npm run dev

# Terminal 3: User Frontend
cd user-frontend
npm run dev
```

#### Backend Health Check
Once backend is running, verify these endpoints:
- http://localhost:8000 (API root)
- http://localhost:8000/swagger (API documentation)
- http://localhost:8000/health (if implemented)

```bash
# Test API is responding
curl http://localhost:8000/swagger
# Should return HTML page, not error
```

### Database Operations
```bash
# Create migration
alembic revision --autogenerate -m "Your changes"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

## ❗ Troubleshooting

### Backend Issues

#### Database Connection Problems
```bash
# 1. Check PostgreSQL is running
pg_ctl status
# or
net start postgresql-x64-14  # Windows service

# 2. Verify database exists
psql -U postgres -l | grep helpdesk

# 3. Test connection manually
psql -U postgres -d helpdesk -c "SELECT 1;"

# 4. Check your .env file has correct credentials
cat .env  # Linux/Mac
type .env  # Windows
```

#### Common Database Errors & Solutions
```bash
# Error: "database does not exist"
createdb -U postgres helpdesk

# Error: "password authentication failed"
# Update .env with correct password:
echo DATABASE_URL=postgresql+psycopg2://postgres:CORRECT_PASSWORD@localhost:5432/helpdesk > .env

# Error: "connection refused"
# Check PostgreSQL port (default 5432)
netstat -an | findstr :5432  # Windows
lsof -i :5432               # Linux/Mac

# Error: "relation does not exist"
alembic upgrade head

# Error: "No admin user exists"
python -m app.cli.create_admin
```

#### Python Environment Issues
```bash
# Virtual environment not working?
deactivate
rmdir venv /s     # Windows
rm -rf venv       # Linux/Mac
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Dependencies error?
pip install -r requirements.txt --force-reinstall --no-cache-dir

# Import errors?
# Make sure you're in the backend directory and venv is activated
cd backend
venv\Scripts\activate  # Windows
python -c "from app.database import Base; print('Imports working!')"
```

#### Server Issues
```bash
# Port 8000 already in use?
netstat -ano | findstr :8000  # Windows - find PID
taskkill /PID <PID> /F        # Windows - kill process
lsof -ti:8000 | xargs kill    # Linux/Mac

# CORS errors from frontend?
# Check main.py allows your frontend URLs (5173, 5174)

# WebSocket connection issues?
# Ensure firewall allows port 8000
# Check browser console for WebSocket errors
```

#### Windows-Specific Issues
```cmd
# PowerShell execution policy error?
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Antivirus blocking Python/Node?
# Add project folder to antivirus exclusions

# Virtual environment activation fails?
# Try using Command Prompt instead of PowerShell
cmd
cd backend
venv\Scripts\activate.bat

# pip install fails with "Microsoft Visual C++ 14.0 is required"?
# Install Microsoft C++ Build Tools:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# PostgreSQL service not starting?
net start postgresql-x64-14
# or
services.msc  # Start PostgreSQL service manually
```

### Frontend Issues
```bash
# Build errors?
rm -rf node_modules package-lock.json
npm install

# Port already in use?
# Kill process on port 5173/5174:
npx kill-port 5173
npx kill-port 5174
```

### Database Issues
```bash
# Reset database
dropdb helpdesk
createdb helpdesk
alembic upgrade head
```

## 🔄 Environment Variables

### Required Backend Configuration

Create `backend/.env` file with your specific settings:

```env
# Database Configuration (REQUIRED)
# Format: postgresql+psycopg2://username:password@host:port/database
DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/helpdesk

# Security Settings (REQUIRED for production)
SECRET_KEY=your-secret-key-change-in-production-use-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=2880

# File Upload (Optional - for attachments)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Development Settings (Optional)
DEBUG=True
LOG_LEVEL=INFO
```

### Common Database URL Examples
```env
# Default PostgreSQL (local)
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/helpdesk

# PostgreSQL with custom port
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5566/helpdesk

# PostgreSQL with different user
DATABASE_URL=postgresql+psycopg2://helpdesk_user:password@localhost:5432/helpdesk

# Remote PostgreSQL
DATABASE_URL=postgresql+psycopg2://username:password@remote-host:5432/helpdesk
```

### Environment Variables Validation
```bash
# Test your configuration
cd backend
venv\Scripts\activate  # Windows
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('DATABASE_URL:', os.getenv('DATABASE_URL'))
print('SECRET_KEY set:', bool(os.getenv('SECRET_KEY')))
"
```

## 📞 Need Help?

1. **Check logs**: Look at terminal outputs for error messages
2. **API Documentation**: Visit http://localhost:8000/swagger
3. **Database**: Verify PostgreSQL connection and database exists
4. **Ports**: Ensure ports 8000, 5173, 5174 are available

## 🎯 What's Next?

1. **Create Categories**: Use admin panel to set up ticket categories
2. **Add Agents**: Create agent accounts in user management
3. **Assign Categories**: Link agents to specific categories
4. **Test System**: Create test tickets and messages
5. **Customize**: Modify styling and add your branding

---
