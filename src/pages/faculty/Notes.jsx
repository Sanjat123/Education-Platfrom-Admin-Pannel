import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { FiFolderPlus, FiFileText, FiDownload, FiTrash2, FiExternalLink, FiSearch, FiLayers } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

const FacultyNotes = () => {
  const { userProfile } = useAuth();
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({ title: "", type: "PDF", link: "", courseId: "" });

  useEffect(() => {
    if (!userProfile?.uid) return;

    // Fetch Teacher's Courses for Selection
    const qCourses = query(collection(db, "courses"), where("instructorId", "==", userProfile.uid));
    const unsubCourses = onSnapshot(qCourses, (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Uploaded Resources
    const qRes = query(collection(db, "resources"), where("instructorId", "==", userProfile.uid));
    const unsubRes = onSnapshot(qRes, (snap) => {
      setResources(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubCourses(); unsubRes(); };
  }, [userProfile]);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      await addDoc(collection(db, "resources"), {
        ...formData,
        courseName: selectedCourse?.title || "General",
        instructorId: userProfile.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Resource Shared Successfully!");
      setShowUpload(false);
    } catch (err) {
      toast.error("Upload failed");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure?")) {
      await deleteDoc(doc(db, "resources", id));
      toast.success("Deleted!");
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-10">
      <Toaster />
      
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col md:row justify-between items-center gap-6 bg-gradient-to-br from-white to-blue-50/20">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Study <span className="text-blue-600">Vault</span></h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Upload Syllabus & Lecture Materials</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-blue-100">
          <FiFolderPlus className="text-lg" /> Add New Resource
        </button>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {resources.map((res) => (
          <div key={res.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:translate-y-[-5px] transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-[1.5rem] flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <FiFileText />
              </div>
              <button onClick={() => handleDelete(res.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                <FiTrash2 />
              </button>
            </div>
            
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight mb-2">{res.title}</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">{res.courseName}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
               <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">{res.type}</span>
               <a href={res.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase group-hover:text-blue-600 transition-colors">
                 Access File <FiExternalLink />
               </a>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl relative">
            <h2 className="text-2xl font-black uppercase mb-8 tracking-tighter italic">Share <span className="text-blue-600">Material</span></h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <select className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold text-[10px] uppercase tracking-widest border border-slate-100" onChange={(e) => setFormData({...formData, courseId: e.target.value})} required>
                <option value="">Select Target Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input type="text" placeholder="Resource Title (e.g. Unit 1 Notes)" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300 border border-slate-100" onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              <select className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold text-[10px] uppercase border border-slate-100" onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="PDF">Document (PDF)</option>
                <option value="VIDEO">Video Lecture</option>
                <option value="LINK">External Link</option>
              </select>
              <input type="url" placeholder="Paste Resource Link (Drive/YouTube)" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300 border border-slate-100" onChange={(e) => setFormData({...formData, link: e.target.value})} required />
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all">Publish</button>
                <button type="button" onClick={() => setShowUpload(false)} className="px-8 text-slate-400 font-black uppercase text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyNotes;