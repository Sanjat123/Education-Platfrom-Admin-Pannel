import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiVideo, FiTrash2, FiChevronLeft, FiFolder, FiPlayCircle, FiX } from "react-icons/fi";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const ManageLectures = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [modules, setModules] = useState([]);
  const [isModuleModal, setIsModuleModal] = useState(false);
  const [isLectureModal, setIsLectureModal] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);

  const [moduleTitle, setModuleTitle] = useState("");
  const [lectureData, setLectureData] = useState({ title: "", videoUrl: "", duration: "" });

  useEffect(() => {
    // Fetch Modules for this specific course
    const q = query(collection(db, `courses/${courseId}/modules`), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setModules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [courseId]);

  const addModule = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, `courses/${courseId}/modules`), {
      title: moduleTitle,
      createdAt: new Date().toISOString()
    });
    setModuleTitle("");
    setIsModuleModal(false);
  };

  const addLecture = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, `courses/${courseId}/modules/${activeModuleId}/lectures`), {
      ...lectureData,
      createdAt: new Date().toISOString()
    });
    setLectureData({ title: "", videoUrl: "", duration: "" });
    setIsLectureModal(false);
  };

  return (
    <div className="space-y-8 animate-auth-entry p-4">
      {/* Header */}
      <div className="flex items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <button onClick={() => navigate(-1)} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
          <FiChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Curriculum</h1>
          <p className="text-slate-500 font-medium">Add chapters and video lectures to your course.</p>
        </div>
        <button onClick={() => setIsModuleModal(true)} className="btn-primary ml-auto px-8 py-4">
          <FiPlus /> New Module
        </button>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {modules.map((module) => (
          <div key={module.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-3">
                <FiFolder className="text-sky-500 text-xl" />
                <h3 className="text-lg font-black text-slate-800">{module.title}</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setActiveModuleId(module.id); setIsLectureModal(true); }}
                  className="flex items-center gap-2 text-xs font-bold bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition-all"
                >
                  <FiPlus /> Add Lecture
                </button>
                {userProfile?.role === 'admin' && (
                  <button onClick={() => deleteDoc(doc(db, `courses/${courseId}/modules`, module.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-item: Lectures list inside this module (Real-time display logic yahan add karein) */}
            <div className="p-4 space-y-2">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">Lectures in this module</p>
               {/* Note: In a full implementation, you'd add a sub-listener for lectures here */}
               <div className="p-4 flex items-center gap-4 bg-slate-50/30 rounded-2xl border border-dashed border-slate-100 text-slate-400 text-sm">
                 <FiPlayCircle /> Lecture list will appear here...
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Module Modal */}
      {isModuleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModuleModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tighter">Add Module</h2>
            <form onSubmit={addModule} className="space-y-4">
              <input 
                type="text" placeholder="e.g. Chapter 1: Introduction" required className="input-auth !bg-slate-50 !text-slate-900 !border-slate-200"
                value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)}
              />
              <button type="submit" className="btn-primary w-full py-4 font-bold">Create Module</button>
            </form>
          </div>
        </div>
      )}

      {/* Lecture Modal */}
      {isLectureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLectureModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tighter">Upload Lecture</h2>
            <form onSubmit={addLecture} className="space-y-4">
              <input type="text" placeholder="Lecture Title" required className="input-auth !bg-slate-50 !text-slate-900 !border-slate-200" value={lectureData.title} onChange={(e) => setLectureData({...lectureData, title: e.target.value})} />
              <input type="url" placeholder="Video Link (YouTube/Vimeo)" required className="input-auth !bg-slate-50 !text-slate-900 !border-slate-200" value={lectureData.videoUrl} onChange={(e) => setLectureData({...lectureData, videoUrl: e.target.value})} />
              <input type="text" placeholder="Duration (e.g. 10:30)" required className="input-auth !bg-slate-50 !text-slate-900 !border-slate-200" value={lectureData.duration} onChange={(e) => setLectureData({...lectureData, duration: e.target.value})} />
              <button type="submit" className="btn-primary w-full py-4 font-bold">Save Lecture</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLectures;