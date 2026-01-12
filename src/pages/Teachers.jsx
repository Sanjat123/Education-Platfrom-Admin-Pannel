import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiUserPlus, FiMail, FiPhone, FiTrash2, FiX, FiCheckCircle } from "react-icons/fi";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "+91", subject: "", experience: "" });

  useEffect(() => {
    const q = query(collection(db, "teachers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "teachers"), {
        ...formData,
        role: "teacher",
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "+91", subject: "", experience: "" });
    } catch (err) { alert("Permissions Error: Apne Firebase rules update karein!"); }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Faculty</h1>
          <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-1">Personnel Management</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-sky-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 z-10"
        >
          <FiUserPlus className="text-xl" /> Register Teacher
        </button>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 relative shadow-sm hover:shadow-xl transition-all group overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black uppercase">
                {teacher.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 truncate max-w-[150px]">{teacher.name}</h3>
                <p className="text-sky-600 text-[10px] font-black uppercase tracking-widest">{teacher.subject}</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <p className="flex items-center gap-3 text-slate-500 text-xs font-bold"><FiPhone className="text-slate-300"/> {teacher.phone}</p>
              <p className="flex items-center gap-3 text-slate-500 text-xs font-bold"><FiMail className="text-slate-300"/> {teacher.email}</p>
            </div>
            <button 
              onClick={() => deleteDoc(doc(db, "teachers", teacher.id))} 
              className="absolute top-8 right-8 text-slate-200 hover:text-rose-500 transition-colors"
            >
              <FiTrash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* --- BOX (MODAL) ENHANCED & FIXED POSITIONING --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-0">
            {/* Dark Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
              onClick={() => setIsModalOpen(false)} 
            />

            {/* Modal Box: Centered using Flexbox */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] z-[10000] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Box Header - Fixed */}
              <div className="p-10 pb-6 flex justify-between items-center bg-white border-b border-slate-50 sticky top-0 z-20">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Add Faculty</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Recruitment</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all hover:rotate-90"
                >
                  <FiX size={20}/>
                </button>
              </div>

              {/* Box Content - Scrollable */}
              <div className="p-10 pt-4 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                <form id="teacher-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Input */}
                  <div className="group space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-sky-500">Teacher's Full Name</label>
                    <input 
                      type="text" required 
                      className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-bold text-slate-900" 
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phone Input */}
                    <div className="group space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-sky-500">Phone</label>
                      <input 
                        type="text" required 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-bold text-slate-900" 
                        value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      />
                    </div>
                    {/* Experience Input */}
                    <div className="group space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-sky-500">Exp (Years)</label>
                      <input 
                        type="number" required 
                        className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-bold text-slate-900" 
                        value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Specialization Input */}
                  <div className="group space-y-2 pb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-sky-500">Specialization</label>
                    <input 
                      type="text" required placeholder="e.g. Next.js Expert"
                      className="w-full bg-slate-50 border-2 border-slate-200/50 p-5 rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-bold text-slate-900" 
                      value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                    />
                  </div>
                </form>
              </div>

              {/* Box Footer - Fixed at bottom */}
              <div className="p-10 bg-slate-50 border-t border-slate-100 rounded-b-[3.5rem]">
                <button 
                  type="submit" 
                  form="teacher-form"
                  className="w-full bg-slate-900 text-white py-6 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-sky-600 transition-all active:scale-95"
                >
                  Register Teacher Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;