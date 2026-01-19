import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { 
  FiPlayCircle, FiClock, FiGlobe, FiAward, FiCheck, 
  FiUsers, FiStar, FiChevronDown, FiYoutube, FiDownload,
  FiBook, FiVideo, FiFileText, FiMessageCircle,
  FiThumbsUp, FiShare2, FiBookmark, FiShoppingCart,
  FiChevronRight, FiTarget, FiBarChart2, FiHelpCircle
} from "react-icons/fi";
import { FaChalkboardTeacher, FaCertificate, FaRegPlayCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [instructor, setInstructor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          const courseData = { id: courseDoc.id, ...courseDoc.data() };
          setCourse(courseData);

          // Check if user is enrolled
          if (user) {
            const enrollmentQuery = query(
              collection(db, "enrollments"),
              where("studentId", "==", user.uid),
              where("courseId", "==", courseId)
            );
            const enrollmentSnap = await getDocs(enrollmentQuery);
            setEnrolled(!enrollmentSnap.empty);
          }

          // Fetch lectures
          const lectsQuery = query(
            collection(db, `courses/${courseId}/lectures`),
            orderBy("order")
          );
          const lectsSnap = await getDocs(lectsQuery);
          const lecturesData = lectsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLectures(lecturesData);

          // Group lectures by section
          const groupedLectures = lecturesData.reduce((acc, lecture) => {
            const section = lecture.section || "Course Content";
            if (!acc[section]) acc[section] = [];
            acc[section].push(lecture);
            return acc;
          }, {});

          setLectures(groupedLectures);
          Object.keys(groupedLectures).forEach(section => {
            setOpenSections(prev => ({ ...prev, [section]: false }));
          });

          // Fetch instructor
          if (courseData.instructorId) {
            const instructorDoc = await getDoc(doc(db, "users", courseData.instructorId));
            if (instructorDoc.exists()) {
              setInstructor(instructorDoc.data());
            }
          }

          // Fetch reviews
          const reviewsQuery = query(
            collection(db, `courses/${courseId}/reviews`),
            orderBy("createdAt", "desc"),
            limit(5)
          );
          const reviewsSnap = await getDocs(reviewsQuery);
          setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleEnroll = () => {
    if (!user) {
      toast.error("Please login to enroll in this course");
      navigate("/login", { state: { returnTo: `/course/${courseId}` } });
      return;
    }
    
    if (enrolled) {
      navigate(`/course/learn/${courseId}`);
    } else {
      navigate(`/checkout/${courseId}`);
    }
  };

  const calculateProgress = () => {
    if (!enrolled) return 0;
    // Calculate progress based on completed lectures
    const totalLectures = Object.values(lectures).flat().length;
    // You would fetch actual progress from Firestore
    return 0; // Replace with actual progress calculation
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Course Not Found</h1>
          <p className="text-slate-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  const totalLectures = Object.values(lectures).flat().length;
  const totalHours = Math.round(totalLectures * 0.5); // Assuming 30 minutes per lecture

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <button onClick={() => navigate("/")} className="hover:text-red-300 transition-colors">
                  Home
                </button>
              </li>
              <li><FiChevronRight className="text-slate-400" /></li>
              <li>
                <button 
                  onClick={() => navigate(`/category/${course.category?.toLowerCase()}`)}
                  className="hover:text-red-300 transition-colors capitalize"
                >
                  {course.category}
                </button>
              </li>
              <li><FiChevronRight className="text-slate-400" /></li>
              <li className="font-bold truncate">{course.title}</li>
            </ol>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-4xl lg:text-5xl font-black leading-tight">
                {course.title}
              </h1>
              
              <div className="text-lg text-slate-300 leading-relaxed">
                <p className={showFullDescription ? "" : "line-clamp-3"}>
                  {course.description || "No description available."}
                </p>
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-red-400 hover:text-red-300 font-bold text-sm mt-2"
                >
                  {showFullDescription ? "Show less" : "Show more"}
                </button>
              </div>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className="text-amber-400 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold">{course.rating || 4.8}</span>
                  <span className="text-slate-400">({course.totalRatings || "2.5k"} ratings)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FiUsers />
                  <span>{course.studentsEnrolled?.toLocaleString() || "5,432"} students</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FiClock />
                  <span>Last updated {new Date(course.updatedAt || course.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Instructor Info */}
              {instructor && (
                <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                    <img 
                      src={instructor.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.name}`}
                      alt={instructor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Created by</p>
                    <h3 className="font-bold text-lg">{instructor.name}</h3>
                    <p className="text-slate-400 text-sm">{instructor.title || "Senior Instructor"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Course Card */}
            <div className="sticky top-24 self-start">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                {/* Preview Video */}
                <div className="relative aspect-video group cursor-pointer">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaRegPlayCircle className="text-white text-5xl" />
                    <span className="absolute bottom-4 text-white text-xs font-bold">Preview this course</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Price */}
                  <div className="mb-6">
                    {course.discountPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">₹{course.discountPrice}</span>
                        <span className="text-lg text-slate-400 line-through">₹{course.price}</span>
                        <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                          {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="text-3xl font-black text-slate-900">₹{course.price}</span>
                    )}
                    <p className="text-slate-500 text-sm mt-1">30-Day Money-Back Guarantee</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleEnroll}
                      className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all ${
                        enrolled 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {enrolled ? 'Continue Learning' : 'Add to Cart'}
                    </button>
                    
                    <button className="w-full py-3 px-6 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                      Buy Now
                    </button>
                    
                    <button className="w-full py-3 px-6 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <FiBookmark /> Save for Later
                    </button>
                  </div>

                  {/* Course Includes */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-4">This course includes:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-slate-600">
                        <FiVideo className="text-red-600" /> {totalHours} hours on-demand video
                      </li>
                      <li className="flex items-center gap-2 text-slate-600">
                        <FiFileText className="text-red-600" /> {course.resources || 10} downloadable resources
                      </li>
                      <li className="flex items-center gap-2 text-slate-600">
                        <FiTarget className="text-red-600" /> Assignments & quizzes
                      </li>
                      <li className="flex items-center gap-2 text-slate-600">
                        <FiAward className="text-red-600" /> Certificate of completion
                      </li>
                      <li className="flex items-center gap-2 text-slate-600">
                        <FiClock className="text-red-600" /> Full lifetime access
                      </li>
                      <li className="flex items-center gap-2 text-slate-600">
                        <FiSmartphone className="text-red-600" /> Access on mobile and TV
                      </li>
                    </ul>
                  </div>

                  {/* Share & Gift */}
                  <div className="mt-6 flex gap-3">
                    <button className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                      <FiShare2 /> Share
                    </button>
                    <button className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50">
                      Gift this course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* What You'll Learn */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">What you'll learn</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {course.learningObjectives?.slice(0, 8).map((objective, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <FiCheck className="text-emerald-600 mt-1 flex-shrink-0" />
                    <span className="text-slate-700">{objective}</span>
                  </div>
                )) || (
                  <>
                    <div className="flex items-start gap-3">
                      <FiCheck className="text-emerald-600 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Master the fundamentals of {course.category}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <FiCheck className="text-emerald-600 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Build real-world projects</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <FiCheck className="text-emerald-600 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Get expert guidance and support</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <FiCheck className="text-emerald-600 mt-1 flex-shrink-0" />
                      <span className="text-slate-700">Prepare for industry certifications</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Course Content */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Course content</h2>
                <div className="text-slate-600">
                  <span className="font-bold">{totalLectures} lectures</span> • <span>{totalHours} total hours</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                {Object.entries(lectures).map(([sectionName, sectionLectures], sectionIndex) => (
                  <div key={sectionIndex} className="border-b border-slate-100 last:border-b-0">
                    <button
                      onClick={() => toggleSection(sectionName)}
                      className="w-full p-6 bg-slate-50 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <FiChevronDown className={`transition-transform ${openSections[sectionName] ? "rotate-180" : ""}`} />
                        <div>
                          <h3 className="font-bold text-slate-800">{sectionName}</h3>
                          <p className="text-sm text-slate-500">
                            {sectionLectures.length} lectures • {Math.round(sectionLectures.length * 0.5)} min
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400">{enrolled ? 'View' : 'Preview'}</span>
                    </button>
                    
                    <AnimatePresence>
                      {openSections[sectionName] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="divide-y divide-slate-100">
                            {sectionLectures.map((lecture, lectureIndex) => (
                              <div key={lecture.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <FiPlayCircle className="text-slate-400" />
                                  <div>
                                    <h4 className="font-medium text-slate-800">{lecture.title}</h4>
                                    <p className="text-sm text-slate-500">{lecture.duration || "5:30"}</p>
                                  </div>
                                </div>
                                {lecture.isFree && (
                                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                    PREVIEW
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Requirements</h2>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center gap-2">
                  <FiCheck className="text-emerald-600" />
                  Basic computer knowledge
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-emerald-600" />
                  Internet connection
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="text-emerald-600" />
                  Willingness to learn
                </li>
              </ul>
            </section>

            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Description</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed">
                  {course.longDescription || course.description || "This comprehensive course is designed to take you from beginner to advanced level. You'll learn industry best practices and gain hands-on experience through practical projects."}
                </p>
              </div>
            </section>

            {/* Instructor Details */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Instructor</h2>
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                      <img 
                        src={instructor?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor?.name}`}
                        alt={instructor?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{instructor?.name || "Expert Instructor"}</h3>
                    <p className="text-slate-600 mb-4">{instructor?.title || "Senior Industry Professional"}</p>
                    <div className="flex items-center gap-6 mb-4">
                      <div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar key={star} className="text-amber-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">Instructor Rating</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{instructor?.students || "10,000"}+</p>
                        <p className="text-sm text-slate-500">Students</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{instructor?.courses || "15"}</p>
                        <p className="text-sm text-slate-500">Courses</p>
                      </div>
                    </div>
                    <p className="text-slate-700">
                      {instructor?.bio || "With over 10 years of industry experience, I'm passionate about sharing knowledge and helping students achieve their goals. My teaching approach focuses on practical, real-world applications."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Student Reviews */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Student reviews</h2>
                <button className="text-red-600 font-bold hover:text-red-700">
                  See all reviews
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                        {review.studentName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <h4 className="font-bold">{review.studentName || "Student"}</h4>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar 
                              key={star} 
                              className={`${star <= review.rating ? "text-amber-400 fill-current" : "text-slate-300"}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-700 line-clamp-3">{review.comment}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                      <button className="flex items-center gap-1 hover:text-slate-700">
                        <FiThumbsUp /> Helpful
                      </button>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Course Stats */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Course Statistics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">Student Satisfaction</span>
                    <span className="text-sm font-bold">98%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 rounded-full h-2" style={{ width: "98%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">Completion Rate</span>
                    <span className="text-sm font-bold">85%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">Career Impact</span>
                    <span className="text-sm font-bold">92%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple-500 rounded-full h-2" style={{ width: "92%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Can I take this course for free?</h4>
                  <p className="text-sm text-slate-600">This course offers free preview lessons. Full access requires enrollment.</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">How long do I have access?</h4>
                  <p className="text-sm text-slate-600">You get lifetime access to all course materials.</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Is there a certificate?</h4>
                  <p className="text-sm text-slate-600">Yes, you'll receive a certificate upon completion.</p>
                </div>
                <button className="w-full text-center text-red-600 font-bold hover:text-red-700">
                  See all FAQs
                </button>
              </div>
            </div>

            {/* Similar Courses */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Students also bought</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-3 cursor-pointer group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={`https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80`}
                        alt="Related course"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-2">
                        Advanced {course.category} Masterclass
                      </h4>
                      <p className="text-sm text-slate-500">By Expert Instructor</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold">₹{course.price + 500}</span>
                        {course.discountPrice && (
                          <span className="text-sm text-slate-400 line-through">₹{course.price + 1000}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start learning?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join {course.studentsEnrolled?.toLocaleString() || "5,432"} students who have already enrolled</p>
          <button
            onClick={handleEnroll}
            className="px-8 py-4 bg-white text-red-600 rounded-xl font-bold text-lg hover:bg-slate-100 transition-colors shadow-2xl"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;