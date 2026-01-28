import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { 
  collection, query, getDocs, where, orderBy, limit, 
  onSnapshot, doc, getDoc, addDoc, updateDoc, 
  serverTimestamp, increment 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  FiPlayCircle, FiStar, FiUsers, FiArrowRight, 
  FiCheckCircle, FiSearch, FiTrendingUp, FiAward,
  FiBookOpen, FiClock, FiTarget, FiBarChart2,
  FiChevronRight, FiGlobe, FiShield, FiBook,
  FiVideo, FiMusic, FiCamera, FiHeart,
  FiThumbsUp, FiMessageCircle, FiZap, FiLock,
  FiShoppingCart // Added this import
} from "react-icons/fi";
import { 
  FaChalkboardTeacher, FaGraduationCap, 
  FaLaptopCode, FaChartLine, FaPalette,
  FaBullhorn, FaCertificate, FaRegSmile
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [trendingCourses, setTrendingCourses] = useState([]);
  const [newCourses, setNewCourses] = useState([]);
  const [globalCourses, setGlobalCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 125000,
    totalCourses: 3500,
    totalInstructors: 850,
    successRate: 98
  });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Listen to authentication state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Get user profile
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
        // Get user's enrollment records
        fetchUserEnrollments(currentUser.uid);
      } else {
        setUserProfile(null);
        setUserEnrollments([]);
      }
    });

    fetchHomeData();

    return () => unsubscribeAuth();
  }, []);

  // Fetch user's enrollment records
  const fetchUserEnrollments = async (userId) => {
    try {
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", userId)
      );
      const snapshot = await getDocs(enrollmentsQuery);
      const enrollments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserEnrollments(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  // Check if user is enrolled in a specific course
  const isCourseEnrolled = (courseId) => {
    return userEnrollments.some(enrollment => enrollment.courseId === courseId);
  };

  // Check if course is free
  const isCourseFree = (course) => {
    return course.price === 0 || course.discountPrice === 0 || course.isFree === true;
  };

  // Enrollment logic for free courses
  const handleEnroll = async (course) => {
    try {
      // 1. Check if user is logged in
      if (!user) {
        toast.error("Please login to enroll in this course!");
        navigate("/login", { state: { from: `/course/${course.id}` } });
        return;
      }

      // 2. Check if user is already enrolled
      if (isCourseEnrolled(course.id)) {
        toast.info("You are already enrolled in this course!");
        navigate(`/course/${course.id}/learn`);
        return;
      }

      // 3. Check if user is the course creator
      if (user.uid === course.instructorId) {
        toast.error("You cannot enroll in your own course!");
        return;
      }

      // 4. Create enrollment record
      await addDoc(collection(db, "enrollments"), {
        studentId: user.uid,
        studentName: userProfile?.name || user.displayName || user.email,
        studentEmail: user.email,
        courseId: course.id,
        courseName: course.title,
        instructorId: course.instructorId,
        instructorName: course.instructorName,
        coursePrice: 0, // Free course
        enrolledAt: serverTimestamp(),
        status: "active",
        progress: 0,
        lastAccessed: serverTimestamp()
      });

      // 5. Update course's enrolled students count
      const courseRef = doc(db, "courses", course.id);
      await updateDoc(courseRef, {
        enrolledStudents: increment(1)
      });

      // 6. Update user's enrollment records
      fetchUserEnrollments(user.uid);

      toast.success("🎉 Enrolled Successfully! Redirecting to course...");
      
      // 7. Redirect to learning page
      setTimeout(() => {
        navigate(`/course/${course.id}/learn`);
      }, 1500);

    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error("Enrollment failed: " + error.message);
    }
  };

  // Purchase logic for paid courses
  const handlePurchase = (course) => {
    try {
      if (!user) {
        toast.error("Please login to purchase this course!");
        navigate("/login", { state: { from: `/course/${course.id}` } });
        return;
      }

      if (isCourseEnrolled(course.id)) {
        toast.info("You already own this course!");
        navigate(`/course/${course.id}/learn`);
        return;
      }

      // Redirect to checkout page with course information
      navigate(`/checkout/${course.id}`, {
        state: {
          course: {
            id: course.id,
            title: course.title,
            price: course.price,
            discountPrice: course.discountPrice,
            instructorName: course.instructorName,
            thumbnail: course.thumbnail
          }
        }
      });
    } catch (error) {
      toast.error("Purchase failed: " + error.message);
    }
  };

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Fetch global courses (isGlobal: true)
      const globalQuery = query(
        collection(db, "courses"),
        where("isGlobal", "==", true),
        limit(12)
      );
      const globalSnap = await getDocs(globalQuery);
      const globalCoursesData = globalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalCourses(globalCoursesData);

      // Fetch featured courses
      const featuredQuery = query(
        collection(db, "courses"),
        where("isFeatured", "==", true),
        limit(8)
      );
      const featuredSnap = await getDocs(featuredQuery);
      setFeaturedCourses(featuredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch trending courses (most enrolled)
      const trendingQuery = query(
        collection(db, "courses"),
        orderBy("enrolledStudents", "desc"),
        limit(6)
      );
      const trendingSnap = await getDocs(trendingQuery);
      setTrendingCourses(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch new courses
      const newQuery = query(
        collection(db, "courses"),
        orderBy("createdAt", "desc"),
        limit(6)
      );
      const newSnap = await getDocs(newQuery);
      setNewCourses(newSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Set categories
      const categoryList = [
        { name: "Development", icon: <FaLaptopCode />, courses: 1250, color: "from-blue-500 to-cyan-500" },
        { name: "Business", icon: <FaChartLine />, courses: 850, color: "from-emerald-500 to-green-500" },
        { name: "Data Science", icon: <FiBarChart2 />, courses: 620, color: "from-purple-500 to-pink-500" },
        { name: "Design", icon: <FaPalette />, courses: 540, color: "from-pink-500 to-rose-500" },
        { name: "Marketing", icon: <FaBullhorn />, courses: 480, color: "from-amber-500 to-orange-500" },
        { name: "Music", icon: <FiMusic />, courses: 320, color: "from-red-500 to-pink-500" },
        { name: "Photography", icon: <FiCamera />, courses: 280, color: "from-cyan-500 to-blue-500" },
        { name: "Health", icon: <FaRegSmile />, courses: 410, color: "from-green-500 to-emerald-500" }
      ];
      setCategories(categoryList);

      // Set instructors
      const instructorList = [
        { name: "Dr. Sarah Chen", role: "Data Science Expert", students: 24500, rating: 4.9 },
        { name: "Prof. James Wilson", role: "Senior Developer", students: 18900, rating: 4.8 },
        { name: "Ms. Maria Garcia", role: "Business Strategist", students: 15600, rating: 4.7 },
        { name: "Mr. David Kumar", role: "AI & ML Specialist", students: 21200, rating: 4.9 }
      ];
      setInstructors(instructorList);

      // Set testimonials
      const testimonialList = [
        { name: "Rahul Sharma", role: "Software Engineer", text: "The courses helped me switch careers and land my dream job at Google.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" },
        { name: "Priya Patel", role: "Marketing Manager", text: "Practical projects and real-world examples made learning incredibly effective.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" },
        { name: "Amit Singh", role: "Data Analyst", text: "The quality of instruction surpassed any other platform I've tried.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit" }
      ];
      setTestimonials(testimonialList);

    } catch (error) {
      console.error("Error fetching home data:", error);
      toast.error("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Course Card Component
  const CourseCard = ({ course, index }) => {
    const enrolled = isCourseEnrolled(course.id);
    const isFree = isCourseFree(course);
    const finalPrice = course.discountPrice && course.discountPrice < course.price 
      ? course.discountPrice 
      : course.price;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -8 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-2xl transition-all cursor-pointer group"
        onClick={() => navigate(`/course/${course.id}`)}
      >
        <div className="relative overflow-hidden">
          <img
            src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
              <FiPlayCircle size={24} />
              <span className="font-bold text-sm">Preview Course</span>
            </div>
          </div>
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {course.discountPrice && course.discountPrice < course.price && (
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                SAVE {Math.round(((course.price - course.discountPrice) / course.price) * 100)}%
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              course.level === "beginner" ? "bg-emerald-100 text-emerald-700" :
              course.level === "intermediate" ? "bg-blue-100 text-blue-700" :
              "bg-red-100 text-red-700"
            }`}>
              {course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : "All Levels"}
            </span>
          </div>
          
          {/* Course Badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {course.isBestseller && (
              <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Bestseller
              </div>
            )}
            {course.isGlobal && (
              <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Global
              </div>
            )}
            {enrolled && (
              <div className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Enrolled
              </div>
            )}
            {isFree && !enrolled && (
              <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                FREE
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
            {course.title || "Untitled Course"}
          </h3>
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">
            {course.description || "No description available"}
          </p>
          
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <span className="flex items-center gap-1">
              <FaChalkboardTeacher /> {course.instructorName?.split(" ")[0] || "Instructor"}
            </span>
            <span className="flex items-center gap-1">
              <FiUsers /> {(course.enrolledStudents || 0).toLocaleString()} students
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              {course.discountPrice && course.discountPrice < course.price ? (
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-slate-800">
                    ₹{course.discountPrice}
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    ₹{course.price}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold text-slate-800">
                  {isFree ? "FREE" : `₹${course.price || 0}`}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-500">
                <FiStar className="fill-current" size={14} /> {course.rating || 4.8}
              </div>
              <span className="text-xs text-slate-400">({course.totalReviews || "No"})</span>
            </div>
          </div>

          {/* Dynamic Button based on enrollment status */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (enrolled) {
                navigate(`/course/${course.id}/learn`);
              } else if (isFree) {
                handleEnroll(course);
              } else {
                handlePurchase(course);
              }
            }}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              enrolled
                ? "bg-green-600 hover:bg-green-700 text-white"
                : isFree
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {enrolled ? (
              <>
                <FiPlayCircle /> Go to Course
              </>
            ) : isFree ? (
              <>
                <FiLock /> Enroll for Free
              </>
            ) : (
              <>
                <FiShoppingCart /> Buy Now
              </>
            )}
          </button>
          
          {/* Add to Wishlist button */}
          {!enrolled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  toast.error("Please login to add to wishlist!");
                  navigate("/login");
                } else {
                  toast.info("Added to wishlist!");
                }
              }}
              className="w-full mt-3 py-2 border border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <FiHeart /> Add to Wishlist
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  // Hero Section Floating Course Cards
  const FloatingCourseCard = ({ course, position }) => {
    const enrolled = isCourseEnrolled(course.id);
    const isFree = isCourseFree(course);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: position === "top" ? 0.3 : 0.5 }}
        className={`absolute ${position === "top" ? "-top-8 -right-8" : "-bottom-8 -left-8"} w-64 bg-white rounded-2xl shadow-2xl p-4 z-20`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-500 rounded-lg flex items-center justify-center text-white font-bold">
            {course.title?.substring(0, 2).toUpperCase() || "JS"}
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{course.title}</h4>
            <p className="text-xs text-slate-500">{course.rating} ★ ({(course.enrolledStudents || 0).toLocaleString()})</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-900">
            {isFree ? "FREE" : `₹${course.discountPrice || course.price}`}
          </span>
          <button
            onClick={() => {
              if (enrolled) {
                navigate(`/course/${course.id}/learn`);
              } else if (isFree) {
                handleEnroll(course);
              } else {
                handlePurchase(course);
              }
            }}
            className={`text-xs px-3 py-1 rounded-lg font-bold ${
              enrolled
                ? "bg-green-600 text-white"
                : isFree
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {enrolled ? "Go to Course" : isFree ? "Enroll Free" : "Enroll Now"}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Learnify - Online Learning Platform</title>
        <meta name="description" content="Learn new skills with expert-led courses. Join 125,000+ students in mastering programming, business, design, and more." />
      </Helmet>

      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white min-h-screen">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
              >
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <FiZap className="text-amber-400" />
                  <span className="text-sm font-bold">Join 125,000+ Successful Students</span>
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight">
                  Learn Without <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">
                    Limits.
                  </span>
                </h1>
                
                <p className="text-xl text-slate-300 mb-10 max-w-lg leading-relaxed">
                  Master in-demand skills with courses taught by industry experts. 
                  Transform your career with hands-on projects and personalized learning paths.
                </p>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-8">
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="What do you want to learn today?"
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl py-4 pl-14 pr-4 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-shadow"
                    >
                      Search
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="text-sm text-white/60">Trending:</span>
                    {["Python", "React", "Digital Marketing", "Excel", "AI", "UX Design"].map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </form>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-emerald-400" />
                    <span className="text-sm">30-Day Money Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiAward className="text-amber-400" />
                    <span className="text-sm">Certified Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiShield className="text-blue-400" />
                    <span className="text-sm">Secure Payments</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                {/* Floating Course Cards */}
                <FloatingCourseCard 
                  course={{
                    id: "js-mastery",
                    title: "JavaScript Mastery",
                    price: 6999,
                    discountPrice: 3499,
                    rating: 4.8,
                    enrolledStudents: 2400,
                    instructorName: "John Doe"
                  }}
                  position="top"
                />
                
                <FloatingCourseCard 
                  course={{
                    id: "data-science",
                    title: "Data Science",
                    price: 4999,
                    rating: 4.9,
                    enrolledStudents: 3100,
                    instructorName: "Jane Smith"
                  }}
                  position="bottom"
                />
                
                <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                    className="w-full h-[500px] object-cover"
                    alt="Students learning"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. Stats Section */}
        <section className="py-16 bg-gradient-to-r from-red-50 via-white to-red-50">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "Active Students", value: stats.totalStudents.toLocaleString(), icon: <FiUsers />, color: "text-blue-600" },
                { label: "Expert Courses", value: stats.totalCourses.toLocaleString(), icon: <FiBookOpen />, color: "text-emerald-600" },
                { label: "Top Instructors", value: stats.totalInstructors.toLocaleString(), icon: <FaChalkboardTeacher />, color: "text-purple-600" },
                { label: "Success Rate", value: `${stats.successRate}%`, icon: <FiTrendingUp />, color: "text-amber-600" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-all"
                >
                  <div className={`text-4xl mb-4 ${stat.color}`}>{stat.icon}</div>
                  <div className="text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-slate-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Global Courses Section */}
        {globalCourses.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    <FiGlobe /> Global Courses
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
                    Courses Available Worldwide
                  </h2>
                  <p className="text-lg text-slate-600 max-w-2xl">
                    Explore courses available to students globally
                  </p>
                </div>
                <button 
                  onClick={() => navigate("/courses?filter=global")}
                  className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 group"
                >
                  View All Global Courses
                  <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {globalCourses.slice(0, 6).map((course, index) => (
                    <CourseCard key={course.id} course={course} index={index} />
                  ))}
                </div>
              )}
              
              {globalCourses.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 rounded-full bg-blue-100 text-blue-600 mb-4">
                    <FiGlobe size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Global Courses Yet</h3>
                  <p className="text-slate-600">Global courses will appear here once published.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Categories Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
                  Explore Popular Categories
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl">
                  Discover courses across 100+ categories, from technology to creative arts
                </p>
              </div>
              <button 
                onClick={() => navigate("/categories")}
                className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 group"
              >
                Browse All Categories
                <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-red-200 hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/category/${category.name.toLowerCase().replace(" ", "-")}`)}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${category.color} text-white mb-4`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-slate-500 text-sm mb-3">
                    {category.courses.toLocaleString()} Courses
                  </p>
                  <div className="flex items-center text-red-600 font-bold text-sm">
                    Explore <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Featured Courses */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <FiAward /> Featured Courses
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
                  Most Popular Courses
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl">
                  Join thousands of students learning these top-rated courses
                </p>
              </div>
              <button 
                onClick={() => navigate("/courses")}
                className="flex items-center gap-2 text-red-600 font-bold hover:text-red-700 group"
              >
                View All Courses
                <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredCourses.map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))}
              </div>
            )}
            
            {featuredCourses.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="inline-flex p-4 rounded-full bg-red-100 text-red-600 mb-4">
                  <FiAward size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Featured Courses Yet</h3>
                <p className="text-slate-600">Featured courses will appear here once added.</p>
              </div>
            )}
          </div>
        </section>

        {/* 6. Trending Courses */}
        {trendingCourses.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    <FiTrendingUp /> Trending Now
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
                    Hot & Trending Courses
                  </h2>
                  <p className="text-lg text-slate-600 max-w-2xl">
                    Most enrolled courses this month
                  </p>
                </div>
                <button 
                  onClick={() => navigate("/courses?sort=trending")}
                  className="flex items-center gap-2 text-amber-600 font-bold hover:text-amber-700 group"
                >
                  View All Trending
                  <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingCourses.slice(0, 3).map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 7. Why Choose Us */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
                Why Learn With Us?
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                We're committed to providing the best learning experience with these key benefits
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <FaChalkboardTeacher className="text-4xl" />,
                  title: "Expert Instructors",
                  description: "Learn from industry professionals with years of practical experience",
                  color: "text-blue-600"
                },
                {
                  icon: <FiTarget className="text-4xl" />,
                  title: "Project-Based Learning",
                  description: "Build real-world projects that showcase your skills to employers",
                  color: "text-emerald-600"
                },
                {
                  icon: <FaCertificate className="text-4xl" />,
                  title: "Career Certificates",
                  description: "Earn industry-recognized certificates to boost your career",
                  color: "text-amber-600"
                },
                {
                  icon: <FiClock className="text-4xl" />,
                  title: "Lifetime Access",
                  description: "Access course materials anytime, with lifetime updates included",
                  color: "text-purple-600"
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="text-center p-6"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-white ${feature.color} mb-6 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Testimonials */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">
                Student Success Stories
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Hear from our students who transformed their careers with our courses
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                      <p className="text-slate-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 italic mb-6">"{testimonial.text}"</p>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className="fill-current" />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. CTA Section */}
        <section className="py-20 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <h2 className="text-3xl lg:text-5xl font-black mb-6">
                Start Your Learning Journey Today
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
                Join thousands of students who have transformed their careers with our courses. 
                No prior experience required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/signup")}
                  className="px-8 py-4 bg-white text-red-600 rounded-xl font-bold text-lg hover:bg-slate-100 transition-colors shadow-2xl"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate("/courses")}
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
                >
                  Browse Courses
                </button>
              </div>
              
              <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-300" />
                  <span>30-Day Money-Back Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiGlobe className="text-blue-300" />
                  <span>Learn From Anywhere</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-amber-300" />
                  <span>Self-Paced Learning</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;