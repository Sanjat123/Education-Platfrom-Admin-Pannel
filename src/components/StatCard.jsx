import { motion } from "framer-motion";

export default function StatCard({ title, value, change, icon: Icon, color = "neonblue" }) {
  const colorClasses = {
    neonblue: "text-neonblue border-neonblue/30 shadow-neon",
    neonpurple: "text-neonpurple border-neonpurple/30 shadow-neonStrong",
    neonpink: "text-neonpink border-neonpink/30 shadow-neon",
  };

  const textColorClass = colorClasses[color].split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative p-6 rounded-xl backdrop-blur-md bg-cybercard/80 border ${colorClasses[color]} hover:scale-105 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br from-${color}/20 to-${color}/10`}>
          <Icon size={24} className={textColorClass} />
        </div>
      </div>
    </motion.div>
  );
}
