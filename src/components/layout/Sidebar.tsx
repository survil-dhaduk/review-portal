import {
  BarChart,
  FileText,
  Home,
  Settings,
  Users
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";

const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <aside className="bg-indigo-900 text-white w-64 hidden md:block flex-shrink-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold">ReviewPulse</h2>
      </div>

      <nav className="mt-4">
        <div className="px-4 py-2 text-indigo-300 text-sm uppercase tracking-wider">
          Menu
        </div>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center px-6 py-3 text-sm ${isActive
              ? "bg-indigo-800 text-white border-l-4 border-indigo-400"
              : "text-indigo-100 hover:bg-indigo-800"
            }`
          }
        >
          <Home className="h-5 w-5 mr-3" />
          <span>Dashboard</span>
        </NavLink>

        {(isAdmin || currentUser?.role === UserRole.PROJECT_MANAGER || currentUser?.role === UserRole.TEAM_LEAD) && (
          <NavLink
            to="/ratings"
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm ${isActive
                ? "bg-indigo-800 text-white border-l-4 border-indigo-400"
                : "text-indigo-100 hover:bg-indigo-800"
              }`
            }
          >
            <FileText className="h-5 w-5 mr-3" />
            <span>Ratings</span>
          </NavLink>
        )}

        {isAdmin && (
          <>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-sm ${isActive
                  ? "bg-indigo-800 text-white border-l-4 border-indigo-400"
                  : "text-indigo-100 hover:bg-indigo-800"
                }`
              }
            >
              <Users className="h-5 w-5 mr-3" />
              <span>Users</span>
            </NavLink>

            <NavLink
              to="/criteria"
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-sm ${isActive
                  ? "bg-indigo-800 text-white border-l-4 border-indigo-400"
                  : "text-indigo-100 hover:bg-indigo-800"
                }`
              }
            >
              <BarChart className="h-5 w-5 mr-3" />
              <span>Criteria</span>
            </NavLink>
          </>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-6 py-3 text-sm ${isActive
              ? "bg-indigo-800 text-white border-l-4 border-indigo-400"
              : "text-indigo-100 hover:bg-indigo-800"
            }`
          }
        >
          <Settings className="h-5 w-5 mr-3" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* <div className="absolute bottom-0 w-full p-4">
        <div className="bg-indigo-800 rounded-lg p-4 flex items-center text-sm">
          <div className="mr-3">
            <svg className="h-10 w-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-white">ReviewPulse Pro</p>
            <p className="text-indigo-300 text-xs">Get more features</p>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-300 ml-auto" />
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;
