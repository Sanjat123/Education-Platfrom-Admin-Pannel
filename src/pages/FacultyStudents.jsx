import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { FiUsers, FiCheckCircle, FiSearch } from "react-icons/fi";

const FacultyStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Sirf students ko fetch karein
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = students.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 space-y-8 animate-auth-entry">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase">My Students</h1>
          <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase mt-1">Total Enrolled: {students.length}</p>
        </div>
        <div className="relative w-72">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" placeholder="Search student..." 
            className="w-full bg-slate-50 border-none p-4 pl-12 rounded-2xl text-xs font-bold outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(student => (
          <div key={student.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                {student.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase text-sm">{student.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{student.email}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                <FiCheckCircle /> Active
              </span>
              <button className="text-[9px] font-black text-sky-500 uppercase hover:underline">View Progress</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacultyStudents;