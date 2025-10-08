from fastapi import WebSocket
from typing import Dict, List
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Store active connections by ticket_id for rooms
        self.ticket_rooms: Dict[int, List[Dict]] = {}
        # Store global connections (not tied to specific tickets)
        self.global_connections: List[Dict] = []
    
    async def connect(self, websocket: WebSocket, ticket_id: int, user_id: int, user_name: str, user_role: str):
        """Connect a user to a ticket's chat room (legacy method - use join_ticket_room instead)"""
        return await self.join_ticket_room(websocket, ticket_id, user_id, user_name, user_role)
    
    def disconnect(self, websocket: WebSocket, ticket_id: int):
        """Disconnect a user from a ticket's chat room (legacy method - use leave_ticket_room instead)"""
        return self.leave_ticket_room(websocket, ticket_id)
    
    async def broadcast_to_ticket(self, ticket_id: int, message: dict, exclude_user: int = None):
        """Broadcast a message to all users connected to a specific ticket (legacy method)"""
        return await self.broadcast_to_ticket_room(ticket_id, message, exclude_user)
    
    def get_ticket_users(self, ticket_id: int) -> List[Dict]:
        """Get list of users currently connected to a ticket (legacy method)"""
        return self.get_ticket_room_users(ticket_id)
    
    def is_user_online(self, ticket_id: int, user_id: int) -> bool:
        """Check if a specific user is online for a ticket (legacy method)"""
        return self.is_user_in_ticket_room(ticket_id, user_id)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific websocket connection"""
        try:
            await websocket.send_text(message)
        except:
            # Connection might be closed
            pass

    async def connect_global(self, websocket: WebSocket, user_id: int, user_name: str, user_role: str):
        """Connect a user to global messaging (not tied to specific ticket)"""
        await websocket.accept()
        
        connection_info = {
            "websocket": websocket,
            "user_id": user_id,
            "user_name": user_name,
            "user_role": user_role,
            "connected_at": datetime.now()
        }
        
        self.global_connections.append(connection_info)
        print(f"User {user_name} connected globally. Total global connections: {len(self.global_connections)}")

    def disconnect_global(self, websocket: WebSocket):
        """Disconnect a user from global messaging"""
        connection_to_remove = None
        for connection in self.global_connections:
            if connection["websocket"] == websocket:
                connection_to_remove = connection
                break
        
        if connection_to_remove:
            self.global_connections.remove(connection_to_remove)
            user_name = connection_to_remove["user_name"]
            print(f"User {user_name} disconnected globally. Total global connections: {len(self.global_connections)}")

    async def broadcast_global(self, message: dict, exclude_user: int = None):
        """Broadcast a message to all globally connected users"""
        message_str = json.dumps(message)
        connections_to_remove = []
        
        for connection in self.global_connections:
            if exclude_user and connection["user_id"] == exclude_user:
                continue
            
            try:
                await connection["websocket"].send_text(message_str)
            except:
                # Connection is broken, mark for removal
                connections_to_remove.append(connection)
        
        # Remove broken connections
        for broken_connection in connections_to_remove:
            if broken_connection in self.global_connections:
                self.global_connections.remove(broken_connection)
        
        print(f"Broadcasted message to {len(self.global_connections) - len(connections_to_remove)} global connections")

    # New room-based methods for better ticket messaging
    async def join_ticket_room(self, websocket: WebSocket, ticket_id: int, user_id: int, user_name: str, user_role: str):
        """Join a user to a specific ticket room"""
        await websocket.accept()
        
        if ticket_id not in self.ticket_rooms:
            self.ticket_rooms[ticket_id] = []
        
        # Check if user is already in the room and remove old connection
        existing_connections = [conn for conn in self.ticket_rooms[ticket_id] if conn["user_id"] == user_id]
        for old_conn in existing_connections:
            print(f"Removing duplicate connection for user {user_name} in ticket room {ticket_id}")
            self.ticket_rooms[ticket_id].remove(old_conn)
            try:
                await old_conn["websocket"].close(code=1000, reason="Duplicate connection replaced")
            except:
                pass  # Connection might already be closed
        
        connection_info = {
            "websocket": websocket,
            "user_id": user_id,
            "user_name": user_name,
            "user_role": user_role,
            "connected_at": datetime.now()
        }
        
        self.ticket_rooms[ticket_id].append(connection_info)
        print(f"User {user_name} ({user_role}) joined ticket room {ticket_id}. Room size: {len(self.ticket_rooms[ticket_id])}")
        
        # Notify others in the room that someone joined (only if it's a fresh join)
        if not existing_connections:
            await self.broadcast_to_ticket_room(ticket_id, {
                "type": "user_joined",
                "user_name": user_name,
                "user_role": user_role,
                "timestamp": datetime.now().isoformat()
            }, exclude_user=user_id)

    def leave_ticket_room(self, websocket: WebSocket, ticket_id: int):
        """Remove a user from a specific ticket room"""
        if ticket_id not in self.ticket_rooms:
            return
        
        connection_to_remove = None
        for connection in self.ticket_rooms[ticket_id]:
            if connection["websocket"] == websocket:
                connection_to_remove = connection
                break
        
        if connection_to_remove:
            self.ticket_rooms[ticket_id].remove(connection_to_remove)
            user_name = connection_to_remove["user_name"]
            user_role = connection_to_remove["user_role"]
            print(f"User {user_name} ({user_role}) left ticket room {ticket_id}. Room size: {len(self.ticket_rooms[ticket_id])}")
            
            # Notify others in the room that someone left
            if self.ticket_rooms[ticket_id]:  # If there are still users in the room
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    loop.create_task(self.broadcast_to_ticket_room(ticket_id, {
                        "type": "user_left",
                        "user_name": user_name,
                        "user_role": user_role,
                        "timestamp": datetime.now().isoformat()
                    }))
                except:
                    pass
            
            # Clean up empty rooms
            if not self.ticket_rooms[ticket_id]:
                del self.ticket_rooms[ticket_id]
                print(f"Ticket room {ticket_id} is now empty and has been removed")

    async def broadcast_to_ticket_room(self, ticket_id: int, message: dict, exclude_user: int = None):
        """Broadcast a message to all users in a specific ticket room"""
        if ticket_id not in self.ticket_rooms:
            return
        
        message_str = json.dumps(message)
        connections_to_remove = []
        active_connections = 0
        
        for connection in self.ticket_rooms[ticket_id]:
            if exclude_user and connection["user_id"] == exclude_user:
                continue
            
            try:
                await connection["websocket"].send_text(message_str)
                active_connections += 1
            except:
                # Connection is broken, mark for removal
                connections_to_remove.append(connection)
        
        # Remove broken connections
        for broken_connection in connections_to_remove:
            if broken_connection in self.ticket_rooms[ticket_id]:
                self.ticket_rooms[ticket_id].remove(broken_connection)
        
        print(f"Broadcasted message to {active_connections} users in ticket room {ticket_id}")

    def get_ticket_room_users(self, ticket_id: int) -> List[Dict]:
        """Get list of users currently in a ticket room"""
        if ticket_id not in self.ticket_rooms:
            return []
        
        return [
            {
                "user_id": conn["user_id"],
                "user_name": conn["user_name"],
                "user_role": conn["user_role"],
                "connected_at": conn["connected_at"].isoformat()
            }
            for conn in self.ticket_rooms[ticket_id]
        ]

    def is_user_in_ticket_room(self, ticket_id: int, user_id: int) -> bool:
        """Check if a specific user is in a ticket room"""
        if ticket_id not in self.ticket_rooms:
            return False
        
        return any(conn["user_id"] == user_id for conn in self.ticket_rooms[ticket_id])

# Global connection manager instance
manager = ConnectionManager()