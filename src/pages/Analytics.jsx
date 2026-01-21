import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  FiTrendingUp, FiTrendingDown, FiUsers, FiBookOpen, 
  FiDollarSign, FiUserCheck, FiClock, FiCalendar,
  FiBarChart2, FiPieChart, FiFilter, FiDownload,
  FiEye, FiRefreshCw, FiActivity, FiShoppingBag,
  FiMap, FiGlobe, FiSmartphone, FiMonitor,
  FiTarget, FiStar, FiMessageSquare, FiShare2,
  FiCheckCircle
} from "react-icons/fi";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, Legend
} from "recharts";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { db } from "../firebase";
import { 
  collection, getDocs, query, where, 
  orderBy, limit, Timestamp 
} from "firebase/firestore";
import toast from "react-hot-toast";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("30days");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [chartType, setChartType] = useState("line");
  const [isChartReady, setIsChartReady] = useState(false);
  
  // Data states
  const [revenueData, setRevenueData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [coursePerformanceData, setCoursePerformanceData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [geographicData, setGeographicData] = useState([]);
  const [studentEngagementData, setStudentEngagementData] = useState([]);
  const [teacherPerformanceData, setTeacherPerformanceData] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalStudents: 0,
    studentGrowth: 0,
    totalCourses: 0,
    avgRating: 0,
    completionRate: 0,
    activeUsers: 0,
    avgSessionTime: 0,
    topCourse: "",
    topTeacher: "",
    conversionRate: 0
  });

  // Custom colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];
  const STATUS_COLORS = {
    completed: '#10B981',
    in_progress: '#3B82F6',
    enrolled: '#8B5CF6',
    dropped: '#EF4444'
  };

  useEffect(() => {
    fetchAnalyticsData();
    
    // Set chart ready after mount
    const timer = setTimeout(() => {
      setIsChartReady(true);
    }, 100);
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      await Promise.all([
        fetchRevenueData(),
        fetchUserData(),
        fetchCourseData(),
        fetchEngagementData(),
        calculateStats()
      ]);
      
      // Generate mock/synthetic data for visualization
      generateVisualizationData();
      
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(paymentsQuery);
      
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate()
      }));
      
      // Calculate daily revenue for selected time range
      const days = getDaysForTimeRange();
      const dailyRevenue = {};
      
      days.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        dailyRevenue[dayKey] = 0;
      });
      
      payments.forEach(payment => {
        if (payment.status === "completed") {
          const dateKey = format(payment.date, 'yyyy-MM-dd');
          const amount = parseFloat(payment.amount) || 0;
          
          if (dailyRevenue[dateKey] !== undefined) {
            dailyRevenue[dateKey] += amount;
          }
        }
      });
      
      // Format for chart
      const chartData = Object.entries(dailyRevenue)
        .map(([date, revenue]) => ({
          date: format(new Date(date), 'MMM dd'),
          fullDate: date,
          revenue,
          trend: revenue > 10000 ? 'up' : 'down'
        }))
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
      
      setRevenueData(chartData);
      
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "student")
      );
      const snapshot = await getDocs(usersQuery);
      
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      // Calculate monthly growth
      const months = 6; // Last 6 months
      const monthlyGrowth = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'MMM yyyy');
        
        const studentsInMonth = students.filter(student => {
          const studentDate = student.createdAt;
          return studentDate && 
                 studentDate.getMonth() === monthDate.getMonth() &&
                 studentDate.getFullYear() === monthDate.getFullYear();
        }).length;
        
        monthlyGrowth.push({
          month: monthKey,
          students: studentsInMonth,
          growth: i > 0 ? Math.random() * 20 - 5 : 0 // Mock growth percentage
        });
      }
      
      setUserGrowthData(monthlyGrowth);
      
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchCourseData = async () => {
    try {
      const coursesQuery = query(collection(db, "courses"));
      const snapshot = await getDocs(coursesQuery);
      
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate course performance metrics
      const performance = courses.map(course => ({
        name: course.title,
        enrollments: Math.floor(Math.random() * 100) + 20, // Mock data
        revenue: Math.floor(Math.random() * 50000) + 10000,
        rating: (Math.random() * 2 + 3).toFixed(1), // 3-5 rating
        completion: Math.floor(Math.random() * 30) + 50 // 50-80% completion
      })).sort((a, b) => b.revenue - a.revenue);
      
      setCoursePerformanceData(performance.slice(0, 10));
      
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const fetchEngagementData = async () => {
    try {
      // Mock engagement data
      const engagement = [
        { category: 'Video Lectures', value: 85, max: 100 },
        { category: 'Quizzes', value: 70, max: 100 },
        { category: 'Assignments', value: 60, max: 100 },
        { category: 'Discussion Forums', value: 45, max: 100 },
        { category: 'Live Sessions', value: 75, max: 100 },
        { category: 'Practice Tests', value: 65, max: 100 }
      ];
      
      setStudentEngagementData(engagement);
      
    } catch (error) {
      console.error("Error fetching engagement data:", error);
    }
  };

  const calculateStats = async () => {
    try {
      const [studentsSnap, teachersSnap, coursesSnap, paymentsSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
        getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "payments"))
      ]);
      
      const students = studentsSnap.docs.map(doc => doc.data());
      const teachers = teachersSnap.docs.map(doc => doc.data());
      const courses = coursesSnap.docs.map(doc => doc.data());
      const payments = paymentsSnap.docs.map(doc => doc.data());
      
      // Calculate metrics
      let totalRevenue = 0;
      let lastMonthRevenue = 0;
      
      payments.forEach(payment => {
        const amount = parseFloat(payment.amount) || 0;
        if (payment.status === "completed") {
          totalRevenue += amount;
          
          // Check if payment was in last month
          const paymentDate = payment.timestamp?.toDate();
          if (paymentDate && paymentDate > subMonths(new Date(), 1)) {
            lastMonthRevenue += amount;
          }
        }
      });
      
      const revenueGrowth = lastMonthRevenue > 0 ? 
        ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
      
      // Find top course
      const courseEnrollments = {};
      courses.forEach(course => {
        courseEnrollments[course.title] = (courseEnrollments[course.title] || 0) + 1;
      });
      
      const topCourse = Object.entries(courseEnrollments)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      
      // Calculate average rating
      const totalRatings = courses.reduce((sum, course) => sum + (course.rating || 0), 0);
      const avgRating = courses.length > 0 ? totalRatings / courses.length : 0;
      
      // Mock metrics
      const newStats = {
        totalRevenue,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        totalStudents: students.length,
        studentGrowth: 12.5,
        totalCourses: courses.length,
        avgRating: parseFloat(avgRating.toFixed(1)),
        completionRate: 68,
        activeUsers: Math.floor(students.length * 0.6),
        avgSessionTime: 42,
        topCourse,
        topTeacher: teachers[0]?.name || "N/A",
        conversionRate: 3.2
      };
      
      setStats(newStats);
      
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const generateVisualizationData = () => {
    // Device usage data
    const devices = [
      { name: 'Mobile', value: 65, color: '#0088FE' },
      { name: 'Desktop', value: 25, color: '#00C49F' },
      { name: 'Tablet', value: 8, color: '#FFBB28' },
      { name: 'Other', value: 2, color: '#FF8042' }
    ];
    setDeviceData(devices);
    
    // Geographic data
    const geographic = [
      { state: 'Maharashtra', students: 1250, revenue: 1250000 },
      { state: 'Delhi', students: 980, revenue: 980000 },
      { state: 'Karnataka', students: 850, revenue: 850000 },
      { state: 'Tamil Nadu', students: 720, revenue: 720000 },
      { state: 'Uttar Pradesh', students: 650, revenue: 650000 },
      { state: 'Gujarat', students: 580, revenue: 580000 },
      { state: 'West Bengal', students: 520, revenue: 520000 },
      { state: 'Rajasthan', students: 480, revenue: 480000 }
    ];
    setGeographicData(geographic);
    
    // Teacher performance data
    const teachers = [
      { name: 'Dr. Sharma', courses: 8, students: 420, rating: 4.8 },
      { name: 'Prof. Patel', courses: 6, students: 380, rating: 4.7 },
      { name: 'Ms. Gupta', courses: 5, students: 320, rating: 4.9 },
      { name: 'Mr. Singh', courses: 7, students: 290, rating: 4.6 },
      { name: 'Dr. Reddy', courses: 4, students: 250, rating: 4.5 }
    ];
    setTeacherPerformanceData(teachers);
  };

  const getDaysForTimeRange = () => {
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case "7days":
        startDate = subDays(now, 7);
        break;
      case "30days":
        startDate = subDays(now, 30);
        break;
      case "90days":
        startDate = subDays(now, 90);
        break;
      case "year":
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }
    
    return eachDayOfInterval({ start: startDate, end: now });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    let csvData = [];
    let filename = 'analytics_export.csv';
    
    switch(activeTab) {
      case "revenue":
        csvData = revenueData.map(item => `${item.date},${item.revenue}`);
        filename = 'revenue_analytics.csv';
        break;
      case "students":
        csvData = userGrowthData.map(item => `${item.month},${item.students},${item.growth}`);
        filename = 'student_growth.csv';
        break;
      case "courses":
        csvData = coursePerformanceData.map(item => `${item.name},${item.enrollments},${item.revenue},${item.rating}`);
        filename = 'course_performance.csv';
        break;
      default:
        csvData = revenueData.map(item => `${item.date},${item.revenue}`);
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvData.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filename}`);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-bold text-slate-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) {
      return <FiTrendingUp className="text-emerald-500" />;
    } else if (growth < 0) {
      return <FiTrendingDown className="text-rose-500" />;
    }
    return <FiActivity className="text-slate-500" />;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return "text-emerald-600";
    if (growth < 0) return "text-rose-600";
    return "text-slate-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const ChartContainer = ({ children, title, subtitle, className = "" }) => (
    <div className={`bg-white border border-slate-100 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-500">Real-time insights and performance metrics</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-slate-700"
          >
            <FiDownload />
            Export Data
          </button>
          <button 
            onClick={fetchAnalyticsData}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 font-medium"
          >
            <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Time Range Selector */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {["7days", "30days", "90days", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${timeRange === range 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {range === "7days" ? "Last 7 Days" :
                 range === "30days" ? "Last 30 Days" :
                 range === "90days" ? "Last 90 Days" : "Last Year"}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
            
            <div className="text-sm text-slate-500">
              Last updated: {format(new Date(), 'hh:mm a')}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Total Revenue", 
            value: formatCurrency(stats.totalRevenue), 
            growth: stats.revenueGrowth,
            icon: <FiDollarSign className="text-2xl" />,
            color: "bg-gradient-to-br from-emerald-500 to-green-400"
          },
          { 
            title: "Total Students", 
            value: stats.totalStudents.toLocaleString(), 
            growth: stats.studentGrowth,
            icon: <FiUsers className="text-2xl" />,
            color: "bg-gradient-to-br from-blue-500 to-cyan-400"
          },
          { 
            title: "Active Users", 
            value: stats.activeUsers.toLocaleString(), 
            growth: 8.2,
            icon: <FiActivity className="text-2xl" />,
            color: "bg-gradient-to-br from-purple-500 to-pink-400"
          },
          { 
            title: "Avg. Rating", 
            value: stats.avgRating, 
            growth: 1.5,
            icon: <FiStar className="text-2xl" />,
            color: "bg-gradient-to-br from-amber-500 to-yellow-400"
          }
        ].map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                {stat.icon}
              </div>
              <div className={`text-sm font-bold px-2 py-1 rounded-full flex items-center gap-1 ${getGrowthColor(stat.growth)} bg-slate-50`}>
                {getGrowthIcon(stat.growth)}
                {stat.growth > 0 ? '+' : ''}{stat.growth}%
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-500">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          {["overview", "revenue", "students", "courses", "engagement", "geographic"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${activeTab === tab 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              {tab === "overview" ? "Overview" :
               tab === "revenue" ? "Revenue Analytics" :
               tab === "students" ? "Student Growth" :
               tab === "courses" ? "Course Performance" :
               tab === "engagement" ? "Engagement" : "Geographic"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <ChartContainer 
            title="Revenue Trend" 
            subtitle="Daily revenue over time"
          >
            <div className="h-64 min-h-[300px]">
              {isChartReady && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  {chartType === "line" ? (
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  ) : chartType === "area" ? (
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                        fillOpacity={0.3}
                      />
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  ) : (
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Loading revenue data...
                </div>
              )}
            </div>
          </ChartContainer>

          {/* User Growth Chart */}
          <ChartContainer 
            title="Student Growth" 
            subtitle="Monthly new student signups"
          >
            <div className="h-64 min-h-[300px]">
              {isChartReady && userGrowthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <ComposedChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="students" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="growth" stroke="#10B981" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Loading growth data...
                </div>
              )}
            </div>
          </ChartContainer>
        </div>
      )}

      {/* Course Performance */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Top Performing Courses">
            <div className="space-y-4">
              {coursePerformanceData.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-amber-100 text-amber-600' :
                      index === 1 ? 'bg-slate-100 text-slate-600' :
                      index === 2 ? 'bg-amber-50 text-amber-500' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      <FiBookOpen />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">
                        {course.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {course.enrollments} enrollments
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formatCurrency(course.revenue)}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <FiStar className="text-amber-400" size={12} />
                      {course.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>

          <ChartContainer title="Course Performance Metrics">
            <div className="h-64 min-h-[300px]">
              {isChartReady && coursePerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={coursePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="enrollments" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completion" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Loading course data...
                </div>
              )}
            </div>
          </ChartContainer>
        </div>
      )}

      {/* Student Growth */}
      {activeTab === "students" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Student Demographics">
            <div className="h-64 min-h-[300px]">
              {isChartReady && deviceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Usage"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Loading device data...
                </div>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Avg. Session Time</div>
                <div className="text-2xl font-bold text-slate-900">{stats.avgSessionTime} min</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-slate-900">{stats.completionRate}%</div>
              </div>
            </div>
          </ChartContainer>

          <ChartContainer title="Top Teachers">
            <div className="space-y-4">
              {teacherPerformanceData.map((teacher, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-purple-100 text-purple-600' :
                      index === 1 ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <FiUserCheck />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{teacher.name}</div>
                      <div className="text-xs text-slate-500">{teacher.courses} courses</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{teacher.students} students</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <FiStar className="text-amber-400" size={12} />
                      {teacher.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      )}

      {/* Engagement */}
      {activeTab === "engagement" && (
        <ChartContainer title="Student Engagement Analysis">
          <div className="h-96 min-h-[400px]">
            {isChartReady && studentEngagementData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={studentEngagementData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Engagement Level"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Loading engagement data...
              </div>
            )}
          </div>
        </ChartContainer>
      )}

      {/* Geographic */}
      {activeTab === "geographic" && (
        <ChartContainer 
          title="Geographic Distribution" 
          subtitle="Students and revenue by state"
        >
          <div className="h-96 min-h-[400px] overflow-x-auto">
            {isChartReady && geographicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={600} minHeight={0}>
                <BarChart data={geographicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="state" stroke="#94a3b8" width={100} />
                  <Tooltip formatter={(value, name) => [
                    name === 'students' ? `${value} students` : formatCurrency(value),
                    name === 'students' ? 'Students' : 'Revenue'
                  ]} />
                  <Legend />
                  <Bar dataKey="students" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Loading geographic data...
              </div>
            )}
          </div>
        </ChartContainer>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartContainer title="System Performance">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Server Uptime</span>
                <span className="font-medium text-slate-900">99.8%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '99.8%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">API Response Time</span>
                <span className="font-medium text-slate-900">142ms</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Error Rate</span>
                <span className="font-medium text-slate-900">0.12%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '0.12%' }}></div>
              </div>
            </div>
          </div>
        </ChartContainer>

        <ChartContainer title="Top Metrics">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FiTarget className="text-amber-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Conversion Rate</div>
                  <div className="font-bold text-slate-900">{stats.conversionRate}%</div>
                </div>
              </div>
              <div className={`text-sm font-medium ${stats.conversionRate > 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats.conversionRate > 3 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FiMessageSquare className="text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Student Satisfaction</div>
                  <div className="font-bold text-slate-900">{stats.avgRating}/5</div>
                </div>
              </div>
              <div className="text-sm font-medium text-emerald-600">Excellent</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiClock className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Avg. Study Time</div>
                  <div className="font-bold text-slate-900">2.8 hrs/day</div>
                </div>
              </div>
              <div className="text-sm font-medium text-emerald-600">Above Avg</div>
            </div>
          </div>
        </ChartContainer>

        <ChartContainer title="Quick Insights">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-900">Peak Hours</div>
              <div className="text-sm text-blue-700">Most active: 7-9 PM</div>
            </div>
            
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-sm font-medium text-emerald-900">Best Performing</div>
              <div className="text-sm text-emerald-700">{stats.topCourse}</div>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm font-medium text-amber-900">Recommendation</div>
              <div className="text-sm text-amber-700">Increase video content by 20%</div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm font-medium text-purple-900">Growth Opportunity</div>
              <div className="text-sm text-purple-700">Mobile app adoption low</div>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Bottom Summary */}
      <ChartContainer>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Summary</h3>
            <p className="text-slate-500">
              Overall platform performance is trending positively with {stats.revenueGrowth}% revenue growth 
              and {stats.studentGrowth}% student growth over the selected period.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
              <FiShare2 />
              Share Report
            </button>
            <button className="px-4 py-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors flex items-center gap-2">
              <FiEye />
              View Details
            </button>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
};

export default Analytics;