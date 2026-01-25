import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiCalendar, FiClock, FiMapPin, FiUsers,
  FiChevronLeft, FiChevronRight, FiPlus
} from "react-icons/fi";

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week"); // 'day', 'week', 'month'

  const scheduleData = [
    { 
      id: 1, 
      title: "React Advanced Patterns", 
      time: "10:00 AM - 12:00 PM", 
      type: "Lecture", 
      batch: "Full Stack",
      room: "Lab 101",
      color: "bg-blue-100 text-blue-700"
    },
    { 
      id: 2, 
      title: "Database Design Workshop", 
      time: "02:00 PM - 04:00 PM", 
      type: "Workshop", 
      batch: "Data Science",
      room: "Room 205",
      color: "bg-emerald-100 text-emerald-700"
    },
    { 
      id: 3, 
      title: "Project Review", 
      time: "04:30 PM - 06:00 PM", 
      type: "Meeting", 
      batch: "UI/UX Design",
      room: "Conference Room",
      color: "bg-amber-100 text-amber-700"
    },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => `${i + 8}:00 ${i < 4 ? 'AM' : 'PM'}`);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
              Schedule
            </h1>
            <p className="text-slate-400 text-xs md:text-[10px] font-black tracking-[0.3em] uppercase mt-1">
              Manage Your Calendar
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
              {['day', 'week', 'month'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            
            <button className="bg-slate-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-600 transition-all shadow-xl active:scale-95">
              <FiPlus /> Add Event
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <button className="p-2 hover:bg-slate-50 rounded-xl">
            <FiChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-black text-slate-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <button className="p-2 hover:bg-slate-50 rounded-xl">
            <FiChevronRight size={20} />
          </button>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {days.map(day => (
            <div key={day} className="text-center p-3">
              <div className="text-xs font-bold text-slate-500 uppercase">{day}</div>
              <div className={`text-lg font-black mt-1 ${day === 'Wed' ? 'bg-sky-100 text-sky-700 w-10 h-10 flex items-center justify-center rounded-full mx-auto' : 'text-slate-900'}`}>
                {15 + days.indexOf(day)}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative min-h-[600px]">
          {hours.map(hour => (
            <div key={hour} className="flex border-t border-slate-100">
              <div className="w-20 p-3 text-xs text-slate-500 font-bold">{hour}</div>
              <div className="flex-1 grid grid-cols-7">
                {days.map(day => (
                  <div key={`${hour}-${day}`} className="border-l border-slate-100 min-h-[80px]"></div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Schedule Events */}
          {scheduleData.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute left-20 right-4 ${event.color} p-3 rounded-xl shadow-sm border`}
              style={{ 
                top: '160px', // Based on time
                height: '120px' // Based on duration
              }}
            >
              <div className="font-bold text-sm mb-1">{event.title}</div>
              <div className="text-xs opacity-75 mb-2">{event.time}</div>
              <div className="flex items-center gap-2 text-xs">
                <FiUsers size={12} />
                <span>{event.batch}</span>
                <FiMapPin className="ml-2" size={12} />
                <span>{event.room}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
        <h3 className="text-lg font-black text-slate-900 mb-4">Today's Schedule</h3>
        
        <div className="space-y-4">
          {scheduleData.map(event => (
            <div key={event.id} className="flex items-center p-4 bg-slate-50 rounded-xl">
              <div className={`w-12 h-12 rounded-xl ${event.color} flex items-center justify-center mr-4`}>
                <FiCalendar />
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">{event.title}</h4>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <FiClock size={12} /> {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers size={12} /> {event.batch}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMapPin size={12} /> {event.room}
                  </span>
                </div>
              </div>
              
              <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-600 transition-all">
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;