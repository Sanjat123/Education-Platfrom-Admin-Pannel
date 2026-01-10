import { Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-cybercard/80 backdrop-blur-md border-b border-neonblue/20 p-4 flex items-center justify-between"
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search students, teachers, courses..."
            className="w-full pl-10 pr-4 py-2 bg-cyberbg border border-neonblue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neonblue focus:ring-1 focus:ring-neonblue transition-all"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg hover:bg-neonblue/10 transition-colors"
        >
          <Bell size={20} className="text-gray-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">3</span>
        </motion.button>

        {/* Profile Dropdown */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neonpurple/10 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-neonpurple to-neonblue rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </motion.button>

          {/* Dropdown Menu */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            whileHover={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 mt-2 w-48 bg-cybercard border border-neonpurple/30 rounded-lg shadow-neonStrong opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
          >
            <div className="p-2">
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neonpurple/10 transition-colors text-left">
                <Settings size={16} className="text-gray-400" />
                <span className="text-sm text-white">Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-500/10 transition-colors text-left">
                <LogOut size={16} className="text-gray-400" />
                <span className="text-sm text-white">Logout</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
