import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUserPlus, FiMail, FiPhone, FiTrash2, FiX, 
  FiSearch, FiCheckCircle, FiUserCheck, FiUserX,
  FiDownload, FiRefreshCw, FiAlertCircle, FiUsers,
  FiCalendar, FiLock, FiUnlock, FiEdit
} from "react-icons/fi";
import { db } from "../firebase";
import { 
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, query, orderBy, where, serverTimestamp 
} from "firebase/firestore";
import toast from "react-hot-toast";
import { format } from "date-fns";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0
  });
  
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "+91", 
    batch: "Full Stack", 
    password: "Student@123",
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: "active",
    notes: ""
  });

  // Fetch students from users collection
  useEffect(() => {
    try {
      const q = query(
        collection(db, "users"), 
        where("role", "==", "student"),
        orderBy("createdAt", "desc")
      );
      
      const unsub = onSnapshot(q, 
        (snapshot) => {
          const studentList = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            // Safely handle timestamps
            createdAt: doc.data().createdAt?.toDate 
              ? doc.data().createdAt.toDate() 
              : new Date(),
            lastLogin: doc.data().lastLogin?.toDate 
              ? doc.data().lastLogin.toDate() 
              : null
          }));
          
          setStudents(studentList);
          setFilteredStudents(studentList);
          
          // Calculate stats
          const active = studentList.filter(s => s.status === "active").length;
          const inactive = studentList.filter(s => s.status === "inactive").length;
          const pending = studentList.filter(s => s.status === "pending").length;
          
          setStats({
            total: studentList.length,
            active,
            inactive,
            pending
          });
        },
        (error) => {
          console.error("Error fetching students:", error);
          toast.error("Failed to load students. Please refresh.");
        }
      );
      
      return () => unsub();
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Database connection error");
    }
  }, []);

  // Filter students based on search and filters
  useEffect(() => {
    let result = students;
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.name?.toLowerCase().includes(term)) || 
        (s.email?.toLowerCase().includes(term)) ||
        (s.phone?.includes(searchTerm)) ||
        (s.studentId?.toLowerCase().includes(term))
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(s => s.status === statusFilter);
    }
    
    // Batch filter
    if (batchFilter !== "all") {
      result = result.filter(s => s.batch === batchFilter);
    }
    
    setFilteredStudents(result);
  }, [searchTerm, statusFilter, batchFilter, students]);

  // Generate random student ID
  const generateStudentId = () => {
    const prefix = "STU";
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${year}${random}`;
  };

  // Add new student (Admin only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const studentId = generateStudentId();
      
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Student name is required");
      }
      
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Create user document
      await addDoc(collection(db, "users"), {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        batch: formData.batch,
        role: "student",
        studentId: studentId,
        status: formData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,
        loginMethod: "manual",
        profileComplete: false,
        emailVerified: false,
        enrollmentDate: formData.enrollmentDate,
        notes: formData.notes || "",
        // Default preferences
        preferences: {
          notifications: true,
          theme: "light",
          language: "en"
        },
        // Academic info
        progress: 0,
        coursesEnrolled: [],
        assignmentsSubmitted: 0,
        attendance: 100,
        // Financial info
        feesPaid: 0,
        feesPending: 0,
        lastPayment: null
      });

      toast.success(`Student enrolled successfully! ID: ${studentId}`, {
        duration: 4000,
        icon: '🎓',
      });
      
      setIsModalOpen(false);
      
      // Reset form
      setFormData({ 
        name: "", 
        email: "", 
        phone: "+91", 
        batch: "Full Stack", 
        password: "Student@123",
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: "active",
        notes: ""
      });
      
    } catch (err) { 
      console.error("Enrollment error:", err);
      toast.error(err.message || "Failed to enroll student"); 
    } finally {
      setLoading(false);
    }
  };

  // Toggle student status (active/inactive)
  const toggleStudentStatus = async (studentId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      await updateDoc(doc(db, "users", studentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      toast.success(`Student ${newStatus === "active" ? "activated" : "deactivated"}!`, {
        duration: 3000,
        icon: newStatus === "active" ? '✅' : '⏸️',
      });
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
    }
  };

  // Delete student
  const deleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove "${studentName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "users", studentId));
      toast.success(`"${studentName}" removed successfully`, {
        duration: 3000,
        icon: '🗑️',
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error deleting student");
    }
  };

  // Export student data
  const exportStudents = () => {
    try {
      const data = filteredStudents.map(s => ({
        ID: s.studentId || "N/A",
        Name: s.name || "Unknown",
        Email: s.email || "N/A",
        Phone: s.phone || "N/A",
        Batch: s.batch || "Not assigned",
        Status: s.status || "active",
        "Enrollment Date": s.enrollmentDate || 
          (s.createdAt ? format(s.createdAt, "dd/MM/yyyy") : "N/A"),
        "Last Login": s.lastLogin ? format(s.lastLogin, "dd/MM/yyyy HH:mm") : "Never"
      }));
      
      if (data.length === 0) {
        toast.error("No data to export");
        return;
      }
      
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${data.length} students successfully!`, {
        duration: 3000,
        icon: '📥',
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const cell = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return cell.toString().includes(',') 
          ? `"${cell.toString().replace(/"/g, '""')}"`
          : cell;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  // Get unique batches for filter
  const uniqueBatches = [...new Set(students
    .map(s => s.batch)
    .filter(batch => batch && batch.trim() !== ""))];

  // Format date safely
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return format(date, "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header with Stats */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
              Student Management
            </h1>
            <p className="text-slate-400 text-xs md:text-[10px] font-black tracking-[0.3em] uppercase mt-1">
              Complete Control Panel
            </p>
            
            {/* Stats Grid */}
            <div className="flex flex-wrap gap-3 md:gap-4 mt-4">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-2 md:px-4 md:py-2 rounded-xl min-w-[100px]">
                <div className="text-xl md:text-2xl font-black text-emerald-700">
                  {stats.active}
                </div>
                <div className="text-xs font-bold text-emerald-600 uppercase">Active</div>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-2 md:px-4 md:py-2 rounded-xl min-w-[100px]">
                <div className="text-xl md:text-2xl font-black text-amber-700">
                  {stats.inactive}
                </div>
                <div className="text-xs font-bold text-amber-600 uppercase">Inactive</div>
              </div>
              <div className="bg-gradient-to-r from-rose-50 to-rose-100 px-3 py-2 md:px-4 md:py-2 rounded-xl min-w-[100px]">
                <div className="text-xl md:text-2xl font-black text-rose-700">
                  {stats.pending}
                </div>
                <div className="text-xs font-bold text-rose-600 uppercase">Pending</div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 md:px-4 md:py-2 rounded-xl min-w-[100px]">
                <div className="text-xl md:text-2xl font-black text-blue-700">
                  {stats.total}
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase">Total</div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="flex flex-wrap gap-2">
              <select 
                className="bg-slate-50 border-2 border-slate-50 p-2 md:p-3 rounded-xl outline-none focus:border-sky-500/20 focus:bg-white transition-all text-sm font-bold"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              
              <select 
                className="bg-slate-50 border-2 border-slate-50 p-2 md:p-3 rounded-xl outline-none focus:border-sky-500/20 focus:bg-white transition-all text-sm font-bold"
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                disabled={uniqueBatches.length === 0}
              >
                <option value="all">All Batches</option>
                {uniqueBatches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={exportStudents}
                disabled={students.length === 0}
                className="bg-white border-2 border-slate-200 text-slate-700 px-3 py-2 md:px-4 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:border-slate-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload className="text-lg" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-slate-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-600 transition-all shadow-xl active:scale-95"
              >
                <FiUserPlus className="text-lg md:text-xl" /> 
                <span className="hidden sm:inline">Enroll Student</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, phone, or student ID..." 
            className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 pl-10 md:pl-12 rounded-2xl outline-none focus:border-sky-500/20 focus:bg-white transition-all text-sm font-bold"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      {students.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredStudents.map((student) => (
            <motion.div 
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 relative shadow-sm hover:shadow-xl transition-all group overflow-hidden"
            >
              {/* Status Badge */}
              <div className={`absolute top-3 right-3 text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full ${
                student.status === "active" 
                  ? "bg-emerald-100 text-emerald-700" 
                  : student.status === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              }`}>
                {student.status?.toUpperCase() || "ACTIVE"}
              </div>
              
              {/* Student ID */}
              <div className="absolute top-3 left-3 text-[10px] md:text-xs font-bold text-slate-400">
                {student.studentId || "ID: N/A"}
              </div>
              
              {/* Student Info */}
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 mt-8 md:mt-10">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center text-sky-600 text-xl md:text-2xl font-black">
                  {student.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 truncate">
                    {student.name || "Unknown Student"}
                  </h3>
                  <p className="text-emerald-500 text-xs font-bold uppercase tracking-wider truncate">
                    {student.batch || "Not Assigned"}
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">
                    Joined: {formatDate(student.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 text-slate-600 text-sm">
                  <FiPhone className="text-slate-300 flex-shrink-0" size={16}/> 
                  <span className="truncate text-xs md:text-sm">
                    {student.phone || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-slate-600 text-sm">
                  <FiMail className="text-slate-300 flex-shrink-0" size={16}/> 
                  <span className="truncate text-xs md:text-sm">
                    {student.email || "Not provided"}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-100">
                <button 
                  onClick={() => toggleStudentStatus(student.id, student.status || "active")}
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1 md:gap-2 ${
                    student.status === "active" 
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
                >
                  {student.status === "active" ? (
                    <>
                      <FiUserX size={14} className="md:size-4" />
                      <span className="hidden xs:inline">Deactivate</span>
                    </>
                  ) : (
                    <>
                      <FiUserCheck size={14} className="md:size-4" />
                      <span className="hidden xs:inline">Activate</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => deleteStudent(student.id, student.name)}
                  className="p-1.5 md:p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all"
                  title="Delete student"
                >
                  <FiTrash2 size={14} className="md:size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
            <FiUsers className="text-slate-400 text-2xl md:text-3xl" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
            No Students Found
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {searchTerm || statusFilter !== "all" || batchFilter !== "all" 
              ? "Try adjusting your filters or search terms"
              : "Get started by enrolling your first student"}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-all inline-flex items-center gap-2"
          >
            <FiUserPlus /> Enroll First Student
          </button>
        </div>
      )}

      {/* Empty Search Results */}
      {students.length > 0 && filteredStudents.length === 0 && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <FiSearch className="text-amber-600 text-2xl md:text-3xl" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
            No Matching Students
          </h3>
          <p className="text-slate-500 mb-6">
            No students found with current filters. Try a different search or clear filters.
          </p>
          <button 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setBatchFilter("all");
            }}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-all inline-flex items-center gap-2"
          >
            <FiRefreshCw /> Clear Filters
          </button>
        </div>
      )}

      {/* Student Enroll Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
              onClick={() => !loading && setIsModalOpen(false)} 
            />

            {/* Modal */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl md:rounded-[3.5rem] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 md:p-8 lg:p-10 pb-4 md:pb-6 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white z-20">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                    Enroll New Student
                  </h2>
                  <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider mt-1">
                    Manual Student Registration
                  </p>
                </div>
                <button 
                  onClick={() => !loading && setIsModalOpen(false)} 
                  disabled={loading}
                  className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl text-slate-400 hover:text-slate-900 transition-all disabled:opacity-50"
                  aria-label="Close"
                >
                  <FiX size={20}/>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 lg:p-10 pt-4 md:pt-6 overflow-y-auto flex-1">
                <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Student Name *
                      </label>
                      <input 
                        type="text" 
                        required 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-medium text-slate-900"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter full name"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input 
                        type="email" 
                        required 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-medium text-slate-900"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="student@example.com"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Phone Number *
                      </label>
                      <input 
                        type="tel" 
                        required 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-medium text-slate-900"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+91 9876543210"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Assign Batch *
                      </label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] outline-none focus:border-sky-500/20 font-medium text-sm"
                        value={formData.batch}
                        onChange={(e) => setFormData({...formData, batch: e.target.value})}
                        disabled={loading}
                      >
                        <option>Full Stack</option>
                        <option>Data Science</option>
                        <option>UI/UX Design</option>
                        <option>Mobile Development</option>
                        <option>Cyber Security</option>
                        <option>Digital Marketing</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Account Status
                      </label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] outline-none focus:border-sky-500/20 font-medium text-sm"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        disabled={loading}
                      >
                        <option value="active">Active (Can login)</option>
                        <option value="inactive">Inactive (Cannot login)</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Enrollment Date
                      </label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] outline-none focus:border-sky-500/20 font-medium text-slate-900"
                        value={formData.enrollmentDate}
                        onChange={(e) => setFormData({...formData, enrollmentDate: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Notes (Optional)
                    </label>
                    <textarea 
                      rows="3"
                      className="w-full bg-slate-50 border-2 border-slate-50 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] outline-none focus:border-sky-500/20 font-medium text-slate-900 resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any additional information about the student..."
                      disabled={loading}
                    />
                  </div>

                  {/* Information Box */}
                  <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-xl md:rounded-2xl p-4 md:p-6">
                    <h4 className="font-bold text-slate-900 mb-2 md:mb-3 flex items-center gap-2">
                      <FiCheckCircle className="text-sky-600" size={18} />
                      Important Information
                    </h4>
                    <ul className="text-xs md:text-sm text-slate-600 space-y-1 md:space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>
                        <span>Student will receive login credentials via email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>
                        <span>Status "Inactive" means student cannot login to system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>
                        <span>You can activate/deactivate students anytime</span>
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-3 md:py-4 rounded-xl md:rounded-2xl text-sm font-bold uppercase tracking-wider hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enrolling Student...
                      </>
                    ) : (
                      "Confirm Enrollment"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {students.length === 0 && !isModalOpen && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500 mb-4"></div>
          <p className="text-slate-500">Loading students...</p>
        </div>
      )}
    </div>
  );
};

export default Students;