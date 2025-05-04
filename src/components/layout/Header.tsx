
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";
import { Button } from "@/components/ui/button";
import { LogOut, User, Bell } from "lucide-react";

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800 md:block hidden">
            Performance Review Portal
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-2 text-gray-500 hover:text-indigo-500 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-700">
                {currentUser?.name}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {currentUser?.role.replace('_', ' ')}
              </span>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-indigo-500"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
