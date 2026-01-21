import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUsers, 
  FiBookOpen, 
  FiUserCheck, 
  FiDollarSign, 
  FiDownload, 
  FiTrendingUp, 
  FiRefreshCw, 
  FiBarChart2, 
  FiCalendar, 
  FiClock,
  FiActivity,
  FiChevronRight,
  FiCheckCircle,
  FiGrid,
  FiEye,
  FiCreditCard,
  FiAlertCircle,
  FiTarget,
  FiPercent
} from "react-icons/fi";
import { db } from "../firebase";
import { collection, onSnapshot, query, where, Timestamp, orderBy, limit } from "firebase/firestore";
import StatCard from "../components/StatCard";
import StudentChart from "../components/StudentChart";
import RevenueChart from "../components/RevenueChart";
import ActivityHeatmap from "../components/ActivityHeatmap";
import PieChart from "../components/PieChart";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    revenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    pendingApprovals: 0,
    activeUsers: 0
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [revenueData, setRevenueData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topCourses, setTopCourses] = useState([]);

  useEffect(() => {
  // ... existing code ...
  
  // Fetch students with status breakdown
  const unsubStudents = onSnapshot(
    query(collection(db, "users"), where("role", "==", "student")), 
    (snap) => {
      const studentList = snap.docs.map(doc => doc.data());
      const activeStudents = studentList.filter(s => s.status === "active").length;
      const inactiveStudents = studentList.filter(s => s.status === "inactive").length;
      const pendingStudents = studentList.filter(s => s.status === "pending").length;
      
      setStats(prev => ({ 
        ...prev, 
        students: studentList.length,
        activeStudents,
        inactiveStudents,
        pendingStudents
      }));
      updateLastUpdated();
    }
  );


    const unsubTeachers = onSnapshot(
      query(collection(db, "users"), where("role", "==", "teacher")), 
      (snap) => {
        setStats(prev => ({ ...prev, teachers: snap.size }));
        updateLastUpdated();
      }
    );

    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      const publishedCourses = snap.docs.filter(doc => doc.data().isPublished);
      const pendingCourses = snap.docs.filter(doc => !doc.data().isPublished);
      
      // Get top courses by student count
      const sortedCourses = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.students || 0) - (a.students || 0))
        .slice(0, 5);
      
      setTopCourses(sortedCourses);
      setStats(prev => ({ 
        ...prev, 
        courses: publishedCourses.length,
        pendingApprovals: pendingCourses.length
      }));
      updateLastUpdated();
    });

    const unsubPayments = onSnapshot(
      query(collection(db, "payments"), orderBy("timestamp", "desc"), limit(100)), 
      (snap) => {
        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let weeklyRevenue = 0;
        let pendingPayments = 0;
        const revenueByDay = {};
        const currentDate = new Date();
        const currentMonthStart = startOfMonth(currentDate);
        const weekAgo = subDays(currentDate, 7);

        snap.docs.forEach(doc => {
          const payment = doc.data();
          const amount = Number(payment.amount) || 0;
          const paymentDate = payment.timestamp?.toDate() || new Date();
          
          // Total revenue
          if (payment.status === "completed") {
            totalRevenue += amount;
            
            // Monthly revenue
            if (paymentDate >= currentMonthStart) {
              monthlyRevenue += amount;
            }
            
            // Weekly revenue
            if (paymentDate >= weekAgo) {
              weeklyRevenue += amount;
            }
            
            // Daily revenue for chart
            const dayKey = format(paymentDate, "MMM dd");
            revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + amount;
          }
          
          // Pending payments
          if (payment.status === "pending") {
            pendingPayments++;
          }
        });

        // Convert revenue by day to array for chart
        const revenueChartData = Object.entries(revenueByDay)
          .map(([day, revenue]) => ({ day, revenue }))
          .sort((a, b) => new Date(a.day) - new Date(b.day));

        setStats(prev => ({ 
          ...prev, 
          revenue: totalRevenue,
          monthlyRevenue,
          weeklyRevenue,
          pendingPayments
        }));
        setRevenueData(revenueChartData.slice(-10)); // Last 10 days
        updateLastUpdated();
      }
    );

    // Fetch recent activities
    const unsubActivities = onSnapshot(
      query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(10)),
      (snap) => {
        const activities = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        setRecentActivities(activities);
      }
    );

    // Mock active users (in real app, implement presence system)
    const unsubActiveUsers = onSnapshot(
      query(collection(db, "users"), where("lastActive", ">", Timestamp.fromDate(subDays(new Date(), 1)))),
      (snap) => {
        setStats(prev => ({ ...prev, activeUsers: snap.size }));
      }
    );

    const updateLastUpdated = () => {
      setLastUpdated(new Date());
    };

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubCourses();
      unsubPayments();
      unsubActivities();
      unsubActiveUsers();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const now = new Date();
      setLastUpdated(now);
      
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    } catch (error) {
      console.error("Refresh error:", error);
      setIsRefreshing(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const viewOptions = [
    { id: "overview", label: "Overview", icon: <FiGrid /> },
    { id: "analytics", label: "Analytics", icon: <FiBarChart2 /> },
    { id: "financial", label: "Financial", icon: <FiCreditCard /> },
  ];

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return "+100%";
    const growth = ((current - previous) / previous) * 100;
    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  // Mock previous month data
  const previousMonthRevenue = stats.revenue * 0.85;

  // Generate mock weekly data for charts
  const weeklyEnrollmentData = [
    { day: 'Mon', students: 45 },
    { day: 'Tue', students: 52 },
    { day: 'Wed', students: 48 },
    { day: 'Thu', students: 61 },
    { day: 'Fri', students: 55 },
    { day: 'Sat', students: 70 },
    { day: 'Sun', students: 65 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg">
              <FiActivity className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 text-sm">
                Real-time insights and platform analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white border border-slate-200">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveView(option.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                  activeView === option.id 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {option.icon}
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm flex items-center gap-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 0.8, ease: "linear" }}
            >
              <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
            </motion.div>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm text-slate-600">Live Data</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-slate-200"></div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FiClock />
            <span>Updated: {formatTime(lastUpdated)}</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-slate-200"></div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FiAlertCircle />
            <span>{stats.pendingApprovals} pending approvals</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>{stats.activeUsers} users online</span>
          </div>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-all">
            <FiEye className="inline mr-2" />
            View Details
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <FiUsers size={24}/>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.students}</div>
            </div>
            <div className="text-sm font-medium text-slate-700">Total Students</div>
            <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <FiTrendingUp /> {calculateGrowth(stats.students, stats.students * 0.88)}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <FiUserCheck size={24} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.teachers}</div>
            </div>
            <div className="text-sm font-medium text-slate-700">Active Teachers</div>
            <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <FiTrendingUp /> {calculateGrowth(stats.teachers, stats.teachers * 0.92)}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                <FiBookOpen size={24} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.courses}</div>
            </div>
            <div className="text-sm font-medium text-slate-700">Published Courses</div>
            <div className="text-xs text-amber-600 font-medium mt-2">
              +{stats.pendingApprovals} pending
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                <FiDollarSign size={24} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.revenue)}</div>
            </div>
            <div className="text-sm font-medium text-slate-700">Total Revenue</div>
            <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <FiTrendingUp /> {calculateGrowth(stats.revenue, previousMonthRevenue)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {formatCurrency(stats.monthlyRevenue)} this month
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* View-Specific Content */}
      <AnimatePresence mode="wait">
        {activeView === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Student Enrollment</h3>
                    <p className="text-sm text-slate-500">Weekly growth trend</p>
                  </div>
                  <button className="text-sm text-slate-700 font-medium flex items-center gap-1 hover:text-slate-900 transition-colors">
                    Details
                    <FiChevronRight />
                  </button>
                </div>
                <div className="h-64">
                  {/* Placeholder for actual chart component */}
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    Enrollment Chart Component
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Revenue Analytics</h3>
                    <p className="text-sm text-slate-500">
                      {revenueData.length} days of data
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${stats.monthlyRevenue > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {stats.monthlyRevenue > 0 ? `+${formatCurrency(stats.monthlyRevenue)}` : 'No data'}
                  </div>
                </div>
                <div className="h-64">
                  <RevenueChart revenueData={revenueData} />
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Recent Activities</h3>
                    <p className="text-sm text-slate-500">Latest platform actions</p>
                  </div>
                  <button className="text-sm text-slate-700 hover:text-slate-900">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          {activity.type === 'enrollment' ? <FiUsers /> :
                           activity.type === 'payment' ? <FiDollarSign /> :
                           activity.type === 'course' ? <FiBookOpen /> : <FiActivity />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">{activity.description}</p>
                          <p className="text-xs text-slate-500">
                            {activity.timestamp ? format(activity.timestamp, 'MMM dd, HH:mm') : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <FiActivity className="text-3xl mx-auto mb-3 text-slate-300" />
                      <p>No recent activities</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Top Courses</h3>
                    <p className="text-sm text-slate-500">By enrollment</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    {topCourses.length} Total
                  </div>
                </div>
                <div className="space-y-4">
                  {topCourses.map((course, index) => (
                    <div key={course.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-700">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                            {course.title}
                          </p>
                          <p className="text-xs text-slate-500">{course.students || 0} students</p>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(course.discountPrice || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === "financial" && (
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <FiCreditCard className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Monthly Revenue</h4>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      {formatCurrency(stats.monthlyRevenue)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Current month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <FiTrendingUp className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Growth Rate</h4>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {calculateGrowth(stats.revenue, previousMonthRevenue)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">vs last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100">
                    <FiClock className="text-amber-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Pending Payments</h4>
                    <p className="text-2xl font-bold text-amber-600 mt-2">
                      {stats.pendingPayments}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Awaiting clearance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Revenue Overview</h3>
                  <p className="text-sm text-slate-500">
                    Total revenue: {formatCurrency(stats.revenue)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-xs text-slate-600">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span className="text-xs text-slate-600">Target</span>
                  </div>
                </div>
              </div>
              <div className="h-72">
                <RevenueChart 
                  revenueData={revenueData} 
                  showTarget={true}
                  targetAmount={stats.revenue * 1.2}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <FiDownload className="text-white text-xl" />
            </div>
            <div>
              <h4 className="font-semibold">Export Reports</h4>
              <p className="text-sm text-slate-300 mt-1">Download detailed analytics</p>
            </div>
          </div>
          <button className="w-full mt-6 px-4 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors">
            Download PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <FiCalendar className="text-emerald-600 text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Schedule Report</h4>
              <p className="text-sm text-slate-500 mt-1">Automate weekly reports</p>
            </div>
          </div>
          <button className="w-full mt-6 px-4 py-3 border border-slate-200 rounded-lg font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors">
            Set Schedule
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <FiCheckCircle className="text-blue-600 text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">System Health</h4>
              <p className="text-sm text-slate-500 mt-1">99.8% uptime</p>
            </div>
          </div>
          <button className="w-full mt-6 px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
            View Status
          </button>
        </div>
      </motion.div>

      {/* Footer Status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-900 font-medium">System Status: Normal</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
          <div className="text-sm text-slate-600">
            {stats.activeUsers} active sessions
          </div>
        </div>
        <div className="text-sm text-slate-600">
          Last sync: {new Date().toLocaleDateString()} {formatTime(lastUpdated)}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;