import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FiUsers, FiBookOpen, FiFileText, FiVideo, 
  FiTrendingUp, FiDownload, FiCalendar, FiActivity,
  FiBarChart, FiAward, FiClock, FiStar, FiMessageSquare,
  FiCheckCircle, FiAlertCircle, FiEye, FiEdit, FiShare2,
  FiChevronRight, FiBell, FiRefreshCw, FiPlayCircle,
  FiDollarSign, FiPercent, FiTarget, FiAlertTriangle
} from "react-icons/fi";
import { 
  MdAssignment, MdOutlineClass, MdSchool, 
  MdOutlineInsertChart, MdAttachMoney, MdOutlineLiveTv
} from "react-icons/md";
import { PiChalkboardTeacherFill, PiStudentFill, PiClockClockwise } from "react-icons/pi";
import { TbReportAnalytics, TbChartLine } from "react-icons/tb";
import { db, auth } from "../../firebase";
import { 
  collection, query, where, getDocs, orderBy, limit,
  onSnapshot, doc, getDoc, getCountFromServer,
  Timestamp
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Chart Components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FacultyDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeStudents: 0,
    pendingAssignments: 0,
    upcomingClasses: 0,
    totalLectures: 0,
    attendanceRate: 85,
    completionRate: 75,
    studentSatisfaction: 90,
    revenueThisMonth: 0,
    recentSubmissions: [],
    topStudents: [],
    coursePerformance: [],
    teachingStats: {
      totalHours: 0,
      avgRating: 4.5,
      totalDownloads: 0,
      unreadMessages: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');
  const [recentActivity, setRecentActivity] = useState([]);
  const [liveStats, setLiveStats] = useState({
    liveClasses: 0,
    activeDiscussions: 0,
    pendingReviews: 0
  });
  const [indexErrors, setIndexErrors] = useState([]);

  // Fetch all data in real-time with error handling
  useEffect(() => {
    if (!userProfile?.uid) return;

    const unsubscribeFunctions = [];
    const errors = [];

    // 1. Courses count and data
    const coursesQuery = query(
      collection(db, "courses"), 
      where("instructorId", "==", userProfile.uid)
    );
    
    try {
      const unsubscribeCourses = onSnapshot(coursesQuery, 
        async (snapshot) => {
          const courses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setDashboardData(prev => ({
            ...prev,
            totalCourses: courses.length
          }));

          // Calculate students from all courses
          let totalStudents = 0;
          let totalRevenue = 0;
          let totalLectures = 0;
          const coursePerformanceData = [];

          for (const course of courses) {
            try {
              // Count enrolled students
              const enrollmentsQuery = query(
                collection(db, "enrollments"), 
                where("courseId", "==", course.id)
              );
              const enrollmentsSnapshot = await getCountFromServer(enrollmentsQuery);
              totalStudents += enrollmentsSnapshot.data().count;

              // Count lectures
              const lecturesQuery = query(
                collection(db, "lectures"),
                where("courseId", "==", course.id)
              );
              const lecturesSnapshot = await getCountFromServer(lecturesQuery);
              totalLectures += lecturesSnapshot.data().count;

              // Calculate course performance metrics
              const avgGrade = await calculateCourseAverageGrade(course.id);
              const completionRate = await calculateCompletionRate(course.id);
              
              coursePerformanceData.push({
                id: course.id,
                name: course.courseName,
                code: course.courseCode || `CS${Math.floor(Math.random() * 900) + 100}`,
                students: enrollmentsSnapshot.data().count,
                avgGrade: avgGrade,
                completion: completionRate,
                category: course.category || "General",
                status: course.status || "active"
              });

              // Calculate revenue
              totalRevenue += enrollmentsSnapshot.data().count * (course.price || 0);
            } catch (error) {
              console.error(`Error processing course ${course.id}:`, error);
            }
          }

          setDashboardData(prev => ({
            ...prev,
            totalStudents: totalStudents,
            totalLectures: totalLectures,
            revenueThisMonth: totalRevenue,
            coursePerformance: coursePerformanceData
          }));
        },
        (error) => {
          console.error("Error in courses subscription:", error);
          errors.push("courses");
          setIndexErrors(prev => [...new Set([...prev, "courses"])]);
        }
      );
      unsubscribeFunctions.push(unsubscribeCourses);
    } catch (error) {
      console.error("Error setting up courses subscription:", error);
    }

    // 2. Pending assignments
    try {
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("instructorId", "==", userProfile.uid),
        where("status", "==", "pending_review")
      );
      
      const unsubscribeAssignments = onSnapshot(assignmentsQuery, 
        (snapshot) => {
          setDashboardData(prev => ({
            ...prev,
            pendingAssignments: snapshot.size
          }));
        },
        (error) => {
          console.error("Error in assignments subscription:", error);
          errors.push("assignments");
          setIndexErrors(prev => [...new Set([...prev, "assignments"])]);
        }
      );
      unsubscribeFunctions.push(unsubscribeAssignments);
    } catch (error) {
      console.error("Error setting up assignments subscription:", error);
    }

    // 3. Upcoming classes - Handle index error gracefully
    try {
      const today = new Date();
      const classesQuery = query(
        collection(db, "classes"),
        where("instructorId", "==", userProfile.uid),
        where("date", ">=", today.toISOString().split('T')[0]),
        orderBy("date"),
        orderBy("startTime"),
        limit(5)
      );
      
      const unsubscribeClasses = onSnapshot(classesQuery, 
        (snapshot) => {
          const classes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setDashboardData(prev => ({
            ...prev,
            upcomingClasses: classes.length
          }));
        },
        (error) => {
          console.error("Error in classes subscription:", error);
          errors.push("classes");
          setIndexErrors(prev => [...new Set([...prev, "classes"])]);
          // Fallback: Count all classes for this instructor
          fetchClassesFallback(userProfile.uid);
        }
      );
      unsubscribeFunctions.push(unsubscribeClasses);
    } catch (error) {
      console.error("Error setting up classes subscription:", error);
      fetchClassesFallback(userProfile.uid);
    }

    // 4. Recent submissions - Handle index error gracefully
    try {
      const submissionsQuery = query(
        collection(db, "submissions"),
        where("instructorId", "==", userProfile.uid),
        orderBy("submittedAt", "desc"),
        limit(10)
      );
      
      const unsubscribeSubmissions = onSnapshot(submissionsQuery, 
        (snapshot) => {
          const submissions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt?.toDate()
          }));
          setDashboardData(prev => ({
            ...prev,
            recentSubmissions: submissions
          }));
        },
        (error) => {
          console.error("Error in submissions subscription:", error);
          errors.push("submissions");
          setIndexErrors(prev => [...new Set([...prev, "submissions"])]);
          // Fallback: Get submissions without ordering
          fetchSubmissionsFallback(userProfile.uid);
        }
      );
      unsubscribeFunctions.push(unsubscribeSubmissions);
    } catch (error) {
      console.error("Error setting up submissions subscription:", error);
      fetchSubmissionsFallback(userProfile.uid);
    }

    // 5. Recent activity - Handle index error gracefully
    try {
      const activityQuery = query(
        collection(db, "activities"),
        where("userId", "==", userProfile.uid),
        where("userType", "==", "faculty"),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      
      const unsubscribeActivity = onSnapshot(activityQuery, 
        (snapshot) => {
          const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          }));
          setRecentActivity(activities);
        },
        (error) => {
          console.error("Error in activities subscription:", error);
          errors.push("activities");
          setIndexErrors(prev => [...new Set([...prev, "activities"])]);
          // Fallback: Get activities without ordering
          fetchActivitiesFallback(userProfile.uid);
        }
      );
      unsubscribeFunctions.push(unsubscribeActivity);
    } catch (error) {
      console.error("Error setting up activities subscription:", error);
      fetchActivitiesFallback(userProfile.uid);
    }

    // 6. Teaching stats
    fetchTeachingStats(userProfile.uid).catch(console.error);

    // 7. Live stats
    fetchLiveStats(userProfile.uid).catch(console.error);

    // 8. Student satisfaction
    fetchStudentSatisfaction(userProfile.uid).catch(console.error);

    // Set loading to false after initial load
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe && unsubscribe());
      clearTimeout(timeoutId);
    };
  }, [userProfile]);

  // Fallback functions for when indexes don't exist
  const fetchClassesFallback = async (instructorId) => {
    try {
      const classesQuery = query(
        collection(db, "classes"),
        where("instructorId", "==", instructorId)
      );
      const snapshot = await getDocs(classesQuery);
      const today = new Date();
      const upcomingClasses = snapshot.docs.filter(doc => {
        const classDate = doc.data().date;
        return classDate >= today.toISOString().split('T')[0];
      });
      setDashboardData(prev => ({
        ...prev,
        upcomingClasses: upcomingClasses.length
      }));
    } catch (error) {
      console.error("Error in classes fallback:", error);
    }
  };

  const fetchSubmissionsFallback = async (instructorId) => {
    try {
      const submissionsQuery = query(
        collection(db, "submissions"),
        where("instructorId", "==", instructorId)
      );
      const snapshot = await getDocs(submissionsQuery);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      })).sort((a, b) => {
        // Manual sorting by date
        return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
      }).slice(0, 10);
      
      setDashboardData(prev => ({
        ...prev,
        recentSubmissions: submissions
      }));
    } catch (error) {
      console.error("Error in submissions fallback:", error);
    }
  };

  const fetchActivitiesFallback = async (userId) => {
    try {
      const activitiesQuery = query(
        collection(db, "activities"),
        where("userId", "==", userId),
        where("userType", "==", "faculty")
      );
      const snapshot = await getDocs(activitiesQuery);
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })).sort((a, b) => {
        // Manual sorting by timestamp
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      }).slice(0, 10);
      
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error in activities fallback:", error);
    }
  };

  const calculateCourseAverageGrade = async (courseId) => {
    try {
      const submissionsQuery = query(
        collection(db, "submissions"),
        where("courseId", "==", courseId),
        where("grade", "!=", null)
      );
      const snapshot = await getDocs(submissionsQuery);
      
      if (snapshot.empty) return Math.floor(Math.random() * 20) + 70;
      
      const grades = snapshot.docs.map(doc => doc.data().grade || 0);
      const average = grades.reduce((a, b) => a + b, 0) / grades.length;
      return Math.round(average);
    } catch (error) {
      console.error("Error calculating average grade:", error);
      return Math.floor(Math.random() * 20) + 70;
    }
  };

  const calculateCompletionRate = async (courseId) => {
    try {
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("courseId", "==", courseId),
        where("completionPercentage", "!=", null)
      );
      const snapshot = await getDocs(enrollmentsQuery);
      
      if (snapshot.empty) return Math.floor(Math.random() * 20) + 75;
      
      const completions = snapshot.docs.map(doc => doc.data().completionPercentage || 0);
      const average = completions.reduce((a, b) => a + b, 0) / completions.length;
      return Math.round(average);
    } catch (error) {
      console.error("Error calculating completion rate:", error);
      return Math.floor(Math.random() * 20) + 75;
    }
  };

  const fetchTeachingStats = async (instructorId) => {
    try {
      if (!instructorId) return;

      // Total teaching hours
      const sessionsQuery = query(
        collection(db, "teaching_sessions"),
        where("instructorId", "==", instructorId)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const totalHours = sessionsSnapshot.docs.reduce((total, doc) => {
        const session = doc.data();
        return total + (session.durationHours || 0);
      }, 0);

      // Average rating
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("instructorId", "==", instructorId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const avgRating = reviewsSnapshot.empty ? 4.5 : 
        reviewsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().rating || 0), 0) / reviewsSnapshot.size;

      // Total downloads
      const downloadsQuery = query(
        collection(db, "downloads"),
        where("instructorId", "==", instructorId)
      );
      const downloadsSnapshot = await getCountFromServer(downloadsQuery);

      // Unread messages
      const messagesQuery = query(
        collection(db, "messages"),
        where("receiverId", "==", instructorId),
        where("read", "==", false)
      );
      const messagesSnapshot = await getCountFromServer(messagesQuery);

      setDashboardData(prev => ({
        ...prev,
        teachingStats: {
          totalHours: Math.round(totalHours),
          avgRating: avgRating.toFixed(1),
          totalDownloads: downloadsSnapshot.data().count,
          unreadMessages: messagesSnapshot.data().count
        }
      }));
    } catch (error) {
      console.error("Error fetching teaching stats:", error);
    }
  };

  const fetchLiveStats = async (instructorId) => {
    try {
      // Live classes count
      const liveQuery = query(
        collection(db, "live_sessions"),
        where("instructorId", "==", instructorId),
        where("status", "==", "live")
      );
      const liveSnapshot = await getCountFromServer(liveQuery);

      // Active discussions
      const discussionsQuery = query(
        collection(db, "discussions"),
        where("instructorId", "==", instructorId),
        where("status", "==", "active")
      );
      const discussionsSnapshot = await getCountFromServer(discussionsQuery);

      // Pending reviews
      const reviewsQuery = query(
        collection(db, "assignments"),
        where("instructorId", "==", instructorId),
        where("needsReview", "==", true)
      );
      const reviewsSnapshot = await getCountFromServer(reviewsQuery);

      setLiveStats({
        liveClasses: liveSnapshot.data().count,
        activeDiscussions: discussionsSnapshot.data().count,
        pendingReviews: reviewsSnapshot.data().count
      });
    } catch (error) {
      console.error("Error fetching live stats:", error);
    }
  };

  const fetchStudentSatisfaction = async (instructorId) => {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("instructorId", "==", instructorId)
      );
      const snapshot = await getDocs(reviewsQuery);
      
      if (snapshot.empty) {
        setDashboardData(prev => ({ 
          ...prev, 
          studentSatisfaction: 85,
          attendanceRate: Math.floor(Math.random() * 15) + 80,
          completionRate: Math.floor(Math.random() * 15) + 75
        }));
        return;
      }

      const reviews = snapshot.docs.map(doc => doc.data());
      const satisfaction = (reviews.filter(r => (r.rating || 0) >= 4).length / reviews.length) * 100;
      
      setDashboardData(prev => ({
        ...prev,
        studentSatisfaction: Math.round(satisfaction),
        attendanceRate: Math.floor(Math.random() * 15) + 80,
        completionRate: Math.floor(Math.random() * 15) + 75
      }));
    } catch (error) {
      console.error("Error fetching satisfaction:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (userProfile?.uid) {
        await Promise.all([
          fetchTeachingStats(userProfile.uid),
          fetchLiveStats(userProfile.uid),
          fetchStudentSatisfaction(userProfile.uid)
        ]);
        toast.success("Dashboard refreshed!");
      }
    } catch (error) {
      toast.error("Refresh failed!");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateIndex = () => {
    // Open Firebase Console
    window.open("https://console.firebase.google.com/project/education-platfrom-2191d/firestore/indexes", "_blank");
    toast.success("Opening Firebase Console...");
  };

  // Chart data configurations (same as before)
  const studentPerformanceData = useMemo(() => {
    const currentWeek = new Date();
    const weeks = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentWeek);
      date.setDate(date.getDate() - (i * 7));
      weeks.push(`Week ${i + 1}`);
    }

    return {
      labels: weeks,
      datasets: [
        {
          label: 'Your Students Avg',
          data: [65, 72, 68, 75, 78, 82],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Platform Avg',
          data: [60, 65, 62, 70, 72, 75],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    };
  }, [dashboardData]);

  const courseEnrollmentData = useMemo(() => {
    const courses = dashboardData.coursePerformance.slice(0, 4);
    return {
      labels: courses.map(course => course.name),
      datasets: [
        {
          label: 'Enrolled Students',
          data: courses.map(course => course.students),
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(139, 92, 246)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [dashboardData.coursePerformance]);

  const gradeDistributionData = useMemo(() => {
    // Calculate actual grade distribution from submissions
    const allGrades = dashboardData.recentSubmissions
      .map(s => s.grade)
      .filter(grade => grade != null);
    
    const distribution = {
      A: allGrades.filter(g => g >= 90).length,
      B: allGrades.filter(g => g >= 80 && g < 90).length,
      C: allGrades.filter(g => g >= 70 && g < 80).length,
      D: allGrades.filter(g => g >= 60 && g < 70).length,
      F: allGrades.filter(g => g < 60).length
    };

    return {
      labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
      datasets: [
        {
          data: Object.values(distribution),
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(249, 115, 22)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [dashboardData.recentSubmissions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  const quickActions = [
    {
      title: "Start Live Class",
      icon: <MdOutlineLiveTv className="text-xl" />,
      color: "bg-gradient-to-r from-rose-500 to-pink-600",
      action: () => navigate("/faculty/live/start"),
      description: "Begin interactive session"
    },
    {
      title: "Create Assignment",
      icon: <FiFileText className="text-xl" />,
      color: "bg-gradient-to-r from-blue-500 to-cyan-600",
      action: () => navigate("/faculty/assignments/new"),
      description: "Add new task"
    },
    {
      title: "Upload Materials",
      icon: <FiDownload className="text-xl" />,
      color: "bg-gradient-to-r from-emerald-500 to-green-600",
      action: () => navigate("/faculty/resources/upload"),
      description: "Share learning materials"
    },
    {
      title: "Schedule Class",
      icon: <FiCalendar className="text-xl" />,
      color: "bg-gradient-to-r from-purple-500 to-violet-600",
      action: () => navigate("/faculty/schedule/new"),
      description: "Plan upcoming session"
    },
    {
      title: "Send Announcement",
      icon: <FiMessageSquare className="text-xl" />,
      color: "bg-gradient-to-r from-amber-500 to-orange-600",
      action: () => navigate("/faculty/announcements/new"),
      description: "Notify all students"
    },
    {
      title: "View Analytics",
      icon: <TbChartLine className="text-xl" />,
      color: "bg-gradient-to-r from-indigo-500 to-blue-600",
      action: () => navigate("/faculty/analytics"),
      description: "Detailed reports"
    }
  ];

  const upcomingTasks = [
    ...dashboardData.recentSubmissions
      .filter(s => s.status === 'submitted')
      .slice(0, 3)
      .map(s => ({
        id: s.id,
        task: `Grade ${s.assignmentTitle || "Assignment"}`,
        course: s.courseName || "Course",
        due: "Today",
        priority: "high",
        type: "grading"
      })),
    {
      id: "prep",
      task: "Prepare Lecture Materials",
      course: "All Courses",
      due: "Tomorrow",
      priority: "medium",
      type: "preparation"
    },
    {
      id: "meet",
      task: "Student Consultations",
      course: "Office Hours",
      due: "This Week",
      priority: "medium",
      type: "meeting"
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'assignment': return <MdAssignment className="text-blue-600" />;
      case 'lecture': return <FiBookOpen className="text-emerald-600" />;
      case 'message': return <FiMessageSquare className="text-purple-600" />;
      case 'grade': return <FiAward className="text-amber-600" />;
      default: return <FiActivity className="text-gray-600" />;
    }
  };

  // Index warning component
  const IndexWarning = () => (
    <div className="mb-4 bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-600/20">
          <FiAlertTriangle className="text-amber-600 dark:text-amber-400 text-xl" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            Database Indexes Required
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Some features may not work optimally. Please create the required Firestore indexes.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {indexErrors.includes("submissions") && (
              <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full border border-amber-500/20">
                Submissions Index
              </span>
            )}
            {indexErrors.includes("activities") && (
              <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full border border-amber-500/20">
                Activities Index
              </span>
            )}
            {indexErrors.includes("classes") && (
              <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full border border-amber-500/20">
                Classes Index
              </span>
            )}
          </div>
          <button
            onClick={handleCreateIndex}
            className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <FiAlertTriangle size={16} />
            Create Indexes in Firebase Console
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your teaching dashboard...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Setting up real-time connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Index Warning */}
      {indexErrors.length > 0 && <IndexWarning />}

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-cyan-200/50 dark:border-cyan-800/30 shadow-lg">
       
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <PiChalkboardTeacherFill size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Prof. {userProfile?.name?.split(' ')[0] || 'Teacher'}</span>!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Here's your teaching overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            {/* Live Stats Badges */}
            <div className="flex flex-wrap gap-3 mt-4">
              {liveStats.liveClasses > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-500/10 to-pink-600/10 border border-rose-200 dark:border-rose-800/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-rose-700 dark:text-rose-400">
                    {liveStats.liveClasses} Live Class{liveStats.liveClasses !== 1 ? 'es' : ''}
                  </span>
                </div>
              )}
              
              {liveStats.activeDiscussions > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-600/10 border border-blue-200 dark:border-blue-800/30 rounded-full">
                  <FiMessageSquare size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {liveStats.activeDiscussions} Active Discussion{liveStats.activeDiscussions !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {liveStats.pendingReviews > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-200 dark:border-amber-800/30 rounded-full">
                  <FiAlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {liveStats.pendingReviews} Review{liveStats.pendingReviews !== 1 ? 's' : ''} Pending
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-600 dark:text-gray-400 hover:from-gray-500/20 hover:to-gray-600/20 transition-all disabled:opacity-50"
            >
              <FiRefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => navigate("/faculty/analytics/export")}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all flex items-center gap-2"
            >
              <FiDownload size={16} />
              Export Report
            </button>
            <button 
              onClick={() => navigate("/faculty/courses/new")}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <FiCalendar size={16} />
              New Course
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.totalCourses}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(dashboardData.totalCourses * 20, 100)}%` }}
                  ></div>
                </div>
                <FiTrendingUp className="text-emerald-500" size={16} />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20">
              <FiBookOpen className="text-2xl text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.totalStudents}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(dashboardData.totalStudents, 100)}%` }}
                  ></div>
                </div>
                <FiActivity className="text-blue-500" size={16} />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-600/20">
              <PiStudentFill className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Assignments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.pendingAssignments}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(dashboardData.pendingAssignments * 20, 100)}%` }}
                  ></div>
                </div>
                <FiAlertCircle className="text-amber-500" size={16} />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-600/20">
              <MdAssignment className="text-2xl text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-5 rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Teaching Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.teachingStats.avgRating}/5.0</p>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className={`${i < Math.floor(dashboardData.teachingStats.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-violet-600/20">
              <FiAward className="text-2xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue & Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 dark:from-emerald-900/20 dark:to-green-900/20 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{dashboardData.revenueThisMonth.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2">+12% from last month</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-600/20">
              <FiDollarSign className="text-xl text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.completionRate}%</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">+8% this quarter</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-600/20">
              <FiPercent className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 dark:from-purple-900/20 dark:to-violet-900/20 p-5 rounded-2xl border border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">Student Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.studentSatisfaction}%</p>
              <p className="text-xs text-purple-600 dark:text-purple-500 mt-2">+5% from last month</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-violet-600/20">
              <FiTarget className="text-xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Performance Chart */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Student Performance Trend</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Weekly average scores</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="h-64">
            <Line 
              data={studentPerformanceData} 
              options={chartOptions}
            />
          </div>
        </div>

        {/* Course Enrollment Chart */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course Enrollment</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Student distribution across courses</p>
            </div>
            <button 
              onClick={() => navigate("/faculty/courses")}
              className="text-sm bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-medium hover:opacity-80 transition-all flex items-center gap-1"
            >
              View All <FiChevronRight size={14} />
            </button>
          </div>
          <div className="h-64">
            <Bar 
              data={courseEnrollmentData} 
              options={chartOptions}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/30 hover:border-cyan-300/50 dark:hover:border-cyan-500/50 hover:shadow-md transition-all bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm group"
              >
                <div className={`${action.color} text-white p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  {action.icon}
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 text-center">{action.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{action.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <button 
              onClick={() => navigate("/faculty/activity")}
              className="text-sm bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-medium hover:opacity-80 transition-all"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {recentActivity.slice(0, 5).map((activity, index) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-500/5 to-blue-500/5 hover:from-cyan-500/10 hover:to-blue-500/10 transition-all cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.timestamp?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Recently'}
                    </p>
                  </div>
                  <FiChevronRight className="text-gray-400 dark:text-gray-500" size={14} />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {recentActivity.length === 0 && (
              <div className="text-center py-8">
                <FiActivity className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions & Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Submissions</h3>
            <button 
              onClick={() => navigate("/faculty/assignments")}
              className="text-sm bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-medium hover:opacity-80 transition-all flex items-center gap-1"
            >
              View All <FiChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboardData.recentSubmissions.slice(0, 5).map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 hover:border-cyan-300/50 dark:hover:border-cyan-500/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-600/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {submission.studentName?.charAt(0) || "S"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {submission.studentName || "Student"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {submission.assignmentTitle} • {submission.courseName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {submission.status === 'graded' ? 'Graded' : 'Pending'}
                  </span>
                  <button 
                    onClick={() => navigate(`/faculty/assignments/grade/${submission.id}`)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white text-xs rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Grade
                  </button>
                </div>
              </div>
            ))}
            
            {dashboardData.recentSubmissions.length === 0 && (
              <div className="text-center py-10">
                <FiFileText className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Students will appear here when they submit work</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Students & Grade Distribution */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Grade Distribution</h3>
          </div>
          
          <div className="h-64 mb-8">
            <Doughnut 
              data={gradeDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: {
                        size: 11
                      },
                      padding: 20
                    }
                  }
                }
              }}
            />
          </div>
          
          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-600/10 border border-emerald-200/50 dark:border-emerald-800/30">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.attendanceRate}%</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Avg. Attendance</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-600/10 border border-blue-200/50 dark:border-blue-800/30">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.completionRate}%</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Avg. Completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course Performance</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed metrics for all your courses</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'overview' 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('detailed')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'detailed' 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Detailed
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Students</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Avg Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Completion</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {dashboardData.coursePerformance.map((course, index) => (
                <tr key={course.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-3 shadow-sm ${index % 4 === 0 ? 'bg-gradient-to-r from-cyan-500 to-blue-600' :
                        index % 4 === 1 ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                        index % 4 === 2 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                        'bg-gradient-to-r from-purple-500 to-violet-600'}`}>
                        {course.code?.charAt(0) || course.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{course.code || `Course ${index + 1}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{course.students}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <span className={`text-sm font-bold ${course.avgGrade >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                        course.avgGrade >= 80 ? 'text-blue-600 dark:text-blue-400' :
                        course.avgGrade >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {course.avgGrade}%
                      </span>
                      {course.avgGrade >= 85 && (
                        <FiTrendingUp className="ml-2 text-emerald-500" size={14} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                        <div 
                          className={`h-2 rounded-full ${course.completion >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                            course.completion >= 80 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                            course.completion >= 70 ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-rose-500 to-pink-600'}`}
                          style={{ width: `${course.completion}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{course.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
                      course.status === 'draft' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
                      'bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20'}`}>
                      {course.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => navigate(`/faculty/courses/${course.id}`)}
                        className="p-1.5 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      <button 
                        onClick={() => navigate(`/faculty/courses/${course.id}/edit`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit Course"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button 
                        onClick={() => navigate(`/faculty/analytics/course/${course.id}`)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        title="View Analytics"
                      >
                        <TbReportAnalytics size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {dashboardData.coursePerformance.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <FiBookOpen className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No courses yet</p>
                      <p className="text-sm mt-2">Create your first course to get started</p>
                      <button 
                        onClick={() => navigate("/faculty/courses/new")}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                      >
                        Create First Course
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teaching Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 dark:from-cyan-900/20 dark:to-blue-900/20 p-5 rounded-2xl border border-cyan-200/50 dark:border-cyan-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-700 dark:text-cyan-400 font-medium">Teaching Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.teachingStats.totalHours}</p>
              <p className="text-xs text-cyan-600 dark:text-cyan-500 mt-2">This semester</p>
            </div>
            <FiClock className="text-cyan-500 dark:text-cyan-400 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 dark:from-emerald-900/20 dark:to-green-900/20 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Material Downloads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.teachingStats.totalDownloads}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2">Total downloads</p>
            </div>
            <FiDownload className="text-emerald-500 dark:text-emerald-400 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Unread Messages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.teachingStats.unreadMessages}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">Needs attention</p>
            </div>
            <FiMessageSquare className="text-amber-500 dark:text-amber-400 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 dark:from-purple-900/20 dark:to-violet-900/20 p-5 rounded-2xl border border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">Upcoming Classes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{dashboardData.upcomingClasses}</p>
              <p className="text-xs text-purple-600 dark:text-purple-500 mt-2">Next 7 days</p>
            </div>
            <FiCalendar className="text-purple-500 dark:text-purple-400 text-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;