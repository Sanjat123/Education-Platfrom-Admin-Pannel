import { useState } from 'react';
import { Plus, Edit, Trash2, Phone, Video, DollarSign, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Teachers() {
  const [teachers, setTeachers] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@studentnagari.com',
      courses: ['Web Development', 'React Basics'],
      phoneLogin: true,
      liveAccess: true,
      earnings: 12500,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Prof. Michael Chen',
      email: 'michael.chen@studentnagari.com',
      courses: ['Data Science', 'Python Programming'],
      phoneLogin: false,
      liveAccess: true,
      earnings: 15800,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Ms. Emily Davis',
      email: 'emily.davis@studentnagari.com',
      courses: ['UI/UX Design', 'Graphic Design'],
      phoneLogin: true,
      liveAccess: false,
      earnings: 9200,
      status: 'Inactive'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (id) => {
    setTeachers(teachers.map(teacher =>
      teacher.id === id
        ? { ...teacher, status: teacher.status === 'Active' ? 'Inactive' : 'Active' }
        : teacher
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Teachers Management</h1>
          <p className="text-gray-400">Manage teachers, assign courses, and track performance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neonblue to-neonpurple text-white rounded-lg hover:shadow-neon transition-all"
        >
          <Plus size={20} />
          Add Teacher
        </motion.button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cybercard border border-neonblue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neonblue"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-cybercard border border-neonblue/30 rounded-lg text-white hover:bg-neonblue/10">
          <Filter size={20} />
          Filter
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-cybercard/80 backdrop-blur-md border border-neonblue/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cyberbg/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Courses</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Earnings</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neonblue/20">
              {filteredTeachers.map((teacher) => (
                <motion.tr
                  key={teacher.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-neonblue/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">{teacher.name}</div>
                      <div className="text-sm text-gray-400">{teacher.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {teacher.courses.map((course, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-neonpurple/20 text-neonpurple rounded-full">
                          {course}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${teacher.phoneLogin ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        <Phone size={12} />
                        Phone
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${teacher.liveAccess ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        <Video size={12} />
                        Live
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-neonblue">
                      <DollarSign size={16} />
                      <span className="font-medium">${teacher.earnings.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(teacher.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        teacher.status === 'Active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {teacher.status}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 text-gray-400 hover:text-neonblue transition-colors"
                      >
                        <Edit size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-cybercard border border-neonblue/30 rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Add New Teacher</h3>
            <p className="text-gray-400 mb-4">Teacher management form would go here</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-neonblue to-neonpurple text-white rounded-lg"
              >
                Add Teacher
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
