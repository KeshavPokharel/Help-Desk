@echo off
echo 🚀 Help Desk Backend Setup for Windows
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

:: Activate virtual environment
echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

:: Upgrade pip
echo ⬆️ Upgrading pip...
python -m pip install --upgrade pip

:: Install requirements
echo 📚 Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

:: Check for .env file
if not exist ".env" (
    echo ⚠️ .env file not found
    echo Creating template .env file...
    echo DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/helpdesk > .env
    echo.
    echo ❗ IMPORTANT: Please edit .env file with your PostgreSQL credentials
    echo Then run this script again
    pause
    exit /b 1
)

:: Test database connection
echo 🔍 Testing database connection...
python -c "from app.database import engine; engine.connect().close(); print('✅ Database connection successful')" 2>nul
if errorlevel 1 (
    echo ❌ Database connection failed
    echo Please check your .env file and ensure PostgreSQL is running
    pause
    exit /b 1
)

:: Run migrations
echo 🗄️ Running database migrations...
alembic upgrade head
if errorlevel 1 (
    echo ❌ Migration failed
    pause
    exit /b 1
)

:: Check if admin user exists, create if not
echo 👤 Checking for admin user...
python -c "
from app.database import SessionLocal
from app.models.user import User
db = SessionLocal()
admin = db.query(User).filter(User.role == 'admin').first()
db.close()
if not admin:
    print('No admin user found. Please create one.')
    exit(1)
else:
    print('✅ Admin user exists')
" 2>nul
if errorlevel 1 (
    echo 🔧 Creating admin user...
    python -m app.cli.create_admin
    if errorlevel 1 (
        echo ❌ Failed to create admin user
        pause
        exit /b 1
    )
)

echo.
echo ✅ Setup complete! Starting server...
echo.
echo 📖 API Documentation: http://localhost:8000/swagger
echo 🏥 Health Check: http://localhost:8000/health
echo Press Ctrl+C to stop the server
echo.

:: Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause