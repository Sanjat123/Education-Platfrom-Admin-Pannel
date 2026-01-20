import { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  db, 
  storage 
} from "../firebase";
import { 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  deleteUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Initialize user session
  const initializeUser = async (currentUser) => {
    try {
      if (currentUser) {
        setUser(currentUser);
        
        // Get user profile from Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          const normalizedProfile = {
            ...profileData,
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            role: profileData.role?.toLowerCase() || "student",
            photoURL: profileData.photoURL || currentUser.photoURL,
            name: profileData.name || currentUser.displayName || currentUser.email?.split('@')[0],
            createdAt: profileData.createdAt || currentUser.metadata.creationTime,
            lastLoginAt: profileData.lastLoginAt || new Date().toISOString()
          };
          
          setUserProfile(normalizedProfile);
          
          // Update last login timestamp
          await updateDoc(userDocRef, {
            lastLoginAt: new Date().toISOString(),
            lastActive: serverTimestamp()
          });
        } else {
          // Create profile if doesn't exist
          const defaultProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email?.split('@')[0],
            role: "student",
            emailVerified: currentUser.emailVerified,
            photoURL: currentUser.photoURL || "",
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            lastActive: serverTimestamp(),
            status: "active"
          };
          
          await setDoc(userDocRef, defaultProfile);
          setUserProfile(defaultProfile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
      setUserProfile(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // ✅ Login with email and password
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Validate email format
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await initializeUser(userCredential.user);
      
      toast.success(`Welcome back, ${userCredential.user.email?.split('@')[0]}!`);
      return userCredential.user;
    } catch (error) {
      let errorMessage = "Login failed";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later";
          break;
        default:
          errorMessage = error.message || "Login failed";
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register new user
  const register = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      
      // Check if email already exists
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase())
      );
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        throw new Error("Email already registered");
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      const userProfileData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userData.name || userCredential.user.email?.split('@')[0],
        role: userData.role || "student",
        phone: userData.phone || "",
        photoURL: "",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        lastActive: serverTimestamp(),
        status: "active",
        preferences: {
          notifications: true,
          emailUpdates: true,
          theme: "light"
        }
      };
      
      await setDoc(doc(db, "users", userCredential.user.uid), userProfileData);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Update display name if provided
      if (userData.name) {
        await updateProfile(userCredential.user, {
          displayName: userData.name
        });
      }
      
      await initializeUser(userCredential.user);
      
      toast.success("Account created successfully! Please verify your email.");
      return userCredential.user;
    } catch (error) {
      let errorMessage = "Registration failed";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email already in use";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters";
          break;
        default:
          errorMessage = error.message || "Registration failed";
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout user
  const logout = async () => {
    try {
      // Update last active before logout
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          lastActive: serverTimestamp()
        });
      }
      
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      throw error;
    }
  };

  // ✅ Update user profile
  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error("No user logged in");
      
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh user profile
      await initializeUser(user);
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  // ✅ Upload profile picture
  const uploadProfilePicture = async (file) => {
    try {
      if (!user) throw new Error("No user logged in");
      if (!file) throw new Error("No file selected");
      
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error("File size should be less than 5MB");
      }
      
      if (!file.type.startsWith('image/')) {
        throw new Error("Only image files are allowed");
      }
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update user profile
      await updateUserProfile({ photoURL: downloadURL });
      
      // Update auth user
      await updateProfile(user, { photoURL: downloadURL });
      
      return downloadURL;
    } catch (error) {
      console.error("Upload profile picture error:", error);
      toast.error(error.message || "Failed to upload profile picture");
      throw error;
    }
  };

  // ✅ Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent");
    } catch (error) {
      let errorMessage = "Failed to send reset email";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ✅ Delete account (admin only)
  const deleteAccount = async (userId) => {
    try {
      if (!userProfile || userProfile.role !== "admin") {
        throw new Error("Only admins can delete accounts");
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, "users", userId));
      
      // If deleting own account, also delete auth user
      if (userId === user.uid) {
        await deleteUser(user);
        setUser(null);
        setUserProfile(null);
        toast.success("Your account has been deleted");
      } else {
        toast.success("Account deleted successfully");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account");
      throw error;
    }
  };

  // ✅ Get user by ID (admin only)
  const getUserById = async (userId) => {
    try {
      if (!userProfile || userProfile.role !== "admin") {
        throw new Error("Only admins can view user details");
      }
      
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      throw new Error("User not found");
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  };

  // ✅ Get all users (admin only)
  const getAllUsers = async () => {
    try {
      if (!userProfile || userProfile.role !== "admin") {
        throw new Error("Only admins can view all users");
      }
      
      const usersQuery = query(collection(db, "users"));
      const querySnapshot = await getDocs(usersQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Get all users error:", error);
      throw error;
    }
  };

  // ✅ Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!userProfile) return false;
    
    const userRole = userProfile.role?.toLowerCase();
    const checkRole = requiredRole?.toLowerCase();
    
    // Role hierarchy: admin > teacher > student
    const roleHierarchy = {
      'admin': 3,
      'teacher': 2,
      'faculty': 2,
      'student': 1
    };
    
    if (userRole === 'admin') return true; // Admin can access everything
    
    if (checkRole === userRole) return true;
    
    // Check if user has higher role than required
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[checkRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // ✅ Check if user can perform action
  const can = (action, resource) => {
    if (!userProfile) return false;
    
    const permissions = {
      'admin': {
        'users': ['create', 'read', 'update', 'delete'],
        'courses': ['create', 'read', 'update', 'delete', 'approve'],
        'payments': ['read', 'update', 'refund'],
        'analytics': ['read'],
        'settings': ['read', 'update']
      },
      'teacher': {
        'courses': ['create', 'read', 'update'],
        'students': ['read'],
        'analytics': ['read']
      },
      'student': {
        'courses': ['read', 'enroll'],
        'profile': ['read', 'update']
      }
    };
    
    const userPermissions = permissions[userProfile.role] || {};
    return userPermissions[resource]?.includes(action) || false;
  };

  // ✅ Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      await initializeUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  // ✅ Session timeout check
  useEffect(() => {
    if (!user) return;
    
    const checkSession = async () => {
      try {
        // Check if token is still valid (optional - Firebase handles this)
        // You can implement custom session timeout logic here
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    
    const interval = setInterval(checkSession, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [user]);

  const value = {
    // State
    user,
    userProfile,
    loading,
    isInitialized,
    
    // Authentication
    login,
    register,
    logout,
    resetPassword,
    
    // Profile Management
    updateUserProfile,
    uploadProfilePicture,
    
    // User Management (Admin only)
    deleteAccount,
    getUserById,
    getAllUsers,
    
    // Authorization
    hasRole,
    can,
    
    // Quick checks
    isAdmin: userProfile?.role === 'admin',
    isTeacher: userProfile?.role === 'teacher',
    isStudent: userProfile?.role === 'student',
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};