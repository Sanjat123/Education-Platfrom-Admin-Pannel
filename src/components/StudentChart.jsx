import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const data = [
  { month: 'Jan', students: 120 },
  { month: 'Feb', students: 150 },
  { month: 'Mar', students: 180 },
  { month: 'Apr', students: 220 },
  { month: 'May', students: 280 },
  { month: 'Jun', students: 320 },
];

export default function StudentChart() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-6 rounded-xl backdrop-blur-md bg-cybercard/80 border border-neonpurple/30 shadow-neonStrong"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Student Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#12121a',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="students"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
