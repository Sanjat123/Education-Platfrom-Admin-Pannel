import React from "react";
import { FiTrendingUp } from "react-icons/fi";

const ProgressChart = ({ data }) => {
  const chartData = data?.labels?.map((label, index) => ({
    name: label,
    score: data.scores[index],
  })) || [];

  const maxScore = Math.max(...chartData.map(d => d.score), 100);
  const minScore = Math.min(...chartData.map(d => d.score), 0);

  return (
    <div className="w-full">
      <div className="h-48 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((line) => (
            <div key={line} className="relative">
              <div className="absolute left-0 right-0 h-px bg-slate-200"></div>
              <div className="absolute -left-8 text-xs text-slate-500 -top-2">
                {line}%
              </div>
            </div>
          ))}
        </div>

        {/* Chart line */}
        <div className="absolute inset-0 flex items-end">
          <div className="flex-1 flex items-end justify-between px-4">
            {chartData.map((point, index) => {
              const height = ((point.score - minScore) / (maxScore - minScore)) * 100;
              const isLast = index === chartData.length - 1;
              const isFirst = index === 0;
              
              return (
                <div key={index} className="relative flex-1 flex flex-col items-center">
                  {/* Bar */}
                  <div
                    className="w-8 bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg relative group"
                    style={{ height: `${height}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.name}: {point.score}%
                    </div>
                    {/* Value on top */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-slate-700">
                      {point.score}%
                    </div>
                  </div>
                  
                  {/* Label */}
                  <div className="mt-2 text-xs text-slate-600 font-medium">
                    {point.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connecting line */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={chartData.map((point, index) => {
              const x = (index / (chartData.length - 1)) * 100;
              const y = 100 - ((point.score - minScore) / (maxScore - minScore)) * 100;
              return `${x}%,${y}%`;
            }).join(' ')}
          />
        </svg>
      </div>
      
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="text-emerald-500" />
          <span className="text-sm text-slate-600">Overall Progress Trend</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-800">
            {chartData.length > 0 ? chartData[chartData.length - 1].score : 0}%
          </div>
          <div className="text-xs text-emerald-600">+8% from last month</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;