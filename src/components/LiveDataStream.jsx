import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUserPlus, FiCreditCard, FiActivity, FiClock } from "react-icons/fi";
import { format } from "date-fns";

const LiveDataStream = ({ events }) => {
  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      <AnimatePresence initial={false}>
        {events.length === 0 ? (
          <p className="text-slate-500 text-sm italic text-center py-10">Waiting for live activity...</p>
        ) : (
          events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  event.type === 'enrollment' ? 'bg-emerald-500/20 text-emerald-400' : 
                  event.type === 'payment' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {event.type === 'enrollment' ? <FiUserPlus /> : event.type === 'payment' ? <FiCreditCard /> : <FiActivity />}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{event.user || "New User"}</p>
                  <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">
                    {event.course || event.action || `Paid ${event.amount || ""}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                  <FiClock size={10} /> {format(event.timestamp, "hh:mm:ss a")}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveDataStream;