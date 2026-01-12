import React from "react";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { FiLogOut, FiUser, FiBell, FiSearch, FiSettings, FiHelpCircle } from "react-icons/fi";
import { motion } from "framer-motion";

const Navbar = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      {/* Logo and Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500"></div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Student Nagari</h1>
          <p className="text-xs text-slate-500">LMS Dashboard</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative hidden md:block w-96">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search for courses, students, reports..." 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <FiHelpCircle size={20} />
        </button>
        
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <FiSettings size={20} />
        </button>
        
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <FiBell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user.email?.split('@')[0]}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-50 border border-sky-200 flex items-center justify-center text-sky-600 font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-rose-600 px-4 py-2 rounded-xl transition-all duration-200 font-medium"
            >
              <FiLogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        ) : (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-200 transition-all"
          >
            Login
          </motion.button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;