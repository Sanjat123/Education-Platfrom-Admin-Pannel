// RevenueChart.jsx - Super Enhanced & Fixed Version
import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const RevenueChart = ({ revenueData = [], showTarget = false, targetAmount = 50000 }) => {
  const [isReady, setIsReady] = useState(false);

  // Responsive container fix: 100ms delay to ensure parent width is calculated
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Fallback Data if Firestore is empty or permissions fail
  const data = revenueData.length > 0 ? revenueData : [
    { month: "Jan", revenue: 4500 },
    { month: "Feb", revenue: 5200 },
    { month: "Mar", revenue: 4800 },
    { month: "Apr", revenue: 6100 },
    { month: "May", revenue: 5900 },
    { month: "Jun", revenue: 7200 },
    { month: "Jul", revenue: 8500 },
  ];

  const maxRevenue = Math.max(...data.map(d => d.revenue), targetAmount);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <p className="text-lg font-black tracking-tight">
              ₹{payload[0].value.toLocaleString()}
            </p>
          </div>
          {showTarget && (
            <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400">
              Target Progress: {Math.round((payload[0].value / targetAmount) * 100)}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative">
      {/* Chart Title Overlay */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-tight">Revenue Performance</h4>
          <p className="text-2xl font-black text-slate-900">₹{data[data.length-1].revenue.toLocaleString()}</p>
        </div>
        {revenueData.length === 0 && (
          <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-bold">
            PREVIEW MODE
          </span>
        )}
      </div>

      {/* Fixed: Explicit height container to prevent width(-1) error */}
      <div className="w-full h-[350px] relative">
        <AnimatePresence>
          {isReady ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    dy={15}
                  />
                  
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                    domain={[0, maxRevenue * 1.2]}
                  />

                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  
                  {showTarget && (
                    <ReferenceLine 
                      y={targetAmount} 
                      stroke="#6366f1" 
                      strokeDasharray="8 8" 
                      strokeWidth={2}
                      label={{ value: 'Target', fill: '#6366f1', fontSize: 10, fontWeight: 'bold', position: 'insideTopRight' }}
                    />
                  )}

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#chartGradient)"
                    activeDot={{ r: 8, fill: "#10b981", stroke: "#fff", strokeWidth: 4 }}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            // Shimmer/Loading state while container ready
            <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center">
              <p className="text-slate-400 text-sm font-medium">Initializing Chart...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RevenueChart;