import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiX, 
  FiPlay, 
  FiClock, 
  FiUsers, 
  FiStar, 
  FiLock, 
  FiUnlock,
  FiFileText,
  FiDownload,
  FiCalendar,
  FiCheckCircle,
  FiChevronRight
} from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";

const CoursePreviewModal = ({ course, onClose, onEnroll }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFullDescription, setShowFullDescription] = useState(false);

  const previewLessons = [
    { id: 1, title: "Course Introduction", duration: "5:30", isFree: true },
    { id: 2, title: "Getting Started", duration: "8:15", isFree: true },
    { id: 3, title: "Basic Concepts", duration: "12:45", isFree: false }
  ];

  const features = [
    "Lifetime Access",
    "Certificate of Completion",
    "Downloadable Resources",
    "Q&A Support",
    "Mobile Access",
    "Assignments & Projects"
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-6xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{course.title}</h2>
              <p className="text-slate-600">Preview Course Content</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full"
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="px-6">
            <div className="flex border-b">
              {["overview", "curriculum", "instructor", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium text-sm capitalize relative ${
                    activeTab === tab 
                      ? "text-red-600 border-b-2 border-red-600" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Course Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Course Thumbnail */}
                <div className="relative rounded-2xl overflow-hidden">
                  <img 
                    src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"}
                    alt={course.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold">
                          {course.level || "All Levels"}
                        </span>
                        <span className="text-sm">⭐ {course.rating || 4.5}/5.0</span>
                      </div>
                      <h3 className="text-xl font-bold">{course.title}</h3>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">About This Course</h3>
                  <div className={`text-slate-600 ${showFullDescription ? "" : "max-h-48 overflow-hidden"}`}>
                    <p className="mb-4">
                      {course.description || "This comprehensive course will take you from beginner to advanced level. Learn practical skills that you can apply immediately in real-world projects."}
                    </p>
                    <p className="mb-4">
                      Our expert instructors have designed this course with hands-on projects, real-world examples, and interactive exercises to ensure you master the concepts.
                    </p>
                    {showFullDescription && (
                      <>
                        <p className="mb-4">
                          Each module includes downloadable resources, practice exercises, and quizzes to test your understanding. By the end of this course, you'll have built real projects for your portfolio.
                        </p>
                        <h4 className="font-bold text-slate-800 mb-2">What You'll Build:</h4>
                        <ul className="list-disc pl-5 mb-4">
                          <li>Complete web application</li>
                          <li>Database integration</li>
                          <li>API development</li>
                          <li>Deployment to production</li>
                        </ul>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-red-600 hover:text-red-700 font-medium mt-2"
                  >
                    {showFullDescription ? "Show Less" : "Read More"}
                  </button>
                </div>

                {/* What You'll Learn */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">What You'll Learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Master fundamental concepts",
                      "Build real-world projects",
                      "Solve practical problems",
                      "Industry best practices",
                      "Career-ready skills",
                      "Portfolio development"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <FiCheckCircle className="text-emerald-600 mt-1 flex-shrink-0" />
                        <span className="text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Course Details */}
              <div className="space-y-6">
                {/* Price Card */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl p-6">
                  <div className="text-center mb-6">
                    {course.discountPrice ? (
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-slate-800">₹{course.discountPrice}</span>
                        <span className="text-lg text-slate-400 line-through ml-2">₹{course.price}</span>
                        <div className="text-sm text-emerald-600 font-bold mt-1">
                          Save ₹{course.price - course.discountPrice}
                        </div>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-slate-800 mb-2">₹{course.price || 0}</div>
                    )}
                    <div className="text-sm text-slate-600">One-time payment</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <button
                      onClick={onEnroll}
                      className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                    >
                      Enroll Now
                    </button>
                    <button className="w-full border border-red-600 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors">
                      Add to Wishlist
                    </button>
                  </div>

                  <div className="text-sm text-slate-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600" />
                      <span>30-Day Money-Back Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600" />
                      <span>Full Lifetime Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600" />
                      <span>Certificate of Completion</span>
                    </div>
                  </div>
                </div>

                {/* Course Features */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h4 className="font-bold text-slate-800 mb-4">This Course Includes</h4>
                  <div className="space-y-3">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <FiCheckCircle className="text-red-600" />
                        </div>
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{course.lessonsCount || 12}</div>
                      <div className="text-sm text-slate-600">Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{course.duration || "8 weeks"}</div>
                      <div className="text-sm text-slate-600">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{course.studentsEnrolled || 0}</div>
                      <div className="text-sm text-slate-600">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">{course.level || "All"}</div>
                      <div className="text-sm text-slate-600">Level</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "curriculum" && (
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-6">Course Curriculum</h3>
              
              {/* Free Preview Lessons */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FiUnlock className="text-emerald-600" /> Free Preview Lessons
                </h4>
                <div className="space-y-3">
                  {previewLessons
                    .filter(lesson => lesson.isFree)
                    .map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <FiPlay className="text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{lesson.title}</div>
                            <div className="text-sm text-slate-600">{lesson.duration}</div>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">
                          Watch Free
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Paid Lessons (Locked) */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FiLock className="text-red-600" /> Full Course Content (After Purchase)
                </h4>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((module) => (
                    <div key={module} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 p-4 font-bold text-slate-800">
                        Module {module}: Advanced Topics
                      </div>
                      <div className="p-4">
                        {[1, 2, 3].map((lesson) => (
                          <div key={lesson} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FiLock className="text-slate-400" />
                              <div>
                                <div className="font-medium text-slate-700">Lesson {lesson}: Advanced Concept</div>
                                <div className="text-sm text-slate-500">15:30</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-400">LOCKED</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "instructor" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-8 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-rose-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {course.teacherName?.charAt(0) || "I"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{course.teacherName || "Expert Instructor"}</h3>
                    <p className="text-slate-600 mb-4">Senior Instructor with 10+ years of experience</p>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-800">4.9</div>
                        <div className="text-sm text-slate-600">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-800">24,580</div>
                        <div className="text-sm text-slate-600">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-800">15</div>
                        <div className="text-sm text-slate-600">Courses</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-3">About the Instructor</h4>
                  <p className="text-slate-600">
                    With over a decade of experience in the industry, our instructor has trained thousands of students worldwide. They are passionate about making complex topics easy to understand and focus on practical, real-world applications.
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-3">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Web Development", "Data Science", "UI/UX Design", "Cloud Computing", "Machine Learning"].map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Student Reviews</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-3xl font-bold text-slate-800">4.8</div>
                    <div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
                      </div>
                      <div className="text-sm text-slate-600">Based on 1,248 reviews</div>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50">
                  Write a Review
                </button>
              </div>

              <div className="space-y-6">
                {[
                  { name: "Rajesh Kumar", rating: 5, date: "2 weeks ago", comment: "Excellent course! The instructor explains complex concepts in a simple way." },
                  { name: "Priya Sharma", rating: 4, date: "1 month ago", comment: "Very comprehensive content. The projects helped me understand real-world applications." },
                  { name: "Amit Patel", rating: 5, date: "2 months ago", comment: "Best investment in my career. Got a job offer after completing this course!" }
                ].map((review, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{review.name}</div>
                          <div className="text-sm text-slate-600">{review.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={i < review.rating ? "fill-current" : ""} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white border-t p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-bold text-slate-800">
                ₹{course.discountPrice || course.price || 0}
                {course.discountPrice && (
                  <span className="text-lg text-slate-400 line-through ml-2">₹{course.price}</span>
                )}
              </div>
              <div className="text-sm text-slate-600">One-time payment • Lifetime access</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
              >
                Close Preview
              </button>
              <button
                onClick={onEnroll}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center gap-2"
              >
                <FiShoppingCart /> Enroll Now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CoursePreviewModal;