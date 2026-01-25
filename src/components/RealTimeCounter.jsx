import React, { useState, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

const RealTimeCounter = ({ count }) => {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(count);
  }, [count, spring]);

  return (
    <div className="flex flex-col items-end">
      <motion.span className="text-xl font-black text-slate-900">
        {display}
      </motion.span>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
      </div>
    </div>
  );
};

export default RealTimeCounter;