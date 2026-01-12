import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight, FiShield, FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Successful login ke baad Dashboard
    } catch (err) {
      alert("Verification Failed: Check Admin Credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-[420px] auth-glass p-8 md:p-12 rounded-[2.5rem] animate-auth-entry relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-sky-400 to-indigo-600 rounded-2xl mb-6 shadow-xl shadow-sky-500/20">
            <FiShield className="text-3xl text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Student Nagari</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Admin Command Center</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest ml-1">Identity Email</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="email" required placeholder="admin@nagari.com"
                className="input-auth pl-12"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Secret Key</label>
            </div>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                required placeholder="••••••••"
                className="input-auth pl-12 pr-12"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full text-lg mt-4">
            Authorize Access <FiArrowRight />
          </button>
        </form>

        <footer className="mt-12 text-center">
           <p className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter">
             Secure Core System v4.0 • Chandigarh University
           </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;