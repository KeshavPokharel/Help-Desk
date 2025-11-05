import os
import sys
from typing import Union
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.routers import user
from app.database import Base, engine, get_db
from app.auth import router as auth
from app.routers import ticket
from app.routers import ticket_transfer
from app.routers import category
from app.routers import message_ws
from app.routers import call_ws
from app.routers import notification
from app.core.seed_category import seed_categories

# Test database connection before starting
try:
    connection = engine.connect()
    connection.close()
    print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("Please check your DATABASE_URL in .env file")
    sys.exit(1)

# Create all tables (development only)
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
except Exception as e:
    print(f"❌ Failed to create database tables: {e}")
    sys.exit(1)

app = FastAPI(
    title="Help Desk System API",
    description="A comprehensive help desk system with ticket management, real-time messaging, and user management",
    version="1.0.0",
    docs_url="/swagger",
    redoc_url="/redoc"
)

# Configure CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # Common React dev port
        "http://localhost:5173",    # Admin frontend (Vite default)
        "http://localhost:5174",    # User frontend 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
@app.on_event("startup")
def on_startup():
    try:
        seed_categories()
        print("✅ Categories seeded successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not seed categories: {e}")

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Help Desk API is running", "status": "healthy", "timestamp": datetime.now()}

@app.get("/health")
def health_check():
    try:
        # Test database connection
        db = next(get_db())
        db.execute("SELECT 1")
        db.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(),
            "version": "1.0.0"
        }
    except SQLAlchemyError as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now()
            }
        )

# Include all routers
app.include_router(auth,  tags=["Authentication"])
app.include_router(user.router, tags=["Users"])
app.include_router(ticket.router, tags=["Tickets"])
app.include_router(ticket_transfer.router, tags=["Ticket Transfers"])
app.include_router(category.router, tags=["Categories"])
app.include_router(message_ws.router, tags=["Messages"])
app.include_router(call_ws.router, tags=["Calls"])
app.include_router(notification.router, tags=["Notifications"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error occurred",
            "error": str(exc) if os.getenv("DEBUG") else "Contact administrator"
        }
    )

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Help Desk API server...")
    print("📖 API Documentation: http://localhost:8000/swagger")
    print("🏥 Health Check: http://localhost:8000/health")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

