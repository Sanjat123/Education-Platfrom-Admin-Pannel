import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const data = [
  { name: 'Programming', value: 35, color: '#00f6ff' },
  { name: 'Design', value: 25, color: '#8b5cf6' },
  { name: 'Business', value: 20, color: '#ff00ff' },
  { name: 'Marketing', value: 15, color: '#00ff88' },
  { name: 'Others', value: 5, color: '#ff6b6b' },
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CoursePieChart() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-6 rounded-xl backdrop-blur-md bg-cybercard/80 border border-neonpurple/30 shadow-neonStrong"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Course Categories</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#12121a',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
            }}
          />
          <Legend
            wrapperStyle={{ color: '#9ca3af' }}
            iconType="circle"
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
