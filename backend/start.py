#!/usr/bin/env python3
"""
Help Desk Backend Startup Script
This script provides an easy way to start the backend with proper checks.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version_info.major}.{sys.version_info.minor}")
    return True

def check_virtual_environment():
    """Check if virtual environment exists and is activated"""
    venv_path = Path("venv")
    if not venv_path.exists():
        print("❌ Virtual environment not found")
        print("Run: python -m venv venv")
        return False
    
    # Check if we're in a virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️ Virtual environment not activated")
        if os.name == 'nt':  # Windows
            print("Run: venv\\Scripts\\activate")
        else:  # Unix/Mac
            print("Run: source venv/bin/activate")
        return False
    
    print("✅ Virtual environment is active")
    return True

def check_environment_file():
    """Check if .env file exists and contains required variables"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found")
        print("Create .env file with DATABASE_URL")
        return False
    
    # Read and check DATABASE_URL
    with open(env_file, 'r') as f:
        content = f.read()
        if 'DATABASE_URL=' not in content:
            print("❌ DATABASE_URL not found in .env file")
            return False
    
    print("✅ Environment file exists with DATABASE_URL")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import psycopg2
        import alembic
        print("✅ Required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Run: pip install -r requirements.txt")
        return False

def check_database_connection():
    """Test database connection"""
    try:
        from app.database import engine
        connection = engine.connect()
        connection.close()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Check your DATABASE_URL and ensure PostgreSQL is running")
        return False

def run_migrations():
    """Run database migrations"""
    try:
        result = subprocess.run(['alembic', 'upgrade', 'head'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Database migrations completed")
            return True
        else:
            print(f"❌ Migration failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting Help Desk API server...")
    print("📖 API Documentation will be available at: http://localhost:8000/swagger")
    print("🏥 Health Check: http://localhost:8000/health")
    print("Press Ctrl+C to stop the server\n")
    
    try:
        subprocess.run([
            'uvicorn', 'main:app', 
            '--host', '0.0.0.0', 
            '--port', '8000', 
            '--reload'
        ])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

def main():
    """Main startup routine"""
    print("🔧 Help Desk Backend Startup Check\n")
    
    # Run all checks
    checks = [
        ("Python Version", check_python_version),
        ("Virtual Environment", check_virtual_environment),
        ("Environment File", check_environment_file),
        ("Dependencies", check_dependencies),
        ("Database Connection", check_database_connection),
        ("Database Migrations", run_migrations)
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"Checking {check_name}...")
        if not check_func():
            all_passed = False
            break
        print()
    
    if all_passed:
        print("✅ All checks passed! Starting server...\n")
        start_server()
    else:
        print("\n❌ Setup incomplete. Please fix the issues above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()