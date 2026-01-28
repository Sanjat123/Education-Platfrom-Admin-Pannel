import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebase";
import { 
  collection, query, where, onSnapshot, 
  addDoc, serverTimestamp, orderBy 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import { 
  FiFileText, FiPlus, FiUploadCloud, FiClock, 
  FiBook, FiShield, FiEdit3, FiX, FiCheckCircle, FiInfo 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const FacultyAssignments = () => {
  const { userProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isManualCourse, setIsManualCourse] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    customCourseName: "",
    type: "Assignment",
    dueDate: "",
    file: null
  });

  useEffect(() => {
    if (!userProfile?.uid) return;

    // Fetch Teacher's Courses
    const qCourses = query(collection(db, "courses"), where("instructorId", "==", userProfile.uid));
    const unsubCourses = onSnapshot(qCourses, (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Published Resources
    const qResources = query(
      collection(db, "resources"), 
      where("instructorId", "==", userProfile.uid),
      orderBy("createdAt", "desc")
    );
    const unsubResources = onSnapshot(qResources, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubCourses(); unsubResources(); };
  }, [userProfile]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return toast.error("Please select a file first!");
    if (!isManualCourse && !formData.courseId) return toast.error("Select a course or type manually");
    if (isManualCourse && !formData.customCourseName) return toast.error("Enter course name");

    setUploading(true);
    try {
      // CORS Safety: Remove spaces from filename
      const safeFileName = `${Date.now()}_${formData.file.name.replace(/\s+/g, '_')}`;
      const fileRef = ref(storage, `resources/${userProfile.uid}/${safeFileName}`);
      
      const uploadTask = uploadBytesResumable(fileRef, formData.file);

      uploadTask.on("state_changed", 
        (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => {
          console.error(err);
          toast.error("Upload Blocked: Please ensure CORS is enabled in Firebase.");
          setUploading(false);
        },
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, "resources"), {
            title: formData.title,
            courseId: isManualCourse ? "custom" : formData.courseId,
            courseName: isManualCourse ? formData.customCourseName : (courses.find(c => c.id === formData.courseId)?.title || "General"),
            type: formData.type,
            dueDate: formData.dueDate,
            fileUrl,
            fileName: formData.file.name,
            instructorId: userProfile.uid,
            instructorName: userProfile.name,
            createdAt: serverTimestamp(),
          });

          toast.success("Resource Published Successfully!");
          setShowAdd(false);
          setUploading(false);
          setProgress(0);
          setFormData({ title: "", courseId: "", customCourseName: "", type: "Assignment", dueDate: "", file: null });
        }
      );
    } catch (err) {
      toast.error("Process Failed: " + err.message);
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-10 max-w-[1600px] mx-auto">
      <Toaster position="top-right" />
      
      {/* 🟢 HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">
            Resource <span className="text-blue-500">Forge</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 italic">
            Global distribution of notes & tasks
          </p>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className="w-full md:w-max relative z-10 bg-white text-slate-900 px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl"
        >
          <FiPlus className="inline mr-2" /> Create New Material
        </button>
        <FiFileText className="absolute -bottom-10 -right-10 text-[15rem] text-white/5 -rotate-12" />
      </div>

      {/* 🔵 RESOURCES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={item.id} 
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                 <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${item.type === 'Assignment' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                   {item.type}
                 </span>
                 <div className="flex items-center gap-2 text-slate-200">
                    <FiShield className="group-hover:text-blue-500 transition-colors" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Protected</span>
                 </div>
              </div>

              <h3 className="font-black text-slate-900 uppercase italic text-xl leading-tight mb-2">{item.title}</h3>
              <p className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-2 mb-6">
                <FiBook className="text-slate-900" /> {item.courseName}
              </p>
              
              {item.dueDate && (
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                  <FiClock className="text-rose-500" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Submission Deadline</span>
                    <span className="text-[10px] font-black uppercase text-slate-700">{item.dueDate}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                 <a 
                   href={item.fileUrl} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                 >
                   <FiUploadCloud /> Access File
                 </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 🟠 ADD MATERIAL MODAL */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-2xl h-full md:h-auto md:rounded-[4rem] p-10 md:p-16 shadow-2xl overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">New <span className="text-blue-600">Material</span></h2>
                <button onClick={() => setShowAdd(false)} className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"><FiX /></button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Resource Title</label>
                  <input type="text" placeholder="E.G. ADVANCED REACT HOOKS PDF" className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-black text-[12px] uppercase border border-slate-100 focus:border-blue-500" required onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                
                {/* Course Selection Logic */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Target Course</label>
                    <button type="button" onClick={() => setIsManualCourse(!isManualCourse)} className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                      {isManualCourse ? "Switch to List" : "Type Manual Name"}
                    </button>
                  </div>

                  {isManualCourse ? (
                    <div className="relative">
                      <FiEdit3 className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input type="text" placeholder="ENTER CUSTOM COURSE NAME..." className="w-full bg-slate-50 p-6 pl-14 rounded-2xl outline-none font-black text-[11px] border border-blue-100 text-blue-600 uppercase" required onChange={(e) => setFormData({...formData, customCourseName: e.target.value})} />
                    </div>
                  ) : (
                    <select className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-black text-[11px] uppercase border border-slate-100" required onChange={(e) => setFormData({...formData, courseId: e.target.value})}>
                      <option value="">Choose Existing Academy Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  )}
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select className="bg-slate-50 p-6 rounded-2xl outline-none font-black text-[11px] uppercase border border-slate-100" onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="Assignment">Assignment</option>
                    <option value="Note">Lecture Notes</option>
                    <option value="Quiz">Quick Quiz</option>
                  </select>
                  <input type="date" className="bg-slate-50 p-6 rounded-2xl outline-none font-black text-[11px] border border-slate-100" onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                </div>

                {/* File Drop */}
                <div className="border-4 border-dashed border-slate-50 p-12 rounded-[3rem] text-center bg-slate-50/50 hover:bg-blue-50/30 transition-all group">
                  <input type="file" className="hidden" id="res-file" onChange={(e) => setFormData({...formData, file: e.target.files[0]})} />
                  <label htmlFor="res-file" className="cursor-pointer block">
                    <FiUploadCloud className="mx-auto text-4xl text-slate-300 mb-4 group-hover:text-blue-500 transition-colors" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                      {formData.file ? (
                        <span className="text-blue-600">{formData.file.name}</span>
                      ) : (
                        <>Drag & Drop PDF/Docs <br /><span className="text-[8px] opacity-60">Max 25MB recommended</span></>
                      )}
                    </p>
                  </label>
                </div>

                {/* Progress Bar */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="bg-blue-600 h-full"
                      />
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase text-center tracking-widest italic">{progress}% Syncing to Global Server</p>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 pt-6">
                  <button type="submit" disabled={uploading} className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50">
                    {uploading ? "Broadcasting..." : "Publish Globally"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyAssignments;