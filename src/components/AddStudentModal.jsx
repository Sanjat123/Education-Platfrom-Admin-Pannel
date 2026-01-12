import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { FiX, FiUser, FiMail, FiBook, FiDollarSign } from "react-icons/fi";

const AddStudentModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: "", email: "", course: "", amount: "" });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), {
        name: formData.name,
        email: formData.email,
        course: formData.course,
        joinedAt: new Date().toISOString()
      });

      await addDoc(collection(db, "payments"), {
        amount: Number(formData.amount),
        studentName: formData.name,
        timestamp: new Date().toISOString()
      });

      onClose();
      setFormData({ name: "", email: "", course: "", amount: "" });
      alert("Registration Successful!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-scale-in">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full">
          <FiX size={24} />
        </button>
        <h2 className="text-2xl font-black text-slate-900 mb-6">New Admission</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input type="email" placeholder="Email Address" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="text" placeholder="Course Name" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-500" value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} />
          <input type="number" placeholder="Fee Amount" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-500" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
          <button type="submit" className="w-full bg-sky-600 text-white py-4 rounded-2xl font-bold hover:bg-sky-700 shadow-lg">Register Student</button>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;