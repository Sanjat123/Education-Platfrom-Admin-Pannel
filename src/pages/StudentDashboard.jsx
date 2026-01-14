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
  addDoc,
  orderBy,
  limit,
  Timestamp
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
  FiTarget,
  FiUpload,
  FiImage,
  FiAlertCircle,
  FiCopy,
  FiX
} from "react-icons/fi";
import { 
  FaChalkboardTeacher, 
  FaRegMoneyBillAlt,
  FaPercentage,
  FaRupeeSign
} from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
// StudentDashboard.jsx imports should include:
import CourseCard from "../components/CourseCard";
import PaymentModal from "../components/PaymentModal";
import CoursePreviewModal from "../components/CoursePreviewModal";

// Razorpay configuration
const RAZORPAY_KEY_ID = "rzp_test_S3ksnwzFmK3f5K";

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
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleCoursePurchase = async (course) => {
    setSelectedCourse(course);
    setProcessingPayment(true);
    
    try {
      // First try automatic payment
      const success = await initiateRazorpayPayment(course);
      
      if (!success) {
        // If automatic payment fails, show manual option
        toast.error("Automatic payment failed. You can try manual payment with screenshot.");
        setShowManualPaymentModal(true);
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Payment failed. Please try manual method.");
      setShowManualPaymentModal(true);
    } finally {
      setProcessingPayment(false);
    }
  };

  const initiateRazorpayPayment = async (course) => {
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment system. Please try manual method.");
        return false;
      }

      // Calculate amount (in paise for Razorpay)
      const amount = (course.discountPrice || course.price) * 100;
      
      // Generate order ID
      const orderId = `order_${Date.now()}_${user.uid}_${course.id}`;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency: "INR",
        name: "Learning Platform",
        description: `Payment for ${course.title}`,
        order_id: orderId,
        handler: async function (response) {
          // Payment successful
          await handlePaymentSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            method: "automatic"
          });
        },
        prefill: {
          name: userProfile?.name || "",
          email: user?.email || "",
          contact: userProfile?.phone || ""
        },
        theme: {
          color: "#EF4444"
        },
        modal: {
          ondismiss: function() {
            toast.error("Payment cancelled. You can try manual payment.");
            setShowManualPaymentModal(true);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      return true;
    } catch (error) {
      console.error("Razorpay error:", error);
      return false;
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      toast.loading("Processing your enrollment...", { duration: 3000 });
      
      // Create enrollment record
      const enrollmentId = `${user.uid}_${selectedCourse.id}`;
      const enrollmentRef = doc(db, "enrollments", enrollmentId);
      
      await updateDoc(enrollmentRef, {
        studentId: user.uid,
        studentName: userProfile?.name || user.email,
        studentEmail: user.email,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        enrolledAt: Timestamp.now(),
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        amount: selectedCourse.discountPrice || selectedCourse.price,
        status: "active",
        paymentMethod: paymentData.method,
        verifiedAt: Timestamp.now(),
        transactionDetails: paymentData
      }, { merge: true });

      // Create student progress record
      const progressId = `${user.uid}_${selectedCourse.id}`;
      const progressRef = doc(db, "student_progress", progressId);
      
      await updateDoc(progressRef, {
        studentId: user.uid,
        courseId: selectedCourse.id,
        completedLessons: [],
        totalLessons: selectedCourse.lessonsCount || 0,
        progressPercentage: 0,
        enrolledAt: Timestamp.now(),
        lastAccessed: Timestamp.now(),
        learningHours: 0,
        certificateIssued: false
      }, { merge: true });

      // Update course enrollment count
      const courseRef = doc(db, "courses", selectedCourse.id);
      await updateDoc(courseRef, {
        studentsEnrolled: (selectedCourse.studentsEnrolled || 0) + 1
      });

      // Add to purchase history
      await addDoc(collection(db, "payment_history"), {
        studentId: user.uid,
        studentEmail: user.email,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        amount: selectedCourse.discountPrice || selectedCourse.price,
        paymentId: paymentData.paymentId,
        paymentMethod: paymentData.method,
        status: "success",
        timestamp: Timestamp.now(),
        autoVerified: paymentData.method === "automatic"
      });

      toast.success("🎉 Payment successful! Course access granted immediately.");
      
      // Refresh data
      setTimeout(() => {
        fetchEnrollments();
        fetchCourses();
      }, 1000);

    } catch (error) {
      console.error("Error updating after payment:", error);
      toast.error("Payment processed but enrollment failed. Contact support.");
    }
  };

  const handleManualPaymentSubmit = async (screenshotData) => {
    try {
      toast.loading("Submitting payment proof for verification...");
      
      // Create manual payment request
      const manualPaymentId = `manual_${Date.now()}_${user.uid}_${selectedCourse.id}`;
      
      await addDoc(collection(db, "manual_payments"), {
        id: manualPaymentId,
        studentId: user.uid,
        studentName: userProfile?.name || user.email,
        studentEmail: user.email,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        amount: selectedCourse.discountPrice || selectedCourse.price,
        screenshotUrl: screenshotData.url,
        screenshotFile: screenshotData.fileName,
        transactionId: screenshotData.transactionId || "",
        bankName: screenshotData.bankName || "",
        submittedAt: Timestamp.now(),
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        notes: screenshotData.notes || ""
      });

      // Create pending enrollment
      const enrollmentId = `${user.uid}_${selectedCourse.id}`;
      const enrollmentRef = doc(db, "enrollments", enrollmentId);
      
      await updateDoc(enrollmentRef, {
        studentId: user.uid,
        studentName: userProfile?.name || user.email,
        studentEmail: user.email,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        enrolledAt: Timestamp.now(),
        amount: selectedCourse.discountPrice || selectedCourse.price,
        status: "pending",
        paymentMethod: "manual",
        manualPaymentId: manualPaymentId,
        requiresVerification: true
      }, { merge: true });

      setShowManualPaymentModal(false);
      toast.success("✅ Payment proof submitted! Admin will verify within 24 hours.");
      toast.success("You'll receive email notification when approved.");
      
      // Show contact info
      setTimeout(() => {
        toast((t) => (
          <div className="p-2">
            <p className="font-bold">Need immediate access?</p>
            <p className="text-sm">Contact support: support@learningplatform.com</p>
            <p className="text-sm">WhatsApp: +91 9876543210</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText("support@learningplatform.com");
                toast.success("Email copied!");
              }}
              className="mt-2 text-blue-600 text-sm"
            >
              Copy Support Email
            </button>
          </div>
        ), { duration: 10000 });
      }, 2000);

    } catch (error) {
      console.error("Manual payment submission error:", error);
      toast.error("Failed to submit payment proof. Please try again.");
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
      
      {/* Payment Info Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-2 px-4 text-center">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-2">
          <FiShield className="inline mr-2" />
          <span className="font-bold">Instant Access:</span>
          <span className="text-emerald-100">Pay with UPI/Card for immediate enrollment</span>
          <span className="mx-2">•</span>
          <FiHelpCircle className="inline mr-2" />
          <span className="font-bold">Manual Option:</span>
          <span className="text-emerald-100">Upload screenshot if payment fails</span>
        </div>
      </div>

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
                                        <div className="flex flex-col gap-2">
                                          <button
                                            onClick={() => handleCoursePurchase(course)}
                                            disabled={processingPayment}
                                            className={`px-4 py-2 ${processingPayment ? 'bg-gray-400' : 'bg-red-600'} text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2`}
                                          >
                                            {processingPayment ? (
                                              <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                              </>
                                            ) : (
                                              <>
                                                <FiShoppingCart size={14} /> Enroll Now
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedCourse(course);
                                              setShowManualPaymentModal(true);
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1"
                                            title="Having payment issues? Upload screenshot"
                                          >
                                            <FiUpload size={12} /> Manual Payment
                                          </button>
                                        </div>
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
                                    <div className="flex flex-col gap-2">
                                      <button
                                        onClick={() => handleCoursePurchase(course)}
                                        disabled={processingPayment}
                                        className={`px-4 py-1.5 ${processingPayment ? 'bg-gray-400' : 'bg-red-600'} text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2`}
                                      >
                                        {processingPayment ? (
                                          <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ...
                                          </>
                                        ) : (
                                          <>
                                            <FiShoppingCart size={12} /> Enroll
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedCourse(course);
                                          setShowManualPaymentModal(true);
                                        }}
                                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
                                        title="Manual payment option"
                                      >
                                        <FiUpload size={10} /> Manual
                                      </button>
                                    </div>
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

      {/* Manual Payment Modal */}
      {showManualPaymentModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Manual Payment Process</h2>
                <p className="text-slate-600">Upload payment proof for manual verification</p>
              </div>
              <button
                onClick={() => setShowManualPaymentModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Payment Details */}
                <div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FaRupeeSign /> Payment Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-red-200">
                        <span className="text-slate-600">Course:</span>
                        <span className="font-bold">{selectedCourse.title}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-3 border-b border-red-200">
                        <span className="text-slate-600">Amount to Pay:</span>
                        <span className="text-2xl font-bold text-red-600">
                          ₹{selectedCourse.discountPrice || selectedCourse.price}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Student:</span>
                        <span className="font-bold">{userProfile?.name || user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Bank Transfer Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Account Name:</span>
                        <span className="font-bold">Learning Platform</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Account Number:</span>
                        <span className="font-bold">123456789012</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">IFSC Code:</span>
                        <span className="font-bold">SBIN0001234</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Bank:</span>
                        <span className="font-bold">State Bank of India</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">UPI ID:</span>
                        <span className="font-bold">learningplatform@upi</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const details = `Account Name: Learning Platform\nAccount Number: 123456789012\nIFSC Code: SBIN0001234\nBank: State Bank of India\nUPI ID: learningplatform@upi`;
                        navigator.clipboard.writeText(details);
                        toast.success('Bank details copied to clipboard!');
                      }}
                      className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiCopy /> Copy Bank Details
                    </button>
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6">
                    <h4 className="font-bold text-slate-800 mb-3">Payment Methods Accepted</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-700">Bank Transfer (NEFT/IMPS)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-700">UPI Payment</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-700">Google Pay / PhonePe</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-700">Paytm Wallet</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Upload Form */}
                <div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <FiUpload /> Upload Payment Proof
                    </h3>

                    {/* Upload Area */}
                    <div className="mb-6">
                      <label className="block text-slate-700 font-medium mb-3">
                        Payment Screenshot / Receipt *
                      </label>
                      
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          id="screenshot-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const mockUrl = URL.createObjectURL(file);
                              handleManualPaymentSubmit({
                                url: mockUrl,
                                fileName: file.name,
                                transactionId: '',
                                bankName: '',
                                notes: ''
                              });
                            }
                          }}
                        />
                        
                        <label htmlFor="screenshot-upload" className="cursor-pointer">
                          <div className="space-y-4">
                            <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                              <FiUpload className="text-slate-400 text-3xl" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-700">Click to upload screenshot</p>
                              <p className="text-sm text-slate-500">JPG, PNG up to 5MB</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 mb-6">
                      <div className="flex items-start gap-3 mb-4">
                        <FiAlertCircle className="text-amber-600 text-xl mt-1" />
                        <div>
                          <h4 className="font-bold text-slate-800 mb-2">Important Instructions</h4>
                          <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600">•</span>
                              Ensure screenshot clearly shows transaction ID and amount
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600">•</span>
                              Include your email ID in payment notes if possible
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600">•</span>
                              Verification usually takes 2-24 hours during business days
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600">•</span>
                              You'll receive email notification once approved
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                      <p className="text-sm text-slate-600 mb-2">Need immediate assistance?</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("support@learningplatform.com");
                            toast.success("Support email copied!");
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-bold"
                        >
                          ✉️ support@learningplatform.com
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("+91 9876543210");
                            toast.success("Phone number copied!");
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-bold"
                        >
                          📞 +91 9876543210
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;