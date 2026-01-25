import React from "react";
import { motion } from "framer-motion";

const PerformanceGauge = ({ percentage = 0, label = "Completion" }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-sky-600"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-black text-slate-900">{Math.round(percentage)}%</span>
        </div>
      </div>
      <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
};

export default PerformanceGauge;