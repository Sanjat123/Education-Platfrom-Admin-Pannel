import React, { useState } from 'react';
import { FiUserCheck, FiUserX, FiClock } from 'react-icons/fi';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const StudentStatusToggle = ({ studentId, currentStatus, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  const statusOptions = [
    { value: 'active', label: 'Active', icon: FiUserCheck, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'inactive', label: 'Inactive', icon: FiUserX, color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { value: 'pending', label: 'Pending', icon: FiClock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ];

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', studentId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Student status changed to ${newStatus}`);
      if (onUpdate) onUpdate(newStatus);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {statusOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleStatusChange(option.value)}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg border-2 flex items-center gap-1.5 text-xs font-bold transition-all ${
            currentStatus === option.value
              ? `${option.color} scale-105`
              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option.icon />
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default StudentStatusToggle;