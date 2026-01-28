import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { 
  collection, query, where, onSnapshot, 
  getDocs, doc, getDoc 
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { 
  FiUsers, FiMessageSquare, FiBook, 
  FiSearch, FiCheckCircle, FiShield, FiArrowRight 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const FacultyStudents = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const fetchMyStudents = async () => {
      try {
        // 1. Teacher ke saare Course IDs fetch karein
        const courseQ = query(collection(db, "courses"), where("instructorId", "==", userProfile.uid));
        const courseSnap = await getDocs(courseQ);
        const myCourseIds = courseSnap.docs.map(doc => doc.id);

        if (myCourseIds.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Sirf un courses ke enrollments dekhein
        const enrollQ = query(collection(db, "enrollments"), where("courseId", "in", myCourseIds));
        
        const unsub = onSnapshot(enrollQ, async (snap) => {
          const list = [];
          for (const d of snap.docs) {
            const enrollData = d.data();
            // Student details fetch karein
            const userSnap = await getDoc(doc(db, "users", enrollData.studentId));
            if (userSnap.exists()) {
              list.push({
                id: d.id,
                ...userSnap.data(),
                courseName: enrollData.courseName,
                progress: enrollData.progress || 0
              });
            }
          }
          setStudents(list);
          setLoading(false);
        });

        return () => unsub();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchMyStudents();
  }, [userProfile]);

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 space-y-10 max-w-[1600px] mx-auto">
      <Toaster />
      
      {/* 🟢 HEADER */}
      <div className="bg-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">My <span className="text-blue-600">Scholars</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 italic">Direct access to your enrolled students</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search student or course..." 
            className="w-full bg-slate-50 p-5 pl-14 rounded-2xl outline-none font-bold text-[11px] uppercase border-none focus:ring-4 ring-blue-500/5 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 🔵 STUDENT LIST */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center font-black uppercase text-slate-300 text-[10px] tracking-widest">Accessing Student Database...</div>
        ) : (
          <AnimatePresence>
            {filtered.map((student, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={student.id} 
                className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center gap-6 w-full">
                  <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center font-black text-white text-xl overflow-hidden shadow-lg">
                    {student.photoURL ? <img src={student.photoURL} className="w-full h-full object-cover" /> : student.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase italic text-lg leading-tight">{student.name}</h4>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span className="text-[9px] font-black text-blue-500 uppercase flex items-center gap-1"><FiBook /> {student.courseName}</span>
                      <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1"><FiCheckCircle /> {student.progress}% Complete</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => navigate(`/faculty/messages?chat=${student.uid}`)}
                    className="flex-1 md:px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    <FiMessageSquare /> Discussion
                  </button>
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 hidden md:block">
                    <FiShield />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default FacultyStudents;