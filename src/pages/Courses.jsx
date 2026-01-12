import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, FiVideo, FiTrash2, FiEye, FiUpload, 
  FiImage, FiX, FiCheck, FiClock, FiUsers,
  FiTag, FiDollarSign, FiBookOpen, FiBarChart2,
  FiEdit2, FiShare2, FiCopy, FiSave
} from "react-icons/fi";
import { db, storage } from "../firebase";
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, 
  query, orderBy, updateDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    originalPrice: "",
    discountPrice: "",
    instructor: userProfile?.name || "Instructor",
    instructorId: userProfile?.uid,
    category: "Development",
    difficulty: "Beginner",
    duration: "",
    lessons: "",
    students: 0,
    thumbnail: "",
    isPublished: true
  });

  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `course-thumbnails/${Date.now()}-${selectedFile.name}`);
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setIsUploading(false);
      return downloadURL;
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let thumbnailUrl = formData.thumbnail;
    
    if (selectedFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        thumbnailUrl = uploadedUrl;
      }
    }

    try {
      await addDoc(collection(db, "courses"), {
        ...formData,
        thumbnail: thumbnailUrl,
        originalPrice: Number(formData.originalPrice),
        discountPrice: Number(formData.discountPrice),
        lessons: Number(formData.lessons),
        duration: `${formData.duration} hours`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roleSpecific: userProfile?.role,
        instructorAvatar: userProfile?.photoURL || ""
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err) { 
      alert(err.message); 
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: "", 
      description: "",
      originalPrice: "", 
      discountPrice: "", 
      instructor: userProfile?.name || "Instructor", 
      instructorId: userProfile?.uid,
      category: "Development", 
      difficulty: "Beginner", 
      duration: "", 
      lessons: "",
      students: 0,
      thumbnail: "",
      isPublished: true
    });
    setSelectedFile(null);
    setImagePreview("");
  };

  const categories = ["Development", "Design", "Business", "Marketing", "Data Science", "Personal Development"];
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const calculateDiscount = (original, discount) => {
    if (!original || !discount) return 0;
    return Math.round(((original - discount) / original) * 100);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  
  return (
    <div className="min-h-screen space-y-8 p-4 md:p-8 bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-3xl p-8 shadow-soft border border-gray-100"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg">
              <FiBookOpen className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600">Create and manage your educational content</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200">
              <span className="text-sm font-medium text-sky-700">
                {courses.length} Total Courses
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Role: <span className="font-semibold text-gray-700">{userProfile?.role}</span>
            </div>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)} 
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-200 flex items-center gap-3"
        >
          <FiPlus className="text-xl" /> 
          Create New Course
        </motion.button>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Courses", value: courses.length, icon: <FiBookOpen />, color: "sky" },
          { label: "Active Students", value: courses.reduce((acc, course) => acc + (course.students || 0), 0), icon: <FiUsers />, color: "emerald" },
          { label: "Avg. Price", value: formatPrice(courses.reduce((acc, course) => acc + course.discountPrice, 0) / (courses.length || 1)), icon: <FiDollarSign />, color: "amber" },
          { label: "Published", value: courses.filter(c => c.isPublished).length, icon: <FiCheck />, color: "green" },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:shadow-elevated transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-100 text-${stat.color}-600`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
            <div className="text-sm font-medium text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => {
          const discount = calculateDiscount(course.originalPrice, course.discountPrice);
          
          return (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden hover:shadow-elevated transition-all duration-300 group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiVideo className="text-white/20 text-5xl" />
                  </div>
                )}
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {discount}% OFF
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {course.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FiUsers className="text-gray-400" />
                      {course.instructor}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    course.difficulty === "Beginner" ? "bg-green-100 text-green-700" :
                    course.difficulty === "Intermediate" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Course Details */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <FiClock className="text-gray-400" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiBookOpen className="text-gray-400" />
                    <span>{course.lessons} modules</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{formatPrice(course.discountPrice)}</div>
                    {course.originalPrice > course.discountPrice && (
                      <div className="text-sm text-gray-400 line-through">
                        {formatPrice(course.originalPrice)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {course.students || 0} students
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/courses/manage/${course.id}`)}
                    className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-sky-600 hover:to-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FiEdit2 /> Manage
                  </button>
                  
                  {userProfile?.role === 'admin' && (
                    <button 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this course?")) {
                          deleteDoc(doc(db, "courses", course.id));
                        }
                      }}
                      className="px-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl transition-colors duration-200 flex items-center justify-center"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center mb-6">
            <FiBookOpen className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Create your first course to get started</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-200"
          >
            Create Your First Course
          </button>
        </motion.div>
      )}

      {/* Create Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
                  <p className="text-gray-600 text-sm">Fill in the course details below</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="text-gray-500 text-xl" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Course Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Course Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Advanced React Development"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      placeholder="Brief description about the course..."
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Course Thumbnail</label>
                    <div className="space-y-4">
                      {/* Preview */}
                      {(imagePreview || formData.thumbnail) && (
                        <div className="relative">
                          <img 
                            src={imagePreview || formData.thumbnail} 
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-xl border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview("");
                              setSelectedFile(null);
                              setFormData({...formData, thumbnail: ""});
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <FiX />
                          </button>
                        </div>
                      )}

                      {/* Upload Area */}
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-sky-400 hover:bg-sky-50/50 transition-all duration-200 cursor-pointer"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                            <FiUpload className="text-sky-600 text-xl" />
                          </div>
                          <div>
                            <p className="text-gray-700 font-medium">Upload thumbnail image</p>
                            <p className="text-gray-500 text-sm">PNG, JPG up to 5MB</p>
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                          >
                            Browse files
                          </button>
                        </div>
                      </div>

                      {/* Or URL Input */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">or enter image URL</span>
                        </div>
                      </div>

                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all text-sm"
                        value={formData.thumbnail}
                        onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Original Price (₹) *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="2999"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Discounted Price (₹) *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiDollarSign className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="1999"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                          value={formData.discountPrice}
                          onChange={(e) => setFormData({...formData, discountPrice: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Category *</label>
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Difficulty Level *</label>
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={formData.difficulty}
                        onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      >
                        {difficulties.map((diff) => (
                          <option key={diff} value={diff}>{diff}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Duration (hours) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="40"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Number of Modules *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="12"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={formData.lessons}
                        onChange={(e) => setFormData({...formData, lessons: e.target.value})}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="px-8 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-200 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiSave /> Create Course
                      </>
                    )}
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

export default Courses;