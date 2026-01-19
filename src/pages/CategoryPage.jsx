import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { 
  FiFilter, FiStar, FiUsers, FiChevronRight, FiTrendingUp,
  FiClock, FiAward, FiSearch, FiChevronDown, FiGrid,
  FiList, FiBook, FiVideo, FiBarChart2, FiCheck
} from "react-icons/fi";
import { FaChalkboardTeacher, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("popular");
  const [filters, setFilters] = useState({
    rating: null,
    level: [],
    price: null,
    duration: null,
    features: []
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Category metadata
  const categoryData = {
    development: {
      title: "Development",
      description: "Learn programming, web development, mobile apps, and software engineering",
      icon: "💻",
      color: "bg-blue-50 text-blue-600"
    },
    business: {
      title: "Business",
      description: "Master business strategies, entrepreneurship, and management skills",
      icon: "💼",
      color: "bg-emerald-50 text-emerald-600"
    },
    "data-science": {
      title: "Data Science",
      description: "Data analysis, machine learning, artificial intelligence, and analytics",
      icon: "📊",
      color: "bg-purple-50 text-purple-600"
    },
    design: {
      title: "Design",
      description: "Graphic design, UX/UI, web design, and creative tools",
      icon: "🎨",
      color: "bg-pink-50 text-pink-600"
    },
    marketing: {
      title: "Marketing",
      description: "Digital marketing, SEO, social media, and growth strategies",
      icon: "📈",
      color: "bg-amber-50 text-amber-600"
    },
    music: {
      title: "Music",
      description: "Music production, instruments, theory, and audio engineering",
      icon: "🎵",
      color: "bg-red-50 text-red-600"
    },
    photography: {
      title: "Photography",
      description: "Photography techniques, editing, and creative skills",
      icon: "📷",
      color: "bg-cyan-50 text-cyan-600"
    },
    health: {
      title: "Health & Fitness",
      description: "Fitness training, nutrition, yoga, and wellness",
      icon: "💪",
      color: "bg-green-50 text-green-600"
    }
  };

  const category = categoryData[categoryName] || {
    title: categoryName,
    description: `Explore ${categoryName} courses taught by industry experts`,
    icon: "📚",
    color: "bg-slate-50 text-slate-600"
  };

  useEffect(() => {
    fetchCourses();
  }, [categoryName]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [courses, filters, sortBy, searchQuery]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "courses"),
        where("category", "==", category.title),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...courses];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(course =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructorName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply rating filter
    if (filters.rating) {
      result = result.filter(course => course.rating >= filters.rating);
    }

    // Apply level filter
    if (filters.level.length > 0) {
      result = result.filter(course => filters.level.includes(course.level));
    }

    // Apply price filter
    if (filters.price) {
      switch (filters.price) {
        case "free":
          result = result.filter(course => course.price === 0);
          break;
        case "under-1000":
          result = result.filter(course => course.price < 1000);
          break;
        case "1000-5000":
          result = result.filter(course => course.price >= 1000 && course.price <= 5000);
          break;
        case "above-5000":
          result = result.filter(course => course.price > 5000);
          break;
      }
    }

    // Apply duration filter
    if (filters.duration) {
      const hours = parseInt(filters.duration);
      result = result.filter(course => (course.durationHours || 0) <= hours);
    }

    // Apply features filter
    if (filters.features.length > 0) {
      result = result.filter(course => {
        if (filters.features.includes("certificate") && !course.hasCertificate) return false;
        if (filters.features.includes("projects") && !course.hasProjects) return false;
        if (filters.features.includes("quizzes") && !course.hasQuizzes) return false;
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.studentsEnrolled || 0) - (a.studentsEnrolled || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "price-low":
          return (a.discountPrice || a.price || 0) - (b.discountPrice || b.price || 0);
        case "price-high":
          return (b.discountPrice || b.price || 0) - (a.discountPrice || a.price || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(result);
  };

  const clearFilters = () => {
    setFilters({
      rating: null,
      level: [],
      price: null,
      duration: null,
      features: []
    });
    setSearchQuery("");
  };

  const toggleLevelFilter = (level) => {
    setFilters(prev => ({
      ...prev,
      level: prev.level.includes(level)
        ? prev.level.filter(l => l !== level)
        : [...prev.level, level]
    }));
  };

  const toggleFeatureFilter = (feature) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600">Loading {category.title} courses...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.title} Courses | Learnify</title>
        <meta name="description" content={category.description} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Category Header */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <button onClick={() => navigate("/")} className="hover:text-red-600">Home</button>
                  <FiChevronRight />
                  <button onClick={() => navigate("/categories")} className="hover:text-red-600">Categories</button>
                  <FiChevronRight />
                  <span className="font-bold text-slate-900">{category.title}</span>
                </nav>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${category.color}`}>
                    <span className="text-3xl">{category.icon}</span>
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-2">
                      {category.title} Courses
                    </h1>
                    <p className="text-lg text-slate-600 max-w-3xl">
                      {category.description} • {courses.length} courses available
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900">{courses.length}</div>
                  <div className="text-sm text-slate-500">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900">250K+</div>
                  <div className="text-sm text-slate-500">Students</div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-8 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${category.title} courses...`}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="lg:w-1/4 hidden lg:block">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Rating Filter */}
                <div className="mb-8">
                  <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <FiStar /> Rating
                  </h4>
                  <div className="space-y-2">
                    {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFilters(prev => ({ ...prev, rating: filters.rating === rating ? null : rating }))}
                        className={`flex items-center gap-3 w-full p-2 rounded-lg text-left ${
                          filters.rating === rating ? 'bg-red-50 text-red-600' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaRegStar 
                              key={star} 
                              className={`${star <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'} ${star <= rating && star === Math.ceil(rating) ? 'relative' : ''}`}
                              size={14}
                            />
                          ))}
                        </div>
                        <span className="font-bold">{rating}+</span>
                        <span className="text-xs text-slate-400 ml-auto">(1,200+)</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Filter */}
                <div className="mb-8">
                  <h4 className="font-bold text-slate-700 mb-4">Level</h4>
                  <div className="space-y-2">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <label key={level} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={filters.level.includes(level.toLowerCase())}
                          onChange={() => toggleLevelFilter(level.toLowerCase())}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="text-slate-600">{level}</span>
                        <span className="text-xs text-slate-400 ml-auto">(300+)</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-8">
                  <h4 className="font-bold text-slate-700 mb-4">Price</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Free", value: "free" },
                      { label: "Under ₹1000", value: "under-1000" },
                      { label: "₹1000 - ₹5000", value: "1000-5000" },
                      { label: "Above ₹5000", value: "above-5000" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilters(prev => ({ ...prev, price: filters.price === option.value ? null : option.value }))}
                        className={`flex items-center justify-between w-full p-2 rounded-lg text-left ${
                          filters.price === option.value ? 'bg-red-50 text-red-600 font-bold' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="text-xs text-slate-400">(200+)</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features Filter */}
                <div className="mb-8">
                  <h4 className="font-bold text-slate-700 mb-4">Features</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Certificate", value: "certificate", icon: <FiAward /> },
                      { label: "Hands-on Projects", value: "projects", icon: <FiBook /> },
                      { label: "Quizzes & Assignments", value: "quizzes", icon: <FiCheck /> },
                      { label: "Video Content", value: "videos", icon: <FiVideo /> }
                    ].map((feature) => (
                      <label key={feature.value} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={filters.features.includes(feature.value)}
                          onChange={() => toggleFeatureFilter(feature.value)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <div className="flex items-center gap-2 text-slate-600">
                          {feature.icon}
                          <span>{feature.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Duration Filter */}
                <div className="mb-8">
                  <h4 className="font-bold text-slate-700 mb-4">Duration</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Under 5 hours", value: "5" },
                      { label: "5-10 hours", value: "10" },
                      { label: "10-20 hours", value: "20" },
                      { label: "20+ hours", value: "50" }
                    ].map((duration) => (
                      <button
                        key={duration.value}
                        onClick={() => setFilters(prev => ({ ...prev, duration: filters.duration === duration.value ? null : duration.value }))}
                        className={`flex items-center justify-between w-full p-2 rounded-lg text-left ${
                          filters.duration === duration.value ? 'bg-red-50 text-red-600 font-bold' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{duration.label}</span>
                        <span className="text-xs text-slate-400">(150+)</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular Topics */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                <h4 className="font-bold text-slate-900 mb-4">Popular Topics</h4>
                <div className="space-y-3">
                  {category.title === "Development" && [
                    "Python", "JavaScript", "React", "Web Development", "Mobile Apps",
                    "Machine Learning", "Data Structures", "Cloud Computing"
                  ].map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSearchQuery(topic)}
                      className="block w-full text-left text-slate-600 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg text-sm"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:w-3/4">
              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-700 hover:bg-slate-50"
                >
                  <FiFilter /> Filters
                  {Object.values(filters).some(v => v !== null && v.length > 0) && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-600">
                      Showing <span className="font-bold">{filteredCourses.length}</span> of{" "}
                      <span className="font-bold">{courses.length}</span> courses
                    </span>
                    {Object.values(filters).some(v => v !== null && v.length > 0) && (
                      <button
                        onClick={clearFilters}
                        className="ml-4 text-sm text-red-600 hover:text-red-700 font-bold"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}
                      >
                        <FiGrid size={20} />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg ${viewMode === "list" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}
                      >
                        <FiList size={20} />
                      </button>
                    </div>
                    
                    {/* Sort Dropdown */}
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="popular">Most Popular</option>
                      <option value="rating">Highest Rated</option>
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Courses Grid/List */}
              {filteredCourses.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <FiSearch className="text-6xl text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No courses found</h3>
                  <p className="text-slate-500 mb-6">Try adjusting your filters or search term</p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-6"}>
                  {filteredCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      {viewMode === "list" ? (
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-2/5 relative">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-48 md:h-full object-cover"
                            />
                            {course.discountPrice && (
                              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                SAVE {Math.round(((course.price - course.discountPrice) / course.price) * 100)}%
                              </div>
                            )}
                          </div>
                          
                          <div className="md:w-3/5 p-6">
                            <div className="flex flex-col h-full">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    course.level === "beginner" ? "bg-emerald-100 text-emerald-700" :
                                    course.level === "intermediate" ? "bg-blue-100 text-blue-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {course.level || "All Levels"}
                                  </span>
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2">{course.title}</h3>
                                <p className="text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                                
                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                  <span className="flex items-center gap-1">
                                    <FaChalkboardTeacher /> {course.instructorName || "Instructor"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FiUsers /> {course.studentsEnrolled?.toLocaleString() || 0}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="flex items-end gap-2">
                                  {course.discountPrice ? (
                                    <>
                                      <span className="text-2xl font-bold text-slate-800">₹{course.discountPrice}</span>
                                      <span className="text-lg text-slate-400 line-through">₹{course.price}</span>
                                    </>
                                  ) : (
                                    <span className="text-2xl font-bold text-slate-800">₹{course.price || 0}</span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-amber-500">
                                    <FiStar className="fill-current" /> {course.rating || 4.8}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Grid View
                        <div>
                          <div className="relative">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                              {course.discountPrice && (
                                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                  SAVE {Math.round(((course.price - course.discountPrice) / course.price) * 100)}%
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                course.level === "beginner" ? "bg-emerald-100 text-emerald-700" :
                                course.level === "intermediate" ? "bg-blue-100 text-blue-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {course.level || "All Levels"}
                              </span>
                            </div>
                            {course.isBestseller && (
                              <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                Bestseller
                              </div>
                            )}
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{course.title}</h3>
                            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                            
                            <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                              <span className="flex items-center gap-1">
                                <FaChalkboardTeacher /> {course.instructorName?.split(" ")[0] || "Instructor"}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiUsers /> {course.studentsEnrolled?.toLocaleString() || 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                {course.discountPrice ? (
                                  <div className="flex items-end gap-2">
                                    <span className="text-xl font-bold text-slate-800">₹{course.discountPrice}</span>
                                    <span className="text-sm text-slate-400 line-through">₹{course.price}</span>
                                  </div>
                                ) : (
                                  <span className="text-xl font-bold text-slate-800">₹{course.price || 0}</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-amber-500">
                                  <FiStar className="fill-current" size={14} /> {course.rating || 4.8}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {filteredCourses.length > 0 && (
                <div className="mt-12 text-center">
                  <button className="px-8 py-3 border-2 border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors">
                    Load More Courses
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100] lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[101] lg:hidden overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">Filters</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 font-bold"
                  >
                    Clear All
                  </button>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <FiX size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {/* Mobile filters content (same as desktop sidebar) */}
                <div className="space-y-6">
                  {/* Rating Filter */}
                  <div>
                    <h4 className="font-bold text-slate-700 mb-4">Rating</h4>
                    <div className="space-y-2">
                      {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setFilters(prev => ({ ...prev, rating: filters.rating === rating ? null : rating }))}
                          className={`flex items-center gap-3 w-full p-2 rounded-lg text-left ${
                            filters.rating === rating ? 'bg-red-50 text-red-600' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaRegStar 
                                key={star} 
                                className={`${star <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'} ${star <= rating && star === Math.ceil(rating) ? 'relative' : ''}`}
                                size={14}
                              />
                            ))}
                          </div>
                          <span className="font-bold">{rating}+</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Level Filter */}
                  <div>
                    <h4 className="font-bold text-slate-700 mb-4">Level</h4>
                    <div className="space-y-2">
                      {["Beginner", "Intermediate", "Advanced"].map((level) => (
                        <label key={level} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                          <input
                            type="checkbox"
                            checked={filters.level.includes(level.toLowerCase())}
                            onChange={() => toggleLevelFilter(level.toLowerCase())}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          />
                          <span className="text-slate-600">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <h4 className="font-bold text-slate-700 mb-4">Price</h4>
                    <div className="space-y-2">
                      {[
                        { label: "Free", value: "free" },
                        { label: "Under ₹1000", value: "under-1000" },
                        { label: "₹1000 - ₹5000", value: "1000-5000" },
                        { label: "Above ₹5000", value: "above-5000" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setFilters(prev => ({ ...prev, price: filters.price === option.value ? null : option.value }))}
                          className={`flex items-center justify-between w-full p-2 rounded-lg text-left ${
                            filters.price === option.value ? 'bg-red-50 text-red-600 font-bold' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Filters Button */}
                  <div className="sticky bottom-0 bg-white pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                    >
                      Show {filteredCourses.length} Courses
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CategoryPage;