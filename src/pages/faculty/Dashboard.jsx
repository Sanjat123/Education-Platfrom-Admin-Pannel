import React, { useState, useEffect } from 'react';
import { useFaculty } from '../../context/FacultyContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FiBookOpen, FiVideo, FiUsers, FiZap, FiPlus, 
  FiFileText, FiTrendingUp, FiActivity, FiArrowRight, FiClock 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const FacultyDashboard = () => {
  const { getQuickStats, loading, stats } = useFaculty();
  const { userProfile } = useAuth();
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
    else if (hour >= 17) setGreeting("Good Evening");
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400 italic">Syncing Academy...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
      
      {/* 🟢 DYNAMIC HERO SECTION */}
      <div className="bg-slate-900 p-8 md:p-20 rounded-[3rem] md:rounded-[5rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                Live Status: Active
              </span>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 italic">
                <FiClock /> {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
              {greeting}, <br />
              <span className="text-emerald-500">{userProfile?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-bold text-[11px] md:text-sm uppercase tracking-[0.2em] italic max-w-md leading-relaxed">
              Your academy is currently reaching <span className="text-white">{stats.totalStudents}</span> active scholars globally.
            </p>
          </div>
          
          <div className="hidden lg:block bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10">
             <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Performance Score</p>
             <div className="flex items-end gap-2">
                <span className="text-5xl font-black italic">4.9</span>
                <span className="text-emerald-500 font-black text-sm mb-2">/ 5.0</span>
             </div>
             <div className="mt-4 flex gap-1">
                {[1,2,3,4,5].map(i => <div key={i} className="w-6 h-1.5 bg-emerald-500 rounded-full"></div>)}
             </div>
          </div>
        </div>
        <FiZap className="absolute -bottom-20 -right-20 text-[20rem] md:text-[35rem] text-white/[0.03] -rotate-12" />
      </div>

      {/* 🔵 KPI STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {getQuickStats().map((stat, index) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: index * 0.1 }} 
            key={index} 
            className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group relative overflow-hidden"
          >
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] mb-6 flex items-center justify-center text-xl md:text-3xl transition-all group-hover:scale-110
              ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                stat.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {stat.icon === 'book' ? <FiBookOpen /> : 
               stat.icon === 'file' ? <FiFileText /> : 
               stat.icon === 'video' ? <FiVideo /> : <FiUsers />}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mt-2 tracking-tighter italic">{stat.value}</h3>
            <FiActivity className="absolute bottom-6 right-6 text-slate-100 text-4xl group-hover:text-emerald-500/20 transition-all" />
          </motion.div>
        ))}
      </div>

      {/* 🟠 ACTION HUBS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div onClick={() => window.location.href='/faculty/courses'} className="bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 group cursor-pointer relative overflow-hidden hover:border-blue-500/30 transition-all shadow-sm">
          <div className="relative z-10 flex flex-col h-full justify-between gap-12">
            <div>
               <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Build Your <span className="text-blue-600">Empire</span></h2>
               <p className="text-slate-400 font-bold text-[10px] uppercase mt-2">Manage your global curriculum and content</p>
            </div>
            <button className="w-max flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-blue-600 transition-all shadow-xl">
              <FiPlus /> Add New Course <FiArrowRight className="group-hover:translate-x-2 transition-transform"/>
            </button>
          </div>
          <FiBookOpen className="absolute -bottom-10 -right-10 text-[15rem] text-slate-50 -rotate-12 group-hover:text-blue-50 transition-all" />
        </div>

        <div onClick={() => window.location.href='/faculty/live'} className="bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 group cursor-pointer relative overflow-hidden hover:border-rose-500/30 transition-all shadow-sm">
           <div className="relative z-10 flex flex-col h-full justify-between gap-12">
            <div>
               <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Live <span className="text-rose-600">Studio</span></h2>
               <p className="text-slate-400 font-bold text-[10px] uppercase mt-2">Broadcast real-time to your entire student base</p>
            </div>
            <button className="w-max flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-rose-600 transition-all shadow-xl">
              <FiVideo /> Launch Session <FiArrowRight className="group-hover:translate-x-2 transition-transform"/>
            </button>
          </div>
          <FiVideo className="absolute -bottom-10 -right-10 text-[15rem] text-slate-50 -rotate-12 group-hover:text-rose-50 transition-all" />
        </div>
      </div>

      {/* ⚪ RECENT INSIGHTS SECTION */}
      <div className="bg-white p-8 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Real-Time <span className="text-emerald-500">Insights</span></h2>
          <FiTrendingUp className="text-emerald-500 text-2xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Enrollment Velocity</p>
              <h4 className="text-2xl font-black italic text-slate-900">+12% <span className="text-sm font-bold text-emerald-500 not-italic ml-2">This Week</span></h4>
           </div>
           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Completion Rate</p>
              <h4 className="text-2xl font-black italic text-slate-900">84% <span className="text-sm font-bold text-blue-500 not-italic ml-2">Course Average</span></h4>
           </div>
           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Feedback Score</p>
              <h4 className="text-2xl font-black italic text-slate-900">96% <span className="text-sm font-bold text-rose-500 not-italic ml-2">Positive</span></h4>
           </div>
        </div>
      </div>

    </div>
  );
};

export default FacultyDashboard;