import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
import { FiPlus, FiVideo, FiUploadCloud, FiClock, FiCheck, FiArrowRight, FiInfo } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

const FacultyMyCourses = () => {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Course Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Web Development",
    price: "",
    description: "",
    thumbnail: null
  });

  useEffect(() => {
    if (!userProfile?.uid) return;
    // Sirf is teacher ke courses fetch karein
    const q = query(collection(db, "courses"), where("instructorId", "==", userProfile.uid));
    const unsub = onSnapshot(q, (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [userProfile]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let url = "";
      if (formData.thumbnail) {
        const storageRef = ref(storage, `thumbnails/${Date.now()}_${formData.thumbnail.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, formData.thumbnail);
        url = await getDownloadURL(uploadTask.ref);
      }

      // Add to Firestore - Global visibility enabled
      await addDoc(collection(db, "courses"), {
        ...formData,
        thumbnail: url,
        instructorId: userProfile.uid,
        instructorName: userProfile.name,
        status: "active", 
        isGlobal: true, // Home page sync enabled
        createdAt: serverTimestamp(),
        enrolledStudents: 0
      });

      toast.success("Academy Updated Globally!");
      setShowAdd(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-10">
      <Toaster />
      
      {/* Header - Mobile Responsive Padding */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Course <span className="text-blue-600">Architect</span></h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Design your curriculum for the world</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-full md:w-max bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl">
          <FiPlus className="inline mr-2" /> Start New Build
        </button>
      </div>

      {/* Course Cards Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group">
            <div className="h-56 bg-slate-100 relative overflow-hidden">
              <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest">
                ${course.price}
              </div>
            </div>
            <div className="p-10">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">{course.category}</span>
              <h3 className="text-xl font-black text-slate-900 uppercase italic mt-2 leading-tight">{course.title}</h3>
              <div className="flex items-center gap-6 mt-8">
                <button onClick={() => window.location.href = `/faculty/courses/manage/${course.id}`} className="flex-1 bg-slate-50 text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                   Manage Content
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal - Mobile Optimized Fullscreen on Small Screens */}
      {showAdd && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-xl">
          <div className="bg-white w-full max-w-2xl h-full md:h-auto md:rounded-[4rem] p-10 md:p-16 shadow-2xl overflow-y-auto">
            <h2 className="text-3xl font-black uppercase italic mb-10 tracking-tighter">New <span className="text-blue-600">Academy Build</span></h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <input type="text" placeholder="COURSE TITLE" className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-black text-[12px] uppercase tracking-widest border border-slate-100" required onChange={(e) => setFormData({...formData, title: e.target.value})} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="bg-slate-50 p-6 rounded-2xl outline-none font-black text-[10px] uppercase border border-slate-100" onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option>Web Development</option>
                  <option>Mobile Apps</option>
                  <option>UI/UX Design</option>
                </select>
                <input type="number" placeholder="PRICE ($)" className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-black text-[12px] border border-slate-100" required onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>

              <textarea placeholder="DETAILED DESCRIPTION..." className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-bold h-32 border border-slate-100" required onChange={(e) => setFormData({...formData, description: e.target.value})} />

              <div className="border-4 border-dashed border-slate-50 p-10 rounded-[3rem] text-center bg-slate-50/50">
                <input type="file" className="hidden" id="file" onChange={(e) => setFormData({...formData, thumbnail: e.target.files[0]})} />
                <label htmlFor="file" className="cursor-pointer">
                  <FiUploadCloud className="mx-auto text-4xl text-slate-300 mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formData.thumbnail ? formData.thumbnail.name : "Drop Thumbnail Here"}</p>
                </label>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-6">
                <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl">
                  {loading ? "Initializing..." : "Launch Course"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-10 py-6 text-slate-400 font-black uppercase text-[10px]">Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyMyCourses;