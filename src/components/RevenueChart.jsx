// RevenueChart.jsx - Updated component
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from "recharts";

const RevenueChart = ({ revenueData = [], showTarget = false, targetAmount = 0 }) => {
  // If no data from Firestore, use mock data
  const data = revenueData.length > 0 ? revenueData : [
    { month: "Jan", revenue: 4000 },
    { month: "Feb", revenue: 3000 },
    { month: "Mar", revenue: 5000 },
    { month: "Apr", revenue: 2780 },
    { month: "May", revenue: 1890 },
    { month: "Jun", revenue: 2390 },
    { month: "Jul", revenue: 3490 },
  ];

  const maxRevenue = Math.max(...data.map(d => d.revenue), targetAmount);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-sm text-[#0fa3ab]">
            Revenue: ₹{payload[0].value.toLocaleString()}
          </p>
          {showTarget && (
            <p className="text-sm text-purple-500 mt-1">
              Target: ₹{targetAmount.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0fa3ab" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0fa3ab" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `₹${value/1000}k`}
            domain={[0, maxRevenue * 1.1]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#0fa3ab"
            strokeWidth={2}
            fill="url(#colorRevenue)"
            activeDot={{ r: 6, fill: "#088a54" }}
          />
          
          {showTarget && (
            <ReferenceLine
              y={targetAmount}
              stroke="purple"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `Target: ₹${targetAmount.toLocaleString()}`,
                position: 'right',
                fill: 'purple',
                fontSize: 12
              }}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#088a54"
            strokeWidth={2}
            dot={{ fill: "#088a54", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;