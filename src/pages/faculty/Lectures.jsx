import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiBookOpen, FiSearch, FiFilter, FiDownload, FiUpload,
  FiCalendar, FiClock, FiEye, FiEdit2, FiTrash2,
  FiShare2, FiPlus, FiPlayCircle, FiVideo, FiFileText,
  FiBarChart, FiUsers
} from "react-icons/fi";
import { MdOutlineVideoLibrary, MdOutlineClass } from "react-icons/md";
import { db, storage } from "../../firebase";
import { 
  collection, query, where, getDocs, orderBy, addDoc,
  serverTimestamp, onSnapshot, doc, deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Lectures = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    courseId: "",
    type: "video",
    file: null,
    duration: "",
    isPublic: true
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (!userProfile?.uid) return;
    fetchLectures();
    fetchCourses();
  }, [userProfile]);

  const fetchCourses = async () => {
    try {
      const coursesQuery = query(
        collection(db, "courses"),
        where("instructorId", "==", userProfile.uid)
      );
      const snapshot = await getDocs(coursesQuery);
      setCourses(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchLectures = async () => {
    try {
      const lecturesQuery = query(
        collection(db, "lectures"),
        where("instructorId", "==", userProfile.uid),
        orderBy("createdAt", "desc")
      );
      
      const unsubscribe = onSnapshot(lecturesQuery, (snapshot) => {
        const lecturesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setLectures(lecturesData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching lectures:", error);
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.file || !uploadData.title || !uploadData.courseId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      const file = uploadData.file;
      const timestamp = Date.now();
      const fileName = `${userProfile.uid}_${timestamp}_${file.name}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `lectures/${fileName}`);
      const uploadTask = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      // Find selected course
      const selectedCourse = courses.find(c => c.id === uploadData.courseId);
      
      // Save to Firestore
      await addDoc(collection(db, "lectures"), {
        title: uploadData.title,
        description: uploadData.description,
        courseId: uploadData.courseId,
        courseName: selectedCourse?.courseName || "Unknown Course",
        instructorId: userProfile.uid,
        instructorName: userProfile.name,
        type: uploadData.type,
        fileUrl: downloadURL,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        duration: uploadData.duration || "N/A",
        isPublic: uploadData.isPublic,
        views: 0,
        downloads: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success("Lecture uploaded successfully!");
      setShowUploadModal(false);
      setUploadData({
        title: "",
        description: "",
        courseId: "",
        type: "video",
        file: null,
        duration: "",
        isPublic: true
      });
      
      fetchLectures();
    } catch (error) {
      console.error("Error uploading lecture:", error);
      toast.error("Failed to upload lecture!");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) return;
    
    try {
      await deleteDoc(doc(db, "lectures", lectureId));
      toast.success("Lecture deleted successfully!");
    } catch (error) {
      console.error("Error deleting lecture:", error);
      toast.error("Failed to delete lecture!");
    }
  };

  const filteredLectures = lectures.filter(lecture => {
    const matchesSearch = lecture.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lecture.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === "all" || lecture.courseId === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const getFileIcon = (type) => {
    switch (type) {
      case 'video': return <FiVideo className="text-blue-600" />;
      case 'pdf': return <FiFileText className="text-rose-600" />;
      case 'presentation': return <FiBarChart className="text-amber-600" />;
      default: return <FiFileText className="text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lectures</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload and manage your lecture materials
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-md"
        >
          <FiUpload size={16} />
          Upload Lecture
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 p-5 rounded-2xl border border-blue-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Lectures</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{lectures.length}</p>
            </div>
            <MdOutlineVideoLibrary className="text-blue-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 p-5 rounded-2xl border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {lectures.reduce((sum, lecture) => sum + (lecture.views || 0), 0).toLocaleString()}
              </p>
            </div>
            <FiEye className="text-emerald-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-5 rounded-2xl border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {lectures.reduce((sum, lecture) => sum + (lecture.downloads || 0), 0).toLocaleString()}
              </p>
            </div>
            <FiDownload className="text-amber-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 p-5 rounded-2xl border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">45 min</p>
            </div>
            <FiClock className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search lectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </select>
            <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
              <FiFilter size={16} />
              Filter by Type
            </button>
          </div>
        </div>

        {/* Lectures Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lectures...</p>
          </div>
        ) : filteredLectures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLectures.map((lecture) => (
              <div key={lecture.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getFileIcon(lecture.type)}
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {lecture.type.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 mb-1">{lecture.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{lecture.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiBookOpen size={12} />
                          {lecture.courseName}
                        </span>
                        {lecture.duration && (
                          <span className="flex items-center gap-1">
                            <FiClock size={12} />
                            {lecture.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-gray-500">
                        <div className="font-medium text-gray-700">{formatFileSize(lecture.fileSize || 0)}</div>
                        <div className="mt-1">
                          {lecture.views || 0} views • {lecture.downloads || 0} downloads
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(lecture.fileUrl, '_blank')}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        title="View Lecture"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLecture(lecture.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete Lecture"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(lecture.fileUrl)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Share Link"
                      >
                        <FiShare2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Uploaded {lecture.createdAt?.toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => window.open(lecture.fileUrl, '_blank', 'download')}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <FiDownload size={12} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiBookOpen className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No lectures found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? "Try a different search term" : "Upload your first lecture to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Upload Lecture</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  placeholder="e.g., Introduction to React Hooks"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  rows="2"
                  placeholder="Brief description of the lecture..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course *
                  </label>
                  <select
                    value={uploadData.courseId}
                    onChange={(e) => setUploadData({...uploadData, courseId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.courseName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={uploadData.type}
                    onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF Document</option>
                    <option value="presentation">Presentation</option>
                    <option value="audio">Audio</option>
                    <option value="document">Document</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  value={uploadData.duration}
                  onChange={(e) => setUploadData({...uploadData, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  placeholder="e.g., 45 min, 1:30:00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File *
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <FiUpload className="text-3xl text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Videos, PDFs, Presentations, Documents (Max 100MB)
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  />
                  {uploadData.file && (
                    <div className="mt-3 p-2 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-emerald-700 font-medium">
                        Selected: {uploadData.file.name}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {formatFileSize(uploadData.file.size)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={uploadData.isPublic}
                  onChange={(e) => setUploadData({...uploadData, isPublic: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">
                  Make this lecture public to all students
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload size={16} />
                      Upload Lecture
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lectures;