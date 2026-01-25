import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiFolder, FiFileText, FiVideo, FiImage,
  FiDownload, FiShare2, FiMoreVertical, FiSearch,
  FiUpload, FiGrid, FiList, FiFolderPlus
} from "react-icons/fi";

const Resources = () => {
  const [view, setView] = useState("grid"); // 'grid' or 'list'
  
  const resources = [
    { id: 1, name: 'React Fundamentals Guide.pdf', type: 'pdf', size: '2.4 MB', date: '2024-01-15', category: 'Course Materials' },
    { id: 2, name: 'Database Design Slides.pptx', type: 'presentation', size: '15.7 MB', date: '2024-01-10', category: 'Presentations' },
    { id: 3, name: 'Project Requirements.docx', type: 'document', size: '1.2 MB', date: '2024-01-05', category: 'Assignments' },
    { id: 4, name: 'Lecture Recording - Week 3.mp4', type: 'video', size: '245 MB', date: '2024-01-03', category: 'Recordings' },
    { id: 5, name: 'UI Design Resources.zip', type: 'archive', size: '87 MB', date: '2023-12-28', category: 'Resources' },
    { id: 6, name: 'Mid-term Exam Paper.pdf', type: 'pdf', size: '3.1 MB', date: '2023-12-20', category: 'Exams' },
  ];

  const categories = [
    { name: 'All Files', count: 24, color: 'bg-blue-100 text-blue-700' },
    { name: 'Course Materials', count: 8, color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Presentations', count: 6, color: 'bg-amber-100 text-amber-700' },
    { name: 'Recordings', count: 5, color: 'bg-purple-100 text-purple-700' },
    { name: 'Assignments', count: 3, color: 'bg-rose-100 text-rose-700' },
    { name: 'Exams', count: 2, color: 'bg-sky-100 text-sky-700' },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return <FiFileText className="text-rose-500" />;
      case 'video': return <FiVideo className="text-purple-500" />;
      case 'presentation': return <FiImage className="text-amber-500" />;
      case 'document': return <FiFileText className="text-blue-500" />;
      default: return <FiFolder className="text-emerald-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
              Teaching Resources
            </h1>
            <p className="text-slate-400 text-xs md:text-[10px] font-black tracking-[0.3em] uppercase mt-1">
              Share & Manage Materials
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
              <FiFolderPlus /> New Folder
            </button>
            <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-sky-600 transition-all shadow-xl">
              <FiUpload /> Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3`}>
              <FiFolder size={20} />
            </div>
            <h3 className="font-bold text-slate-900">{cat.name}</h3>
            <p className="text-sm text-slate-500">{cat.count} files</p>
          </div>
        ))}
      </div>

      {/* File Browser */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="w-full bg-slate-50 border-2 border-slate-50 p-3 pl-10 rounded-xl outline-none focus:border-sky-500/20 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-50 p-1 rounded-lg">
              <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <FiGrid />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <FiList />
              </button>
            </div>
            
            <select className="bg-slate-50 border-2 border-slate-50 p-2 rounded-xl outline-none focus:border-sky-500/20 text-sm">
              <option>Sort by Date</option>
              <option>Sort by Name</option>
              <option>Sort by Size</option>
            </select>
          </div>
        </div>

        {/* Files Grid/List */}
        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 md:p-6">
            {resources.map((file) => (
              <motion.div 
                key={file.id}
                whileHover={{ y: -2 }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-sky-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    {getIcon(file.type)}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded">
                    <FiMoreVertical />
                  </button>
                </div>
                
                <h4 className="font-bold text-slate-900 truncate mb-1">{file.name}</h4>
                <p className="text-xs text-slate-500 mb-2">{file.category}</p>
                
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{file.size}</span>
                  <span>{file.date}</span>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                  <button className="flex-1 bg-white border border-slate-200 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1">
                    <FiDownload size={14} /> Download
                  </button>
                  <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                    <FiShare2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-4 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-bold">Name</th>
                    <th className="pb-3 font-bold">Category</th>
                    <th className="pb-3 font-bold">Size</th>
                    <th className="pb-3 font-bold">Modified</th>
                    <th className="pb-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((file) => (
                    <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            {getIcon(file.type)}
                          </div>
                          <span className="font-medium text-slate-900">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                          {file.category}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-slate-600">{file.size}</td>
                      <td className="py-3 text-sm text-slate-600">{file.date}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-white rounded">
                            <FiDownload size={14} />
                          </button>
                          <button className="p-1 hover:bg-white rounded">
                            <FiShare2 size={14} />
                          </button>
                          <button className="p-1 hover:bg-white rounded">
                            <FiMoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;