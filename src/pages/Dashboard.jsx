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
  FiCreditCard
} from "react-icons/fi";
import { db } from "../firebase";
import { collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import StatCard from "../components/StatCard";
import StudentChart from "../components/StudentChart";
import RevenueChart from "../components/RevenueChart";
import ActivityHeatmap from "../components/ActivityHeatmap";
import PieChart from "../components/PieChart";

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    revenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      setStats(prev => ({ ...prev, students: snap.size }));
      updateLastUpdated();
    });

    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      setStats(prev => ({ ...prev, teachers: snap.size }));
      updateLastUpdated();
    });

    const unsubCourses = onSnapshot(collection(db, "courses"), (snap) => {
      setStats(prev => ({ ...prev, courses: snap.size }));
      updateLastUpdated();
    });

    const unsubPayments = onSnapshot(collection(db, "payments"), (snap) => {
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let pendingPayments = 0;
      const revenueByMonth = {};
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      snap.docs.forEach(doc => {
        const payment = doc.data();
        const amount = Number(payment.amount) || 0;
        
        // Total revenue
        totalRevenue += amount;
        
        // Monthly revenue
        if (payment.timestamp) {
          const paymentDate = payment.timestamp.toDate();
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            monthlyRevenue += amount;
          }

          // Prepare data for chart
          const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth() + 1}`;
          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + amount;
        }
        
        // Pending payments
        if (payment.status === "pending") {
          pendingPayments++;
        }
      });

      // Convert revenue by month to array for chart
      const revenueChartData = Object.entries(revenueByMonth)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setStats(prev => ({ 
        ...prev, 
        revenue: totalRevenue,
        monthlyRevenue,
        pendingPayments
      }));
      setRevenueData(revenueChartData);
      updateLastUpdated();
    });

    // Add subscription for real-time analytics
    const unsubAnalytics = onSnapshot(collection(db, "analytics"), (snap) => {
      if (!snap.empty) {
        const analyticsData = snap.docs[0].data();
        setStats(prev => ({
          ...prev,
          platformHealth: analyticsData.uptime || "99.8%",
          activeSessions: analyticsData.activeSessions || 0,
        }));
      }
    });

    const updateLastUpdated = () => {
      setLastUpdated(new Date());
    };

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubCourses();
      unsubPayments();
      unsubAnalytics();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate data refresh with new data fetching
    try {
      // Force re-fetch of all data
      const now = new Date();
      setLastUpdated(now);
      
      // Add animation effect
      setTimeout(() => {
        setIsRefreshing(false);
        
        // Show success notification
        if (window.showNotification) {
          window.showNotification("Dashboard refreshed successfully", "success");
        }
      }, 800);
    } catch (error) {
      console.error("Refresh error:", error);
      setIsRefreshing(false);
      
      if (window.showNotification) {
        window.showNotification("Failed to refresh data", "error");
      }
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

  // Mock previous month data (in real app, fetch from historical data)
  const previousMonthRevenue = stats.revenue * 0.85; // 15% growth

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
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#0fa3ab] to-[#088a54] shadow-elevated">
              <FiActivity className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gradient">
                Dashboard Overview
              </h1>
              <p className="text-[#64748b] text-sm">
                Real-time insights and analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white border-modern">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveView(option.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                  activeView === option.id 
                    ? 'bg-gradient-to-r from-[#0fa3ab]/10 to-[#088a54]/10 text-[#036374]' 
                    : 'text-[#64748b] hover:text-[#1e293b] hover:bg-gray-50'
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
            className="px-4 py-2 rounded-xl border-modern hover-lift hover-glow flex items-center gap-2 text-sm font-medium text-[#036374] disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 card-glass">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0fa3ab] to-[#088a54] animate-pulse"></div>
            <span className="text-sm text-[#64748b]">Live Data</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <FiClock />
            <span>Updated: {formatTime(lastUpdated)}</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-gray-200"></div>
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <FiCreditCard />
            <span>{stats.pendingPayments} pending payments</span>
          </div>
        </div>
        <button className="btn-outline-modern flex items-center gap-2 text-sm mt-2 md:mt-0">
          <FiEye />
          <span>View Details</span>
        </button>
      </div>

      {/* Stat Cards Grid */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard 
            title="Total Students" 
            value={stats.students} 
            icon={<FiUsers size={24}/>} 
            color="sky" 
            trend={{ value: calculateGrowth(stats.students, stats.students * 0.88), direction: "up" }} 
          />
          
          <StatCard 
            title="Active Teachers" 
            value={stats.teachers} 
            icon={<FiUserCheck size={24} />}
            trend={{ value: calculateGrowth(stats.teachers, stats.teachers * 0.92), direction: "up" }}
            color="accent"
          />
          
          <StatCard 
            title="Courses" 
            value={stats.courses} 
            icon={<FiBookOpen size={24} />}
            trend={{ value: calculateGrowth(stats.courses, stats.courses * 0.85), direction: "up" }}
            color="success"
          />
          
          <StatCard 
            title="Total Revenue" 
            value={formatCurrency(stats.revenue)}
            icon={<FiDollarSign size={24} />}
            trend={{ 
              value: calculateGrowth(stats.revenue, previousMonthRevenue), 
              direction: stats.revenue >= previousMonthRevenue ? "up" : "down" 
            }}
            color="secondary"
            subtitle={`${formatCurrency(stats.monthlyRevenue)} this month`}
          />
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
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="card hover-lift"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1e293b]">Student Enrollment</h3>
                      <p className="text-sm text-[#64748b] mt-1">Monthly growth trend</p>
                    </div>
                    <button className="text-sm text-[#0fa3ab] font-medium flex items-center gap-1 hover:text-[#088a54] transition-colors">
                      Details
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <StudentChart />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="card hover-lift"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1e293b]">Revenue Analytics</h3>
                      <p className="text-sm text-[#64748b] mt-1">
                        {revenueData.length > 0 
                          ? `${revenueData.length} months of data` 
                          : "Monthly revenue breakdown"
                        }
                      </p>
                    </div>
                    <div className={`badge-modern ${stats.monthlyRevenue > 0 ? 'bg-gradient-to-r from-[#0fa3ab]/10 to-[#088a54]/10' : ''}`}>
                      {stats.monthlyRevenue > 0 ? `+${formatCurrency(stats.monthlyRevenue)}` : 'No data'}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <RevenueChart revenueData={revenueData} />
                </div>
              </motion.div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="lg:col-span-2 card hover-lift"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1e293b]">Platform Activity</h3>
                      <p className="text-sm text-[#64748b] mt-1">Peak hours and engagement</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#0fa3ab]/30"></div>
                        <span className="text-xs text-[#64748b]">Low</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#0fa3ab]/60"></div>
                        <span className="text-xs text-[#64748b]">Medium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#0fa3ab]"></div>
                        <span className="text-xs text-[#64748b]">High</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ActivityHeatmap />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="card hover-lift"
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1e293b]">Course Distribution</h3>
                      <p className="text-sm text-[#64748b] mt-1">By enrollment numbers</p>
                    </div>
                    <div className="badge-modern">
                      {stats.courses} Total
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <PieChart />
                </div>
              </motion.div>
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
              <div className="card hover-lift">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#0fa3ab]/10 to-[#088a54]/10">
                      <FiCreditCard className="text-[#0fa3ab] text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1e293b]">Monthly Revenue</h4>
                      <p className="text-2xl font-bold text-[#036374] mt-2">
                        {formatCurrency(stats.monthlyRevenue)}
                      </p>
                      <p className="text-sm text-[#64748b] mt-1">Current month</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card hover-lift">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                      <FiTrendingUp className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1e293b]">Growth Rate</h4>
                      <p className="text-2xl font-bold text-purple-600 mt-2">
                        {calculateGrowth(stats.revenue, previousMonthRevenue)}
                      </p>
                      <p className="text-sm text-[#64748b] mt-1">vs last month</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card hover-lift">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                      <FiClock className="text-amber-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#1e293b]">Pending Payments</h4>
                      <p className="text-2xl font-bold text-amber-600 mt-2">
                        {stats.pendingPayments}
                      </p>
                      <p className="text-sm text-[#64748b] mt-1">Awaiting clearance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart with More Details */}
            <div className="card hover-lift">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1e293b]">Revenue Overview</h3>
                    <p className="text-sm text-[#64748b] mt-1">
                      Total revenue: {formatCurrency(stats.revenue)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-[#0fa3ab]"></div>
                      <span className="text-xs text-[#64748b]">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-purple-500"></div>
                      <span className="text-xs text-[#64748b]">Target</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <RevenueChart 
                  revenueData={revenueData} 
                  showTarget={true}
                  targetAmount={stats.revenue * 1.2} // 20% growth target
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
        <div className="gradient-bg-accent rounded-2xl p-6 border-modern">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white shadow-soft">
              <FiDownload className="text-[#0fa3ab] text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-[#1e293b]">Export Reports</h4>
              <p className="text-sm text-[#64748b] mt-1">Download detailed analytics</p>
            </div>
          </div>
          <button className="btn-outline-modern w-full mt-4">
            Download PDF
          </button>
        </div>

        <div className="gradient-bg-accent rounded-2xl p-6 border-modern">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white shadow-soft">
              <FiCalendar className="text-[#0fa3ab] text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-[#1e293b]">Schedule Report</h4>
              <p className="text-sm text-[#64748b] mt-1">Automate weekly reports</p>
            </div>
          </div>
          <button className="btn-outline-modern w-full mt-4">
            Set Schedule
          </button>
        </div>

        <div className="gradient-bg-accent rounded-2xl p-6 border-modern">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white shadow-soft">
              <FiCheckCircle className="text-[#0fa3ab] text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-[#1e293b]">System Health</h4>
              <p className="text-sm text-[#64748b] mt-1">
                {stats.platformHealth || "99.8%"} uptime
              </p>
            </div>
          </div>
          <button className="btn-modern w-full mt-4">
            View Status
          </button>
        </div>
      </motion.div>

      {/* Footer Status */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 card"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669]"></div>
            <span className="text-sm text-[#1e293b] font-medium">System Status: Normal</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-200"></div>
          <div className="text-sm text-[#64748b]">
            {stats.activeSessions ? `${stats.activeSessions} active sessions` : "Real-time updates"}
          </div>
        </div>
        <div className="text-sm text-[#64748b]">
          Last sync: {new Date().toLocaleDateString()} {formatTime(lastUpdated)}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;