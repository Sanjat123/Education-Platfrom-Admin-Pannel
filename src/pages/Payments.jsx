import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCreditCard, FiCheckCircle, FiClock, FiXCircle, 
  FiSearch, FiDollarSign, FiRefreshCw, FiFilter,
  FiDownload, FiTrendingUp, FiTrendingDown, FiBarChart2,
  FiCalendar, FiUser, FiBook, FiEye, FiExternalLink,
  FiArrowUpRight, FiArrowDownRight, FiMoreVertical,
  FiMail, FiSmartphone, FiActivity, FiShoppingBag,
  FiGlobe, FiCopy, FiSend, FiPrinter
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
  getDocs,
  getCountFromServer
} from "firebase/firestore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Sector, AreaChart, Area } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, startOfDay, endOfDay } from "date-fns";
import toast, { Toaster } from "react-hot-toast";


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
    dailyRevenue: 0,
    avgTransaction: 0,
    pendingCount: 0,
    successRate: 0,
    topCourse: "",
    totalTransactions: 0,
    refundAmount: 0,
    netRevenue: 0
  });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paymentMethodsSummary, setPaymentMethodsSummary] = useState([]);
  const [refundsData, setRefundsData] = useState([]);

  // Real Indian payment methods
  const PAYMENT_METHODS = {
    upi: { name: "UPI", icon: "💳", color: "#6D28D9" },
    razorpay: { name: "Razorpay", icon: "🏦", color: "#1E40AF" },
    card: { name: "Card", icon: "💳", color: "#059669" },
    netbanking: { name: "Net Banking", icon: "🌐", color: "#0EA5E9" },
    wallet: { name: "Wallet", icon: "👛", color: "#F59E0B" },
    cod: { name: "Cash on Delivery", icon: "💵", color: "#6B7280" },
    emi: { name: "EMI", icon: "📅", color: "#8B5CF6" }
  };

  useEffect(() => {
    setLoading(true);
    
    let q = collection(db, "payments");
    
    const now = new Date();
    let startDate = new Date();
    
    switch(dateRange) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subDays(now, 30);
        break;
      case "3months":
        startDate = subMonths(now, 3);
        break;
      case "year":
        startDate = subMonths(now, 12);
        break;
      case "all":
        startDate = new Date(0);
        break;
      default:
        startDate = subDays(now, 30);
    }
    
    q = query(
      q,
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const paymentsData = [];
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let weeklyRevenue = 0;
      let dailyRevenue = 0;
      let pendingCount = 0;
      let completedCount = 0;
      let refundAmount = 0;
      const courseRevenue = {};
      const dailyRevenueData = {};
      const paymentMethodsCount = {};
      
      const currentMonthStart = startOfMonth(now);
      const weekAgo = subDays(now, 7);
      const todayStart = startOfDay(now);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const paymentDate = data.timestamp?.toDate() || new Date();
        const amount = Number(data.amount || 0);
        const refundedAmount = Number(data.refundedAmount || 0);
        
        const payment = { 
          id: doc.id, 
          ...data,
          timestamp: paymentDate,
          formattedDate: format(paymentDate, "dd MMM yyyy, hh:mm a"),
          originalAmount: amount,
          netAmount: amount - refundedAmount
        };
        
        paymentsData.push(payment);
        
        // Payment method statistics
        const method = data.paymentMethod || "unknown";
        paymentMethodsCount[method] = (paymentMethodsCount[method] || 0) + 1;
        
        if (data.status === "completed" || data.status === "refunded_partial") {
          totalRevenue += amount;
          refundAmount += refundedAmount;
          
          if (paymentDate >= currentMonthStart) {
            monthlyRevenue += amount;
          }
          
          if (paymentDate >= weekAgo) {
            weeklyRevenue += amount;
          }
          
          if (paymentDate >= todayStart) {
            dailyRevenue += amount;
          }
          
          const courseName = data.courseName || "Other";
          courseRevenue[courseName] = (courseRevenue[courseName] || 0) + amount;
          
          const dateKey = format(paymentDate, "dd MMM");
          dailyRevenueData[dateKey] = (dailyRevenueData[dateKey] || 0) + amount;
          
          completedCount++;
        } else if (data.status === "pending") {
          pendingCount++;
        } else if (data.status === "refunded") {
          refundAmount += amount;
        }
      });
      
      // Calculate statistics
      const avgTransaction = completedCount > 0 ? totalRevenue / completedCount : 0;
      const successRate = paymentsData.length > 0 ? (completedCount / paymentsData.length) * 100 : 0;
      const topCourse = Object.entries(courseRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const netRevenue = totalRevenue - refundAmount;
      
      // Prepare trend data
      const trendData = Object.entries(dailyRevenueData)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-15);
      
      // Payment methods summary
      const methodsSummary = Object.entries(paymentMethodsCount)
        .map(([method, count]) => ({
          name: PAYMENT_METHODS[method]?.name || method,
          value: count,
          icon: PAYMENT_METHODS[method]?.icon || "❓",
          color: PAYMENT_METHODS[method]?.color || "#6B7280"
        }));
      
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      setStats({
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        dailyRevenue,
        avgTransaction,
        pendingCount,
        successRate,
        topCourse,
        totalTransactions: paymentsData.length,
        refundAmount,
        netRevenue
      });
      setRevenueTrend(trendData);
      setPaymentMethodsSummary(methodsSummary);
      setLoading(false);
      
      // Load refunds separately
      loadRefundsData();
    }, (error) => {
      console.error("Firestore Error:", error);
      toast.error("Error loading payments data");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dateRange]);

  const loadRefundsData = async () => {
    try {
      const refundsQuery = query(
        collection(db, "payments"),
        where("status", "in", ["refunded", "refunded_partial"]),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const snapshot = await getDocs(refundsQuery);
      const refunds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setRefundsData(refunds);
    } catch (error) {
      console.error("Error loading refunds:", error);
    }
  };

  useEffect(() => {
    let result = [...payments];
    
    // Status filter
    if (activeFilter !== "all") {
      result = result.filter(p => p.status === activeFilter);
    }
    
    // Payment method filter
    if (paymentMethodFilter !== "all") {
      result = result.filter(p => p.paymentMethod === paymentMethodFilter);
    }
    
    // Amount filters
    if (minAmount) {
      result = result.filter(p => p.amount >= Number(minAmount));
    }
    
    if (maxAmount) {
      result = result.filter(p => p.amount <= Number(maxAmount));
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.studentName?.toLowerCase().includes(term) ||
        p.studentEmail?.toLowerCase().includes(term) ||
        p.courseName?.toLowerCase().includes(term) ||
        p.paymentId?.toLowerCase().includes(term) ||
        p.razorpayPaymentId?.toLowerCase().includes(term) ||
        p.upiTransactionId?.toLowerCase().includes(term) ||
        p.id?.toLowerCase().includes(term)
      );
    }
    
    // Sorting
    result.sort((a, b) => {
      switch(sortBy) {
        case "date_desc":
          return b.timestamp - a.timestamp;
        case "date_asc":
          return a.timestamp - b.timestamp;
        case "amount_desc":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        default:
          return b.timestamp - a.timestamp;
      }
    });
    
    setFilteredPayments(result);
    setPage(1); // Reset to first page when filters change
  }, [payments, activeFilter, searchTerm, paymentMethodFilter, minAmount, maxAmount, sortBy]);

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: "admin",
        ...(newStatus === "refunded" && { refundedAt: Timestamp.now() })
      });
      
      toast.success(`Payment ${newStatus} successfully`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const initiateRefund = async (paymentId, amount, reason = "Customer request") => {
    try {
      const paymentRef = doc(db, "payments", paymentId);
      await updateDoc(paymentRef, {
        status: "refunded",
        refundedAmount: amount,
        refundReason: reason,
        refundedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      toast.success(`Refund of ₹${amount} initiated successfully`);
    } catch (error) {
      console.error("Error initiating refund:", error);
      toast.error("Failed to initiate refund");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Payment ID", 
      "Razorpay ID", 
      "UPI ID", 
      "Student Name", 
      "Student Email", 
      "Student Phone",
      "Course", 
      "Course ID",
      "Amount", 
      "Tax", 
      "Net Amount",
      "Status", 
      "Date", 
      "Payment Method",
      "Bank/UPI App",
      "Refund Amount",
      "Refund Date",
      "Notes"
    ];
    
    const csvData = payments.map(payment => [
      payment.paymentId || payment.id,
      payment.razorpayPaymentId || "",
      payment.upiTransactionId || "",
      payment.studentName || "N/A",
      payment.studentEmail || "N/A",
      payment.studentPhone || "",
      payment.courseName || "N/A",
      payment.courseId || "",
      `₹${payment.amount}`,
      `₹${payment.tax || 0}`,
      `₹${payment.netAmount || payment.amount}`,
      payment.status,
      format(payment.timestamp, "yyyy-MM-dd HH:mm:ss"),
      PAYMENT_METHODS[payment.paymentMethod]?.name || payment.paymentMethod,
      payment.bankName || payment.upiApp || "",
      payment.refundedAmount ? `₹${payment.refundedAmount}` : "",
      payment.refundedAt ? format(payment.refundedAt.toDate(), "yyyy-MM-dd HH:mm:ss") : "",
      payment.notes || ""
    ].join(","));
    
    const csvContent = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_export_${format(new Date(), "dd-MMM-yyyy")}.csv`;
    a.click();
    
    toast.success("CSV exported successfully");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: { 
        color: "bg-gradient-to-r from-emerald-500 to-green-400", 
        icon: <FiCheckCircle />, 
        label: "Completed",
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50"
      },
      pending: { 
        color: "bg-gradient-to-r from-amber-500 to-yellow-400", 
        icon: <FiClock />, 
        label: "Pending",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50"
      },
      failed: { 
        color: "bg-gradient-to-r from-rose-500 to-red-400", 
        icon: <FiXCircle />, 
        label: "Failed",
        textColor: "text-rose-700",
        bgColor: "bg-rose-50"
      },
      refunded: { 
        color: "bg-gradient-to-r from-slate-500 to-gray-400", 
        icon: <FiArrowDownRight />, 
        label: "Refunded",
        textColor: "text-slate-700",
        bgColor: "bg-slate-50"
      },
      refunded_partial: { 
        color: "bg-gradient-to-r from-purple-500 to-pink-400", 
        icon: <FiArrowDownRight />, 
        label: "Partial Refund",
        textColor: "text-purple-700",
        bgColor: "bg-purple-50"
      },
      processing: { 
        color: "bg-gradient-to-r from-blue-500 to-cyan-400", 
        icon: <FiRefreshCw className="animate-spin" />, 
        label: "Processing",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50"
      }
    };
    
    const cfg = config[status] || { color: "bg-gray-100", icon: null, label: status };
    
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 ${cfg.color}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    return PAYMENT_METHODS[method]?.icon || "💳";
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-bold text-slate-900">{label}</p>
          <p className="text-sm text-slate-700">
            Revenue: <span className="font-bold">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 animate-auth-entry">
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Dashboard</h1>
          <p className="text-slate-500">Real-time monitoring of all transactions with Indian payment systems</p>
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
          <button 
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-slate-700"
          >
            <FiPrinter />
            Print Report
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <FiDollarSign className="text-2xl text-slate-300" />
              <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">TOTAL REVENUE</span>
            </div>
            <h3 className="text-2xl font-black mb-1">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-sm text-slate-300">All Transactions</p>
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
            <div className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
              stats.successRate >= 80 ? "bg-emerald-50 text-emerald-600" : 
              stats.successRate >= 60 ? "bg-amber-50 text-amber-600" : 
              "bg-rose-50 text-rose-600"
            }`}>
              {stats.successRate >= 80 ? <FiArrowUpRight /> : <FiArrowDownRight />} 
              {stats.successRate.toFixed(1)}%
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
          <h3 className="text-2xl font-black text-slate-900 mb-1">{stats.totalTransactions}</h3>
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

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FiArrowDownRight className="text-2xl text-purple-500" />
            <div className="text-xs font-bold bg-purple-50 text-purple-600 px-3 py-1 rounded-full">
              Refunds
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(stats.refundAmount)}</h3>
          <p className="text-sm text-slate-500">Total Refunds</p>
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
                <p className="text-sm text-slate-500">Last 15 days performance</p>
              </div>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₹${value/1000}k`} />
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
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Distribution */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Payment Methods Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsSummary}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodsSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} transactions (${((value/payments.length)*100).toFixed(1)}%)`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {paymentMethodsSummary.map((method, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <span>{method.icon}</span>
                  <span className="text-sm font-medium">{method.name}</span>
                  <span className="text-sm text-slate-500">({method.value})</span>
                </div>
              ))}
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
            {["all", "completed", "pending", "failed", "refunded", "processing"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${activeFilter === filter 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search payments by ID, name, email, UPI..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Amount High to Low</option>
              <option value="amount_asc">Amount Low to High</option>
            </select>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-2 font-medium text-slate-700"
            >
              <FiFilter />
              Advanced Filters
            </button>
          </div>
        </div>
        
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 p-4 bg-slate-50 rounded-xl space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <option value="3months">Last 3 Months</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <select 
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="all">All Methods</option>
                  {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                    <option key={key} value={key}>
                      {method.icon} {method.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Min Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Max Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="100000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setMinAmount("");
                  setMaxAmount("");
                  setPaymentMethodFilter("all");
                  setSearchTerm("");
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Clear All Filters
              </button>
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
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Info</th>
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
              ) : currentPayments.length === 0 ? (
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
                  {currentPayments.map((payment, index) => (
                    <motion.tr 
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="font-mono text-sm font-bold text-slate-900">
                            {payment.paymentId || payment.id.substring(0, 8)}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <FiCalendar size={10} />
                            {payment.formattedDate}
                          </div>
                          {payment.razorpayPaymentId && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <span className="font-mono">RP: {payment.razorpayPaymentId.substring(0, 12)}...</span>
                              <button 
                                onClick={() => copyToClipboard(payment.razorpayPaymentId)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <FiCopy size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                              <FiUser className="text-slate-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{payment.studentName || "Unknown"}</div>
                              <div className="text-xs text-slate-500">{payment.studentEmail}</div>
                            </div>
                          </div>
                          {payment.studentPhone && (
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <FiSmartphone size={10} />
                              {payment.studentPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900">{payment.courseName || "General"}</div>
                          <div className="text-xs text-slate-500">ID: {payment.courseId?.substring(0, 8) || "N/A"}</div>
                          {payment.batchName && (
                            <div className="text-xs text-slate-500">Batch: {payment.batchName}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                            <div>
                              <div className="font-bold text-slate-900 text-lg">{formatCurrency(payment.amount)}</div>
                              <div className="text-xs text-slate-500 capitalize">
                                {PAYMENT_METHODS[payment.paymentMethod]?.name || payment.paymentMethod}
                              </div>
                            </div>
                          </div>
                          {payment.upiTransactionId && (
                            <div className="text-xs text-slate-500">
                              UPI: {payment.upiTransactionId.substring(0, 16)}...
                            </div>
                          )}
                          {payment.bankName && (
                            <div className="text-xs text-slate-500">{payment.bankName}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          {getStatusBadge(payment.status)}
                          {payment.status === "pending" && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <button
                                onClick={() => handleStatusUpdate(payment.id, "completed")}
                                className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(payment.id, "failed")}
                                className="text-xs px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors font-medium"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {payment.status === "completed" && (
                            <button
                              onClick={() => initiateRefund(payment.id, payment.amount, "Admin initiated")}
                              className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium mt-2"
                            >
                              Initiate Refund
                            </button>
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
                          <button
                            onClick={() => copyToClipboard(payment.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Copy Payment ID"
                          >
                            <FiCopy />
                          </button>
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} payments
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg ${page === pageNum ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span>...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`w-8 h-8 rounded-lg ${page === totalPages ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FiRefreshCw className={`animate-spin ${loading ? '' : 'hidden'}`} />
                {loading ? "Updating..." : "Live"}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Refunds Section */}
      {refundsData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Refunds</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Refund ID</th>
                  <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Original Payment</th>
                  <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {refundsData.map((refund) => (
                  <tr key={refund.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-sm">{refund.id.substring(0, 12)}...</td>
                    <td className="p-3">
                      <div className="text-sm font-medium">{refund.studentName}</div>
                      <div className="text-xs text-slate-500">{refund.courseName}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-red-600 font-bold">{formatCurrency(refund.refundedAmount || refund.amount)}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{refund.refundReason || "Not specified"}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{format(refund.refundedAt?.toDate() || refund.timestamp, "dd MMM yyyy")}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Payment Detail Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Payment Details</h3>
                  <p className="text-sm text-slate-500">Transaction ID: {selectedPayment.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Information */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <FiUser /> Student Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-slate-500">Full Name</label>
                          <div className="font-medium text-slate-900">{selectedPayment.studentName}</div>
                        </div>
                        <div>
                          <label className="text-sm text-slate-500">Email</label>
                          <div className="font-medium text-slate-900">{selectedPayment.studentEmail}</div>
                        </div>
                        {selectedPayment.studentPhone && (
                          <div>
                            <label className="text-sm text-slate-500">Phone</label>
                            <div className="font-medium text-slate-900">{selectedPayment.studentPhone}</div>
                          </div>
                        )}
                        {selectedPayment.studentAddress && (
                          <div>
                            <label className="text-sm text-slate-500">Address</label>
                            <div className="font-medium text-slate-900">{selectedPayment.studentAddress}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Course Information */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <FiBook /> Course Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-slate-500">Course Name</label>
                          <div className="font-medium text-slate-900">{selectedPayment.courseName}</div>
                        </div>
                        <div>
                          <label className="text-sm text-slate-500">Course ID</label>
                          <div className="font-mono text-sm text-slate-900">{selectedPayment.courseId}</div>
                        </div>
                        {selectedPayment.batchName && (
                          <div>
                            <label className="text-sm text-slate-500">Batch</label>
                            <div className="font-medium text-slate-900">{selectedPayment.batchName}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Information */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <FiDollarSign /> Payment Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Amount:</span>
                          <span className="text-2xl font-bold text-slate-900">
                            {formatCurrency(selectedPayment.amount)}
                          </span>
                        </div>
                        {selectedPayment.tax && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tax (GST):</span>
                            <span className="font-medium">₹{selectedPayment.tax}</span>
                          </div>
                        )}
                        {selectedPayment.discount && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Discount:</span>
                            <span className="font-medium text-emerald-600">-₹{selectedPayment.discount}</span>
                          </div>
                        )}
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-900">Net Amount:</span>
                            <span className="text-slate-900">{formatCurrency(selectedPayment.netAmount || selectedPayment.amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Transaction Details */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <FiCreditCard /> Transaction Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-slate-500">Payment Method</label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getPaymentMethodIcon(selectedPayment.paymentMethod)}</span>
                            <span className="font-medium text-slate-900">
                              {PAYMENT_METHODS[selectedPayment.paymentMethod]?.name || selectedPayment.paymentMethod}
                            </span>
                          </div>
                        </div>
                        
                        {selectedPayment.razorpayPaymentId && (
                          <div>
                            <label className="text-sm text-slate-500">Razorpay ID</label>
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-sm bg-white px-2 py-1 rounded">
                                {selectedPayment.razorpayPaymentId}
                              </code>
                              <button 
                                onClick={() => copyToClipboard(selectedPayment.razorpayPaymentId)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <FiCopy size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {selectedPayment.upiTransactionId && (
                          <div>
                            <label className="text-sm text-slate-500">UPI Transaction ID</label>
                            <div className="font-mono text-sm text-slate-900">
                              {selectedPayment.upiTransactionId}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="text-sm text-slate-500">Date & Time</label>
                          <div className="font-medium text-slate-900">
                            {format(selectedPayment.timestamp, "PPPpp")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status and Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h4 className="font-bold text-slate-900 mb-3">Status</h4>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(selectedPayment.status)}
                      {selectedPayment.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleStatusUpdate(selectedPayment.id, "completed");
                              setSelectedPayment(null);
                            }}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            Approve Payment
                          </button>
                          <button
                            onClick={() => {
                              handleStatusUpdate(selectedPayment.id, "failed");
                              setSelectedPayment(null);
                            }}
                            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          >
                            Reject Payment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h4 className="font-bold text-slate-900 mb-3">Refund</h4>
                    {selectedPayment.status === "completed" && !selectedPayment.refundedAmount ? (
                      <div className="space-y-3">
                        <input
                          type="number"
                          placeholder="Refund amount"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2"
                          max={selectedPayment.amount}
                        />
                        <button
                          onClick={() => {
                            initiateRefund(selectedPayment.id, selectedPayment.amount, "Admin initiated refund");
                            setSelectedPayment(null);
                          }}
                          className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Initiate Full Refund
                        </button>
                      </div>
                    ) : selectedPayment.refundedAmount ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Refunded Amount:</span>
                          <span className="font-bold text-rose-600">
                            {formatCurrency(selectedPayment.refundedAmount)}
                          </span>
                        </div>
                        {selectedPayment.refundReason && (
                          <div>
                            <span className="text-slate-500">Reason:</span>
                            <div className="text-slate-900">{selectedPayment.refundReason}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500">No refund available for this transaction</p>
                    )}
                  </div>
                </div>
                
                {/* Notes Section */}
                {selectedPayment.notes && (
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h4 className="font-bold text-slate-900 mb-3">Notes</h4>
                    <p className="text-slate-700">{selectedPayment.notes}</p>
                  </div>
                )}
                
                {/* Action Buttons */}
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
                  <button
                    onClick={() => {
                      copyToClipboard(selectedPayment.id);
                      toast.success("Payment ID copied!");
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <FiCopy />
                    Copy ID
                  </button>
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