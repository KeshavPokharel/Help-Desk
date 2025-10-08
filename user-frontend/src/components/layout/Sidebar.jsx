import React from "react";
import { NavLink } from "react-router-dom";
import { Ticket, MessageSquare, Home, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Tickets", path: "/dashboard/tickets", icon: Ticket },
    { name: "Messages", path: "/dashboard/messages", icon: MessageSquare },
    { name: "Profile", path: "/dashboard/profile", icon: User },
  ];

  return (
    <div className="bg-white shadow-lg h-full">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800">Help Desk</h2>
        <p className="text-sm text-gray-500">Welcome, {user?.username}</p>
      </div>
      
      <nav className="mt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                isActive ? "bg-blue-50 border-r-4 border-blue-500" : ""
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-full p-4">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
