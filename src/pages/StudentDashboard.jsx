import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion,
  orderBy,
  limit
} from "firebase/firestore";
import { 
  FiBook, 
  FiVideo, 
  FiLock, 
  FiUnlock, 
  FiPlayCircle, 
  FiShoppingCart, 
  FiStar,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiTrendingUp,
  FiUsers,
  FiClock,
  FiAward,
  FiBarChart2,
  FiChevronRight,
  FiBookmark,
  FiEye,
  FiDownload,
  FiCalendar,
  FiCheckCircle,
  FiShield,
  FiHelpCircle,
  FiHome,
  FiBookOpen,
  FiMessageSquare,
  FiTarget
} from "react-icons/fi";
import { 
  FaChalkboardTeacher, 
  FaRegMoneyBillAlt,
  FaPercentage
} from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
// StudentDashboard.jsx imports should include:
import CourseCard from "../components/CourseCard";
import PaymentModal from "../components/PaymentModal";
import CoursePreviewModal from "../components/CoursePreviewModal";

const StudentDashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("popular");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedLessons: 0,
    totalSpent: 0,
    learningHours: 0,
    certificates: 0
  });
  const [categories, setCategories] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrolledCoursesData, setEnrolledCoursesData] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    fetchCourses();
    fetchEnrollments();
    fetchStudentProgress();
  }, [user]);

  useEffect(() => {
    if (courses.length > 0) {
      extractCategories();
      filterAndSortCourses();
    }
  }, [courses, searchTerm, selectedCategory, sortBy]);

  const fetchCourses = async () => {
    try {
      const coursesRef = collection(db, "courses");
      const q = query(coursesRef, where("isActive", "==", true));
      const snapshot = await getDocs(q);
      
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCourses(coursesData);
      setFilteredCourses(coursesData);
      
      setStats(prev => ({
        ...prev,
        totalCourses: coursesData.length
      }));
      
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      if (!user) return;

      const q = query(collection(db, "enrollments"), where("studentId", "==", user.uid));
      const snap = await getDocs(q);
      const enrollmentData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMyEnrollments(enrollmentData.map(e => e.courseId));
      
      // Fetch enrolled courses details
      const enrolledPromises = enrollmentData.map(enrollment =>
        getDocs(query(collection(db, "courses"), where("id", "==", enrollment.courseId)))
      );
      const enrolledSnapshots = await Promise.all(enrolledPromises);
      const enrolledCourses = enrolledSnapshots
        .filter(snap => !snap.empty)
        .map(snap => ({ id: snap.docs[0].id, ...snap.docs[0].data() }));
      
      setEnrolledCoursesData(enrolledCourses);
      
      setStats(prev => ({
        ...prev,
        enrolledCourses: enrolledCourses.length
      }));
      
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      if (!user) return;

      const q = query(collection(db, "student_progress"), where("studentId", "==", user.uid));
      const snap = await getDocs(q);
      
      let totalLessons = 0;
      let completedLessons = 0;
      let totalHours = 0;
      
      snap.docs.forEach(doc => {
        const progress = doc.data();
        totalLessons += progress.totalLessons || 0;
        completedLessons += progress.completedLessons?.length || 0;
        totalHours += progress.learningHours || 0;
      });
      
      setStats(prev => ({
        ...prev,
        completedLessons,
        learningHours: totalHours,
        certificates: snap.docs.filter(d => d.data().certificateIssued).length
      }));
      
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const extractCategories = () => {
    const uniqueCategories = [...new Set(courses.map(course => course.category))];
    setCategories(uniqueCategories.filter(Boolean));
  };

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.studentsEnrolled || 0) - (a.studentsEnrolled || 0);
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "price-low":
          return (a.discountPrice || a.price || 0) - (b.discountPrice || b.price || 0);
        case "price-high":
          return (b.discountPrice || b.price || 0) - (a.discountPrice || a.price || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
  };

  const handleCoursePreview = (course) => {
    setSelectedCourse(course);
    setShowPreviewModal(true);
  };

  const handleCoursePurchase = (course) => {
    setSelectedCourse(course);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Create enrollment
      await updateDoc(doc(db, "enrollments", `${user.uid}_${selectedCourse.id}`), {
        studentId: user.uid,
        courseId: selectedCourse.id,
        enrolledAt: new Date().toISOString(),
        paymentId: paymentData.paymentId,
        amount: selectedCourse.discountPrice || selectedCourse.price,
        status: "active"
      });

      // Create student progress record
      await updateDoc(doc(db, "student_progress", `${user.uid}_${selectedCourse.id}`), {
        studentId: user.uid,
        courseId: selectedCourse.id,
        completedLessons: [],
        totalLessons: selectedCourse.lessonsCount || 0,
        progressPercentage: 0,
        enrolledAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        learningHours: 0
      });

      // Update course enrollment count
      await updateDoc(doc(db, "courses", selectedCourse.id), {
        studentsEnrolled: (selectedCourse.studentsEnrolled || 0) + 1
      });

      toast.success("🎉 Course purchased successfully! You can now access all content.");
      
      // Refresh data
      fetchEnrollments();
      fetchCourses();

    } catch (error) {
      console.error("Error updating after payment:", error);
      toast.error("Error processing purchase");
    }
  };

  const getCourseAccessLevel = (courseId) => {
    return myEnrollments.includes(courseId) ? "full" : "preview";
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
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" />
      
      {/* Header Banner - Enhanced */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4"
              >
                Welcome, {userProfile?.name || "Student"}!
              </motion.h1>
              <p className="text-red-100 text-lg mb-6 max-w-2xl">
                Your gateway to mastering new skills. Explore courses from expert instructors worldwide.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/my-courses")}
                  className="px-6 py-3 bg-white text-red-600 rounded-full font-bold hover:bg-red-50 transition-all shadow-lg"
                >
                  My Courses ({enrolledCoursesData.length})
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all border border-white/30"
                >
                  Learning Path
                </motion.button>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-white/20 to-transparent rounded-full flex items-center justify-center border-4 border-white/30">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black">{stats.enrolledCourses}</div>
                  <div className="text-sm opacity-80">Active Courses</div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 font-black text-sm">
                {stats.certificates} Certificates
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Dashboard */}
      <div className="container mx-auto px-4 -mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: "Learning Hours", 
              value: `${stats.learningHours}h`, 
              icon: <FiClock />, 
              color: "text-blue-600",
              bg: "bg-blue-50"
            },
            { 
              label: "Completed Lessons", 
              value: stats.completedLessons, 
              icon: <FiCheckCircle />, 
              color: "text-emerald-600",
              bg: "bg-emerald-50"
            },
            { 
              label: "Courses Available", 
              value: stats.totalCourses, 
              icon: <FiBookOpen />, 
              color: "text-purple-600",
              bg: "bg-purple-50"
            },
            { 
              label: "Progress Score", 
              value: "85%", 
              icon: <FiTrendingUp />, 
              color: "text-amber-600",
              bg: "bg-amber-50"
            }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              {/* Search */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FiSearch /> Search Courses
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, instructor..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <BiCategory /> Categories
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`block w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      selectedCategory === "all" 
                        ? "bg-red-50 text-red-600 font-bold" 
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    All Categories ({courses.length})
                  </button>
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(category)}
                      className={`block w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                        selectedCategory === category 
                          ? "bg-red-50 text-red-600 font-bold" 
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FaRegMoneyBillAlt /> Price Range
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "Free Only", value: "free" },
                    { label: "Under ₹1000", value: "under-1000" },
                    { label: "₹1000 - ₹5000", value: "1000-5000" },
                    { label: "Above ₹5000", value: "above-5000" }
                  ].map((range, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                      <input type="radio" name="price" className="text-red-600" />
                      <span className="text-slate-600">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3">Difficulty Level</h4>
                <div className="flex flex-wrap gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Toggle */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">View Mode:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 rounded-lg ${viewMode === "grid" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}
                    >
                      <FiGrid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2.5 rounded-lg ${viewMode === "list" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}
                    >
                      <FiList size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="mt-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FiBarChart2 /> Sort By
                </h4>
                <select
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 mt-6 text-white">
              <h4 className="text-lg font-bold mb-4">Your Learning Stats</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-300">Course Progress</span>
                    <span className="text-sm font-bold">65%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-red-500 rounded-full h-2" style={{ width: "65%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-300">Assignment Score</span>
                    <span className="text-sm font-bold">82%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-emerald-500 rounded-full h-2" style={{ width: "82%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-300">Time Spent</span>
                    <span className="text-sm font-bold">{stats.learningHours}h</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors">
                View Detailed Report
              </button>
            </div>
          </div>

          {/* Right Content - Courses */}
          <div className="lg:w-3/4">
            {/* Courses Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Browse All Courses <span className="text-red-600">({filteredCourses.length})</span>
                </h2>
                <p className="text-slate-600 mt-2">Learn from industry experts with hands-on projects</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2.5 border border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center gap-2">
                  <FiBookmark size={16} /> Saved
                </button>
                <button 
                  onClick={() => navigate("/my-courses")}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  My Courses <FiChevronRight />
                </button>
              </div>
            </div>

            {/* Featured Courses Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 mb-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">🎓 Limited Time Offer!</h3>
                  <p className="text-blue-100">Get 30% off on all premium courses. Offer ends soon!</p>
                </div>
                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors whitespace-nowrap">
                  View Offers
                </button>
              </div>
            </div>

            {/* Courses Grid/List */}
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <FiSearch className="text-6xl text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No courses found</h3>
                <p className="text-slate-500">Try adjusting your filters or search term</p>
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="mt-4 px-4 py-2 text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "space-y-6"} gap-6`}>
                <AnimatePresence>
                  {filteredCourses.map((course, index) => {
                    const isEnrolled = myEnrollments.includes(course.id);
                    
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        {viewMode === "list" ? (
                          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-2/5 relative">
                                <img 
                                  src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"}
                                  alt={course.title}
                                  className="w-full h-64 md:h-full object-cover"
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
                                      <span className="text-slate-500 text-sm flex items-center gap-1">
                                        <FaChalkboardTeacher /> {course.teacherName || "Instructor"}
                                      </span>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-800 mb-3">{course.title}</h3>
                                    <p className="text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                      <span className="flex items-center gap-1">
                                        <FiPlayCircle /> {course.lessonsCount || 12} lessons
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FiClock /> {course.duration || "8 weeks"}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <FiUsers /> {course.studentsEnrolled || 0} students
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
                                    
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleCoursePreview(course)}
                                        className="px-4 py-2 border border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                                      >
                                        <FiEye /> Preview
                                      </button>
                                      {isEnrolled ? (
                                        <button 
                                          onClick={() => navigate(`/course/${course.id}`)}
                                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                        >
                                          <FiPlayCircle /> Continue
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleCoursePurchase(course)}
                                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                                        >
                                          <FiShoppingCart /> Enroll
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Grid View Card
                          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all border border-slate-100">
                            <div className="relative">
                              <img 
                                src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"}
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
                              {isEnrolled && (
                                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                  Enrolled
                                </div>
                              )}
                            </div>
                            
                            <div className="p-6">
                              <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{course.title}</h3>
                              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                              
                              <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
                                <span className="flex items-center gap-1">
                                  <FaChalkboardTeacher /> {course.teacherName || "Instructor"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FiUsers /> {course.studentsEnrolled || 0}
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
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCoursePreview(course)}
                                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                                  >
                                    <FiEye size={14} />
                                  </button>
                                  {isEnrolled ? (
                                    <button 
                                      onClick={() => navigate(`/course/${course.id}`)}
                                      className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                                    >
                                      Access
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleCoursePurchase(course)}
                                      className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                                    >
                                      Enroll
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Recently Enrolled Courses */}
            {enrolledCoursesData.length > 0 && (
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Continue Learning</h2>
                  <button 
                    onClick={() => navigate("/my-courses")}
                    className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    View All <FiChevronRight />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCoursesData.slice(0, 3).map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      <div className="relative">
                        <img 
                          src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"}
                          alt={course.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 text-white">
                          <h3 className="font-bold text-lg">{course.title}</h3>
                          <p className="text-sm opacity-90">{course.teacherName}</p>
                        </div>
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          Enrolled
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-slate-600 text-sm">Progress</span>
                          <span className="font-bold text-emerald-600">45%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                          <div className="bg-emerald-500 rounded-full h-2" style={{ width: "45%" }}></div>
                        </div>
                        <button className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors">
                          Continue Course
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Instructors */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Featured Instructors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Dr. Sharma", subject: "Data Science", students: 12450, rating: 4.9 },
                  { name: "Prof. Gupta", subject: "Web Development", students: 8920, rating: 4.8 },
                  { name: "Ms. Patel", subject: "Business Analytics", students: 7560, rating: 4.7 },
                  { name: "Mr. Kumar", subject: "AI & ML", students: 11230, rating: 4.9 }
                ].map((teacher, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-rose-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                      {teacher.name.charAt(0)}
                    </div>
                    <h4 className="font-bold text-slate-800">{teacher.name}</h4>
                    <p className="text-slate-600 text-sm mb-3">{teacher.subject}</p>
                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
                      <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
                      <span className="text-slate-700 text-sm font-bold ml-1">{teacher.rating}</span>
                    </div>
                    <p className="text-slate-500 text-sm">{teacher.students.toLocaleString()} students</p>
                    <button className="mt-4 text-red-600 text-sm font-bold hover:text-red-700">
                      View Courses →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCourse && (
        <PaymentModal
          course={selectedCourse}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedCourse && (
        <CoursePreviewModal
          course={selectedCourse}
          onClose={() => setShowPreviewModal(false)}
          onEnroll={() => {
            setShowPreviewModal(false);
            setShowPaymentModal(true);
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;