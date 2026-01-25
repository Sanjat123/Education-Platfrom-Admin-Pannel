import React, { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  FiGrid, FiUsers, FiVideo, FiLogOut, FiBookOpen, 
  FiMessageSquare, FiBarChart2, FiCalendar, FiUserCheck,
  FiAward, FiLayers, FiPlayCircle, FiChevronRight, FiMenu
} from "react-icons/fi";
import { MdAssignment } from "react-icons/md";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import FacultyQuickActions from "./FacultyQuickActions";

const FacultyLayout = () => {
  const { userProfile } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [facultyStats, setFacultyStats] = useState({ 
    courses: 0, students: 0, pendingAssignments: 12, totalLectures: 45, upcomingClasses: 3 
  });

  // Aapka updated menu list
  const menuItems = [
    { name: "Dashboard", path: "/faculty", icon: <FiGrid />, badge: null },
    { name: "Courses", path: "/faculty/courses", icon: <FiBookOpen />, badge: facultyStats.courses },
    { name: "Students", path: "/faculty/students", icon: <FiUsers />, badge: facultyStats.students },
    { name: "Live Studio", path: "/faculty/live", icon: <FiPlayCircle />, badge: null },
    { name: "Assignments", path: "/faculty/assignments", icon: <MdAssignment />, badge: facultyStats.pendingAssignments },
    { name: "Lectures", path: "/faculty/lectures", icon: <PiChalkboardTeacherFill />, badge: facultyStats.totalLectures },
    { name: "Schedule", path: "/faculty/schedule", icon: <FiCalendar />, badge: facultyStats.upcomingClasses },
    { name: "Messages", path: "/faculty/messages", icon: <FiMessageSquare />, badge: 3 },
    { name: "Analytics", path: "/faculty/analytics", icon: <FiBarChart2 />, badge: null },
    { name: "Resources", path: "/faculty/resources", icon: <FiLayers />, badge: null },
    { name: "Attendance", path: "/faculty/attendance", icon: <FiUserCheck />, badge: null },
    { name: "Grades", path: "/faculty/notes", icon: <FiAward />, badge: null },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-100 flex flex-col transition-all duration-300 shadow-xl z-50`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          {!sidebarCollapsed && <h1 className="text-lg font-black italic">FACULTY <span className="text-emerald-600">HUB</span></h1>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 bg-slate-50 rounded-lg"><FiMenu /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              // Destructuring isActive to fix ReferenceError
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all group
                ${isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                {!sidebarCollapsed && <span className="text-sm truncate">{item.name}</span>}
              </div>
              {!sidebarCollapsed && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${item.path === window.location.pathname ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
           <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-all">
             <FiLogOut /> {!sidebarCollapsed && "Logout"}
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
          <FacultyQuickActions />
        </main>
      </div>
    </div>
  );
};

export default FacultyLayout;