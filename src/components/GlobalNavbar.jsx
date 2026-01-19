import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FiSearch, FiShoppingCart, FiUser, FiChevronDown, 
  FiBell, FiHeart, FiLogOut, FiLayout, FiHome,
  FiBookOpen, FiVideo, FiTarget, FiTrendingUp,
  FiMenu, FiX
} from "react-icons/fi";
import { 
  FaChalkboardTeacher, FaGraduationCap,
  FaLaptopCode, FaChartLine
} from "react-icons/fa";
import logoImg from "../assets/logoo.png"; 
import { motion, AnimatePresence } from "framer-motion";

const GlobalNavbar = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Categories data
  const categories = [
    { name: "Development", icon: <FaLaptopCode />, color: "text-blue-600" },
    { name: "Business", icon: <FaChartLine />, color: "text-emerald-600" },
    { name: "Data Science", icon: <FiTrendingUp />, color: "text-purple-600" },
    { name: "Design", icon: <FiTarget />, color: "text-pink-600" },
    { name: "Marketing", icon: <FaGraduationCap />, color: "text-amber-600" },
    { name: "Music", icon: <FiVideo />, color: "text-red-600" },
    { name: "Photography", icon: <FiBookOpen />, color: "text-cyan-600" },
    { name: "Health", icon: <FiUser />, color: "text-green-600" }
  ];

  // Don't show the global navbar on the Course Video Player page
  if (location.pathname.includes("/course/view/")) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setShowProfileMenu(false);
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-[100] px-4 lg:px-8 py-3 shadow-sm">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 lg:gap-8">
        
        {/* Brand & Categories */}
        <div className="flex items-center gap-6">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <FiMenu size={24} />
          </button>

          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logoImg} alt="Learnify" className="h-10 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase italic text-slate-900 hidden sm:block">
               Student Nagari 
              </span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                Premium Learning Platform
              </span>
            </div>
          </Link>

          {/* Categories Dropdown */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-50"
            >
              <FiMenu /> Categories <FiChevronDown />
            </button>

            <AnimatePresence>
              {showCategories && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[110]"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category, idx) => (
                      <Link
                        key={idx}
                        to={`/category/${category.name.toLowerCase()}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                        onClick={() => setShowCategories(false)}
                      >
                        <div className={`p-2 rounded-lg bg-slate-100 group-hover:bg-white ${category.color}`}>
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{category.name}</p>
                          <p className="text-xs text-slate-500">500+ courses</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link 
                      to="/categories"
                      className="flex items-center justify-center gap-2 text-red-600 font-bold text-sm hover:bg-red-50 p-2 rounded-lg"
                    >
                      Browse all categories <FiChevronRight />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="flex-1 max-w-2xl relative hidden md:block">
          <form onSubmit={handleSearch}>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search for courses, skills, instructors..."
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 px-12 text-sm focus:outline-none focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-50 transition-all placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600" />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-red-700 transition-colors"
              >
                Search
              </button>
            </div>
            <div className="mt-1 flex gap-2 justify-center">
              <span className="text-[10px] text-slate-400 font-medium">Trending:</span>
              {["Python", "React", "Marketing", "Excel", "AI"].map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(tag)}
                  className="text-[10px] text-slate-500 hover:text-red-600"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-2 lg:gap-5">
          {user && userProfile?.role === 'student' && (
            <Link to="/student/my-courses" className="hidden lg:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-slate-50">
              <FaChalkboardTeacher /> My Learning
            </Link>
          )}

          {user && userProfile?.role === 'instructor' && (
            <Link to="/instructor" className="hidden lg:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-slate-50">
              <FiLayout /> Instructor Dashboard
            </Link>
          )}

          {!user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/login")} 
                className="hidden sm:block px-5 py-2.5 text-sm font-bold text-slate-900 border border-slate-900 rounded-lg hover:bg-slate-50 transition-all hover:shadow-sm"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate("/signup")}
                className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all shadow-md"
              >
                Sign Up Free
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 lg:gap-5">
              {/* Mobile Search */}
              <button className="md:hidden p-2">
                <FiSearch size={20} />
              </button>
              
              <Link to="/wishlist" className="hidden sm:block relative p-2 group">
                <FiHeart className="text-slate-600 group-hover:text-red-600 transition-colors" size={20} />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  3
                </span>
              </Link>
              
              <Link to="/cart" className="relative p-2 group">
                <FiShoppingCart className="text-slate-600 group-hover:text-red-600 transition-colors" size={20} />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
              
              <div className="relative hidden sm:block">
                <button className="relative p-2 group">
                  <FiBell className="text-slate-600 group-hover:text-red-600 transition-colors" size={20} />
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold h-3 w-3 rounded-full animate-pulse"></span>
                </button>
              </div>
              
              {/* User Avatar & Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-rose-500 text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                    {userProfile?.name?.charAt(0).toUpperCase() || <FiUser />}
                  </div>
                  <FiChevronDown className={`text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[110]"
                    >
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-500 text-white rounded-full flex items-center justify-center font-black text-xl shadow-md">
                          {userProfile?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{userProfile?.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          <div className="flex gap-1 mt-1">
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[8px] font-bold rounded-full uppercase">
                              {userProfile?.role || "Student"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Link 
                          to={`/${userProfile?.role}/dashboard`} 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <FiLayout /> Dashboard
                        </Link>
                        <Link 
                          to="/profile" 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <FiUser /> Profile Settings
                        </Link>
                        <Link 
                          to="/my-courses" 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <FiBookOpen /> My Courses
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-2"
                        >
                          <FiLogOut /> Logout
                        </button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Account Status:</span>
                          <span className="font-bold text-emerald-600">Active</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Modal */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 bg-white z-[120] lg:hidden overflow-y-auto"
          >
            {/* Mobile Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Learnify" className="h-8 w-auto" />
                <span className="text-lg font-black uppercase italic">LEARNIFY</span>
              </div>
              <button onClick={() => setShowMobileMenu(false)}>
                <FiX size={24} />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-10"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Mobile Menu Items */}
            <div className="p-4 space-y-1">
              <Link 
                to="/" 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <FiHome /> Home
              </Link>
              
              <div className="p-3">
                <h3 className="font-bold text-slate-800 mb-2">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 6).map((cat, idx) => (
                    <Link
                      key={idx}
                      to={`/category/${cat.name.toLowerCase()}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-2 p-2 text-sm hover:bg-slate-50 rounded-lg"
                    >
                      <span className={cat.color}>{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {user ? (
                <>
                  <Link 
                    to="/my-courses" 
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <FiBookOpen /> My Courses
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <FiUser /> Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiLogOut /> Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      navigate("/login");
                      setShowMobileMenu(false);
                    }}
                    className="w-full p-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg text-left"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => {
                      navigate("/signup");
                      setShowMobileMenu(false);
                    }}
                    className="w-full p-3 text-sm font-bold bg-red-600 text-white rounded-lg text-center"
                  >
                    Sign Up Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
              <div className="text-center text-xs text-slate-500">
                © 2024 Learnify. All rights reserved.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile menu */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-[110] lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </nav>
  );
};

export default GlobalNavbar;