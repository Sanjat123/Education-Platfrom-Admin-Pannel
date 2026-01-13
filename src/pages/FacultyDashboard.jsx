import React from "react";
import { useAuth } from "../context/AuthContext";
import { FiUsers, FiVideo, FiActivity } from "react-icons/fi";

const FacultyDashboard = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-8 animate-auth-entry">
      <div className="bg-emerald-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Hello, Prof. {userProfile?.name}</h1>
          <p className="text-emerald-400 text-[10px] font-black tracking-[0.3em] uppercase mt-2 italic">Faculty Management Console</p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center"><FiUsers size={32}/></div>
           <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">My Students</h3>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Manage enrollment</p>
           </div>
        </div>
        
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center"><FiVideo size={32}/></div>
           <div>
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Live Studio</h3>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Broadcast now</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;