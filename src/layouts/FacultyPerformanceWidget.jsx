import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiTrendingUp, FiUsers, FiStar, FiActivity } from 'react-icons/fi';

const FacultyPerformanceWidget = ({ onClose, performance }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-end p-6 bg-black/20 backdrop-blur-sm">
      <motion.div 
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        className="bg-white w-full max-w-md h-full rounded-[3rem] shadow-2xl p-10 overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black uppercase italic text-slate-900">Performance <span className="text-blue-600">Deep-Dive</span></h2>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="space-y-6">
          <MetricCard icon={<FiStar />} label="Avg Rating" value={performance.rating || "4.8"} color="text-yellow-500" />
          <MetricCard icon={<FiUsers />} label="Engagement" value={`${performance.engagement || 92}%`} color="text-blue-500" />
          <MetricCard icon={<FiActivity />} label="Completion" value={`${performance.completion || 85}%`} color="text-emerald-500" />
        </div>

        <div className="mt-10 p-8 bg-slate-900 rounded-[2.5rem] text-white">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pro Tip</p>
          <p className="text-sm font-medium leading-relaxed">Your live sessions have 20% higher engagement. Try hosting more "Doubt Clearing" sessions.</p>
        </div>
      </motion.div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, color }) => (
  <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between">
    <div className="flex items-center gap-4">
      <span className={`text-2xl ${color}`}>{icon}</span>
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xl font-black text-slate-900">{value}</span>
  </div>
);

export default FacultyPerformanceWidget;