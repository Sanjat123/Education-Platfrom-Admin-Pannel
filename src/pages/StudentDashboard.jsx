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
  Timestamp,
  getDoc
} from "firebase/firestore";
import { 
  FiBook, 
  FiVideo, 
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
  FiCalendar,
  FiCheckCircle,
  FiShield,
  FiHelpCircle,
  FiHome,
  FiBookOpen,
  FiMessageSquare,
  FiTarget,
  FiUpload,
  FiCopy,
  FiX,
  FiPercent,
  FiActivity,
  FiCalendar as FiCalendarIcon,
  FiFileText,
  FiDownload,
  FiBell,
  FiSettings,
  FiRefreshCw,
  FiArrowUpRight,
  FiPieChart,
  FiTarget as FiTargetIcon,
  FiClock as FiClockIcon,
  FiEdit,
  FiShare2,
  FiMoreVertical
} from "react-icons/fi";
import { 
  FaChalkboardTeacher, 
  FaRegMoneyBillAlt,
  FaPercentage,
  FaRupeeSign,
  FaCertificate,
  FaTrophy,
  FaFire,
  FaUserGraduate
} from "react-icons/fa";
import { BiCategory, BiTimeFive } from "react-icons/bi";
import { MdAssignment, MdQuiz, MdVideoLibrary, MdNotes } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import CourseCard from "../components/CourseCard";
import PaymentModal from "../components/PaymentModal";
import CoursePreviewModal from "../components/CoursePreviewModal";
import ProgressChart from "../components/ProgressChart";
import CertificateModal from "../components/CertificateModal";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  
  // Enhanced stats state
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    completedLessons: 0,
    totalLessons: 0,
    totalSpent: 0,
    learningHours: 0,
    certificates: 0,
    assignmentsSubmitted: 0,
    assignmentsPending: 0,
    quizScore: 0,
    streakDays: 0,
    rank: 0,
    weeklyProgress: 0,
    monthlyProgress: 0
  });

  const [categories, setCategories] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [enrolledCoursesData, setEnrolledCoursesData] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [ongoingCourses, setOngoingCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    scores: [65, 72, 80, 85]
  });

  // Fetch all data on component mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    fetchDashboardData();
    
    // Set up real-time listener for progress updates
    const unsubscribe = setupRealtimeListeners();
    
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (courses.length > 0) {
      extractCategories();
      filterAndSortCourses();
    }
  }, [courses, searchTerm, selectedCategory, sortBy]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCourses(),
        fetchEnrollments(),
        fetchStudentProgress(),
        fetchRecentActivity(),
        fetchUpcomingDeadlines(),
        fetchPerformanceMetrics()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    if (!user) return () => {};
    
    // Real-time listener for enrollments
    const enrollmentsQuery = query(
      collection(db, "enrollments"),
      where("studentId", "==", user.uid),
      where("status", "==", "active")
    );
    
    const unsubscribe = onSnapshot(enrollmentsQuery, (snapshot) => {
      const newEnrollments = snapshot.docs.map(doc => doc.data().courseId);
      setMyEnrollments(newEnrollments);
      
      // Update enrolled courses data
      const enrolledIds = newEnrollments;
      const enrolledCourses = courses.filter(course => enrolledIds.includes(course.id));
      setEnrolledCoursesData(enrolledCourses);
      
      // Separate ongoing and completed courses
      const ongoing = enrolledCourses.filter(course => {
        const progress = getCourseProgress(course.id);
        return progress < 100;
      });
      const completed = enrolledCourses.filter(course => {
        const progress = getCourseProgress(course.id);
        return progress >= 100;
      });
      
      setOngoingCourses(ongoing);
      setCompletedCourses(completed);
      
      setStats(prev => ({
        ...prev,
        enrolledCourses: enrolledCourses.length,
        completedCourses: completed.length
      }));
    });
    
    return unsubscribe;
  };

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
    }
  };

  const fetchEnrollments = async () => {
    try {
      if (!user) return;

      const q = query(
        collection(db, "enrollments"), 
        where("studentId", "==", user.uid),
        where("status", "in", ["active", "pending"])
      );
      const snap = await getDocs(q);
      const enrollmentData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const activeEnrollments = enrollmentData
        .filter(e => e.status === "active")
        .map(e => e.courseId);
      
      setMyEnrollments(activeEnrollments);
      
      // Fetch enrolled courses details
      if (activeEnrollments.length > 0) {
        const enrolledPromises = activeEnrollments.map(courseId =>
          getDoc(doc(db, "courses", courseId))
        );
        const enrolledSnapshots = await Promise.all(enrolledPromises);
        const enrolledCourses = enrolledSnapshots
          .filter(snap => snap.exists())
          .map(snap => ({ id: snap.id, ...snap.data() }));
        
        setEnrolledCoursesData(enrolledCourses);
        
        // Calculate total spent
        const totalSpent = enrollmentData
          .filter(e => e.status === "active")
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        
        setStats(prev => ({
          ...prev,
          enrolledCourses: enrolledCourses.length,
          totalSpent
        }));
      }
      
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      if (!user) return;

      const q = query(
        collection(db, "student_progress"), 
        where("studentId", "==", user.uid)
      );
      const snap = await getDocs(q);
      
      let totalLessons = 0;
      let completedLessons = 0;
      let totalHours = 0;
      let certificates = 0;
      let assignmentsSubmitted = 0;
      let assignmentsPending = 0;
      let quizScore = 0;
      let completedCoursesCount = 0;
      
      snap.docs.forEach(doc => {
        const progress = doc.data();
        totalLessons += progress.totalLessons || 0;
        completedLessons += progress.completedLessons?.length || 0;
        totalHours += progress.learningHours || 0;
        
        if (progress.certificateIssued) {
          certificates++;
        }
        
        if (progress.assignments) {
          assignmentsSubmitted += progress.assignments.filter(a => a.submitted).length;
          assignmentsPending += progress.assignments.filter(a => !a.submitted).length;
        }
        
        if (progress.quizScore) {
          quizScore = Math.max(quizScore, progress.quizScore);
        }
        
        if (progress.progressPercentage >= 100) {
          completedCoursesCount++;
        }
      });
      
      // Calculate streak days (simulated for now)
      const streakDays = Math.floor(Math.random() * 30) + 1;
      
      // Calculate rank based on progress (simulated)
      const rank = Math.floor(Math.random() * 100) + 1;
      
      setStats(prev => ({
        ...prev,
        completedLessons,
        totalLessons,
        learningHours: Math.round(totalHours * 10) / 10,
        certificates,
        completedCourses: completedCoursesCount,
        assignmentsSubmitted,
        assignmentsPending,
        quizScore,
        streakDays,
        rank
      }));
      
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      if (!user) return;

      const q = query(
        collection(db, "student_activity"),
        where("studentId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      
      const activities = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      
      setRecentActivity(activities);
      
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const fetchUpcomingDeadlines = async () => {
    try {
      if (!user) return;

      const now = new Date();
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const q = query(
        collection(db, "assignments"),
        where("studentId", "==", user.uid),
        where("dueDate", ">=", Timestamp.fromDate(now)),
        where("dueDate", "<=", Timestamp.fromDate(twoWeeksLater)),
        orderBy("dueDate", "asc")
      );
      const snap = await getDocs(q);
      
      const deadlines = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate()
      }));
      
      setUpcomingDeadlines(deadlines);
      
    } catch (error) {
      console.error("Error fetching deadlines:", error);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      if (!user) return;

      // Simulated performance data for now
      // In production, fetch from analytics collection
      const mockPerformance = {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        scores: [60, 68, 75, 82, 85],
        weeklyProgress: 15, // percentage
        monthlyProgress: 42 // percentage
      };
      
      setPerformanceData(mockPerformance);
      setStats(prev => ({
        ...prev,
        weeklyProgress: mockPerformance.weeklyProgress,
        monthlyProgress: mockPerformance.monthlyProgress
      }));
      
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
    }
  };

  const getCourseProgress = (courseId) => {
    // This would fetch from student_progress collection
    // For now, return mock progress
    return Math.floor(Math.random() * 100);
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
        course.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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
        case "completion-rate":
          return (b.completionRate || 0) - (a.completionRate || 0);
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
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
        name: "Student Nagari",
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
        studentAvatar: userProfile?.avatar || "",
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        courseThumbnail: selectedCourse.thumbnail,
        enrolledAt: Timestamp.now(),
        paymentId: paymentData.paymentId,
        orderId: paymentData.orderId,
        amount: selectedCourse.discountPrice || selectedCourse.price,
        status: "active",
        paymentMethod: paymentData.method,
        verifiedAt: Timestamp.now(),
        transactionDetails: paymentData,
        accessExpiry: null // Lifetime access
      }, { merge: true });

      // Create student progress record
      const progressId = `${user.uid}_${selectedCourse.id}`;
      const progressRef = doc(db, "student_progress", progressId);
      
      await updateDoc(progressRef, {
        studentId: user.uid,
        studentName: userProfile?.name || user.email,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        completedLessons: [],
        totalLessons: selectedCourse.lessonsCount || 0,
        progressPercentage: 0,
        enrolledAt: Timestamp.now(),
        lastAccessed: Timestamp.now(),
        learningHours: 0,
        certificateIssued: false,
        assignments: [],
        quizAttempts: [],
        notes: [],
        bookmarks: []
      }, { merge: true });

      // Update course enrollment count
      const courseRef = doc(db, "courses", selectedCourse.id);
      await updateDoc(courseRef, {
        studentsEnrolled: (selectedCourse.studentsEnrolled || 0) + 1,
        lastEnrollment: Timestamp.now()
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

      // Record activity
      await addDoc(collection(db, "student_activity"), {
        studentId: user.uid,
        studentName: userProfile?.name || user.email,
        type: "enrollment",
        title: `Enrolled in ${selectedCourse.title}`,
        description: `Successfully enrolled in ${selectedCourse.title} course`,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        timestamp: Timestamp.now(),
        metadata: {
          amount: selectedCourse.discountPrice || selectedCourse.price,
          paymentMethod: paymentData.method
        }
      });

      toast.success("🎉 Payment successful! Course access granted immediately.");
      
      // Refresh data
      setTimeout(() => {
        fetchEnrollments();
        fetchStudentProgress();
        fetchRecentActivity();
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

      // Record activity
      await addDoc(collection(db, "student_activity"), {
        studentId: user.uid,
        studentName: userProfile?.name || user.email,
        type: "manual_payment",
        title: `Submitted payment proof for ${selectedCourse.title}`,
        description: "Awaiting admin verification",
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        timestamp: Timestamp.now(),
        metadata: {
          amount: selectedCourse.discountPrice || selectedCourse.price
        }
      });

      setShowManualPaymentModal(false);
      toast.success("✅ Payment proof submitted! Admin will verify within 24 hours.");
      toast.success("You'll receive email notification when approved.");
      
      // Show contact info
      setTimeout(() => {
        toast((t) => (
          <div className="p-2">
            <p className="font-bold">Need immediate access?</p>
            <p className="text-sm">Contact support: support@studentnagari.com</p>
            <p className="text-sm">WhatsApp: +91 9876543210</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText("support@studentnagari.com");
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

  const handleContinueLearning = (course) => {
    navigate(`/student/course/view/${course.id}`);
  };

  const handleViewCertificate = (course) => {
    setSelectedCertificate({
      studentName: userProfile?.name || "Student",
      courseTitle: course.title,
      completionDate: new Date().toLocaleDateString(),
      certificateId: `CERT-${course.id}-${user.uid}`,
      issueDate: new Date().toISOString()
    });
    setShowCertificateModal(true);
  };

  const handleDownloadCertificate = (certificate) => {
    // In production, generate and download PDF certificate
    toast.success("Certificate downloaded successfully!");
  };

  const handleShareProgress = () => {
    const progressText = `I've completed ${stats.completedCourses} courses and ${stats.completedLessons} lessons on Student Nagari! 🎓\n\nProgress: ${stats.weeklyProgress}% this week\nLearning Streak: ${stats.streakDays} days 🔥\n\nJoin me: https://studentnagari.com`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Learning Progress',
        text: progressText,
        url: 'https://studentnagari.com'
      });
    } else {
      navigator.clipboard.writeText(progressText);
      toast.success("Progress copied to clipboard! Share it with your friends.");
    }
  };

  const handleRefreshData = () => {
    fetchDashboardData();
    toast.success("Dashboard data refreshed!");
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
          <p className="text-slate-600">Loading your learning dashboard...</p>
          <p className="text-sm text-slate-500 mt-2">Fetching your progress and courses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" />
      
      {/* Dashboard Header with Quick Actions */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-full">
                  <FaUserGraduate className="text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tighter">
                    Welcome back, {userProfile?.name || "Student"}! 👋
                  </h1>
                  <p className="text-red-100 text-sm md:text-base">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/student/my-courses")}
                  className="px-4 py-2 bg-white text-red-600 rounded-full font-bold hover:bg-red-50 transition-all shadow-lg text-sm"
                >
                  📚 My Courses ({stats.enrolledCourses})
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareProgress}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all border border-white/30 text-sm"
                >
                  📢 Share Progress
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefreshData}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all border border-white/30 text-sm flex items-center gap-2"
                >
                  <FiRefreshCw /> Refresh
                </motion.button>
                <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all border border-white/30 text-sm">
                  <FiSettings />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Streak Display */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                <div className="flex items-center justify-center gap-2">
                  <FaFire className="text-orange-400" />
                  <span className="font-bold">{stats.streakDays}</span>
                </div>
                <div className="text-xs text-white/80">Day Streak</div>
              </div>
              
              {/* Rank Display */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                <div className="flex items-center justify-center gap-2">
                  <FaTrophy className="text-yellow-400" />
                  <span className="font-bold">#{stats.rank}</span>
                </div>
                <div className="text-xs text-white/80">Global Rank</div>
              </div>
              
              {/* Profile Avatar */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-transparent rounded-full flex items-center justify-center border-2 border-white/30">
                  <span className="text-xl font-black">
                    {userProfile?.name?.charAt(0) || user.email?.charAt(0) || "S"}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center text-emerald-900 text-xs font-black">
                  {stats.certificates}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="container mx-auto px-4 -mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { 
              label: "Learning Hours", 
              value: `${stats.learningHours}h`, 
              icon: <FiClock />, 
              color: "text-blue-600",
              bg: "bg-blue-50",
              trend: "+2.5h this week",
              progress: 65
            },
            { 
              label: "Course Progress", 
              value: `${stats.completedCourses}/${stats.enrolledCourses}`, 
              icon: <FiCheckCircle />, 
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              trend: `${Math.round((stats.completedCourses / stats.enrolledCourses) * 100) || 0}% completed`,
              progress: stats.enrolledCourses > 0 ? Math.round((stats.completedCourses / stats.enrolledCourses) * 100) : 0
            },
            { 
              label: "Lesson Completion", 
              value: `${stats.completedLessons}/${stats.totalLessons}`, 
              icon: <FiBookOpen />, 
              color: "text-purple-600",
              bg: "bg-purple-50",
              trend: `${Math.round((stats.completedLessons / stats.totalLessons) * 100) || 0}% done`,
              progress: stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0
            },
            { 
              label: "Certificates", 
              value: stats.certificates, 
              icon: <FaCertificate />, 
              color: "text-amber-600",
              bg: "bg-amber-50",
              trend: `${stats.certificates} earned`,
              progress: 100
            },
            { 
              label: "Weekly Progress", 
              value: `${stats.weeklyProgress}%`, 
              icon: <FiTrendingUp />, 
              color: "text-red-600",
              bg: "bg-red-50",
              trend: "+8% from last week",
              progress: stats.weeklyProgress
            }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{stat.trend}</span>
                  <span className="font-bold">{stat.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${stat.color.replace('text-', 'bg-')}`}
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Learning Overview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ongoing Courses */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FiPlayCircle className="text-red-600" /> Continue Learning
                </h2>
                <button 
                  onClick={() => navigate("/student/my-courses")}
                  className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-1"
                >
                  View All <FiChevronRight />
                </button>
              </div>
              
              {ongoingCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ongoingCourses.slice(0, 4).map((course, index) => {
                    const progress = getCourseProgress(course.id);
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-slate-200 rounded-xl p-4 hover:border-red-300 transition-colors cursor-pointer group"
                        onClick={() => handleContinueLearning(course)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <img 
                              src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"}
                              alt={course.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {Math.round(progress)}%
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-1">
                              {course.title}
                            </h3>
                            <p className="text-sm text-slate-500 mb-2">{course.teacherName}</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span className="font-bold">{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div 
                                  className="bg-red-600 h-1.5 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiBook className="text-4xl text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No active courses yet</p>
                  <button 
                    onClick={() => window.scrollTo({ top: document.getElementById('courses-section')?.offsetTop, behavior: 'smooth' })}
                    className="mt-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    Browse Courses
                  </button>
                </div>
              )}
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FiActivity className="text-red-600" /> Learning Analytics
                </h2>
                <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                  <option>Last 4 Weeks</option>
                  <option>Last 3 Months</option>
                  <option>Last 6 Months</option>
                </select>
              </div>
              <ProgressChart data={performanceData} />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FiClock className="text-red-600" /> Recent Activity
              </h2>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50"
                    >
                      <div className={`p-2 rounded-full ${
                        activity.type === 'enrollment' ? 'bg-emerald-100 text-emerald-600' :
                        activity.type === 'lesson_complete' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'assignment' ? 'bg-purple-100 text-purple-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {activity.type === 'enrollment' ? <FiBook /> :
                         activity.type === 'lesson_complete' ? <FiCheckCircle /> :
                         activity.type === 'assignment' ? <MdAssignment /> :
                         <FiVideo />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {activity.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FiCalendarIcon className="text-red-600" /> Upcoming Deadlines
              </h2>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.slice(0, 3).map((deadline, index) => (
                    <div key={deadline.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <p className="font-medium text-slate-800">{deadline.title}</p>
                      <p className="text-sm text-slate-500">{deadline.courseTitle}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <BiTimeFive /> Due: {deadline.dueDate?.toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No upcoming deadlines
                  </div>
                )}
                <button className="w-full text-center text-red-600 hover:text-red-700 font-medium text-sm pt-2">
                  View Calendar
                </button>
              </div>
            </div>

            {/* Certificates Earned */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FaCertificate className="text-amber-600" /> Certificates Earned
              </h2>
              <div className="space-y-4">
                {completedCourses.slice(0, 3).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{course.title}</h3>
                        <p className="text-xs text-slate-500">Completed on {new Date().toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleViewCertificate(course)}
                        className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200"
                      >
                        <FiEye size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {stats.certificates === 0 && (
                  <div className="text-center py-4">
                    <p className="text-slate-600 text-sm">Complete courses to earn certificates</p>
                  </div>
                )}
                {stats.certificates > 3 && (
                  <button className="w-full text-center text-amber-600 hover:text-amber-700 font-medium text-sm">
                    View All ({stats.certificates})
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-6">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Avg. Daily Time</span>
                  <span className="font-bold">1.8h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Quiz Accuracy</span>
                  <span className="font-bold">{stats.quizScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Assignments Done</span>
                  <span className="font-bold">{stats.assignmentsSubmitted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Notes Created</span>
                  <span className="font-bold">24</span>
                </div>
              </div>
              <button className="w-full mt-6 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors">
                View Full Report
              </button>
            </div>

            {/* Learning Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FiTargetIcon className="text-red-600" /> Learning Goals
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">Complete 5 courses</span>
                    <span className="text-sm font-bold">{stats.completedCourses}/5</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-red-600 rounded-full h-2"
                      style={{ width: `${(stats.completedCourses / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">50 learning hours</span>
                    <span className="text-sm font-bold">{stats.learningHours}/50h</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2"
                      style={{ width: `${(stats.learningHours / 50) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">30-day streak</span>
                    <span className="text-sm font-bold">{stats.streakDays}/30</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-amber-600 rounded-full h-2"
                      style={{ width: `${(stats.streakDays / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Browse Courses Section */}
        <div id="courses-section" className="mt-12">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Browse Courses</h2>
                <p className="text-slate-600 mt-2">Discover new skills and advance your career</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <select
                  className="border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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

            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.slice(0, 6).map((course, index) => {
                  const isEnrolled = myEnrollments.includes(course.id);
                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isEnrolled={isEnrolled}
                      onPreview={() => handleCoursePreview(course)}
                      onEnroll={() => handleCoursePurchase(course)}
                      onManualPayment={() => {
                        setSelectedCourse(course);
                        setShowManualPaymentModal(true);
                      }}
                      progress={isEnrolled ? getCourseProgress(course.id) : 0}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiSearch className="text-6xl text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No courses found</h3>
                <p className="text-slate-500">Try adjusting your search or filters</p>
              </div>
            )}
            
            <div className="text-center mt-8">
              <button 
                onClick={() => navigate("/courses")}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
              >
                Browse All Courses <FiArrowUpRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPreviewModal && selectedCourse && (
        <CoursePreviewModal
          course={selectedCourse}
          onClose={() => setShowPreviewModal(false)}
          onEnroll={() => {
            setShowPreviewModal(false);
            handleCoursePurchase(selectedCourse);
          }}
        />
      )}

      {showCertificateModal && selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setShowCertificateModal(false)}
          onDownload={() => handleDownloadCertificate(selectedCertificate)}
        />
      )}

      {showManualPaymentModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* Manual payment modal content */}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;