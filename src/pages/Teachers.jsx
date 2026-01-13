import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUser, FiMail, FiPhone, FiBook, FiCalendar,
  FiTrash2, FiPlus, FiSearch, FiCheckCircle, FiXCircle, FiKey, FiSend, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    subject: "",
    employeeId: "",
    joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Role based fetching
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 4: Compulsory Phone & Email Validation
      if (!newTeacher.phone || newTeacher.phone.length !== 10) {
        throw new Error("Phone number is compulsory (10 digits)");
      }
      
      const emailQuery = query(collection(db, "users"), where("email", "==", newTeacher.email.toLowerCase()));
      const phoneQuery = query(collection(db, "users"), where("phone", "==", newTeacher.phone));
      
      const [emailSnap, phoneSnap] = await Promise.all([getDocs(emailQuery), getDocs(phoneQuery)]);
      
      if (!emailSnap.empty) throw new Error("Email already registered");
      if (!phoneSnap.empty) throw new Error("Phone number already registered");

      // Database Integration
      await addDoc(collection(db, "users"), {
        name: newTeacher.name.trim(),
        email: newTeacher.email.toLowerCase().trim(),
        phone: newTeacher.phone.trim(), // Faculty OTP login ke liye zaroori
        department: newTeacher.department,
        subject: newTeacher.subject,
        employeeId: newTeacher.employeeId.toUpperCase(),
        joiningDate: newTeacher.joiningDate,
        role: "teacher", // Strict Role Assignment
        status: "active",
        createdAt: serverTimestamp(),
        loginMethods: ["phone-otp"], // Only OTP allowed for teachers
      });
      
      toast.success("Faculty added! They can now login via OTP.");
      setShowAddModal(false);
      setNewTeacher({ name: "", email: "", phone: "", department: "", subject: "", employeeId: "", joiningDate: new Date().toISOString().split('T')[0] });
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Faculty List</h1>
          <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-1 italic">Total Staff: {teachers.length}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl">
          <FiPlus /> Add Faculty
        </button>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teachers.map((t) => (
          <div key={t.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <FiUser size={28} />
              </div>
              <button onClick={() => deleteDoc(doc(db, "users", t.id))} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                <FiTrash2 />
              </button>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 leading-tight">{t.name}</h3>
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">{t.subject} • {t.employeeId}</p>

            <div className="mt-6 space-y-3 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 text-slate-500 text-xs font-bold"><FiPhone className="text-slate-300"/> +91 {t.phone}</div>
              <div className="flex items-center gap-3 text-slate-500 text-xs font-bold"><FiMail className="text-slate-300"/> {t.email}</div>
            </div>

            <div className="mt-6 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
              <FiKey /> OTP Login Only
            </div>
          </div>
        ))}
      </div>

      {/* Modern Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl z-[10000] overflow-hidden">
              <div className="p-10 pb-6 flex justify-between items-center border-b border-slate-50">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">New Faculty</h2>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><FiX size={20}/></button>
              </div>

              <form onSubmit={handleAddTeacher} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold" value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-sm" value={newTeacher.email} onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone (Compulsory)</label>
                    <input type="tel" required maxLength={10} className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-sm" value={newTeacher.phone} onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value.replace(/\D/g, '')})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                    <input type="text" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-sm" value={newTeacher.employeeId} onChange={(e) => setNewTeacher({...newTeacher, employeeId: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                    <input type="text" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-sm" value={newTeacher.subject} onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})} />
                  </div>
                </div>

                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                  <FiKey className="text-emerald-500 text-2xl"/>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase leading-relaxed">
                    Faculty access is tied to the phone number. OTP will be sent only to the registered number above.
                  </p>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all">
                  Register & Authorize
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;