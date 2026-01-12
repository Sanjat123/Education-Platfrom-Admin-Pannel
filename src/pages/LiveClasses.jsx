import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiVideo, FiPlus, FiX, FiCalendar, FiClock, FiTrash2, FiPlayCircle, FiUsers } from "react-icons/fi";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const LiveClasses = () => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [formData, setFormData] = useState({ topic: "", instructor: userProfile?.name || "Admin", date: "", time: "" });

  const appID = 942355460; // Aapki correct ID
  const serverSecret = "PASTE_YOUR_SECRET_HERE"; // ZegoCloud console se paste karein

  useEffect(() => {
    const q = query(collection(db, "liveClasses"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const joinLiveRoom = async (roomID) => {
    setIsLiveActive(true);
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, serverSecret, roomID, 
      userProfile?.uid || Date.now().toString(), 
      userProfile?.name || "User"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container: document.querySelector("#video-studio"),
      scenario: { mode: ZegoUIKitPrebuilt.LiveStreaming },
      showScreenSharingButton: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roomID = "nagari_" + Math.random().toString(36).substring(7);
    try {
      await addDoc(collection(db, "liveClasses"), {
        ...formData,
        classRoomId: roomID,
        status: "upcoming",
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ topic: "", instructor: userProfile?.name, date: "", time: "" });
    } catch (err) { alert("Rules Error: " + err.message); }
  };

  if (isLiveActive) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-widest">Nagari Live Studio</h2>
          <button onClick={() => window.location.reload()} className="bg-rose-500 px-4 py-2 rounded-lg font-bold text-[10px] uppercase">End Session</button>
        </div>
        <div id="video-studio" className="flex-1 w-full h-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Live Sessions</h1>
          <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Infrastructure: {appID}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-sky-600 transition-all shadow-xl active:scale-95">
          <FiPlus /> New Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classes.map((item) => (
          <div key={item.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
             <div className="space-y-4">
              <div className="bg-sky-50 text-sky-600 w-fit px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                Scheduled
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{item.topic}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Host: {item.instructor}</p>
              
              <div className="py-6 border-y border-slate-50 flex justify-between">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs"><FiCalendar/> {item.date}</div>
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs"><FiClock/> {item.time}</div>
              </div>

              <button 
                onClick={() => joinLiveRoom(item.classRoomId)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl"
              >
                Launch Studio
              </button>
              
              <button onClick={() => deleteDoc(doc(db, "liveClasses", item.id))} className="absolute top-8 right-8 text-slate-200 hover:text-rose-500 transition-colors">
                <FiTrash2 size={20}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL - CENTERED BOX */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl z-[10000] overflow-hidden">
              <div className="p-10 pb-6 flex justify-between items-center border-b border-slate-50">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Broadcast</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400"><FiX/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Name</label>
                  <input type="text" required className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[1.5rem] outline-none font-bold" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" required className="bg-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-xs" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  <input type="time" required className="bg-slate-50 p-5 rounded-[1.5rem] outline-none font-bold text-xs" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-sky-600 transition-all">Schedule Live Now</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveClasses;