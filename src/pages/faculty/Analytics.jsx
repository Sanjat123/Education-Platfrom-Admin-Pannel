import React from "react";
import {
  FiTrendingUp, FiUsers, FiBookOpen, FiBarChart2,
  FiPieChart, FiActivity, FiTarget, FiAward
} from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const performanceData = [
    { month: 'Jan', attendance: 85, assignments: 78, engagement: 82 },
    { month: 'Feb', attendance: 88, assignments: 82, engagement: 85 },
    { month: 'Mar', attendance: 90, assignments: 85, engagement: 88 },
    { month: 'Apr', attendance: 87, assignments: 80, engagement: 84 },
    { month: 'May', attendance: 92, assignments: 88, engagement: 90 },
    { month: 'Jun', attendance: 94, assignments: 90, engagement: 92 },
  ];

  const batchData = [
    { name: 'Full Stack', students: 45, value: 45 },
    { name: 'Data Science', students: 32, value: 32 },
    { name: 'UI/UX Design', students: 28, value: 28 },
    { name: 'Mobile Dev', students: 24, value: 24 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const stats = [
    { title: 'Total Students', value: '129', icon: FiUsers, change: '+12%', color: 'bg-blue-100 text-blue-700' },
    { title: 'Average Attendance', value: '89%', icon: FiTrendingUp, change: '+3.2%', color: 'bg-emerald-100 text-emerald-700' },
    { title: 'Assignments Graded', value: '342', icon: FiBookOpen, change: '+24%', color: 'bg-amber-100 text-amber-700' },
    { title: 'Overall Performance', value: '87%', icon: FiAward, change: '+5.1%', color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-xs md:text-[10px] font-black tracking-[0.3em] uppercase mt-1">
            Performance Insights & Metrics
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            
            <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-slate-600">
              {stat.title}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="w-full bg-slate-100 rounded-full h-1">
                <div 
                  className="bg-emerald-500 h-1 rounded-full"
                  style={{ width: `${parseInt(stat.value)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Performance Trend */}
        <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900">Performance Trend</h2>
            <FiActivity className="text-sky-500" />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="assignments" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch Distribution */}
        <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900">Batch Distribution</h2>
            <FiPieChart className="text-emerald-500" />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={batchData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {batchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {batchData.map((batch, index) => (
              <div key={batch.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-sm text-slate-700">{batch.name}</span>
                <span className="text-sm font-bold text-slate-900 ml-auto">{batch.students}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Metrics */}
      <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-900">Assignment Metrics</h2>
          <FiBarChart2 className="text-amber-500" />
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="assignments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;