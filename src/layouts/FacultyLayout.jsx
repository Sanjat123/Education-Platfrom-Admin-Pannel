import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { FiGrid, FiUsers, FiVideo, FiLogOut, FiCheckSquare } from "react-icons/fi";
import { auth } from "../firebase";

const FacultyLayout = () => {
  const menuItems = [
    { name: "Faculty Dash", path: "/faculty", icon: <FiGrid /> },
    { name: "My Students", path: "/faculty/students", icon: <FiUsers /> },
    { name: "Live Studio", path: "/faculty/live", icon: <FiVideo /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Faculty Theme (Emerald) */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-emerald-100">N</div>
          <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">FACULTY HUB</span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/faculty"}
              className={({ isActive }) => `
                flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all duration-300
                ${isActive 
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] tracking-widest uppercase">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <button 
          onClick={() => auth.signOut()}
          className="mt-auto flex items-center gap-4 px-5 py-5 rounded-2xl font-black text-rose-500 hover:bg-rose-50 transition-all"
        >
          <FiLogOut className="text-xl" />
          <span className="text-[10px] uppercase tracking-widest">Logout</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <Outlet />
      </main>
    </div>
  );
};

export default FacultyLayout;