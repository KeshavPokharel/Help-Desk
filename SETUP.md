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
# Create database (using psql)
createdb helpdesk

# Or using PostgreSQL client:
psql -U postgres -c "CREATE DATABASE helpdesk;"
```

### Step 2: Clone & Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd "Help Desk"

# Setup backend
cd backend
python -m venv venv

# Activate virtual environment
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create environment file
echo DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/helpdesk > .env

# Run migrations
alembic upgrade head

# Start backend
python main.py
```
✅ Backend running at: http://localhost:8000

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

### Daily Development
```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate
python main.py

# Terminal 2: Admin Frontend
cd admin-frontend
npm run dev

# Terminal 3: User Frontend
cd user-frontend
npm run dev
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
```bash
# Database connection error?
# Check PostgreSQL is running:
pg_ctl status

# Dependencies error?
pip install -r requirements.txt --force-reinstall
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

Create `backend/.env` file:
```env
# Required
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/helpdesk

# Optional
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=2880
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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
