import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { FiCalendar, FiClock, FiPlus, FiMapPin, FiVideo, FiMoreVertical, FiCheckCircle } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

const FacultySchedule = () => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: "", day: "Monday", time: "", type: "Live Class", courseId: "" });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    if (!userProfile?.uid) return;

    // Fetch Courses for selection
    const qCourses = query(collection(db, "courses"), where("instructorId", "==", userProfile.uid));
    const unsubCourses = onSnapshot(qCourses, (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Scheduled Events
    const qEvents = query(collection(db, "schedules"), where("instructorId", "==", userProfile.uid), orderBy("createdAt", "desc"));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubCourses(); unsubEvents(); };
  }, [userProfile]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "schedules"), {
        ...formData,
        instructorId: userProfile.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Schedule Updated!");
      setShowAdd(false);
    } catch (err) {
      toast.error("Failed to add schedule");
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-10">
      <Toaster />
      
      {/* Dynamic Header */}
      <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Academic <span className="text-emerald-500">Timeline</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 italic">Organize your teaching hours & sessions</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="relative z-10 bg-emerald-600 hover:bg-white hover:text-emerald-600 text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl">
          <FiPlus className="inline mr-2" /> Add Session
        </button>
        <FiCalendar className="absolute -bottom-10 -right-10 text-[15rem] text-white/5 -rotate-12" />
      </div>

      {/* Weekly Planner Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
        {days.map((day) => (
          <div key={day} className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center shadow-sm">
              <p className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">{day}</p>
            </div>
            
            <div className="space-y-4">
              {events.filter(e => e.day === day).length > 0 ? (
                events.filter(e => e.day === day).map((session) => (
                  <div key={session.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                       <span className={`p-2 rounded-xl text-xs ${session.type === 'Live Class' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                         {session.type === 'Live Class' ? <FiVideo /> : <FiClock />}
                       </span>
                       <FiMoreVertical className="text-slate-300" />
                    </div>
                    <h4 className="font-black text-slate-900 text-[11px] uppercase leading-tight">{session.title}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-1">
                      <FiClock className="text-emerald-500" /> {session.time}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-10 border-2 border-dashed border-slate-50 rounded-[2rem] flex flex-col items-center opacity-30">
                  <FiCheckCircle className="text-2xl text-slate-200" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Session Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-8 italic">Plan <span className="text-emerald-600">Session</span></h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input type="text" placeholder="Session Title (e.g. Intro to Node.js)" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300 border border-slate-100" onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-slate-50 p-5 rounded-2xl outline-none font-bold text-[10px] uppercase border border-slate-100" onChange={(e) => setFormData({...formData, day: e.target.value})}>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="time" className="bg-slate-50 p-5 rounded-2xl outline-none font-bold border border-slate-100" onChange={(e) => setFormData({...formData, time: e.target.value})} required />
              </div>
              <select className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold text-[10px] uppercase border border-slate-100" onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="Live Class">Live Studio Session</option>
                <option value="Mentorship">1:1 Mentorship</option>
                <option value="Doubt Clearing">Doubt Clearing</option>
              </select>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all">Add to Schedule</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-8 text-slate-400 font-black uppercase text-[10px]">Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultySchedule;