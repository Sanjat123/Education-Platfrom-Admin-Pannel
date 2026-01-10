import { motion } from 'framer-motion';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weeks = Array.from({ length: 12 }, (_, i) => i + 1);

const getActivityLevel = (week, day) => {
  // Mock activity data - in real app, this would come from API
  const activity = Math.floor(Math.random() * 5);
  return activity;
};

const getColorClass = (level) => {
  const colors = [
    'bg-gray-800',
    'bg-neonblue/20',
    'bg-neonblue/40',
    'bg-neonblue/60',
    'bg-neonblue',
  ];
  return colors[level] || 'bg-gray-800';
};

export default function ActivityHeatmap() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="p-6 rounded-xl backdrop-blur-md bg-cybercard/80 border border-neonblue/30 shadow-neon"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Activity Heatmap</h3>
      <div className="flex">
        <div className="flex flex-col mr-2">
          {days.map((day) => (
            <div key={day} className="h-3 text-xs text-gray-400 mb-1">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="grid grid-cols-12 gap-1">
            {weeks.map((week) =>
              days.map((day) => {
                const level = getActivityLevel(week, day);
                return (
                  <motion.div
                    key={`${week}-${day}`}
                    whileHover={{ scale: 1.2 }}
                    className={`w-3 h-3 rounded-sm ${getColorClass(level)} transition-all duration-200`}
                    title={`${day} Week ${week}: ${level} activities`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-800"></div>
          <div className="w-3 h-3 rounded-sm bg-neonblue/20"></div>
          <div className="w-3 h-3 rounded-sm bg-neonblue/40"></div>
          <div className="w-3 h-3 rounded-sm bg-neonblue/60"></div>
          <div className="w-3 h-3 rounded-sm bg-neonblue"></div>
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
}
