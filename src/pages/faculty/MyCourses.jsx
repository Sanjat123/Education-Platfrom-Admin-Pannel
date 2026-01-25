import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiBookOpen, FiPlus, FiVideo, FiUpload, FiEye, 
  FiClock, FiFileText, FiChevronRight, FiEdit2, FiAlertCircle 
} from "react-icons/fi";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, query, where, onSnapshot, 
  addDoc, serverTimestamp, doc, updateDoc 
} from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

const MyCourses = () => {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({ title: "", category: "", description: "" });
  const [newLecture, setNewLecture] = useState({ title: "", videoUrl: "", duration: "" });

  useEffect(() => {
    if (!userProfile?.uid) return;
    // Sirf is teacher ke courses fetch karein
    const q = query(collection(db, "courses"), where("instructorId", "==", userProfile.uid));
    const unsub = onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [userProfile]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        instructorId: userProfile.uid,
        instructorName: userProfile.name,
        enrollments: 0,
        rating: 0,
        isPublished: false, // Initial state draft
        createdAt: serverTimestamp()
      });
      toast.success("Course shell created! Now add lectures.");
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error("Creation failed");
    }
  };

  const handleAddLecture = async (e) => {
    e.preventDefault();
    try {
      const courseRef = doc(db, "courses", selectedCourse.id);
      const updatedLectures = [...(selectedCourse.lectures || []), { ...newLecture, id: Date.now() }];
      
      await updateDoc(courseRef, { lectures: updatedLectures });
      toast.success("Lecture uploaded successfully!");
      setSelectedCourse(null);
      setNewLecture({ title: "", videoUrl: "", duration: "" });
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  return (
    <div className="space-y-8">
      <Toaster />
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">MY <span className="text-emerald-600">COURSES</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manage your academic content</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-emerald-600 transition-all">
          <FiPlus /> New Courses
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all">
            <div className="h-48 bg-slate-100 flex items-center justify-center relative">
              <FiBookOpen size={48} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              {!course.isPublished && (
                <div className="absolute top-6 right-6 bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Draft</div>
              )}
            </div>
            <div className="p-8">
              <h3 className="text-xl font-black text-slate-900 mb-2">{course.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-6">{course.description}</p>
              
              <div className="flex items-center gap-4 mb-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><FiVideo /> {course.lectures?.length || 0} Lectures</span>
                <span className="flex items-center gap-1"><FiEye /> {course.enrollments || 0} Students</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSelectedCourse(course)} className="flex-1 bg-slate-50 text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                  Manage Content
                </button>
                {/* Delete Permission Restricted */}
                <div className="p-4 text-slate-200" title="Only Admin can delete"><FiAlertCircle /></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Lecture Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic">Upload <span className="text-emerald-600">Lecture</span></h2>
                <button onClick={() => setSelectedCourse(null)}><FiX size={24}/></button>
              </div>
              <form onSubmit={handleAddLecture} className="space-y-5">
                <input type="text" placeholder="Lecture Title" required className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" value={newLecture.title} onChange={(e) => setNewLecture({...newLecture, title: e.target.value})} />
                <input type="text" placeholder="Video URL (Vimeo/Drive)" required className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" value={newLecture.videoUrl} onChange={(e) => setNewLecture({...newLecture, videoUrl: e.target.value})} />
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]">Publish Lecture</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyCourses;