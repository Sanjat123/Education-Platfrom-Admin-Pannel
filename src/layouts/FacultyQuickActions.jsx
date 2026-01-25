import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiVideo, FiMessageSquare, FiFileText, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const FacultyQuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { label: "Start Live", icon: <FiVideo />, path: "/faculty/live", color: "bg-rose-500" },
    { label: "New Course", icon: <FiPlus />, path: "/faculty/courses", color: "bg-emerald-600" },
    { label: "Announce", icon: <FiMessageSquare />, path: "/faculty/announcements", color: "bg-blue-600" },
    { label: "Task", icon: <FiFileText />, path: "/faculty/assignments", color: "bg-amber-500" },
  ];

  return (
    <div className="fixed bottom-10 right-10 z-[500] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-3 mb-2">
            {actions.map((action, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  navigate(action.path);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-600 shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={`w-12 h-12 ${action.color} text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110`}>
                  {action.icon}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all ${isOpen ? 'bg-slate-900 rotate-45' : 'bg-emerald-600'}`}
      >
        {isOpen ? <FiPlus size={28}/> : <FiPlus size={28}/>}
      </button>
    </div>
  );
};

export default FacultyQuickActions;