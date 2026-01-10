import { Users, GraduationCap, BookOpen, Video, DollarSign } from 'lucide-react';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import StudentChart from '../components/StudentChart';
import PieChart from '../components/PieChart';
import ActivityHeatmap from '../components/ActivityHeatmap';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Students',
      value: '2,847',
      change: 12.5,
      icon: Users,
      color: 'neonblue'
    },
    {
      title: 'Total Teachers',
      value: '156',
      change: 8.2,
      icon: GraduationCap,
      color: 'neonpurple'
    },
    {
      title: 'Total Courses',
      value: '89',
      change: 15.3,
      icon: BookOpen,
      color: 'neonpink'
    },
    {
      title: 'Active Live Classes',
      value: '23',
      change: -2.1,
      icon: Video,
      color: 'neonblue'
    },
    {
      title: 'Monthly Revenue',
      value: '$45,231',
      change: 18.7,
      icon: DollarSign,
      color: 'neonpurple'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening with Student Nagari today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentChart />
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PieChart />
        </div>
        <div className="lg:col-span-1">
          <ActivityHeatmap />
        </div>
      </div>
    </div>
  );
}
