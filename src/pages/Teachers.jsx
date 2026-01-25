import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";

import { 
  collection, addDoc, query, where, updateDoc, 
  doc, deleteDoc, onSnapshot, serverTimestamp,
  setDoc, getDoc, orderBy, getDocs
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, updateProfile, sendEmailVerification,
  signOut, signInWithEmailAndPassword
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
// At the top of the file with other icon imports, add FiSort:
import { 
  FiUser, FiMail, FiPhone, FiBook, FiTrash2, 
  FiPlus, FiSearch, FiCheckCircle, FiX, FiLock, 
  FiUnlock, FiMail as FiMailIcon, FiKey, FiSend,
  FiAlertCircle, FiEdit, FiEye, FiEyeOff, FiCopy,
  FiCalendar, FiClock, FiUpload, FiDownload, 
  FiFilter, FiRefreshCw, FiMoreVertical, FiLogOut,
  FiPrinter, FiShare2, FiUserPlus, FiStar, FiAward,
  FiMessageSquare, FiDatabase, FiClipboard, FiArchive,
  FiChevronUp, FiChevronDown // Add these for sort icons
} from "react-icons/fi";
import { 
  MdEmail, MdPhoneAndroid, MdAdminPanelSettings, MdSchool,
  MdPersonAdd, MdVerified, MdBlock, MdEdit, MdDelete
} from "react-icons/md";
import { RiShieldUserLine, RiUserSettingsLine } from "react-icons/ri";
import { HiOutlineAcademicCap } from "react-icons/hi";
import { BsThreeDotsVertical, BsFillPersonCheckFill } from "react-icons/bs";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";


const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [authMethod, setAuthMethod] = useState("email");
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [bulkAction, setBulkAction] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    emailLogin: 0,
    phoneLogin: 0,
    verified: 0,
    newThisMonth: 0
  });
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "+91",
    department: "",
    subject: "",
    employeeId: "",
    password: "Teacher@123",
    confirmPassword: "Teacher@123",
    status: "active",
    joiningDate: new Date().toISOString().split('T')[0],
    qualification: "",
    experience: "",
    address: "",
    profileImage: "",
    designation: "",
    specialization: "",
    officeHours: "",
    isVerified: false,
    allowCourseCreation: true
  });

  const [editTeacher, setEditTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    subject: "",
    employeeId: "",
    status: "active",
    qualification: "",
    experience: "",
    address: "",
    designation: "",
    specialization: "",
    officeHours: "",
    isVerified: false,
    allowCourseCreation: true
  });

  // Current admin user fetch - FIXED to prevent session hijacking
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin') {
              setCurrentAdmin({
                uid: user.uid,
                email: user.email,
                role: userData.role,
                name: userData.name,
                profileImage: userData.profileImage
              });
              
              // Add admin activity log
              await updateDoc(doc(db, "adminLogs", user.uid), {
                lastAccess: serverTimestamp(),
                page: "teachers",
                accessedAt: new Date().toISOString()
              }, { merge: true });
            }
          }
        } catch (error) {
          console.error("Error fetching admin data:", error);
          toast.error("Failed to load admin data");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME DATA FETCH with enhanced error handling
  useEffect(() => {
    try {
      const q = query(
        collection(db, "users"), 
        where("role", "==", "teacher"),
        orderBy("createdAt", "desc")
      );
      
      const unsubscribe = onSnapshot(q, 
        async (snapshot) => {
          const teachersList = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || null
          }));
          
          setTeachers(teachersList);
          
          // Update statistics
          updateStats(teachersList);
          
          // Extract unique departments
          const uniqueDepts = [...new Set(teachersList.map(t => t.department).filter(Boolean))];
          setDepartments(uniqueDepts);
          
          // Check for recent notifications
          checkRecentActivities(teachersList);
        },
        (error) => {
          console.error("Error fetching teachers:", error);
          if (error.code === 'failed-precondition') {
            toast.error(
              <div className="flex items-center gap-2">
                <FiAlertCircle />
                <span>Firestore index required. Please create composite index for role and createdAt fields.</span>
              </div>,
              { duration: 8000, icon: '⚠️' }
            );
          } else if (error.code === 'permission-denied') {
            toast.error("You don't have permission to view teachers. Contact administrator.");
          } else {
            toast.error("Failed to load teachers data");
          }
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error("Query setup error:", error);
      toast.error("Failed to initialize teacher data fetch");
    }
  }, []);

  // Update statistics
  const updateStats = (teachersList) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const statsData = {
      total: teachersList.length,
      active: teachersList.filter(t => t.status === 'active').length,
      inactive: teachersList.filter(t => t.status === 'inactive').length,
      emailLogin: teachersList.filter(t => t.loginMethod === 'email').length,
      phoneLogin: teachersList.filter(t => t.loginMethod === 'phone').length,
      verified: teachersList.filter(t => t.isVerified).length,
      newThisMonth: teachersList.filter(t => {
        const createdDate = t.createdAt;
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      }).length
    };
    setStats(statsData);
  };

  // Check recent activities for notifications
  const checkRecentActivities = (teachersList) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentActivities = teachersList.filter(t => {
      if (!t.lastActivity) return false;
      const activityTime = t.lastActivity.toDate ? t.lastActivity.toDate() : new Date(t.lastActivity);
      return activityTime > oneHourAgo;
    });
    
    if (recentActivities.length > 0 && notifications.length === 0) {
      setNotifications([
        ...recentActivities.map(t => ({
          id: t.id,
          message: `${t.name} was recently active`,
          time: "Just now",
          type: "activity"
        }))
      ]);
    }
  };

  // Generate Employee ID
  const generateEmployeeId = () => {
    const dept = newTeacher.department?.substring(0, 3).toUpperCase() || "GEN";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear().toString().slice(-2);
    return `${dept}${year}${randomNum}`;
  };

  // VALIDATE FORM - Enhanced validation
  const validateForm = () => {
    if (!newTeacher.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    
    if (newTeacher.name.length < 3) {
      toast.error("Name must be at least 3 characters");
      return false;
    }
    
    if (authMethod === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newTeacher.email)) {
        toast.error("Valid email is required");
        return false;
      }
      
      if (newTeacher.password !== newTeacher.confirmPassword) {
        toast.error("Passwords don't match!");
        return false;
      }
      
      if (newTeacher.password.length < 8) {
        toast.error("Password must be at least 8 characters!");
        return false;
      }
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newTeacher.password)) {
        toast.error("Password must contain uppercase, lowercase, number, and special character!");
        return false;
      }
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!newTeacher.phone || !phoneRegex.test(newTeacher.phone.replace(/\s/g, ''))) {
      toast.error("Valid phone number is required (10-15 digits)");
      return false;
    }
    
    if (!newTeacher.department.trim()) {
      toast.error("Department is required");
      return false;
    }
    
    if (!newTeacher.subject.trim()) {
      toast.error("Subject is required");
      return false;
    }
    
    if (newTeacher.experience && isNaN(parseInt(newTeacher.experience))) {
      toast.error("Experience must be a number");
      return false;
    }
    
    return true;
  };

  // ADD TEACHER WITH PROPER AUTHENTICATION - FIXED AUTO LOGIN ISSUE
  const handleAddTeacher = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  setLoading(true);
  const adminEmail = currentAdmin?.email;
  const adminPass = localStorage.getItem('admin_temp_password'); 

  try {
    // 1. Naya Teacher Account banayein
    const userCredential = await createUserWithEmailAndPassword(auth, newTeacher.email, newTeacher.password);
    const newUid = userCredential.user.uid;

    // 2. Firestore mein data save karein (setDoc use karein)
    await setDoc(doc(db, "users", newUid), {
      ...newTeacher,
      uid: newUid,
      role: "teacher",
      status: "active",
      createdAt: serverTimestamp()
    });

    // 3. Naye teacher ko logout karein
    await signOut(auth);

    // 4. Admin session restore karein
    if (adminEmail && adminPass) {
      await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      toast.success("Teacher added & Admin session active!");
    } else {
      // Agar password nahi hai toh manual prompt lein
      const manualPass = prompt("Teacher added, but please enter Admin Password to stay on this page:");
      if (manualPass) {
        await signInWithEmailAndPassword(auth, adminEmail, manualPass);
        toast.success("Session Restored");
      } else {
        window.location.reload(); // Refresh to trigger protection redirect
      }
    }
    
    setShowAddModal(false);

  } catch (error) {
    console.error("Critical Error:", error);
    // Error aane par Admin ko wapas login karane ki koshish karein
    if (adminEmail && adminPass) await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    toast.error("Permission Denied: Update Firestore Rules or check Admin Password");
  } finally {
    setLoading(false);
  }
};

  // Handle Firebase errors
  const handleFirebaseError = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        toast.error("Email already registered!");
        break;
      case 'auth/invalid-email':
        toast.error("Invalid email address!");
        break;
      case 'auth/weak-password':
        toast.error("Password must be at least 8 characters with uppercase, lowercase, number, and special character!");
        break;
      case 'permission-denied':
        toast.error(
          <div className="flex items-center gap-2">
            <FiAlertCircle />
            <span>Permission denied. Check Firestore rules.</span>
          </div>
        );
        break;
      case 'auth/operation-not-allowed':
        toast.error("Email/password accounts are not enabled. Enable in Firebase Console.");
        break;
      case 'auth/network-request-failed':
        toast.error("Network error. Please check your internet connection.");
        break;
      default:
        toast.error(`Error: ${error.message}`);
    }
  };

  // Reset new teacher form
  const resetNewTeacherForm = () => {
    setNewTeacher({
      name: "",
      email: "",
      phone: "+91",
      department: "",
      subject: "",
      employeeId: "",
      password: "Teacher@123",
      confirmPassword: "Teacher@123",
      status: "active",
      joiningDate: new Date().toISOString().split('T')[0],
      qualification: "",
      experience: "",
      address: "",
      profileImage: "",
      designation: "",
      specialization: "",
      officeHours: "",
      isVerified: false,
      allowCourseCreation: true
    });
    setAuthMethod("email");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // TOGGLE STATUS
  const toggleStatus = async (teacher) => {
    const newStatus = teacher.status === "active" ? "inactive" : "active";
    const action = newStatus === 'inactive' ? 'disable' : 'enable';
    
    if (window.confirm(`Are you sure you want to ${action} ${teacher.name}?\n\nThis will ${newStatus === 'inactive' ? 'block' : 'allow'} their access to the system.`)) {
      try {
        await updateDoc(doc(db, "users", teacher.id), { 
          status: newStatus,
          updatedAt: serverTimestamp(),
          updatedBy: {
            uid: currentAdmin?.uid,
            name: currentAdmin?.name,
            email: currentAdmin?.email
          }
        });
        
        // Add to audit log
        await addDoc(collection(db, "auditLogs"), {
          action: `teacher_${newStatus}`,
          targetId: teacher.id,
          targetName: teacher.name,
          performedBy: currentAdmin?.uid,
          performedByName: currentAdmin?.name,
          timestamp: serverTimestamp(),
          details: `Changed status to ${newStatus}`
        });
        
        toast.success(
          <div className="flex items-center gap-2">
            {newStatus === 'active' ? '✅' : '⚠️'}
            <span>
              {teacher.name}'s account is now <span className="font-bold">{newStatus}</span>
            </span>
          </div>
        );
      } catch (error) {
        console.error("Status update error:", error);
        toast.error("Failed to update status");
      }
    }
  };

  // EDIT TEACHER
  const handleEditTeacher = async (e) => {
    e.preventDefault();
    
    if (!selectedTeacher) return;
    
    try {
      await updateDoc(doc(db, "users", selectedTeacher.id), {
        ...editTeacher,
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid: currentAdmin?.uid,
          name: currentAdmin?.name,
          email: currentAdmin?.email
        }
      });
      
      // Add to audit log
      await addDoc(collection(db, "auditLogs"), {
        action: "teacher_updated",
        targetId: selectedTeacher.id,
        targetName: selectedTeacher.name,
        performedBy: currentAdmin?.uid,
        performedByName: currentAdmin?.name,
        timestamp: serverTimestamp(),
        details: "Updated teacher profile information"
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <FiCheckCircle className="text-green-500" />
          <span>Teacher updated successfully!</span>
        </div>
      );
      
      setShowEditModal(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to update teacher");
    }
  };

  // DELETE TEACHER - Enhanced with confirmation modal
  const handleDeleteTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!selectedTeacher || !currentAdmin || currentAdmin.role !== 'admin') {
      toast.error("Admin access required");
      return;
    }
    
    try {
      // First archive the teacher data
      const teacherRef = doc(db, "users", selectedTeacher.id);
      const teacherSnap = await getDoc(teacherRef);
      
      if (teacherSnap.exists()) {
        // Archive the teacher data
        await addDoc(collection(db, "archivedTeachers"), {
          ...teacherSnap.data(),
          archivedAt: serverTimestamp(),
          archivedBy: currentAdmin.uid,
          archivedByName: currentAdmin.name,
          originalId: selectedTeacher.id
        });
      }
      
      // Delete from active users
      await deleteDoc(teacherRef);
      
      // Add to audit log
      await addDoc(collection(db, "auditLogs"), {
        action: "teacher_deleted",
        targetId: selectedTeacher.id,
        targetName: selectedTeacher.name,
        performedBy: currentAdmin.uid,
        performedByName: currentAdmin.name,
        timestamp: serverTimestamp(),
        details: "Teacher account deleted and archived"
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <FiTrash2 className="text-red-500" />
          <span>Teacher {selectedTeacher.name} deleted successfully</span>
        </div>
      );
      
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete teacher");
    } finally {
      setShowDeleteConfirm(false);
      setSelectedTeacher(null);
    }
  };

  // SEND LOGIN CREDENTIALS - Enhanced
  const sendCredentials = async (teacher) => {
    const loadingToast = toast.loading("Sending credentials...");
    
    try {
      // Create credentials document
      const credentialsRef = await addDoc(collection(db, "teacherCredentials"), {
        teacherId: teacher.id,
        teacherName: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        sentAt: serverTimestamp(),
        sentBy: currentAdmin?.uid,
        sentByName: currentAdmin?.name,
        status: "sent",
        method: teacher.loginMethod === 'email' ? 'email' : 'sms'
      });
      
      // Update teacher record
      await updateDoc(doc(db, "users", teacher.id), {
        lastCredentialSent: serverTimestamp(),
        credentialsSentBy: {
          uid: currentAdmin?.uid,
          name: currentAdmin?.name,
          email: currentAdmin?.email
        },
        credentialsRef: credentialsRef.id
      });
      
      toast.dismiss(loadingToast);
      toast.success(
        <div className="space-y-1">
          <p className="font-bold">📧 Credentials Sent!</p>
          <p className="text-sm">Login instructions sent to {teacher.email || teacher.phone}</p>
          <p className="text-xs text-gray-500">Reference: {credentialsRef.id.substring(0, 8)}...</p>
        </div>
      );
      
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to send credentials");
    }
  };

  // RESET PASSWORD
  const resetPassword = async (teacher) => {
    if (window.confirm(`Send password reset link to ${teacher.email}?\n\nTeacher will receive email to reset their password.`)) {
      const loadingToast = toast.loading("Sending reset link...");
      
      try {
        // In real app, call backend function or use Firebase Admin SDK
        await updateDoc(doc(db, "users", teacher.id), {
          passwordResetRequested: serverTimestamp(),
          resetRequestedBy: currentAdmin?.name || "Admin",
          resetRequestedByUid: currentAdmin?.uid,
          resetStatus: "pending"
        });
        
        // Add to audit log
        await addDoc(collection(db, "auditLogs"), {
          action: "password_reset_requested",
          targetId: teacher.id,
          targetName: teacher.name,
          performedBy: currentAdmin?.uid,
          performedByName: currentAdmin?.name,
          timestamp: serverTimestamp(),
          details: "Password reset link requested"
        });
        
        toast.dismiss(loadingToast);
        toast.success(
          <div className="flex items-center gap-2">
            <FiKey className="text-amber-500" />
            <div>
              <p className="font-semibold">Password reset link sent!</p>
              <p className="text-sm text-gray-600">Teacher will receive email with reset instructions</p>
            </div>
          </div>
        );
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("Failed to send reset link");
      }
    }
  };

  // VERIFY TEACHER
  const verifyTeacher = async (teacher) => {
    try {
      await updateDoc(doc(db, "users", teacher.id), {
        isVerified: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: currentAdmin?.uid,
        verifiedByName: currentAdmin?.name
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <MdVerified className="text-blue-500" />
          <span>{teacher.name} has been verified!</span>
        </div>
      );
    } catch (error) {
      toast.error("Failed to verify teacher");
    }
  };

  // VIEW TEACHER DETAILS
  const viewTeacherDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailsModal(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacher({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      department: teacher.department || "",
      subject: teacher.subject || "",
      employeeId: teacher.employeeId || "",
      status: teacher.status || "active",
      qualification: teacher.qualification || "",
      experience: teacher.experience || "",
      address: teacher.address || "",
      designation: teacher.designation || "",
      specialization: teacher.specialization || "",
      officeHours: teacher.officeHours || "",
      isVerified: teacher.isVerified || false,
      allowCourseCreation: teacher.allowCourseCreation !== false
    });
    setShowEditModal(true);
  };

  // BULK ACTIONS
  const handleBulkAction = async () => {
    if (!bulkAction || selectedTeachers.length === 0) {
      toast.error("Please select teachers and an action");
      return;
    }
    
    const loadingToast = toast.loading(`Processing ${selectedTeachers.length} teachers...`);
    
    try {
      if (bulkAction === "activate") {
        const promises = selectedTeachers.map(teacherId => {
          const teacherRef = doc(db, "users", teacherId);
          return updateDoc(teacherRef, {
            status: "active",
            updatedAt: serverTimestamp(),
            updatedBy: {
              uid: currentAdmin?.uid,
              name: currentAdmin?.name
            }
          });
        });
        
        await Promise.all(promises);
        toast.dismiss(loadingToast);
        toast.success(`Activated ${selectedTeachers.length} teachers`);
        
      } else if (bulkAction === "deactivate") {
        const promises = selectedTeachers.map(teacherId => {
          const teacherRef = doc(db, "users", teacherId);
          return updateDoc(teacherRef, {
            status: "inactive",
            updatedAt: serverTimestamp(),
            updatedBy: {
              uid: currentAdmin?.uid,
              name: currentAdmin?.name
            }
          });
        });
        
        await Promise.all(promises);
        toast.dismiss(loadingToast);
        toast.success(`Deactivated ${selectedTeachers.length} teachers`);
        
      } else if (bulkAction === "verify") {
        const promises = selectedTeachers.map(teacherId => {
          const teacherRef = doc(db, "users", teacherId);
          return updateDoc(teacherRef, {
            isVerified: true,
            verifiedAt: serverTimestamp(),
            verifiedBy: currentAdmin?.uid
          });
        });
        
        await Promise.all(promises);
        toast.dismiss(loadingToast);
        toast.success(`Verified ${selectedTeachers.length} teachers`);
        
      } else if (bulkAction === "export") {
        exportTeachersToPDF(selectedTeachers);
        toast.dismiss(loadingToast);
      }
      
      setSelectedTeachers([]);
      setBulkAction("");
      setIsSelectAll(false);
      
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Bulk action failed: ${error.message}`);
    }
  };

  // EXPORT TO PDF - Enhanced
  const exportTeachersToPDF = (teacherIds = []) => {
    const teachersToExport = teacherIds.length > 0 
      ? teachers.filter(t => teacherIds.includes(t.id))
      : filteredTeachers;
    
    if (teachersToExport.length === 0) {
      toast.error("No teachers to export");
      return;
    }
    
    const doc = new jsPDF('landscape');
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text("FACULTY MANAGEMENT REPORT", 105, 20, null, null, 'center');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 105, 28, null, null, 'center');
    
    doc.text(`Generated by: ${currentAdmin?.name || 'Admin'}`, 105, 33, null, null, 'center');
    
    // Summary stats
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total Teachers: ${teachersToExport.length} | Active: ${teachersToExport.filter(t => t.status === 'active').length} | Inactive: ${teachersToExport.filter(t => t.status === 'inactive').length}`, 14, 45);
    
    // Table data
    const tableData = teachersToExport.map((teacher, index) => [
      index + 1,
      teacher.name,
      teacher.employeeId,
      teacher.department,
      teacher.subject,
      teacher.designation || '-',
      teacher.email,
      teacher.phone,
      teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1),
      teacher.isVerified ? 'Yes' : 'No',
      teacher.createdAt?.toLocaleDateString() || 'N/A'
    ]);
    
    // AutoTable
    doc.autoTable({
      head: [['#', 'Name', 'ID', 'Department', 'Subject', 'Designation', 'Email', 'Phone', 'Status', 'Verified', 'Joined']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 40 },
        7: { cellWidth: 25 },
        8: { cellWidth: 15 },
        9: { cellWidth: 15 },
        10: { cellWidth: 20 }
      }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Confidential - Faculty Management System`, 14, finalY + 10);
    doc.text(`Page 1 of 1`, 280, finalY + 10, null, null, 'right');
    
    // Save PDF
    const filename = `teachers-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    toast.success(`Exported ${teachersToExport.length} teachers to PDF`);
  };

  // EXPORT TO EXCEL - New feature
  const exportTeachersToExcel = () => {
    const teachersToExport = filteredTeachers;
    
    if (teachersToExport.length === 0) {
      toast.error("No teachers to export");
      return;
    }
    
    const data = teachersToExport.map(teacher => ({
      'Name': teacher.name,
      'Employee ID': teacher.employeeId,
      'Department': teacher.department,
      'Subject': teacher.subject,
      'Designation': teacher.designation || '',
      'Qualification': teacher.qualification || '',
      'Experience': teacher.experience || '',
      'Email': teacher.email,
      'Phone': teacher.phone,
      'Status': teacher.status,
      'Verified': teacher.isVerified ? 'Yes' : 'No',
      'Joining Date': teacher.createdAt?.toLocaleDateString() || '',
      'Login Method': teacher.loginMethod || 'email',
      'Address': teacher.address || '',
      'Office Hours': teacher.officeHours || '',
      'Course Creation': teacher.allowCourseCreation ? 'Allowed' : 'Not Allowed'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    
    // Auto-size columns
    const maxWidth = data.reduce((w, r) => Math.max(w, r.Name.length), 10);
    worksheet['!cols'] = [{ wch: maxWidth }];
    
    XLSX.writeFile(workbook, `teachers-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(`Exported ${teachersToExport.length} teachers to Excel`);
  };

  // BULK UPLOAD HANDLER
  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      toast.error("Please select a file to upload");
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (let i = 0; i < jsonData.length; i++) {
            try {
              const row = jsonData[i];
              const empId = generateEmployeeId();
              
              const teacherData = {
                name: row.Name?.trim() || '',
                email: row.Email?.trim() || '',
                phone: row.Phone?.trim() || '',
                department: row.Department?.trim() || '',
                subject: row.Subject?.trim() || '',
                employeeId: empId,
                role: "teacher",
                status: "active",
                loginMethod: "email",
                createdAt: serverTimestamp(),
                createdBy: {
                  uid: currentAdmin.uid,
                  name: currentAdmin.name,
                  email: currentAdmin.email
                },
                joiningDate: new Date().toISOString().split('T')[0],
                qualification: row.Qualification?.trim() || '',
                experience: row.Experience?.trim() || '',
                address: row.Address?.trim() || '',
                designation: row.Designation?.trim() || '',
                isVerified: false,
                allowCourseCreation: true,
                lastLogin: null,
                totalLogins: 0,
                lastActivity: null
              };
              
              await addDoc(collection(db, "users"), teacherData);
              successCount++;
              
              // Update progress
              setUploadProgress(Math.round((i + 1) / jsonData.length * 100));
              
            } catch (rowError) {
              console.error(`Error processing row ${i}:`, rowError);
              errorCount++;
            }
          }
          
          setLoading(false);
          setShowBulkUploadModal(false);
          setBulkUploadFile(null);
          
          toast.success(
            <div className="space-y-2">
              <p className="font-bold text-lg">✅ Bulk Upload Complete!</p>
              <p>Successfully added: {successCount} teachers</p>
              {errorCount > 0 && (
                <p className="text-red-600">Failed: {errorCount} teachers</p>
              )}
            </div>,
            { duration: 6000 }
          );
          
        } catch (parseError) {
          setLoading(false);
          toast.error("Failed to parse file. Please check the format.");
        }
      };
      
      reader.readAsArrayBuffer(bulkUploadFile);
      
    } catch (error) {
      setLoading(false);
      toast.error("Failed to process file upload");
    }
  };

  // FILTER AND SORT TEACHERS
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || t.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "name":
        comparison = a.name?.localeCompare(b.name);
        break;
      case "department":
        comparison = a.department?.localeCompare(b.department);
        break;
      case "date":
        comparison = new Date(b.createdAt) - new Date(a.createdAt);
        break;
      case "status":
        comparison = a.status?.localeCompare(b.status);
        break;
      case "verified":
        comparison = (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  // TOGGLE SELECT TEACHER
  const toggleSelectTeacher = (teacherId) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  // SELECT ALL TEACHERS
  const selectAllTeachers = () => {
    if (selectedTeachers.length === filteredTeachers.length) {
      setSelectedTeachers([]);
      setIsSelectAll(false);
    } else {
      setSelectedTeachers(filteredTeachers.map(t => t.id));
      setIsSelectAll(true);
    }
  };

  // COPY TO CLIPBOARD
  const copyToClipboard = (text, label = "text") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // GENERATE PASSWORD
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewTeacher(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }));
    toast.success("Generated secure password!");
  };

  // TOGGLE ACTION MENU
  const toggleActionMenu = (teacherId) => {
    setActionMenuOpen(actionMenuOpen === teacherId ? null : teacherId);
  };

  // CLOSE ALL MODALS
  const closeAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowBulkUploadModal(false);
    setShowDeleteConfirm(false);
    resetNewTeacherForm();
  };

  // DOWNLOAD SAMPLE TEMPLATE
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        Name: "John Doe",
        Email: "john.doe@example.com",
        Phone: "+919876543210",
        Department: "Computer Science",
        Subject: "Data Structures",
        Designation: "Assistant Professor",
        Qualification: "PhD in Computer Science",
        Experience: "5 years",
        Address: "123 Main St, City, State",
        "Office Hours": "10 AM - 12 PM, Mon-Fri"
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
    XLSX.writeFile(workbook, "teacher-upload-template.xlsx");
    
    toast.success("Downloaded sample template");
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <MdSchool className="text-2xl text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">FACULTY MANAGEMENT</h1>
              <p className="text-slate-600 font-medium">Manage and authorize teaching faculty</p>
            </div>
          </div>
          
          {currentAdmin && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <RiShieldUserLine className="text-blue-500" />
              <span className="font-semibold text-blue-700">Logged in as:</span>
              <span className="text-slate-700">{currentAdmin.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {currentAdmin.role.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportTeachersToExcel}
            className="px-5 py-3 bg-white text-slate-700 rounded-2xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm border border-slate-200"
          >
            <FiDownload /> Export Excel
          </button>
          
          <button 
            onClick={() => exportTeachersToPDF()}
            className="px-5 py-3 bg-white text-slate-700 rounded-2xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm border border-slate-200"
          >
            <FiPrinter /> Export PDF
          </button>
          
          <button 
            onClick={() => setShowBulkUploadModal(true)}
            className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
          >
            <FiUpload /> Bulk Upload
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl font-black flex items-center gap-2 hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
            disabled={!currentAdmin || currentAdmin.role !== 'admin'}
            title={!currentAdmin ? "Loading..." : currentAdmin.role !== 'admin' ? "Admin access required" : ""}
          >
            <FiPlus size={20}/> ADD NEW TEACHER
          </button>
        </div>
      </div>

      {/* Statistics Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 font-semibold text-sm">TOTAL TEACHERS</p>
            <div className="p-2 bg-blue-50 rounded-xl">
              <FiUser className="text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 font-semibold text-sm">ACTIVE</p>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <FiCheckCircle className="text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">{stats.active}</p>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" 
                 style={{ width: `${stats.total ? (stats.active / stats.total * 100) : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 font-semibold text-sm">INACTIVE</p>
            <div className="p-2 bg-red-50 rounded-xl">
              <FiLock className="text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-red-600">{stats.inactive}</p>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" 
                 style={{ width: `${stats.total ? (stats.inactive / stats.total * 100) : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 font-semibold text-sm">VERIFIED</p>
            <div className="p-2 bg-sky-50 rounded-xl">
              <MdVerified className="text-sky-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-sky-600">{stats.verified}</p>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full" 
                 style={{ width: `${stats.total ? (stats.verified / stats.total * 100) : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 font-semibold text-sm">EMAIL LOGIN</p>
            <div className="p-2 bg-violet-50 rounded-xl">
              <MdEmail className="text-violet-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-violet-600">{stats.emailLogin}</p>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full" 
                 style={{ width: `${stats.total ? (stats.emailLogin / stats.total * 100) : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 font-semibold text-sm">PHONE LOGIN</p>
            <div className="p-2 bg-amber-50 rounded-xl">
              <MdPhoneAndroid className="text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600">{stats.phoneLogin}</p>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" 
                 style={{ width: `${stats.total ? (stats.phoneLogin / stats.total * 100) : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-500 font-semibold text-sm">NEW THIS MONTH</p>
            <div className="p-2 bg-green-50 rounded-xl">
              <FiUserPlus className="text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-green-600">+{stats.newThisMonth}</p>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" 
                 style={{ width: `${Math.min(stats.newThisMonth * 20, 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Control Panel - Enhanced */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search teachers by name, email, ID, department, subject..."
                className="w-full pl-14 pr-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 font-medium placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              List
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select 
                className="pl-12 pr-10 py-3 bg-slate-50 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            
            {/* Department Filter */}
            <div className="relative">
              <select 
                className="pl-12 pr-10 py-3 bg-slate-50 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <FiDatabase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            
          {/* Sort By */}
<div className="relative">
  <select 
    className="pl-12 pr-10 py-3 bg-slate-50 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
  >
    <option value="name">Sort by Name</option>
    <option value="department">Sort by Department</option>
    <option value="date">Sort by Date</option>
    <option value="status">Sort by Status</option>
    <option value="verified">Sort by Verified</option>
  </select>
  <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /> {/* Changed from FiSort to FiFilter */}
</div>
            
            {/* Sort Order */}
            <button 
              className="px-4 py-3 bg-slate-50 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center gap-2"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
            
            {/* Refresh */}
            <button 
              className="px-4 py-3 bg-slate-50 rounded-xl font-medium hover:bg-slate-100 transition-colors"
              onClick={() => window.location.reload()}
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
          
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Show:</span>
            <select 
              className="px-3 py-2 bg-slate-50 rounded-lg font-medium"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedTeachers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  checked={isSelectAll}
                  onChange={selectAllTeachers}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-bold text-blue-700">
                  {selectedTeachers.length} teacher(s) selected
                </span>
                <button 
                  onClick={() => {
                    setSelectedTeachers([]);
                    setIsSelectAll(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  className="px-4 py-2 bg-white rounded-lg font-medium border border-slate-300"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Bulk Actions</option>
                  <option value="activate">Activate Selected</option>
                  <option value="deactivate">Deactivate Selected</option>
                  <option value="verify">Verify Selected</option>
                  <option value="export">Export Selected</option>
                </select>
                
                <button 
                  onClick={handleBulkAction}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Teachers Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedTeachers.map((teacher) => (
            <motion.div 
              layout
              key={teacher.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden"
            >
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input 
                  type="checkbox"
                  checked={selectedTeachers.includes(teacher.id)}
                  onChange={() => toggleSelectTeacher(teacher.id)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity checked:opacity-100"
                />
              </div>
              
              {/* Status Indicator */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full transition-colors ${teacher.status === 'active' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}></div>
              
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-xl font-black text-emerald-700">
                        {teacher.name?.charAt(0) || 'T'}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${teacher.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      {teacher.isVerified && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center">
                          <MdVerified className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{teacher.name}</h3>
                      <p className="text-sm font-semibold text-emerald-600">{teacher.employeeId}</p>
                      {teacher.designation && (
                        <p className="text-xs text-slate-500 mt-1">{teacher.designation}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => toggleActionMenu(teacher.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <BsThreeDotsVertical />
                    </button>
                    
                    {actionMenuOpen === teacher.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                        <button 
                          onClick={() => {
                            viewTeacherDetails(teacher);
                            setActionMenuOpen(null);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <FiEye /> View Details
                        </button>
                        <button 
                          onClick={() => {
                            openEditModal(teacher);
                            setActionMenuOpen(null);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <FiEdit /> Edit
                        </button>
                        {teacher.loginMethod === 'email' && (
                          <button 
                            onClick={() => {
                              resetPassword(teacher);
                              setActionMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <FiKey /> Reset Password
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            sendCredentials(teacher);
                            setActionMenuOpen(null);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <FiSend /> Send Credentials
                        </button>
                        {!teacher.isVerified && (
                          <button 
                            onClick={() => {
                              verifyTeacher(teacher);
                              setActionMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                          >
                            <MdVerified /> Verify Account
                          </button>
                        )}
                        <div className="border-t border-slate-200">
                          <button 
                            onClick={() => {
                              handleDeleteTeacher(teacher);
                              setActionMenuOpen(null);
                            }}
                            className="w-full text-left px-4 py-2 text-red-700 hover:bg-red-50 flex items-center gap-2"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Department & Subject */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-slate-700 mb-1">{teacher.department}</p>
                  <p className="text-xs text-slate-500">{teacher.subject}</p>
                  {teacher.specialization && (
                    <p className="text-xs text-slate-400 mt-1">Specialization: {teacher.specialization}</p>
                  )}
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="px-6 py-4 border-t border-slate-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MdEmail className="text-sky-500 flex-shrink-0" />
                    <span className="text-slate-600 truncate">{teacher.email}</span>
                    <button 
                      onClick={() => copyToClipboard(teacher.email, "Email")}
                      className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy email"
                    >
                      <FiCopy size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <FiPhone className="text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-600">{teacher.phone}</span>
                    <button 
                      onClick={() => copyToClipboard(teacher.phone, "Phone")}
                      className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy phone"
                    >
                      <FiCopy size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${teacher.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {teacher.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    
                    <span className="text-xs text-slate-400">
                      {teacher.loginMethod === 'email' ? '📧' : '📱'}
                    </span>
                    
                    {teacher.isVerified && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Created Date */}
                {teacher.createdAt && (
                  <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                    <FiCalendar size={12} />
                    Joined {teacher.createdAt.toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-left">
                  <input 
                    type="checkbox"
                    checked={isSelectAll}
                    onChange={selectAllTeachers}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-4 px-6 text-left text-slate-700 font-semibold">Teacher</th>
                <th className="py-4 px-6 text-left text-slate-700 font-semibold">Department</th>
                <th className="py-4 px-6 text-left text-slate-700 font-semibold">Contact</th>
                <th className="py-4 px-6 text-left text-slate-700 font-semibold">Status</th>
                <th className="py-4 px-6 text-left text-slate-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <input 
                      type="checkbox"
                      checked={selectedTeachers.includes(teacher.id)}
                      onChange={() => toggleSelectTeacher(teacher.id)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center font-bold text-emerald-700">
                        {teacher.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{teacher.name}</p>
                        <p className="text-sm text-slate-500">{teacher.employeeId}</p>
                        <p className="text-xs text-slate-400">{teacher.subject}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-slate-900">{teacher.department}</p>
                    {teacher.designation && (
                      <p className="text-sm text-slate-500">{teacher.designation}</p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-slate-900">{teacher.email}</p>
                    <p className="text-sm text-slate-500">{teacher.phone}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${teacher.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {teacher.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      {teacher.isVerified && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full w-fit">
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => viewTeacherDetails(teacher)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button 
                        onClick={() => openEditModal(teacher)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => toggleStatus(teacher)}
                        className={`p-2 rounded-lg transition-all ${teacher.status === 'active' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                        title={teacher.status === 'active' ? 'Disable' : 'Enable'}
                      >
                        {teacher.status === 'active' ? <FiLock /> : <FiUnlock />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredTeachers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <FiUser className="text-4xl text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No teachers found</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Add your first teacher to get started'}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <FiPlus /> Add Teacher
            </button>
            <button 
              onClick={() => setShowBulkUploadModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiUpload /> Bulk Upload
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredTeachers.length > 0 && (
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTeachers.length)} of {filteredTeachers.length} teachers
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    page === pageNum
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white z-10 border-b border-slate-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">REGISTER NEW TEACHER</h2>
                      <p className="text-slate-500 font-medium">Create account with login credentials</p>
                    </div>
                    <button 
                      onClick={closeAllModals}
                      className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <FiX size={24} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Authentication Method Selection */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">LOGIN METHOD</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAuthMethod("email")}
                      className={`p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${authMethod === "email" ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className={`p-3 rounded-lg ${authMethod === "email" ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <MdEmail size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">Email & Password</p>
                        <p className="text-sm text-slate-500">Teacher logs in with email and password</p>
                      </div>
                      {authMethod === "email" && (
                        <div className="ml-auto">
                          <FiCheckCircle className="text-emerald-500" />
                        </div>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAuthMethod("phone")}
                      className={`p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${authMethod === "phone" ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className={`p-3 rounded-lg ${authMethod === "phone" ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        <MdPhoneAndroid size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">Phone OTP</p>
                        <p className="text-sm text-slate-500">Teacher logs in with OTP on phone</p>
                      </div>
                      {authMethod === "phone" && (
                        <div className="ml-auto">
                          <FiCheckCircle className="text-blue-500" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddTeacher} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="Dr. Sanjay Kumar"
                        value={newTeacher.name}
                        onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Employee ID</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                          placeholder="Auto-generated"
                          value={newTeacher.employeeId}
                          onChange={(e) => setNewTeacher({...newTeacher, employeeId: e.target.value})} 
                        />
                        <button 
                          type="button"
                          onClick={() => setNewTeacher({...newTeacher, employeeId: generateEmployeeId()})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600 font-semibold hover:text-emerald-700"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email Address {authMethod === "email" ? "*" : ""}</label>
                      <input 
                        required={authMethod === "email"}
                        type="email" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="teacher@institute.edu"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number *</label>
                      <input 
                        required 
                        type="tel" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="+91 9876543210"
                        value={newTeacher.phone}
                        onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Department *</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="Computer Science"
                        value={newTeacher.department}
                        onChange={(e) => {
                          setNewTeacher({...newTeacher, department: e.target.value});
                          // Auto-generate ID based on department
                          if (!newTeacher.employeeId && e.target.value.length >= 3) {
                            setTimeout(() => {
                              setNewTeacher(prev => ({
                                ...prev,
                                employeeId: generateEmployeeId()
                              }));
                            }, 100);
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Subject *</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="Web Development"
                        value={newTeacher.subject}
                        onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Designation</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="Assistant Professor"
                        value={newTeacher.designation}
                        onChange={(e) => setNewTeacher({...newTeacher, designation: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Specialization</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="Artificial Intelligence"
                        value={newTeacher.specialization}
                        onChange={(e) => setNewTeacher({...newTeacher, specialization: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Joining Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={newTeacher.joiningDate}
                        onChange={(e) => setNewTeacher({...newTeacher, joiningDate: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Qualification</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="M.Tech, PhD"
                        value={newTeacher.qualification}
                        onChange={(e) => setNewTeacher({...newTeacher, qualification: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Experience (years)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="5"
                        value={newTeacher.experience}
                        onChange={(e) => setNewTeacher({...newTeacher, experience: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Office Hours</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="10 AM - 12 PM, Mon-Fri"
                        value={newTeacher.officeHours}
                        onChange={(e) => setNewTeacher({...newTeacher, officeHours: e.target.value})} 
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                      <textarea 
                        rows="2"
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500 resize-none" 
                        placeholder="Full address"
                        value={newTeacher.address}
                        onChange={(e) => setNewTeacher({...newTeacher, address: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Password Fields for Email Auth */}
                  {authMethod === "email" && (
                    <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                      <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-4">LOGIN CREDENTIALS</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Set Password *</label>
                          <div className="relative">
                            <input 
                              required 
                              type={showPassword ? "text" : "password"} 
                              className="w-full bg-white p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500 pr-12" 
                              placeholder="Minimum 8 characters"
                              value={newTeacher.password}
                              onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} 
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                              <button 
                                type="button"
                                onClick={generatePassword}
                                className="p-2 text-emerald-600 hover:text-emerald-700"
                                title="Generate password"
                              >
                                <FiKey />
                              </button>
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-2 text-slate-400 hover:text-slate-700"
                              >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Must contain uppercase, lowercase, number, and special character
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password *</label>
                          <div className="relative">
                            <input 
                              required 
                              type={showConfirmPassword ? "text" : "password"} 
                              className="w-full bg-white p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500 pr-12" 
                              placeholder="Re-enter password"
                              value={newTeacher.confirmPassword}
                              onChange={(e) => setNewTeacher({...newTeacher, confirmPassword: e.target.value})} 
                            />
                            <button 
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            >
                              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-3 text-sm text-emerald-700">
                            <FiCheckCircle className="text-emerald-600" />
                            <span>Default password is: <code className="font-mono bg-emerald-100 px-2 py-1 rounded">Teacher@123</code></span>
                            <button 
                              type="button"
                              onClick={() => {
                                setNewTeacher(prev => ({
                                  ...prev,
                                  password: "Teacher@123",
                                  confirmPassword: "Teacher@123"
                                }));
                                toast.success("Reset to default password");
                              }}
                              className="text-xs text-emerald-600 hover:text-emerald-800"
                            >
                              Reset to default
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone Auth Info */}
                  {authMethod === "phone" && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <MdPhoneAndroid className="text-blue-600 text-xl" />
                        <div>
                          <p className="font-bold text-blue-800">Phone OTP Login Setup</p>
                          <p className="text-sm text-blue-600">
                            Teacher will receive OTP on <strong>{newTeacher.phone || "their phone"}</strong> for login. 
                            No password required. Make sure phone number is correct.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Settings */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">ADDITIONAL SETTINGS</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="isVerified"
                          checked={newTeacher.isVerified}
                          onChange={(e) => setNewTeacher({...newTeacher, isVerified: e.target.checked})}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="isVerified" className="text-slate-700 font-medium">
                          Mark as verified teacher
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="allowCourseCreation"
                          checked={newTeacher.allowCourseCreation}
                          onChange={(e) => setNewTeacher({...newTeacher, allowCourseCreation: e.target.checked})}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="allowCourseCreation" className="text-slate-700 font-medium">
                          Allow course creation
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={closeAllModals}
                      className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button 
                      type="submit"
                      disabled={loading || isAddingTeacher}
                      className={`flex-1 px-8 py-4 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${authMethod === "email" ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'}`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          CREATING ACCOUNT...
                        </div>
                      ) : (
                        `REGISTER TEACHER ${authMethod === 'phone' ? '(OTP LOGIN)' : ''}`
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Teacher Modal */}
      <AnimatePresence>
        {showEditModal && selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">EDIT TEACHER</h2>
                    <p className="text-slate-500 font-medium">Update teacher information</p>
                  </div>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <form onSubmit={handleEditTeacher} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.name}
                        onChange={(e) => setEditTeacher({...editTeacher, name: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.email}
                        onChange={(e) => setEditTeacher({...editTeacher, email: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                      <input 
                        type="tel" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.phone}
                        onChange={(e) => setEditTeacher({...editTeacher, phone: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                      <select 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500"
                        value={editTeacher.status}
                        onChange={(e) => setEditTeacher({...editTeacher, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.department}
                        onChange={(e) => setEditTeacher({...editTeacher, department: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.subject}
                        onChange={(e) => setEditTeacher({...editTeacher, subject: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Designation</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.designation}
                        onChange={(e) => setEditTeacher({...editTeacher, designation: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Specialization</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.specialization}
                        onChange={(e) => setEditTeacher({...editTeacher, specialization: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Qualification</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.qualification}
                        onChange={(e) => setEditTeacher({...editTeacher, qualification: e.target.value})} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Experience</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500" 
                        value={editTeacher.experience}
                        onChange={(e) => setEditTeacher({...editTeacher, experience: e.target.value})} 
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                      <textarea 
                        rows="2"
                        className="w-full bg-slate-50 p-4 rounded-xl font-medium border-none focus:ring-2 focus:ring-emerald-500 resize-none" 
                        value={editTeacher.address}
                        onChange={(e) => setEditTeacher({...editTeacher, address: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">ACCOUNT SETTINGS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="editIsVerified"
                          checked={editTeacher.isVerified}
                          onChange={(e) => setEditTeacher({...editTeacher, isVerified: e.target.checked})}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="editIsVerified" className="text-slate-700 font-medium">
                          Verified Account
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="editAllowCourseCreation"
                          checked={editTeacher.allowCourseCreation}
                          onChange={(e) => setEditTeacher({...editTeacher, allowCourseCreation: e.target.checked})}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="editAllowCourseCreation" className="text-slate-700 font-medium">
                          Allow Course Creation
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button 
                      type="submit"
                      className="flex-1 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                    >
                      UPDATE TEACHER
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teacher Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <FiX size={24} />
                </button>

                {/* Teacher Profile Header */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-3xl font-black text-emerald-700">
                    {selectedTeacher.name?.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-slate-900">{selectedTeacher.name}</h2>
                      {selectedTeacher.isVerified && (
                        <MdVerified className="text-blue-500 text-xl" />
                      )}
                    </div>
                    <p className="text-emerald-600 font-bold">{selectedTeacher.employeeId}</p>
                    <p className="text-slate-500">{selectedTeacher.designation || "Teacher"}</p>
                    <p className="text-slate-500 text-sm">{selectedTeacher.department} • {selectedTeacher.subject}</p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedTeacher.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedTeacher.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                        {selectedTeacher.loginMethod === 'email' ? 'Email Login' : 'Phone OTP'}
                      </span>
                      {selectedTeacher.allowCourseCreation && (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          Can Create Courses
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Teacher Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</label>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-700 font-medium">{selectedTeacher.email}</p>
                        <button 
                          onClick={() => copyToClipboard(selectedTeacher.email, "Email")}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</label>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-700 font-medium">{selectedTeacher.phone}</p>
                        <button 
                          onClick={() => copyToClipboard(selectedTeacher.phone, "Phone")}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Qualification</label>
                      <p className="text-slate-700 font-medium">{selectedTeacher.qualification || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Experience</label>
                      <p className="text-slate-700 font-medium">{selectedTeacher.experience || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Specialization</label>
                      <p className="text-slate-700 font-medium">{selectedTeacher.specialization || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Joining Date</label>
                      <p className="text-slate-700 font-medium">
                        {selectedTeacher.createdAt ? selectedTeacher.createdAt.toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Address</label>
                      <p className="text-slate-700 font-medium">{selectedTeacher.address || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Office Hours</label>
                      <p className="text-slate-700 font-medium">{selectedTeacher.officeHours || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Last Login</label>
                      <p className="text-slate-700 font-medium">
                        {selectedTeacher.lastLogin ? new Date(selectedTeacher.lastLogin.toDate()).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Created By</label>
                      <p className="text-slate-700 font-medium">
                        {selectedTeacher.createdBy?.name || 'System'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4 flex-wrap">
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      openEditModal(selectedTeacher);
                    }}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <FiEdit /> Edit Profile
                  </button>
                  
                  <button 
                    onClick={() => {
                      sendCredentials(selectedTeacher);
                      setShowDetailsModal(false);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiSend /> Send Credentials
                  </button>
                  
                  {selectedTeacher.loginMethod === 'email' && (
                    <button 
                      onClick={() => {
                        resetPassword(selectedTeacher);
                        setShowDetailsModal(false);
                      }}
                      className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center gap-2"
                    >
                      <FiKey /> Reset Password
                    </button>
                  )}
                  
                  <button 
                    onClick={() => toggleStatus(selectedTeacher)}
                    className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${
                      selectedTeacher.status === 'active' 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedTeacher.status === 'active' ? <FiLock /> : <FiUnlock />}
                    {selectedTeacher.status === 'active' ? 'Disable Account' : 'Enable Account'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">BULK UPLOAD TEACHERS</h2>
                    <p className="text-slate-500 font-medium">Upload Excel/CSV file with teacher data</p>
                  </div>
                  <button 
                    onClick={() => setShowBulkUploadModal(false)}
                    className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* File Upload */}
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      bulkUploadFile 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file && (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                        setBulkUploadFile(file);
                      } else {
                        toast.error("Please upload Excel or CSV file only");
                      }
                    }}
                  >
                    <FiUpload className="text-4xl text-slate-400 mx-auto mb-4" />
                    
                    {bulkUploadFile ? (
                      <div>
                        <p className="font-semibold text-slate-900 mb-1">{bulkUploadFile.name}</p>
                        <p className="text-sm text-slate-500">
                          {(bulkUploadFile.size / 1024).toFixed(2)} KB
                        </p>
                        <button 
                          onClick={() => setBulkUploadFile(null)}
                          className="mt-3 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-900 mb-1">Drag & drop file here</p>
                        <p className="text-sm text-slate-500 mb-4">or click to browse</p>
                        <input 
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setBulkUploadFile(file);
                            }
                          }}
                          className="hidden"
                          id="bulkUploadInput"
                        />
                        <label 
                          htmlFor="bulkUploadInput"
                          className="inline-block px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 cursor-pointer transition-colors"
                        >
                          Browse Files
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {uploadProgress > 0 && (
                    <div>
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Template Download */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <FiDownload className="text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-800">Download Template</p>
                        <p className="text-sm text-blue-600">
                          Use our template to ensure correct format
                        </p>
                      </div>
                      <button 
                        onClick={downloadSampleTemplate}
                        className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Required Fields Info */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="font-semibold text-amber-800 mb-2">Required Fields:</p>
                    <ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">
                      <li>Name (Required)</li>
                      <li>Email (Required for email login)</li>
                      <li>Phone (Required)</li>
                      <li>Department (Required)</li>
                      <li>Subject (Required)</li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      onClick={() => setShowBulkUploadModal(false)}
                      className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button 
                      onClick={handleBulkUpload}
                      disabled={!bulkUploadFile || loading}
                      className="flex-1 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          UPLOADING...
                        </div>
                      ) : (
                        'UPLOAD TEACHERS'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <FiTrash2 className="text-3xl text-red-600" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Teacher?</h3>
                <p className="text-slate-600 mb-6">
                  Are you sure you want to delete <strong>{selectedTeacher.name}</strong>?
                </p>
                
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                  <p className="text-sm text-red-700 font-semibold">⚠️ This action cannot be undone!</p>
                  <p className="text-xs text-red-600 mt-1">
                    Teacher data will be archived but removed from active users.
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    onClick={confirmDeleteTeacher}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    Delete Teacher
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

export default Teachers;