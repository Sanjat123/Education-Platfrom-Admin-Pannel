import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCreditCard, FiCheckCircle, FiClock, FiXCircle, 
  FiSearch, FiDollarSign, FiRefreshCw, FiFilter,
  FiDownload, FiTrendingUp, FiTrendingDown, FiBarChart2,
  FiCalendar, FiUser, FiBook, FiEye, FiExternalLink,
  FiArrowUpRight, FiArrowDownRight, FiMoreVertical,
  FiMail, FiSmartphone, FiActivity
} from "react-icons/fi";
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  limit,
  Timestamp,
  doc,
  updateDoc,
  getDocs
} from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Sector } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30days");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    avgTransaction: 0,
    pendingCount: 0,
    successRate: 0,
    topCourse: ""
  });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or chart

  useEffect(() => {
    setLoading(true);
    
    let q = collection(db, "payments");
    
    // Apply date range filter
    const now = new Date();
    let startDate = new Date();
    
    switch(dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setDate(now.getDate() - 30);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    q = query(
      q,
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = [];
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let weeklyRevenue = 0;
      let pendingCount = 0;
      let completedCount = 0;
      const courseRevenue = {};
      const dailyRevenue = {};
      
      const currentMonthStart = startOfMonth(now);
      const weekAgo = subDays(now, 7);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const paymentDate = data.timestamp?.toDate() || new Date();
        const amount = Number(data.amount || 0);
        
        const payment = { 
          id: doc.id, 
          ...data,
          timestamp: paymentDate,
          formattedDate: format(paymentDate, "MMM dd, yyyy HH:mm")
        };
        
        paymentsData.push(payment);
        
        // Calculate total revenue
        if (data.status === "completed") {
          totalRevenue += amount;
          
          // Monthly revenue
          if (paymentDate >= currentMonthStart) {
            monthlyRevenue += amount;
          }
          
          // Weekly revenue
          if (paymentDate >= weekAgo) {
            weeklyRevenue += amount;
          }
          
          // Course-wise revenue
          const courseName = data.courseName || "Other";
          courseRevenue[courseName] = (courseRevenue[courseName] || 0) + amount;
          
          // Daily revenue for chart
          const dateKey = format(paymentDate, "MMM dd");
          dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + amount;
          
          completedCount++;
        } else if (data.status === "pending") {
          pendingCount++;
        }
      });
      
      // Calculate statistics
      const avgTransaction = completedCount > 0 ? totalRevenue / completedCount : 0;
      const successRate = paymentsData.length > 0 ? (completedCount / paymentsData.length) * 100 : 0;
      const topCourse = Object.entries(courseRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      
      // Prepare trend data
      const trendData = Object.entries(dailyRevenue)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-10);
      
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      setStats({
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        avgTransaction,
        pendingCount,
        successRate,
        topCourse
      });
      setRevenueTrend(trendData);
      setLoading(false);
      
      console.log(`Loaded ${paymentsData.length} payments`);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dateRange]);

  // Apply filters
  useEffect(() => {
    let result = payments;
    
    // Status filter
    if (activeFilter !== "all") {
      result = result.filter(p => p.status === activeFilter);
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.studentName?.toLowerCase().includes(term) ||
        p.studentEmail?.toLowerCase().includes(term) ||
        p.courseName?.toLowerCase().includes(term) ||
        p.paymentId?.toLowerCase().includes(term) ||
        p.id?.toLowerCase().includes(term)
      );
    }
    
    setFilteredPayments(result);
  }, [payments, activeFilter, searchTerm]);

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: "admin"
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const exportToCSV = () => {
    const headers = ["Payment ID", "Student", "Email", "Course", "Amount", "Status", "Date", "Payment Method"];
    const csvData = payments.map(payment => [
      payment.paymentId || payment.id,
      payment.studentName || "N/A",
      payment.studentEmail || "N/A",
      payment.courseName || "N/A",
      `₹${payment.amount}`,
      payment.status,
      format(payment.timestamp, "yyyy-MM-dd HH:mm"),
      payment.paymentMethod || "Razorpay"
    ].join(","));
    
    const csvContent = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: { color: "bg-gradient-to-r from-emerald-500 to-green-400", icon: <FiCheckCircle />, label: "Completed" },
      pending: { color: "bg-gradient-to-r from-amber-500 to-yellow-400", icon: <FiClock />, label: "Pending" },
      failed: { color: "bg-gradient-to-r from-rose-500 to-red-400", icon: <FiXCircle />, label: "Failed" },
      refunded: { color: "bg-gradient-to-r from-slate-500 to-gray-400", icon: <FiArrowDownRight />, label: "Refunded" }
    };
    
    const cfg = config[status] || { color: "bg-gray-100", icon: null, label: status };
    
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 ${cfg.color}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const paymentMethodsData = useMemo(() => {
    const methods = {};
    payments.forEach(p => {
      const method = p.paymentMethod || "Unknown";
      methods[method] = (methods[method] || 0) + 1;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [payments]);

  return (
    <div className="p-6 space-y-6 animate-auth-entry">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Analytics</h1>
          <p className="text-slate-500">Real-time monitoring of all transactions</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-slate-700"
          >
            <FiDownload />
            Export CSV
          </button>
          <button 
            onClick={() => setViewMode(viewMode === "grid" ? "chart" : "grid")}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-slate-700"
          >
            <FiBarChart2 />
            {viewMode === "grid" ? "Chart View" : "Grid View"}
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <FiDollarSign className="text-2xl text-slate-300" />
              <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">REVENUE</span>
            </div>
            <h3 className="text-2xl font-black mb-1">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-sm text-slate-300">Total Revenue</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-500/20 rounded-full blur-xl"></div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FiTrendingUp className="text-2xl text-emerald-500" />
            <div className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-1">
              <FiArrowUpRight /> {stats.successRate.toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(stats.monthlyRevenue)}</h3>
          <p className="text-sm text-slate-500">This Month</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FiActivity className="text-2xl text-amber-500" />
            <div className="text-xs font-bold bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
              {stats.pendingCount} pending
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-1">{payments.length}</h3>
          <p className="text-sm text-slate-500">Total Transactions</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FiBook className="text-2xl text-blue-500" />
            <div className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full truncate max-w-[120px]">
              {stats.topCourse}
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(stats.avgTransaction)}</h3>
          <p className="text-sm text-slate-500">Avg. Transaction</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      {viewMode === "chart" ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Revenue Trend Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
                <p className="text-sm text-slate-500">Last 10 days performance</p>
              </div>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    labelStyle={{ color: '#475569' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Pie Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Payment Methods</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Transactions"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-100 rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {["all", "completed", "pending", "failed"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${activeFilter === filter 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search payments..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-slate-700"
            >
              <FiFilter />
              Filters
            </button>
          </div>
        </div>
        
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 p-4 bg-slate-50 rounded-xl space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Min Amount</label>
                <input 
                  type="number" 
                  placeholder="₹0"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200">
                  <option value="">All Methods</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Payments Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-slate-500 font-medium">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiCreditCard className="text-4xl text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium">No payments found</p>
                      {searchTerm && (
                        <p className="text-sm text-slate-400 mt-2">Try a different search term</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredPayments.slice(0, 20).map((payment, index) => (
                    <motion.tr 
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                            <FiUser className="text-slate-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{payment.studentName || "Unknown"}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <FiMail size={12} />
                              {payment.studentEmail || payment.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{payment.courseName || "General"}</div>
                        <div className="text-xs text-slate-500">{payment.courseId?.substring(0, 8) || "N/A"}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-lg">{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-slate-500">{payment.paymentMethod || "Razorpay"}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-900">{format(payment.timestamp, "MMM dd")}</div>
                        <div className="text-xs text-slate-500">{format(payment.timestamp, "HH:mm")}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(payment.status)}
                          {payment.status === "pending" && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleStatusUpdate(payment.id, "completed")}
                                className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(payment.id, "failed")}
                                className="text-xs px-2 py-1 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye />
                          </button>
                          {payment.receiptUrl && (
                            <a
                              href={payment.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Receipt"
                            >
                              <FiExternalLink />
                            </a>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredPayments.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Showing {Math.min(filteredPayments.length, 20)} of {filteredPayments.length} payments
            </div>
            <div className="flex items-center gap-4">
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors text-sm font-medium">
                Load More
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FiRefreshCw className={`animate-spin ${loading ? '' : 'hidden'}`} />
                {loading ? "Updating..." : "Live"}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Payment Detail Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Payment Details</h3>
                <button 
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Payment ID</label>
                      <div className="font-mono text-slate-900 bg-slate-50 p-2 rounded-lg">
                        {selectedPayment.paymentId || selectedPayment.id}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-500">Student</label>
                      <div className="font-medium text-slate-900">{selectedPayment.studentName}</div>
                      <div className="text-sm text-slate-500">{selectedPayment.studentEmail}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-500">Amount</label>
                      <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(selectedPayment.amount)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500">Course</label>
                      <div className="font-medium text-slate-900">{selectedPayment.courseName}</div>
                      <div className="text-sm text-slate-500">ID: {selectedPayment.courseId}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-500">Date & Time</label>
                      <div className="font-medium text-slate-900">
                        {format(selectedPayment.timestamp, "PPpp")}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-slate-500">Status</label>
                      <div className="mt-2">
                        {getStatusBadge(selectedPayment.status)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-4">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm text-slate-500">Payment Method</label>
                      <div className="font-medium text-slate-900">{selectedPayment.paymentMethod || "Razorpay"}</div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <label className="text-sm text-slate-500">Transaction ID</label>
                      <div className="font-mono text-sm text-slate-900">
                        {selectedPayment.razorpayPaymentId || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setSelectedPayment(null)}
                    className="px-4 py-2 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  {selectedPayment.receiptUrl && (
                    <a
                      href={selectedPayment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <FiExternalLink />
                      View Receipt
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments;