import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiUserPlus, FiMail, FiPhone, FiTrash2, FiX, FiSearch, FiCheckCircle } from "react-icons/fi";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ 
    name: "", email: "", phone: "+91", batch: "Full Stack", enrollmentDate: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), {
        ...formData,
        role: "student",
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "+91", batch: "Full Stack", enrollmentDate: new Date().toISOString().split('T')[0] });
    } catch (err) { alert("Error: " + err.message); }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header with Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Students</h1>
          <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-1">Enrollment Directory</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text" placeholder="Search by name or phone..." 
              className="bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl outline-none focus:border-sky-500/20 focus:bg-white transition-all w-full sm:w-64 text-sm font-bold"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-sky-600 transition-all shadow-xl active:scale-95"
          >
            <FiUserPlus className="text-xl" /> Enroll Student
          </button>
        </div>
      </div>

      {/* Student List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 relative shadow-sm hover:shadow-xl transition-all group overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 text-xl font-black">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 truncate max-w-[150px]">{student.name}</h3>
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{student.batch}</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <p className="flex items-center gap-3 text-slate-500 text-xs font-bold"><FiPhone className="text-slate-300"/> {student.phone}</p>
              <p className="flex items-center gap-3 text-slate-500 text-xs font-bold"><FiMail className="text-slate-300"/> {student.email}</p>
            </div>
            <button onClick={() => deleteDoc(doc(db, "students", student.id))} className="absolute top-8 right-8 text-slate-200 hover:text-rose-500 transition-colors">
              <FiTrash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* --- CENTERED STUDENT BOX (MODAL) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl z-[10000] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Box Header */}
              <div className="p-10 pb-6 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white z-20">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Enroll Student</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">New Admission Entry</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><FiX size={20}/></button>
              </div>

              {/* Box Body - Scrollable */}
              <div className="p-10 pt-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Name</label>
                    <input type="text" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none focus:border-sky-500/20 focus:bg-white transition-all font-bold text-slate-900" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input type="text" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-slate-900" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Batch</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-sm" value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})}>
                        <option>Full Stack</option>
                        <option>Data Science</option>
                        <option>UI/UX Design</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                    <input type="email" className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-slate-900" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                </form>
              </div>

              {/* Box Footer */}
              <div className="p-10 bg-slate-50 border-t border-slate-100 rounded-b-[3.5rem]">
                <button type="submit" form="student-form" className="w-full bg-slate-900 text-white py-6 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-sky-600 transition-all active:scale-95">
                  Confirm Admission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Students;