import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatCard = ({ title, value, icon, color = "sky", trend, className = "" }) => {
  
  const colorClasses = {
    sky: "bg-gradient-to-br from-sky-500 to-cyan-500",
    indigo: "bg-gradient-to-br from-indigo-500 to-purple-500",
    emerald: "bg-gradient-to-br from-emerald-500 to-green-500",
    rose: "bg-gradient-to-br from-rose-500 to-pink-500"
  };

  const iconBgClasses = {
    sky: "bg-sky-100 text-sky-600",
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600"
  };

  return (
    <div className={`p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        {/* Icon Container */}
        <div className={`p-4 rounded-2xl ${iconBgClasses[color]}`}>
          {icon}
        </div>
        
        {/* Trend Indicator */}
        {trend && (
          <div className={`px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold ${
            trend.direction === "up" 
              ? "bg-emerald-50 text-emerald-600" 
              : "bg-rose-50 text-rose-600"
          }`}>
            {trend.direction === "up" ? <FiTrendingUp /> : <FiTrendingDown />}
            {trend.value}
          </div>
        )}
      </div>
      
      {/* Title and Value */}
      <h3 className="text-3xl font-black text-slate-900 mb-1">{value}</h3>
      <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
      
      {/* Decorative Progress Bar */}
      <div className="mt-6">
        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${colorClasses[color]}`} 
            style={{ width: '70%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;