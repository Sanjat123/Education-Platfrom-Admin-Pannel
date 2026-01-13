import React from "react";
import { useAuth } from "../context/AuthContext";
import { FiBook, FiVideo, FiClock } from "react-icons/fi";

const StudentDashboard = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-8 animate-auth-entry">
      <div className="bg-red-600 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Welcome, {userProfile?.name}!</h1>
          <p className="text-white/70 text-[10px] font-black tracking-[0.3em] uppercase mt-2 italic">Your Learning Journey Starts Here</p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white rounded-full blur-[120px] opacity-10"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center"><FiBook size={32}/></div>
           <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">My Courses</h3>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Resume Learning</p>
           </div>
        </div>
        
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center"><FiVideo size={32}/></div>
           <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Live Now</h3>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Join Class</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;