import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiMail, FiLock, FiSmartphone, FiArrowLeft, FiUser, FiShield,
  FiBookOpen, FiEye, FiEyeOff, FiCheckCircle, FiXCircle, FiRefreshCw,
  FiKey, FiLogIn, FiClock, FiHelpCircle, FiAlertCircle, FiGlobe,
  FiMessageSquare, FiSend, FiHome, FiUsers, FiTrendingUp,
  FiGithub, FiUserPlus, FiEdit2, FiCalendar,
  FiMapPin, FiBriefcase, FiBook, FiCreditCard,
  FiHash, FiUserCheck, FiStar, FiAward, FiExternalLink,
  FiShuffle
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import toast, { Toaster } from "react-hot-toast";

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null); 
  const [step, setStep] = useState("selection");
  const [authMethod, setAuthMethod] = useState("phone");
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  // Registration form states
  const [fullName, setFullName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [interests, setInterests] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // OTP states
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [loginMode, setLoginMode] = useState("login");
  const [socialUserData, setSocialUserData] = useState(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const navigate = useNavigate();

  const roles = [
    { 
      id: "student", 
      title: "Student Dashboard", 
      tagline: "Your Learning Journey",
      description: "Access all courses, submit assignments, join live classes, track grades, download study materials, and interact with peers",
      icon: <FiUser className="text-blue-500" size={54} />,
      color: "from-blue-500 to-cyan-400",
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-400",
      bgColor: "bg-gradient-to-br from-blue-50 via-blue-100/50 to-cyan-50",
      borderColor: "border-blue-200",
      shadowColor: "shadow-blue-200/30",
      glowColor: "from-blue-400/20 to-cyan-400/20",
      stats: {
        total: "15,842",
        active: "94%",
        growth: "+12%"
      },
      features: [
        { icon: "📚", text: "200+ Courses" },
        { icon: "🎓", text: "Live Classes" },
        { icon: "📝", text: "Assignments" },
        { icon: "📊", text: "Grade Reports" },
        { icon: "💬", text: "Discussion Forums" },
        { icon: "📱", text: "Mobile App" }
      ],
      authMethods: [
        { 
          id: "phone", 
          label: "Phone OTP", 
          icon: <FiSmartphone className="text-blue-500" />,
          desc: "Quick login via mobile",
          color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        },
        { 
          id: "email", 
          label: "Email Login", 
          icon: <FiMail className="text-indigo-500" />,
          desc: "Email & password access",
          color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
        },
        { 
          id: "google", 
          label: "Google", 
          icon: <FcGoogle className="text-gray-800" />,
          desc: "Login with Google",
          color: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
        },
        { 
          id: "github", 
          label: "GitHub", 
          icon: <FiGithub className="text-gray-800" />,
          desc: "Login with GitHub",
          color: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
        }
      ],
      quickInfo: "Start learning today",
      badge: {
        text: "Most Active",
        color: "bg-blue-500"
      }
    },
    { 
      id: "teacher", 
      title: "Faculty Portal", 
      tagline: "Empower Tomorrow's Leaders",
      description: "Manage classes, create and grade assignments, track student progress, schedule live sessions, and access teaching resources",
      icon: <FiBookOpen className="text-emerald-500" size={54} />,
      color: "from-emerald-500 to-green-400",
      gradient: "bg-gradient-to-br from-emerald-500 to-green-400",
      bgColor: "bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-green-50",
      borderColor: "border-emerald-200",
      shadowColor: "shadow-emerald-200/30",
      glowColor: "from-emerald-400/20 to-teal-400/20",
      stats: {
        total: "487",
        active: "96%",
        growth: "+8%"
      },
      features: [
        { icon: "🏫", text: "Class Management" },
        { icon: "📋", text: "Create Content" },
        { icon: "✏️", text: "Grade Submissions" },
        { icon: "📈", text: "Analytics Dashboard" },
        { icon: "👥", text: "Student Tracking" },
        { icon: "🎤", text: "Live Teaching" }
      ],
      authMethods: [
        { 
          id: "phone", 
          label: "Phone OTP", 
          icon: <FiSmartphone className="text-emerald-500" />,
          desc: "Secure OTP verification",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
        },
        { 
          id: "email", 
          label: "Email Login", 
          icon: <FiMail className="text-green-500" />,
          desc: "Email & password access",
          color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        }
      ],
      quickInfo: "Admin approval required",
      badge: {
        text: "Verified Faculty",
        color: "bg-emerald-500"
      },
      warning: "Requires admin verification"
    },
    { 
      id: "admin", 
      title: "Admin Console", 
      tagline: "Full System Control",
      description: "Complete system administration, user management, financial reports, security controls, audit logs, and platform configuration",
      icon: <FiShield className="text-slate-700" size={54} />,
      color: "from-slate-800 to-gray-700",
      gradient: "bg-gradient-to-br from-slate-800 to-gray-700",
      bgColor: "bg-gradient-to-br from-slate-50 via-gray-100/50 to-slate-100",
      borderColor: "border-slate-300",
      shadowColor: "shadow-slate-300/20",
      glowColor: "from-slate-600/20 to-gray-600/20",
      stats: {
        total: "42",
        active: "100%",
        growth: "Secure"
      },
      features: [
        { icon: "⚙️", text: "System Settings" },
        { icon: "👤", text: "User Management" },
        { icon: "💰", text: "Financial Reports" },
        { icon: "🔒", text: "Security Controls" },
        { icon: "📋", text: "Audit Logs" },
        { icon: "📊", text: "Analytics" }
      ],
      authMethods: [
        { 
          id: "password", 
          label: "Email & Password", 
          icon: <FiKey className="text-slate-700" />,
          desc: "Advanced security",
          color: "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
        }
      ],
      quickInfo: "Restricted access only",
      badge: {
        text: "Admin Only",
        color: "bg-slate-800"
      },
      warning: "Sensitive system access"
    },
  ];

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!window.recaptchaVerifier && step === "form") {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response) => {
            console.log("reCAPTCHA verified", response);
          },
          'expired-callback': () => {
            console.log("reCAPTCHA expired");
          }
        });
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
      }
    }
  }, [step]);

  // Resend timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Education levels
  const educationLevels = [
    "High School",
    "Intermediate (12th)",
    "Undergraduate",
    "Graduate",
    "Post Graduate",
    "PhD",
    "Diploma",
    "Professional Certification"
  ];

  // Interest categories
  const interestCategories = [
    "Programming", "Web Development", "Data Science", "AI/ML", "Cybersecurity",
    "Digital Marketing", "Graphic Design", "Business", "Finance", "Healthcare",
    "Languages", "Music", "Arts", "Photography", "Fitness", "Cooking"
  ];

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const sendOTP = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
      // Validate phone number
      if (!phone || phone.length !== 10) {
        throw new Error("Please enter a valid 10-digit phone number");
      }

      // Check if teacher is registered (for teacher login)
      if (selectedRole === "teacher") {
        const q = query(
          collection(db, "users"), 
          where("phone", "==", `+91${phone}`), 
          where("role", "==", "teacher")
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error("Phone number not registered as Faculty. Contact admin.");
        }
        
        const teacherData = snap.docs[0].data();
        const teacherStatus = teacherData.status?.toLowerCase().trim();
        if (teacherStatus !== "active") {
          throw new Error("Your account is pending admin approval.");
        }
      }

      const formatPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      
      // Initialize reCAPTCHA if not already
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }
      
      const appVerifier = window.recaptchaVerifier;
      
      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(confirmation);
      setVerificationId(confirmation.verificationId);
      setOtpSent(true);
      setResendTimer(30);
      
      toast.success("OTP sent successfully!");
      
      // Clear OTP fields
      setOtp(["", "", "", "", "", ""]);
      
      // Focus on first OTP input
      setTimeout(() => {
        const firstOtpInput = document.getElementById("otp-0");
        if (firstOtpInput) firstOtpInput.focus();
      }, 100);
      
    } catch (err) {
      console.error("OTP send error:", err);
      
      if (err.code === "auth/invalid-phone-number") {
        toast.error("Invalid phone number format");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Try again later.");
      } else {
        toast.error(err.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
        throw new Error("Please enter 6-digit OTP");
      }

      let userCredential;
      
      if (confirmationResult) {
        userCredential = await confirmationResult.confirm(otpCode);
      } else if (verificationId) {
        const credential = PhoneAuthProvider.credential(verificationId, otpCode);
        userCredential = await signInWithCredential(auth, credential);
      } else {
        throw new Error("OTP session expired. Please request a new OTP.");
      }
      
      await handleSuccessfulLogin(userCredential.user, "phone");
      
    } catch (err) {
      console.error("OTP verification error:", err);
      
      if (err.code === "auth/invalid-verification-code") {
        toast.error("Invalid OTP. Please try again.");
      } else if (err.code === "auth/code-expired") {
        toast.error("OTP expired. Please request a new one.");
        setOtpSent(false);
      } else {
        toast.error(err.message || "Failed to verify OTP");
      }
      
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
      // Validate inputs
      if (!email || !email.trim()) {
        toast.error("Please enter your email address");
        setLoading(false);
        return;
      }
      
      if (!password) {
        toast.error("Please enter your password");
        setLoading(false);
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.toLowerCase())) {
        toast.error("Please enter a valid email address");
        setLoading(false);
        return;
      }
      
      // Password length validation
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }
      
      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();
      
      // Optional: Rate limiting check
      const storedAttempts = localStorage.getItem("loginAttempts");
      const lastAttemptTime = localStorage.getItem("lastLoginAttempt");
      
      if (storedAttempts && lastAttemptTime) {
        const attempts = parseInt(storedAttempts);
        const timeSinceLast = Date.now() - parseInt(lastAttemptTime);
        
        if (attempts >= 5 && timeSinceLast < 15 * 60 * 1000) {
          toast.error("Too many failed attempts. Please try again in 15 minutes.");
          setLoading(false);
          return;
        }
        
        // Reset if cooldown period has passed
        if (timeSinceLast >= 15 * 60 * 1000) {
          localStorage.removeItem("loginAttempts");
          localStorage.removeItem("lastLoginAttempt");
        }
      }
      
      // Attempt login
      const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      
      // ✅ Enhanced login handling with role verification
      await handleSuccessfulLogin(userCred.user, "email");
      
      // ✅ Clear sensitive data from state
      setEmail("");
      setPassword("");
      setRememberMe(false);
      
      // Reset failed attempts on successful login
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lastLoginAttempt");
      
    } catch (err) {
      console.error("Login error:", err);
      
      // Track failed attempts
      const currentAttempts = localStorage.getItem("loginAttempts") || "0";
      const newAttempts = parseInt(currentAttempts) + 1;
      localStorage.setItem("loginAttempts", newAttempts.toString());
      localStorage.setItem("lastLoginAttempt", Date.now().toString());
      
      // Handle specific Firebase auth errors
      switch (err.code) {
        case "auth/invalid-email":
          toast.error("Please enter a valid email address");
          break;
          
        case "auth/user-not-found":
          if (selectedRole === "student") {
            toast.error("No account found. Would you like to register instead?");
            setLoginMode("register");
            setStudentEmail(email);
          } else if (selectedRole === "teacher") {
            toast.error("Teacher account not found. Please contact administrator.");
          } else {
            toast.error("No account found with this email");
          }
          break;
          
        case "auth/wrong-password":
          toast.error("Incorrect password. Please try again.");
          break;
          
        case "auth/user-disabled":
          toast.error("This account has been disabled. Please contact support.");
          break;
          
        case "auth/too-many-requests":
          toast.error("Too many failed attempts. Please try again later.");
          break;
          
        case "auth/network-request-failed":
          toast.error("Network error. Please check your internet connection.");
          break;
          
        case "auth/invalid-credential":
          toast.error("Invalid email or password. Please check your credentials.");
          break;
          
        case "auth/operation-not-allowed":
          toast.error("Email/password login is not enabled. Contact administrator.");
          break;
          
        case "auth/requires-recent-login":
          toast.error("Session expired. Please login again.");
          break;
          
        default:
          const errorMessage = err.message || "Login failed. Please try again.";
          toast.error(errorMessage);
      }
      
      // Optional: Track failed login attempts
      if (err.code && err.code.startsWith("auth/")) {
        console.warn(`Login attempt failed: ${err.code}`, {
          email: email?.substring(0, 5) + "***", // Log partial email for privacy
          role: selectedRole,
          timestamp: new Date().toISOString()
        });
      }
      
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerType) => {
    setLoading(true);
    
    try {
      let provider;
      
      if (providerType === 'google') {
        provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
      } else if (providerType === 'github') {
        provider = new GithubAuthProvider();
        provider.addScope('user:email');
      }
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (!userDoc.exists()) {
        // New social login user - show profile completion
        setSocialUserData({
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || "",
          phone: result.user.phoneNumber || "",
          photoURL: result.user.photoURL || "",
          provider: providerType
        });
        
        // Pre-fill form with social data
        setFullName(result.user.displayName || "");
        setStudentEmail(result.user.email || "");
        setStudentPhone(result.user.phoneNumber?.replace('+91', '') || "");
        
        // Switch to complete profile mode
        setLoginMode("complete-profile");
        setLoading(false);
        
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-2xl shadow-xl border border-emerald-200 max-w-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                <FiUserCheck className="text-blue-600 text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Complete Your Profile</h3>
                <p className="text-slate-600 text-sm">Please provide additional information to continue</p>
              </div>
            </div>
          </motion.div>
        ));
        return;
      }
      
      // Existing user - proceed with login
      await handleSuccessfulLogin(result.user, providerType);
      
    } catch (err) {
      console.error("Social login error:", err);
      
      if (err.code === "auth/popup-closed-by-user") {
        toast.error("Login popup was closed");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        toast.error("Account already exists with different login method");
      } else {
        toast.error(err.message || "Social login failed");
      }
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // ✅ FIX ADDED HERE: Admin bypass aur status check
      await handleSuccessfulLogin(userCred.user, "password");
      
    } catch (err) {
      console.error("Admin login error:", err);
      
      if (err.code === "auth/user-not-found") {
        toast.error("No admin account found with this email");
      } else if (err.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Try again later.");
      } else {
        toast.error(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate inputs
      if (!studentEmail || !password || !fullName || !studentPhone) {
        throw new Error("Please fill all required fields");
      }
      
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (studentPhone.length !== 10) {
        throw new Error("Please enter a valid 10-digit phone number");
      }

      if (!termsAccepted) {
        throw new Error("Please accept terms and conditions");
      }

      // Check if email already exists
      const emailQuery = query(collection(db, "users"), where("email", "==", studentEmail));
      const emailSnap = await getDocs(emailQuery);
      
      if (!emailSnap.empty) {
        throw new Error("Email already registered. Please login instead.");
      }

      // Check if phone already exists
      const phoneQuery = query(collection(db, "users"), where("phone", "==", `+91${studentPhone}`));
      const phoneSnap = await getDocs(phoneQuery);
      
      if (!phoneSnap.empty) {
        throw new Error("Phone number already registered. Please login instead.");
      }

      // Create user with email/password
      const userCred = await createUserWithEmailAndPassword(auth, studentEmail, password);
      const user = userCred.user;

      // Update display name
      await updateProfile(user, {
        displayName: fullName
      });

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        name: fullName,
        email: studentEmail,
        phone: `+91${studentPhone}`,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        address: address || null,
        educationLevel: educationLevel || null,
        interests: interests,
        role: "student",
        status: "active", // ✅ Default status set to active for new students
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        loginMethod: "email",
        lastLogin: serverTimestamp(),
        emailVerified: user.emailVerified,
        profileComplete: true,
        studentId: `STU${Date.now().toString().slice(-8)}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&bold=true`,
        preferences: {
          notifications: true,
          theme: "light",
          language: "en"
        }
      };

      await setDoc(doc(db, "users", user.uid), userProfile);

      toast.success("Account created successfully! Welcome to Student Nagari!");
      
      // Update local state
      setEmail(studentEmail);
      
      // Proceed with login
      await handleSuccessfulLogin(user, "email");
      
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(err.message || "Registration failed");
      setLoading(false);
    }
  };

  const completeSocialProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!fullName || !studentEmail) {
        throw new Error("Please fill all required fields");
      }

      if (studentPhone && studentPhone.length !== 10) {
        throw new Error("Please enter a valid 10-digit phone number");
      }

      // Create user profile in Firestore
      const userProfile = {
        uid: socialUserData.uid,
        name: fullName,
        email: studentEmail,
        phone: studentPhone ? `+91${studentPhone}` : "",
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        address: address || null,
        educationLevel: educationLevel || null,
        interests: interests,
        role: "student",
        status: "active", // ✅ Default status set to active for new students
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        loginMethod: socialUserData.provider,
        lastLogin: serverTimestamp(),
        emailVerified: true,
        profileComplete: true,
        studentId: `STU${Date.now().toString().slice(-8)}`,
        avatar: socialUserData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&bold=true`,
        socialProvider: socialUserData.provider,
        preferences: {
          notifications: true,
          theme: "light",
          language: "en"
        }
      };

      await setDoc(doc(db, "users", socialUserData.uid), userProfile);

      // Update auth profile
      await updateProfile(auth.currentUser, {
        displayName: fullName,
        photoURL: socialUserData.photoURL
      });

      toast.success("Profile completed successfully!");
      
      // Navigate to student dashboard
      setTimeout(() => {
        navigate("/student", { replace: true });
      }, 1000);
      
    } catch (err) {
      console.error("Profile completion error:", err);
      toast.error(err.message || "Failed to complete profile");
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = async (user, loginMethod = "unknown") => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }
      
      const userData = userDoc.data();
      
      // ✅ FIX 1: Case-insensitive role check
      const userRole = userData.role?.toLowerCase().trim();
      const requiredRole = selectedRole?.toLowerCase().trim();
      
      // ✅ FIX 2: Admin bypass aur status check
      // Agar user admin hai to status check na karein (direct access)
      // Agar admin nahi hai aur status active nahi hai to block karein
      if (userRole !== "admin") {
        const userStatus = userData.status?.toLowerCase().trim();
        if (userStatus !== "active") {
          await auth.signOut();
          throw new Error("Your account is not active. Please contact admin.");
        }
      }
      
      // Role verification (case-insensitive)
      if (userRole !== requiredRole) {
        // Special case: teacher can login as faculty
        if (userRole === "teacher" && requiredRole === "faculty") {
          // Allow login
        } else {
          throw new Error(`Access denied. You are registered as ${userData.role}, not ${selectedRole}.`);
        }
      }

      // Update last login timestamp
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
        loginMethod: loginMethod,
        lastActive: serverTimestamp()
      });

      // Show success toast
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200 max-w-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <FiCheckCircle className="text-emerald-600 text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Welcome, {userData.name}!</h3>
              <p className="text-slate-600 text-sm">Redirecting to {selectedRole} portal...</p>
            </div>
          </div>
        </motion.div>
      ));

      // Store login data if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedRole', selectedRole);
        if (selectedRole === 'admin') {
          localStorage.setItem('rememberedEmail', email);
        }
      }

      // Fast navigation based on role
      setTimeout(() => {
        if (selectedRole === "admin") navigate("/admin", { replace: true });
        else if (selectedRole === "teacher") navigate("/faculty", { replace: true });
        else navigate("/student", { replace: true });
      }, 500);
      
    } catch (err) {
      console.error("Login verification error:", err);
      await auth.signOut();
      toast.error(err.message || "Login failed");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      setForgotPassword(false);
    } catch (err) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    sendOTP();
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setPhone("");
    setOtp(["", "", "", "", "", ""]);
    setOtpSent(false);
    setAuthMethod("phone");
    setForgotPassword(false);
    setRememberMe(false);
    setLoginMode("login");
    setSocialUserData(null);
    // Reset registration fields
    setFullName("");
    setStudentEmail("");
    setStudentPhone("");
    setDateOfBirth("");
    setGender("");
    setAddress("");
    setEducationLevel("");
    setInterests([]);
    setTermsAccepted(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleInterest = (interest) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // Load remembered data
  useEffect(() => {
    if (step === "form") {
      const rememberedRole = localStorage.getItem('rememberedRole');
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      
      if (rememberedEmail && selectedRole === 'admin') {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    }
  }, [step, selectedRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      
      {/* Floating Elements */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 8 
        }}
        className="absolute top-1/4 left-10 text-slate-200 text-6xl"
      >
        <FiGlobe />
      </motion.div>
      
      <motion.div 
        animate={{ 
          x: [0, 20, 0],
          y: [0, 10, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 6,
          delay: 0.5
        }}
        className="absolute bottom-1/4 right-10 text-slate-200 text-5xl"
      >
        <FiUsers />
      </motion.div>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '12px',
          },
        }}
      />
      
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="relative z-10 w-full max-w-7xl">
        {/* Logo Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 md:mb-16"
        >
          <Link to="/" className="inline-block">
            <div className="relative inline-block mb-6">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute -inset-4 border-4 border-slate-200 rounded-3xl"
              />
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl flex items-center justify-center text-white text-4xl md:text-5xl font-bold italic shadow-2xl overflow-hidden">
                <img 
                  src="/src/assets/logo.png"
                  alt="Student Nagari Logo"
                  className="w-full h-full object-cover p-2"  
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling?.remove();
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full flex items-center justify-center text-white text-3xl';
                    fallback.textContent = 'N';
                    e.target.parentElement.appendChild(fallback);
                  }}
                />
              </div>
            </div>
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tighter uppercase mb-2">
            STUDENT <span className="text-red-600">NAGARI</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium">
            All-in-One Education Platform Smart Hub
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <FiTrendingUp className="text-emerald-500" /> 24/7 Access
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FiShield className="text-blue-500" /> Secure Login
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FiClock className="text-amber-500" /> Real-time Updates
            </span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "selection" ? (
            /* ROLE SELECTION */
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            >
              {roles.map((role) => (
                <motion.div 
                  key={role.id}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 300 } 
                  }}
                  className={`${role.bgColor} p-6 md:p-8 rounded-[2.5rem] border-2 ${role.borderColor} shadow-xl hover:shadow-2xl ${role.shadowColor} flex flex-col items-center text-center group cursor-pointer relative overflow-hidden`}
                  onClick={() => {
                    setSelectedRole(role.id);
                    setStep("form");
                    resetForm();
                    // Set default auth method based on role
                    if (role.id === 'admin') {
                      setAuthMethod('password');
                    } else {
                      setAuthMethod('phone');
                    }
                  }}
                >
                  {/* Badge */}
                  {role.badge && (
                    <div className={`absolute top-4 right-4 ${role.badge.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      {role.badge.text}
                    </div>
                  )}
                  
                  {/* Warning for teacher */}
                  {role.warning && (
                    <div className="absolute top-4 left-4 text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full">
                      ⚠️ {role.warning}
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl bg-white shadow-md mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {role.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{role.title}</h3>
                  <p className="text-slate-500 text-sm mb-1">{role.tagline}</p>
                  <p className="text-slate-600 text-sm mb-6 flex-1">{role.description}</p>
                  
                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 w-full mb-6">
                    {role.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="text-left text-xs text-slate-700">
                        <span className="mr-1">{feature.icon}</span> {feature.text}
                      </div>
                    ))}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-around w-full mb-6 p-3 bg-white/50 rounded-xl">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900">{role.stats.total}</div>
                      <div className="text-xs text-slate-500">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">{role.stats.active}</div>
                      <div className="text-xs text-slate-500">Active</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${role.stats.growth === 'Secure' ? 'text-slate-700' : 'text-blue-600'}`}>
                        {role.stats.growth}
                      </div>
                      <div className="text-xs text-slate-500">Growth</div>
                    </div>
                  </div>
                  
                  {/* Auth Methods */}
                  <div className="space-y-2 w-full mb-6">
                    {role.authMethods.map((method) => (
                      <div key={method.id} className={`flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border ${method.color} transition-colors`}>
                        {method.icon}
                        <span>{method.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Info */}
                  <div className="text-xs text-slate-500 mb-4">{role.quickInfo}</div>
                  
                  <button className={`${role.gradient} text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:shadow-lg transition-all duration-300 w-full`}>
                    Enter Portal
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* LOGIN FORM */
            <motion.div 
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl mx-auto relative border border-slate-100 ${
                (loginMode === "register" || loginMode === "complete-profile") && selectedRole === "student" 
                  ? "max-w-5xl" 
                  : "max-w-md"
              }`}
            >
              {/* Back Button */}
              <motion.button 
                onClick={() => {
                  setStep("selection");
                  resetForm();
                }}
                className="absolute top-6 left-6 text-slate-400 hover:text-red-600 flex items-center gap-2 text-xs font-bold uppercase tracking-wider group"
                whileHover={{ x: -4 }}
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                Back
              </motion.button>

              {/* Role Indicator */}
              <div className="flex items-center justify-center gap-3 pt-10 pb-4">
                <div className={`p-3 rounded-xl ${roles.find(r => r.id === selectedRole)?.bgColor}`}>
                  {React.cloneElement(roles.find(r => r.id === selectedRole)?.icon, { 
                    className: "text-slate-700"
                  })}
                </div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {selectedRole.toUpperCase()} {loginMode === "register" ? "REGISTRATION" : loginMode === "complete-profile" ? "COMPLETE PROFILE" : "LOGIN"}
                </span>
              </div>

              <div className={`px-6 md:px-8 pb-8 ${(loginMode === "register" || loginMode === "complete-profile") && selectedRole === "student" ? "" : ""}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-2">
                  {loginMode === "register" ? 'Create Student Account' : 
                   loginMode === "complete-profile" ? 'Complete Your Profile' : 
                   'Welcome Back'}
                </h2>
                <p className="text-slate-500 text-center mb-8">
                  {loginMode === "register" 
                    ? 'Join thousands of students learning online' 
                    : loginMode === "complete-profile"
                    ? 'Please provide additional information to continue'
                    : `Sign in to your ${selectedRole} account`}
                </p>

                {forgotPassword ? (
                  /* FORGOT PASSWORD FORM */
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <FiHelpCircle className="text-amber-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            Reset Password
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            Enter your email to receive password reset instructions
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Email Address</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          required
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 rounded-xl outline-none focus:border-red-600/30 font-medium"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForgotPassword(false)}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                      >
                        {loading ? "Sending..." : "Reset Password"}
                      </button>
                    </div>
                  </motion.div>
                ) : otpSent ? (
                  /* OTP VERIFICATION */
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl inline-block mb-4">
                        <FiMessageSquare className="text-blue-600 text-3xl" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Enter Verification Code</h3>
                      <p className="text-slate-500">
                        Enter the 6-digit code sent to <br />
                        <span className="font-bold">+91 {phone}</span>
                      </p>
                    </div>

                    <form onSubmit={verifyOTP}>
                      <div className="space-y-6">
                        {/* OTP Inputs */}
                        <div className="flex justify-center gap-2 md:gap-3">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              className="w-12 h-12 md:w-14 md:h-14 text-2xl font-bold text-center bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !digit && index > 0) {
                                  const prevInput = document.getElementById(`otp-${index - 1}`);
                                  if (prevInput) prevInput.focus();
                                }
                              }}
                              autoFocus={index === 0}
                            />
                          ))}
                        </div>

                        {/* Resend OTP */}
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={resendOTP}
                            disabled={resendTimer > 0 || loading}
                            className="text-slate-600 hover:text-blue-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                          >
                            <FiRefreshCw className={resendTimer > 0 ? 'animate-spin' : ''} />
                            {resendTimer > 0 
                              ? `Resend in ${formatTime(resendTimer)}` 
                              : 'Resend OTP'}
                          </button>
                        </div>

                        {/* Submit Button */}
                        <button 
                          type="submit"
                          disabled={loading || otp.join('').length !== 6}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <FiLogIn />
                              Verify & Login
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="text-slate-500 hover:text-slate-700 text-sm font-medium text-center w-full"
                    >
                      ← Use different phone number
                    </button>
                  </motion.div>
                ) : loginMode === "register" || loginMode === "complete-profile" ? (
                  /* STUDENT REGISTRATION / PROFILE COMPLETION FORM */
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-4 md:p-6 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-xl bg-white">
                          <FiUserPlus className="text-blue-600 text-xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-2">
                            {loginMode === "complete-profile" ? "Complete Your Student Profile" : "Create Your Student Account"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {loginMode === "complete-profile" 
                              ? "We need a few more details to personalize your learning experience"
                              : "Fill in your details to get started with your learning journey"}
                          </p>
                        </div>
                        <div className="text-xs font-bold text-blue-600 bg-white px-3 py-1 rounded-full">
                          STEP 1/2
                        </div>
                      </div>
                    </div>

                    <form onSubmit={loginMode === "complete-profile" ? completeSocialProfile : handleStudentRegistration}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                            <FiUser className="text-blue-500" /> Personal Information
                          </h4>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <input 
                                type="text"
                                required
                                placeholder="John Doe"
                                autoComplete="name"
                                className="w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 rounded-xl outline-none focus:border-blue-500/30 font-medium"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                              />
                              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <input 
                                  type="email"
                                  required
                                  disabled={loginMode === "complete-profile"}
                                  placeholder="student@example.com"
                                  autoComplete="email"
                                  className={`w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 rounded-xl outline-none focus:border-blue-500/30 font-medium ${loginMode === "complete-profile" ? 'opacity-70' : ''}`}
                                  value={loginMode === "complete-profile" ? socialUserData?.email || studentEmail : studentEmail}
                                  onChange={(e) => setStudentEmail(e.target.value)}
                                />
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Phone <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  <span className="font-bold text-slate-700">+91</span>
                                </div>
                                <input 
                                  type="tel"
                                  required={loginMode === "register"}
                                  maxLength={10}
                                  placeholder="9876543210"
                                  autoComplete="tel"
                                  className="w-full bg-slate-50 border-2 border-slate-100 p-3 pl-16 rounded-xl outline-none focus:border-blue-500/30 font-medium"
                                  value={studentPhone}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setStudentPhone(value);
                                  }}
                                />
                                <FiSmartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                              <div className="relative">
                                <input 
                                  type="date"
                                  autoComplete="bday"
                                  className="w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 rounded-xl outline-none focus:border-blue-500/30 font-medium"
                                  value={dateOfBirth}
                                  onChange={(e) => setDateOfBirth(e.target.value)}
                                />
                                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Gender</label>
                              <select 
                                className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-blue-500/30 font-medium"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Address</label>
                            <div className="relative">
                              <textarea 
                                placeholder="Enter your complete address"
                                rows="2"
                                autoComplete="street-address"
                                className="w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 rounded-xl outline-none focus:border-blue-500/30 font-medium resize-none"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                              />
                              <FiMapPin className="absolute left-4 top-4 text-slate-400" />
                            </div>
                          </div>
                        </div>

                        {/* Educational Information */}
                        <div className="space-y-4">
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                            <FiBook className="text-blue-500" /> Educational Information
                          </h4>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Education Level</label>
                            <select 
                              className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-blue-500/30 font-medium"
                              value={educationLevel}
                              onChange={(e) => setEducationLevel(e.target.value)}
                            >
                              <option value="">Select Education Level</option>
                              {educationLevels.map((level) => (
                                <option key={level} value={level}>{level}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Areas of Interest</label>
                            <div className="flex flex-wrap gap-2">
                              {interestCategories.slice(0, 8).map((interest) => (
                                <button
                                  type="button"
                                  key={interest}
                                  onClick={() => toggleInterest(interest)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${interests.includes(interest)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {interest}
                                </button>
                              ))}
                            </div>
                            {interests.length > 0 && (
                              <p className="text-xs text-slate-500 mt-2">
                                Selected: {interests.join(', ')}
                              </p>
                            )}
                          </div>

                          {loginMode === "register" && (
                            <>
                              <div className="space-y-2 pt-4">
                                <label className="text-sm font-medium text-slate-700">Create Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                  <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="Minimum 6 characters"
                                    autoComplete="new-password"
                                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 pr-12 rounded-xl outline-none focus:border-blue-500/30 font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                  />
                                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                  </button>
                                </div>
                                <div className="text-xs text-slate-500 space-y-1 mt-2">
                                  <p className={`flex items-center gap-1 ${password.length >= 6 ? 'text-emerald-600' : ''}`}>
                                    {password.length >= 6 ? <FiCheckCircle /> : '•'} At least 6 characters
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4 pt-4">
                                <label className="flex items-start gap-3">
                                  <input 
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-slate-300"
                                  />
                                  <span className="text-sm text-slate-600">
                                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>. I understand that my information will be used in accordance with the platform's policies.
                                  </span>
                                </label>
                              </div>
                            </>
                          )}

                          {/* Benefits Section */}
                          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-4 mt-6">
                            <h5 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                              <FiAward className="text-amber-500" /> Benefits of Registration
                            </h5>
                            <ul className="text-xs text-slate-600 space-y-1">
                              <li className="flex items-center gap-2">
                                <FiStar className="text-amber-500" size={12} /> Free access to beginner courses
                              </li>
                              <li className="flex items-center gap-2">
                                <FiStar className="text-amber-500" size={12} /> Personalized learning recommendations
                              </li>
                              <li className="flex items-center gap-2">
                                <FiStar className="text-amber-500" size={12} /> Progress tracking & certificates
                              </li>
                              <li className="flex items-center gap-2">
                                <FiStar className="text-amber-500" size={12} /> Join student community forums
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginMode("login");
                            resetForm();
                          }}
                          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors text-sm"
                        >
                          Back to Login
                        </button>
                        <button
                          type="submit"
                          disabled={loading || (loginMode === "register" && !termsAccepted)}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                        >
                          {loading ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                              {loginMode === "complete-profile" ? "Completing..." : "Creating Account..."}
                            </>
                          ) : (
                            <>
                              <FiUserPlus />
                              {loginMode === "complete-profile" ? "Complete Profile" : "Create Account"}
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-100">
                      <p className="text-slate-500 text-sm">
                        Already have an account?{' '}
                        <button
                          onClick={() => {
                            setLoginMode("login");
                            setAuthMethod("email");
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Login here
                        </button>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* REGULAR LOGIN FORM */
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Student Login/Register Toggle */}
                    {selectedRole === 'student' && authMethod === 'email' && (
                      <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setLoginMode('login')}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${loginMode === 'login' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Login
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginMode('register')}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${loginMode === 'register' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Register
                        </button>
                      </div>
                    )}

                    {/* Auth Method Selector (for students and teachers) */}
                    {(selectedRole === 'student' || selectedRole === 'teacher') && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {roles.find(r => r.id === selectedRole)?.authMethods.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setAuthMethod(method.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${authMethod === method.id 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                          >
                            {method.icon}
                            {method.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Social Login Buttons (Students only) */}
                    {selectedRole === 'student' && (authMethod === 'google' || authMethod === 'github') ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-slate-600 mb-4">Login with your social account</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleSocialLogin('google')}
                              disabled={loading}
                              className="flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <FcGoogle className="text-xl" />
                              <span className="font-medium">Google</span>
                            </button>
                            <button
                              onClick={() => handleSocialLogin('github')}
                              disabled={loading}
                              className="flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <FiGithub className="text-xl" />
                              <span className="font-medium">GitHub</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-4">
                            By continuing, you agree to our Terms & Privacy Policy
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Regular Login Form */
                      <form onSubmit={
                        selectedRole === 'admin' ? handleAdminLogin : 
                        authMethod === 'password' ? handleEmailPasswordLogin :
                        authMethod === 'email' && selectedRole === 'student' && loginMode === 'register' ? handleStudentRegistration :
                        authMethod === 'email' ? handleEmailPasswordLogin :
                        sendOTP
                      }>
                        {authMethod === 'phone' ? (
                          /* PHONE OTP FORM */
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Phone Number</label>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  <span className="font-bold text-slate-700">+91</span>
                                  <span className="text-slate-300">|</span>
                                </div>
                                <input 
                                  type="tel"
                                  inputMode="numeric"
                                  required
                                  maxLength={10}
                                  placeholder="9876543210"
                                  autoComplete="tel"
                                  className="w-full bg-slate-50 border-2 border-slate-100 p-3 pl-20 rounded-xl outline-none focus:border-blue-500/30 font-medium"
                                  value={phone}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhone(value);
                                  }}
                                />
                              </div>
                              <p className="text-xs text-slate-500">
                                Enter the phone number registered with your {selectedRole} account
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* EMAIL/PASSWORD FORM */
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Email Address</label>
                              <div className="relative">
                                <input 
                                  type="email"
                                  required
                                  placeholder={
                                    selectedRole === 'admin' ? "admin@studentnagari.com" :
                                    selectedRole === 'teacher' ? "faculty@studentnagari.edu" :
                                    "student@example.com"
                                  }
                                  autoComplete="email"
                                  className={`w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 rounded-xl outline-none font-medium ${
                                    selectedRole === 'admin' ? 'focus:border-slate-900/30' :
                                    selectedRole === 'teacher' ? 'focus:border-emerald-500/30' :
                                    'focus:border-blue-500/30'
                                  }`}
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">
                                Password
                              </label>
                              <div className="relative">
                                <input 
                                  type={showPassword ? "text" : "password"}
                                  required
                                  placeholder="Enter your password"
                                  autoComplete={selectedRole === 'student' && loginMode === 'register' ? 'new-password' : 'current-password'}
                                  className={`w-full bg-slate-50 border-2 border-slate-100 p-3 pl-12 pr-12 rounded-xl outline-none font-medium ${
                                    selectedRole === 'admin' ? 'focus:border-slate-900/30' :
                                    selectedRole === 'teacher' ? 'focus:border-emerald-500/30' :
                                    'focus:border-blue-500/30'
                                  }`}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                />
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Remember Me & Forgot Password (not for admin) */}
                        {(selectedRole === 'student' || selectedRole === 'teacher') && authMethod !== 'phone' && (
                          <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 text-slate-600 text-sm">
                              <input 
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300"
                              />
                              Remember me
                            </label>
                            
                            <button
                              type="button"
                              onClick={() => setForgotPassword(true)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                            >
                              <FiHelpCircle /> Forgot Password?
                            </button>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button 
                          type="submit"
                          disabled={loading}
                          className={`w-full py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all mt-6 ${
                            authMethod === 'phone' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            selectedRole === 'teacher' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                            selectedRole === 'admin' ? 'bg-gradient-to-r from-slate-800 to-slate-900' :
                            loginMode === 'register' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' :
                            'bg-gradient-to-r from-cyan-500 to-blue-500'
                          } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                          {loading ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              />
                              {authMethod === 'phone' ? 'Sending OTP...' : 
                               selectedRole === 'student' && loginMode === 'register' ? 'Creating Account...' : 
                               'Logging in...'}
                            </>
                          ) : (
                            <>
                              <FiLogIn />
                              {authMethod === 'phone' ? 'Send OTP' : 
                               selectedRole === 'student' && loginMode === 'register' ? 'Create Account' : 
                               'Login'}
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Switch to other auth methods (for students) */}
                    {selectedRole === 'student' && authMethod !== 'phone' && authMethod !== 'google' && authMethod !== 'github' && (
                      <div className="text-center pt-4">
                        <button
                          type="button"
                          onClick={() => setAuthMethod('phone')}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Or login with Phone OTP
                        </button>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="pt-4 border-t border-slate-100 text-center">
                      <p className="text-slate-500 text-xs">
                        {selectedRole === 'teacher' ? (
                          "Faculty login requires admin approval. Contact admin if you can't login."
                        ) : selectedRole === 'admin' ? (
                          "For security, admin login is restricted to authorized personnel only."
                        ) : (
                          "Need help? Contact support@studentnagari.edu.in"
                        )}
                      </p>
                      
                      <div className="flex items-center justify-center gap-4 mt-4 text-slate-400 text-xs">
                        <span className="flex items-center gap-1">
                          <FiShield className="text-emerald-500" /> Secure
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FiLock className="text-blue-500" /> Encrypted
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FiClock className="text-amber-500" /> 24/7
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-4">
            <a href="/privacy" className="hover:text-slate-700 transition-colors">Privacy Policy</a>
            <span className="text-slate-300 hidden md:inline">•</span>
            <a href="/terms" className="hover:text-slate-700 transition-colors">Terms of Service</a>
            <span className="text-slate-300 hidden md:inline">•</span>
            <a href="/support" className="hover:text-slate-700 transition-colors">Support Center</a>
            <span className="text-slate-300 hidden md:inline">•</span>
            <a href="/status" className="hover:text-slate-700 transition-colors">System Status</a>
          </div>
          <p>© {new Date().getFullYear()} Student Nagari. All rights reserved.</p>
          <p className="text-xs text-slate-400 mt-2">v2.3.0 • Enhanced Registration System</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;