from typing import Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import user
from app.database import Base, engine
from app.auth import router as auth
from app.routers import ticket
from app.routers import ticket_transfer
from app.routers import category
from app.routers import message_ws
from app.routers import notification
from app.core.seed_category import seed_categories

# Create all tables (development only)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    description="My FastAPI project with Swagger",
    version="1.0.0",
    docs_url="/swagger",       # change Swagger URL
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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
@app.on_event("startup")
def on_startup():
    seed_categories()


app.include_router(user.router)
app.include_router(auth)
app.include_router(ticket.router)
app.include_router(ticket_transfer.router)
app.include_router(category.router)
app.include_router(message_ws.router)
app.include_router(notification.router)

