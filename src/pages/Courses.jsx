import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, FiVideo, FiTrash2, FiEye, FiUpload, 
  FiImage, FiX, FiCheck, FiClock, FiUsers,
  FiTag, FiDollarSign, FiBookOpen, FiBarChart2,
  FiEdit2, FiShare2, FiCopy, FiSave, FiFilter,
  FiPlayCircle, FiLock, FiUnlock, FiDownload,
  FiGrid, FiList, FiSearch, FiStar, FiCalendar,
  FiPercent, FiExternalLink, FiZap, FiCloud,
  FiPlay, FiPause, FiLoader, FiCheckCircle,
  FiHeadphones, FiFileText, FiCode, FiMonitor,
  FiShoppingCart, FiShoppingBag, FiCreditCard,
  FiTrendingUp, FiGlobe, FiDatabase, FiServer,
  FiVideoOff, FiHardDrive, FiCpu, FiWifi
} from "react-icons/fi";
import { db, storage } from "../firebase";
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, 
  query, orderBy, updateDoc, where, getDocs, increment,
  arrayUnion
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [videoPreview, setVideoPreview] = useState(null);
  const [activeCourseForLecture, setActiveCourseForLecture] = useState(null);
  const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
  const [lectures, setLectures] = useState({});
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    difficulty: "all",
    priceRange: "all",
    planType: "all",
    status: "all"
  });
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [courseStats, setCourseStats] = useState({
    totalRevenue: 0,
    totalStudents: 0,
    totalLectures: 0,
    topCourses: []
  });

  const [lectureFormData, setLectureFormData] = useState({
    title: "",
    description: "",
    duration: "",
    videoUrl: "",
    videoFile: null,
    isFree: false,
    order: 0,
    type: "video",
    attachments: [],
    resources: []
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
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
    isPublished: true,
    isFeatured: false,
    isTrending: false,
    tags: [],
    planPricing: {
      lifetime: {
        price: "",
        discount: "",
        active: true
      },
      annual: {
        price: "",
        discount: "",
        active: false
      },
      monthly: {
        price: "",
        discount: "",
        active: false
      }
    },
    freeDemo: {
      enabled: true,
      lectures: []
    },
    ratings: {
      average: 0,
      count: 0,
      reviews: []
    },
    requirements: [],
    learningOutcomes: [],
    whatYouGet: [],
    curriculum: [],
    targetAudience: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    totalHours: 0,
    certificate: true,
    language: "English",
    subtitleLanguages: ["English"],
    accessibility: true,
    mobileFriendly: true,
    lifetimeAccess: true,
    assignments: 0,
    quizzes: 0,
    projects: 0,
    support: "Community + Instructor"
  });

  // Initialize with real-time data
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const coursesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
      setFilteredCourses(coursesData);
      
      // Load lectures for each course
      for (let course of coursesData) {
        await loadLecturesForCourse(course.id);
      }

      // Calculate stats
      calculateStats(coursesData);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchTerm, filters, courses]);

  const calculateStats = (coursesData) => {
    const totalRevenue = coursesData.reduce((acc, course) => 
      acc + (course.discountPrice || 0) * (course.students || 0), 0
    );
    
    const totalStudents = coursesData.reduce((acc, course) => 
      acc + (course.students || 0), 0
    );

    const totalLectures = Object.values(lectures).reduce((acc, courseLectures) => 
      acc + (courseLectures?.length || 0), 0
    );

    const topCourses = [...coursesData]
      .sort((a, b) => (b.students || 0) - (a.students || 0))
      .slice(0, 3);

    setCourseStats({
      totalRevenue,
      totalStudents,
      totalLectures,
      topCourses
    });
  };

  const loadLecturesForCourse = async (courseId) => {
    try {
      const lecturesQuery = query(
        collection(db, "courses", courseId, "lectures"),
        orderBy("order", "asc")
      );
      const lectureSnap = await getDocs(lecturesQuery);
      const lecturesData = lectureSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(prev => ({ ...prev, [courseId]: lecturesData }));
    } catch (error) {
      console.error("Error loading lectures:", error);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(course => course.category === filters.category);
    }

    // Difficulty filter
    if (filters.difficulty !== "all") {
      filtered = filtered.filter(course => course.difficulty === filters.difficulty);
    }

    // Price range filter
    if (filters.priceRange !== "all") {
      switch (filters.priceRange) {
        case "free":
          filtered = filtered.filter(course => course.discountPrice === 0);
          break;
        case "under1000":
          filtered = filtered.filter(course => course.discountPrice < 1000);
          break;
        case "1000-5000":
          filtered = filtered.filter(course => course.discountPrice >= 1000 && course.discountPrice <= 5000);
          break;
        case "5000+":
          filtered = filtered.filter(course => course.discountPrice > 5000);
          break;
      }
    }

    // Plan type filter
    if (filters.planType !== "all") {
      filtered = filtered.filter(course => course.planPricing?.[filters.planType]?.active);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(course => 
        filters.status === "published" ? course.isPublished : !course.isPublished
      );
    }

    setFilteredCourses(filtered);
  };

  // Simple image compression using canvas
  const compressImage = (file, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1920x1080)
          let width = img.width;
          let height = img.height;
          
          if (width > 1920) {
            height = (height * 1920) / width;
            width = 1920;
          }
          
          if (height > 1080) {
            width = (width * 1080) / height;
            height = 1080;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        // For images larger than 1MB, compress them
        if (file.size > 1024 * 1024) {
          const compressedFile = await compressImage(file);
          setSelectedFile(compressedFile);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(compressedFile);
        } else {
          // Use original file if small enough
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error("Image processing error:", error);
        // Fallback to original file
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleVideoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newQueue = [...uploadQueue];
      
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          // Create preview
          const previewUrl = URL.createObjectURL(file);
          
          // Add to queue
          newQueue.push({
            file,
            previewUrl,
            name: file.name,
            size: file.size,
            status: 'pending',
            progress: 0,
            id: Date.now() + Math.random()
          });
          
          // Start upload immediately
          uploadVideoToStorage(file, newQueue[newQueue.length - 1].id);
        }
      }
      
      setUploadQueue(newQueue);
    }
  };

  const uploadVideoToStorage = async (file, queueId) => {
    // Update status to uploading
    setUploadQueue(prev => prev.map(item => 
      item.id === queueId 
        ? { ...item, status: 'uploading' }
        : item
    ));

    try {
      const storageRef = ref(storage, `course-videos/${Date.now()}-${file.name.replace(/\s+/g, '_')}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          // Update progress in queue
          setUploadQueue(prev => prev.map(item => 
            item.id === queueId 
              ? { ...item, progress, status: 'uploading' }
              : item
          ));
          
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setUploadQueue(prev => prev.map(item => 
            item.id === queueId 
              ? { ...item, status: 'error' }
              : item
          ));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update status to completed
            setUploadQueue(prev => prev.map(item => 
              item.id === queueId 
                ? { 
                    ...item, 
                    status: 'completed', 
                    url: downloadURL,
                    progress: 100
                  }
                : item
            ));
            
            // Add to uploaded videos list
            setUploadedVideos(prev => [...prev, {
              url: downloadURL,
              name: file.name,
              size: file.size,
              uploadedAt: new Date().toISOString()
            }]);
            
            // Update video URL in form
            setLectureFormData(prev => ({
              ...prev,
              videoUrl: downloadURL
            }));
            
          } catch (error) {
            console.error("Get URL error:", error);
            setUploadQueue(prev => prev.map(item => 
              item.id === queueId 
                ? { ...item, status: 'error' }
                : item
            ));
          }
        }
      );
    } catch (error) {
      console.error("Upload initialization error:", error);
      setUploadQueue(prev => prev.map(item => 
        item.id === queueId 
          ? { ...item, status: 'error' }
          : item
      ));
    }
  };

  const uploadImageToStorage = async (file) => {
  setIsUploading(true);
  try {
    let fileToUpload = file;
    
    // Agar image 1MB se badi hai toh compress karein
    if (file.size > 1024 * 1024) {
      fileToUpload = await compressImage(file);
    }
    
    // YAHAN DHAYAN DEIN: unique name generate karein
    const storageRef = ref(storage, `course-thumbnails/${Date.now()}-${fileToUpload.name.replace(/\s+/g, '_')}`);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setIsUploading(false);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setIsUploading(false);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    setIsUploading(false);
    throw error;
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let thumbnailUrl = formData.thumbnail;
    
    if (selectedFile) {
      try {
        const uploadedUrl = await uploadImageToStorage(selectedFile);
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      } catch (error) {
        alert("Image upload failed: " + error.message);
        return;
      }
    }

    try {
      const courseData = {
        ...formData,
        thumbnail: thumbnailUrl,
        originalPrice: Number(formData.originalPrice) || 0,
        discountPrice: Number(formData.discountPrice) || 0,
        lessons: Number(formData.lessons) || 0,
        duration: `${formData.duration} hours`,
        totalHours: Number(formData.duration) || 0,
        planPricing: {
          lifetime: {
            price: Number(formData.planPricing.lifetime.price) || 0,
            discount: Number(formData.planPricing.lifetime.discount) || 0,
            active: formData.planPricing.lifetime.active
          },
          annual: {
            price: Number(formData.planPricing.annual.price) || 0,
            discount: Number(formData.planPricing.annual.discount) || 0,
            active: formData.planPricing.annual.active
          },
          monthly: {
            price: Number(formData.planPricing.monthly.price) || 0,
            discount: Number(formData.planPricing.monthly.discount) || 0,
            active: formData.planPricing.monthly.active
          }
        },
        tags: formData.tags.map(tag => tag.trim()).filter(tag => tag),
        requirements: formData.requirements.map(req => req.trim()).filter(req => req),
        learningOutcomes: formData.learningOutcomes.map(out => out.trim()).filter(out => out),
        whatYouGet: formData.whatYouGet.map(item => item.trim()).filter(item => item),
        targetAudience: formData.targetAudience.map(aud => aud.trim()).filter(aud => aud),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        instructorAvatar: userProfile?.photoURL || "",
        instructorBio: userProfile?.bio || "",
        featuredUntil: formData.isFeatured ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        trendingScore: formData.isTrending ? 100 : 0
      };

      const docRef = await addDoc(collection(db, "courses"), courseData);
      
      // Immediately update state to show new course
      const newCourse = { id: docRef.id, ...courseData };
      setCourses(prev => [newCourse, ...prev]);
      
      // Also update public courses collection for instant display
      try {
        await updateDoc(doc(db, "public_courses", docRef.id), courseData);
      } catch (error) {
        console.log("Public courses collection might not exist yet");
      }
      
      setIsModalOpen(false);
      resetForm();
      
      alert("Course created successfully! It's now live on the homepage.");
      
    } catch (err) { 
      alert("Error creating course: " + err.message); 
    }
  };

  const addLecture = async (courseId) => {
    if (!lectureFormData.title.trim()) {
      alert("Lecture title is required");
      return;
    }

    if (!lectureFormData.videoUrl && uploadQueue.filter(item => item.status === 'completed').length === 0) {
      alert("Please upload a video or provide a video URL");
      return;
    }

    try {
      let videoUrl = lectureFormData.videoUrl;
      
      // Use uploaded video if available
      const completedUpload = uploadQueue.find(item => item.status === 'completed');
      if (completedUpload) {
        videoUrl = completedUpload.url;
      }

      const lectureData = {
        ...lectureFormData,
        videoUrl: videoUrl,
        duration: `${lectureFormData.duration} min`,
        createdAt: new Date().toISOString(),
        courseId: courseId,
        instructorId: userProfile?.uid,
        views: 0,
        likes: 0,
        resources: lectureFormData.resources || [],
        attachments: lectureFormData.attachments || []
      };

      const lectureRef = await addDoc(collection(db, "courses", courseId, "lectures"), lectureData);

      // Update course statistics
      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, {
        lessons: increment(1),
        lastUpdated: new Date().toISOString()
      });

      // Update public version
      try {
        await updateDoc(doc(db, "public_courses", courseId), {
          lessons: increment(1),
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.log("Public courses update failed:", error);
      }

      // Also add to free demo if marked as free
      if (lectureFormData.isFree) {
        await updateDoc(courseRef, {
          "freeDemo.lectures": arrayUnion(lectureRef.id)
        });
      }

      // Reset and reload
      resetLectureForm();
      setUploadQueue([]);
      loadLecturesForCourse(courseId);
      setIsLectureModalOpen(false);
      
      alert("Lecture added successfully!");

    } catch (error) {
      alert("Error adding lecture: " + error.message);
    }
  };

  const publishCourse = async (courseId) => {
    try {
      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, {
        isPublished: true,
        publishedAt: new Date().toISOString()
      });

      // Also update public collection
      const course = courses.find(c => c.id === courseId);
      if (course) {
        try {
          await updateDoc(doc(db, "public_courses", courseId), {
            ...course,
            isPublished: true,
            publishedAt: new Date().toISOString()
          });
        } catch (error) {
          console.log("Public courses update failed:", error);
        }
      }

      alert("Course published successfully! It's now visible to students.");
    } catch (error) {
      alert("Error publishing course: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      shortDescription: "",
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
      isPublished: true,
      isFeatured: false,
      isTrending: false,
      tags: [],
      planPricing: {
        lifetime: {
          price: "",
          discount: "",
          active: true
        },
        annual: {
          price: "",
          discount: "",
          active: false
        },
        monthly: {
          price: "",
          discount: "",
          active: false
        }
      },
      freeDemo: {
        enabled: true,
        lectures: []
      },
      ratings: {
        average: 0,
        count: 0,
        reviews: []
      },
      requirements: [],
      learningOutcomes: [],
      whatYouGet: [],
      curriculum: [],
      targetAudience: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalHours: 0,
      certificate: true,
      language: "English",
      subtitleLanguages: ["English"],
      accessibility: true,
      mobileFriendly: true,
      lifetimeAccess: true,
      assignments: 0,
      quizzes: 0,
      projects: 0,
      support: "Community + Instructor"
    });
    setSelectedFile(null);
    setImagePreview("");
  };

  const resetLectureForm = () => {
    setLectureFormData({
      title: "",
      description: "",
      duration: "",
      videoUrl: "",
      videoFile: null,
      isFree: false,
      order: 0,
      type: "video",
      attachments: [],
      resources: []
    });
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const categories = ["Development", "Design", "Business", "Marketing", "Data Science", "Personal Development", "AI & ML", "DevOps"];
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "free", label: "Free" },
    { value: "under1000", label: "Under ₹1000" },
    { value: "1000-5000", label: "₹1000 - ₹5000" },
    { value: "5000+", label: "₹5000+" }
  ];
  const planTypes = [
    { value: "all", label: "All Plans" },
    { value: "lifetime", label: "Lifetime Access" },
    { value: "annual", label: "Annual Plan" },
    { value: "monthly", label: "Monthly Plan" }
  ];

  const calculateDiscount = (original, discount) => {
    if (!original || !discount || original <= discount) return 0;
    return Math.round(((original - discount) / original) * 100);
  };

  const formatPrice = (price) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <FiStar
            key={i}
            className={i < Math.floor(rating) ? "text-amber-500 fill-amber-500" : "text-gray-300"}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderPlanPricing = (course) => {
    const plans = [];
    if (course.planPricing?.lifetime?.active) {
      plans.push({ type: "lifetime", ...course.planPricing.lifetime });
    }
    if (course.planPricing?.annual?.active) {
      plans.push({ type: "annual", ...course.planPricing.annual });
    }
    if (course.planPricing?.monthly?.active) {
      plans.push({ type: "monthly", ...course.planPricing.monthly });
    }

    return plans.map((plan, idx) => (
      <div key={idx} className="flex items-center justify-between mb-2 last:mb-0">
        <span className="text-sm text-gray-600 capitalize">{plan.type}</span>
        <div className="flex items-center gap-2">
          {plan.discount > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(plan.price)}
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(plan.price - plan.discount)}
          </span>
          {plan.discount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              -{calculateDiscount(plan.price, plan.price - plan.discount)}%
            </span>
          )}
        </div>
      </div>
    ));
  };

  const UploadQueueItem = ({ item }) => {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            item.status === 'completed' ? 'bg-green-100 text-green-600' :
            item.status === 'uploading' ? 'bg-blue-100 text-blue-600' :
            item.status === 'error' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {item.status === 'completed' ? <FiCheckCircle /> :
             item.status === 'uploading' ? <FiCloud /> :
             item.status === 'error' ? <FiX /> :
             <FiLoader className="animate-spin" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {item.status === 'uploading' && (
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            item.status === 'completed' ? 'bg-green-100 text-green-700' :
            item.status === 'uploading' ? 'bg-blue-100 text-blue-700' :
            item.status === 'error' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        </div>
      </div>
    );
  };

  // Cleanup video previews on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      uploadQueue.forEach(item => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [videoPreview, uploadQueue]);

  return (
    <div className="min-h-screen space-y-8 p-4 md:p-8 bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced Header Section */}
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
              <h1 className="text-3xl font-bold text-gray-900">Course Studio</h1>
              <p className="text-gray-600">Create, manage, and publish courses instantly</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200">
              <span className="text-sm font-medium text-sky-700">
                {courses.length} Courses • {courseStats.totalStudents} Students
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Instructor: <span className="font-semibold text-gray-700">{userProfile?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FiTrendingUp className="text-green-500" />
              <span className="text-gray-700">₹{courseStats.totalRevenue.toLocaleString()} Revenue</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors">
            <FiTrendingUp />
            <span className="hidden md:inline">Analytics</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)} 
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-200 flex items-center gap-3"
          >
            <FiPlus className="text-xl" /> 
            <span className="hidden md:inline">Create Course</span>
            <span className="md:hidden">New</span>
          </button>
        </div>
      </motion.div>

      {/* Advanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Total Revenue", 
            value: formatPrice(courseStats.totalRevenue),
            icon: <FiTrendingUp />, 
            color: "emerald",
            sublabel: "From all courses",
            trend: "+12%"
          },
          { 
            label: "Active Students", 
            value: courseStats.totalStudents.toLocaleString(), 
            icon: <FiUsers />, 
            color: "sky",
            sublabel: "Enrolled students",
            trend: "+23%"
          },
          { 
            label: "Total Lectures", 
            value: courseStats.totalLectures, 
            icon: <FiVideo />, 
            color: "purple",
            sublabel: "Across all courses",
            trend: "+8%"
          },
          { 
            label: "Avg. Rating", 
            value: courses.length > 0 
              ? (courses.reduce((acc, course) => acc + (course.ratings?.average || 0), 0) / courses.length).toFixed(1)
              : "0.0", 
            icon: <FiStar />, 
            color: "amber",
            sublabel: "Student satisfaction",
            trend: "+0.4"
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:shadow-elevated transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-100 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.sublabel}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top Performing Courses */}
      {courseStats.topCourses.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Top Performing Courses</h2>
              <p className="text-gray-600 text-sm">Most enrolled courses this month</p>
            </div>
            <FiTrendingUp className="text-2xl text-emerald-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courseStats.topCourses.map((course, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    #{idx + 1}
                  </div>
                  {course.thumbnail && (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-12 h-12 rounded-xl object-cover absolute inset-0 opacity-20"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600">{course.students || 0} students</span>
                    <span className="text-sm font-medium text-emerald-600">
                      ₹{(course.discountPrice * (course.students || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, lectures, or tags..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"}`}
              >
                <FiGrid className="text-lg" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"}`}
              >
                <FiList className="text-lg" />
              </button>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
                <FiFilter />
                <span className="hidden md:inline">Filters</span>
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                      value={filters.difficulty}
                      onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                    >
                      <option value="all">All Levels</option>
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                      value={filters.priceRange}
                      onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                    >
                      {priceRanges.map(range => (
                        <option key={range.value} value={range.value}>{range.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setFilters({
                      category: "all",
                      difficulty: "all",
                      priceRange: "all",
                      planType: "all",
                      status: "all"
                    })}
                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Queue Section */}
      {uploadQueue.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600">
                <FiCloud className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Upload Queue</h3>
                <p className="text-sm text-gray-600">{uploadQueue.filter(item => item.status === 'completed').length} of {uploadQueue.length} completed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setUploadQueue([])}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadQueue.map((item, idx) => (
              <UploadQueueItem key={item.id || idx} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const discount = calculateDiscount(course.originalPrice, course.discountPrice);
            const courseLectures = lectures[course.id] || [];
            
            return (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden hover:shadow-elevated transition-all duration-300 group"
              >
                {/* Thumbnail with Status Badges */}
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
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiPlayCircle className="text-white text-xl" />
                        <span className="text-white text-sm font-medium">
                          {courseLectures.length} lectures
                        </span>
                      </div>
                      <button 
                        onClick={() => navigate(`/preview/${course.id}`)}
                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm rounded-lg hover:bg-white/30 transition-colors"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {!course.isPublished && (
                      <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Draft
                      </span>
                    )}
                    {course.isFeatured && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Featured
                      </span>
                    )}
                    {course.isTrending && (
                      <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Trending
                      </span>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {discount > 0 && (
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {discount}% OFF
                      </span>
                    )}
                    {course.freeDemo?.enabled && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Free Demo
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FiUsers className="text-gray-400" />
                        {course.instructor}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        course.difficulty === "Beginner" ? "bg-green-100 text-green-700" :
                        course.difficulty === "Intermediate" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {course.difficulty}
                      </span>
                      {renderStars(course.ratings?.average || 0)}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <FiClock className="text-gray-400" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiBookOpen className="text-gray-400" />
                      <span>{courseLectures.length} lectures</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiUsers className="text-gray-400" />
                      <span>{course.students || 0}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Lifetime Access</span>
                      <div className="flex items-center gap-2">
                        {course.planPricing?.lifetime?.discount > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(course.planPricing.lifetime.price)}
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(
                            (course.planPricing?.lifetime?.price || 0) - 
                            (course.planPricing?.lifetime?.discount || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/courses/manage/${course.id}`)}
                      className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-sky-600 hover:to-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FiEdit2 /> Manage
                    </button>
                    
                    <button 
                      onClick={() => {
                        setActiveCourseForLecture(course.id);
                        setIsLectureModalOpen(true);
                      }}
                      className="px-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                      title="Add Lecture"
                    >
                      <FiPlus className="text-lg" />
                    </button>
                    
                    <button 
                      onClick={() => publishCourse(course.id)}
                      disabled={course.isPublished}
                      className={`px-4 rounded-xl transition-colors duration-200 flex items-center justify-center ${
                        course.isPublished 
                          ? 'bg-green-100 text-green-600 cursor-default'
                          : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                      }`}
                      title={course.isPublished ? "Already Published" : "Publish Course"}
                    >
                      <FiGlobe />
                    </button>
                    
                    {userProfile?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this course?")) {
                            deleteDoc(doc(db, "courses", course.id));
                            try {
                              deleteDoc(doc(db, "public_courses", course.id));
                            } catch (error) {
                              console.log("Public courses delete failed:", error);
                            }
                          }
                        }}
                        className="px-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl transition-colors duration-200 flex items-center justify-center"
                        title="Delete Course"
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
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredCourses.map((course, index) => {
            const discount = calculateDiscount(course.originalPrice, course.discountPrice);
            const courseLectures = lectures[course.id] || [];
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden hover:shadow-elevated transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="md:w-64 h-48 md:h-auto relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiVideo className="text-white/20 text-5xl" />
                      </div>
                    )}
                    
                    {/* Status Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {!course.isPublished && (
                        <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                          {course.isFeatured && (
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">{course.shortDescription || course.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <FiUsers className="text-gray-400" />
                            <span>{course.instructor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiClock className="text-gray-400" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiBookOpen className="text-gray-400" />
                            <span>{courseLectures.length} lectures</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiUsers className="text-gray-400" />
                            <span>{course.students || 0} students</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {course.tags && course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {course.tags.slice(0, 5).map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pricing & Actions */}
                      <div className="lg:w-64 space-y-4">
                        <div>
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {formatPrice(course.discountPrice)}
                          </div>
                          {course.originalPrice > course.discountPrice && (
                            <div className="text-sm text-gray-400 line-through">
                              {formatPrice(course.originalPrice)}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/courses/manage/${course.id}`)}
                            className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <FiEdit2 /> Manage
                          </button>
                          
                          <button 
                            onClick={() => {
                              setActiveCourseForLecture(course.id);
                              setIsLectureModalOpen(true);
                            }}
                            className="px-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-colors duration-200 flex items-center justify-center"
                            title="Add Lecture"
                          >
                            <FiPlus />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center mb-6">
            <FiBookOpen className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600 mb-6">Try changing your filters or create a new course</p>
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
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Course</h2>
                  <p className="text-gray-600 text-sm">Course will be instantly available on homepage</p>
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
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Short Description *</label>
                      <input
                        type="text"
                        required
                        placeholder="Brief one-line description"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Full Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full Description *</label>
                    <textarea
                      placeholder="Detailed description about the course..."
                      rows="4"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Course Thumbnail *</label>
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
                            <p className="text-gray-500 text-sm">Auto-compressed • No size limit</p>
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                          >
                            Choose Image
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Pricing Plans</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["lifetime", "annual", "monthly"].map((planType) => (
                        <div key={planType} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700 capitalize">
                              {planType} Plan
                            </label>
                            <input
                              type="checkbox"
                              checked={formData.planPricing[planType].active}
                              onChange={(e) => setFormData({
                                ...formData,
                                planPricing: {
                                  ...formData.planPricing,
                                  [planType]: {
                                    ...formData.planPricing[planType],
                                    active: e.target.checked
                                  }
                                }
                              })}
                              className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <input
                              type="number"
                              placeholder="Price (₹)"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                              value={formData.planPricing[planType].price}
                              onChange={(e) => setFormData({
                                ...formData,
                                planPricing: {
                                  ...formData.planPricing,
                                  [planType]: {
                                    ...formData.planPricing[planType],
                                    price: e.target.value
                                  }
                                }
                              })}
                            />
                            <input
                              type="number"
                              placeholder="Discount (₹)"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                              value={formData.planPricing[planType].discount}
                              onChange={(e) => setFormData({
                                ...formData,
                                planPricing: {
                                  ...formData.planPricing,
                                  [planType]: {
                                    ...formData.planPricing[planType],
                                    discount: e.target.value
                                  }
                                }
                              })}
                            />
                          </div>
                        </div>
                      ))}
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
                      <label className="text-sm font-medium text-gray-700">Total Duration (hours) *</label>
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
                      <label className="text-sm font-medium text-gray-700">Estimated Modules *</label>
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

                  {/* Additional Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Featured Course</label>
                        <p className="text-gray-500 text-sm">Show on homepage</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                        className="w-6 h-6 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Free Demo</label>
                        <p className="text-gray-500 text-sm">Allow free preview</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.freeDemo.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          freeDemo: {
                            ...formData.freeDemo,
                            enabled: e.target.checked
                          }
                        })}
                        className="w-6 h-6 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="react, javascript, frontend, web-development"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                      value={formData.tags.join(", ")}
                      onChange={(e) => setFormData({
                        ...formData,
                        tags: e.target.value.split(",").map(tag => tag.trim())
                      })}
                    />
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Requirements (one per line)</label>
                    <textarea
                      placeholder="Basic JavaScript knowledge\nHTML/CSS basics\nComputer with internet"
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
                      value={formData.requirements.join("\n")}
                      onChange={(e) => setFormData({
                        ...formData,
                        requirements: e.target.value.split("\n").map(req => req.trim())
                      })}
                    />
                  </div>

                  {/* What You'll Get */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">What You'll Get (one per line)</label>
                    <textarea
                      placeholder="Certificate of completion\nLifetime access\nProject files\nCommunity access"
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
                      value={formData.whatYouGet.join("\n")}
                      onChange={(e) => setFormData({
                        ...formData,
                        whatYouGet: e.target.value.split("\n").map(item => item.trim())
                      })}
                    />
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
                        Creating Course...
                      </>
                    ) : (
                      <>
                        <FiSave /> Create & Publish Instantly
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Lecture Modal */}
      <AnimatePresence>
        {isLectureModalOpen && activeCourseForLecture && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
              onClick={() => {
                setIsLectureModalOpen(false);
                resetLectureForm();
                setUploadQueue([]);
              }}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Lecture</h2>
                  <p className="text-gray-600 text-sm">Upload video or add content</p>
                </div>
                <button 
                  onClick={() => {
                    setIsLectureModalOpen(false);
                    resetLectureForm();
                    setUploadQueue([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="text-gray-500 text-xl" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Video Upload Section */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Upload Video</label>
                    
                    {/* Upload Queue Display */}
                    {uploadQueue.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Upload Queue</h4>
                          <span className="text-sm text-gray-600">
                            {uploadQueue.filter(item => item.status === 'completed').length} / {uploadQueue.length} complete
                          </span>
                        </div>
                        <div className="space-y-2">
                          {uploadQueue.map((item, idx) => (
                            <UploadQueueItem key={item.id || idx} item={item} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Area */}
                    <div 
                      onClick={() => videoInputRef.current.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200 cursor-pointer"
                    >
                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoSelect}
                        accept="video/*"
                        multiple
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <FiVideo className="text-purple-600 text-2xl" />
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium text-lg">Drop videos here or click to upload</p>
                          <p className="text-gray-500 text-sm mt-1">
                            Supports MP4, MOV, AVI • Direct cloud upload • No size limit
                          </p>
                          <p className="text-gray-400 text-xs mt-2">
                            Multiple files supported • Uploads directly to cloud storage
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
                        >
                          Select Videos
                        </button>
                      </div>
                    </div>

                    {/* Or URL Input */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or enter video URL</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <input
                        type="url"
                        placeholder="https://example.com/video.mp4"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                        value={lectureFormData.videoUrl}
                        onChange={(e) => setLectureFormData({...lectureFormData, videoUrl: e.target.value})}
                      />
                      <button
                        type="button"
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                        onClick={() => {
                          if (lectureFormData.videoUrl) {
                            alert("Video URL added successfully!");
                          }
                        }}
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Lecture Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Lecture Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Introduction to React Hooks"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={lectureFormData.title}
                        onChange={(e) => setLectureFormData({...lectureFormData, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Duration (minutes) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="45"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={lectureFormData.duration}
                        onChange={(e) => setLectureFormData({...lectureFormData, duration: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      placeholder="Brief description of this lecture..."
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
                      value={lectureFormData.description}
                      onChange={(e) => setLectureFormData({...lectureFormData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Order Number *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                        value={lectureFormData.order}
                        onChange={(e) => setLectureFormData({...lectureFormData, order: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Free Preview</label>
                        <p className="text-gray-500 text-sm">Students can watch for free</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={lectureFormData.isFree}
                        onChange={(e) => setLectureFormData({...lectureFormData, isFree: e.target.checked})}
                        className="w-6 h-6 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsLectureModalOpen(false);
                      resetLectureForm();
                      setUploadQueue([]);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => addLecture(activeCourseForLecture)}
                    disabled={uploadQueue.some(item => item.status === 'uploading')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all duration-200 flex items-center gap-2"
                  >
                    {uploadQueue.some(item => item.status === 'uploading') ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FiSave /> Add Lecture
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