import React from "react";
import { NavLink } from "react-router-dom";
import { 
  FiGrid, FiUsers, FiUserCheck, FiBook, 
  FiVideo, FiDollarSign, FiSettings, FiLogOut 
} from "react-icons/fi";
import { auth } from "../firebase";

const Sidebar = () => {
  // Yahan se aap kisi bhi link ko remove kar sakte hain
  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FiGrid /> },
    { name: "Students", path: "/students", icon: <FiUsers /> },
    { name: "Teachers", path: "/teachers", icon: <FiUserCheck /> },
    { name: "Courses", path: "/courses", icon: <FiBook /> },
    { name: "Live Classes", path: "/live", icon: <FiVideo /> },
    { name: "Payments", path: "/payments", icon: <FiDollarSign /> },
    { name: "Settings", path: "/settings", icon: <FiSettings /> },
  ];

  return (
    <div className="flex flex-col h-full p-6 bg-white border-r border-slate-100">
      {/* Logo Branding */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black italic shadow-lg">N</div>
        <span className="text-xl font-black text-slate-900 tracking-tighter">NAGARI</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200
              ${isActive 
                ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"}
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm tracking-wide">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* --- AGAR UPGRADE CARD HATANA HAI TOH NICHE WALA DIV DELETE KAREIN --- */}
      {/* Maine ise remove kar diya hai taaki sidebar clean dikhe */}

      <div className="mt-auto pt-6">
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all"
        >
          <FiLogOut className="text-xl" />
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;