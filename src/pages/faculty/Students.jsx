import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiUsers, FiSearch, FiMail, FiMessageSquare, FiUserCheck, 
  FiFilter, FiDownload, FiEye, FiClock, FiTrendingUp,
  FiCalendar, FiBookOpen, FiStar, FiChevronRight
} from "react-icons/fi";
import { MdOutlineGroup } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Students = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    avgAttendance: 0
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    fetchStudentsData();
  }, [userProfile]);

  const fetchStudentsData = async () => {
    try {
      // Mock data for now - Replace with actual API calls
      const mockStudents = generateMockStudents();
      const mockCourses = generateMockCourses();
      
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
      setCourses(mockCourses);
      setStats({
        total: mockStudents.length,
        active: mockStudents.filter(s => s.status === "active").length,
        completed: Math.floor(mockStudents.length * 0.7),
        avgAttendance: 87
      });
      
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students!");
    } finally {
      setLoading(false);
    }
  };

  const generateMockStudents = () => {
    const names = [
      "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Singh", 
      "Vikram Yadav", "Anjali Verma", "Rohan Mehta", "Kavita Reddy",
      "Sanjay Gupta", "Pooja Joshi", "Manish Chauhan", "Neha Kapoor"
    ];
    
    return names.map((name, index) => ({
      id: `student${index + 1}`,
      name: name,
      email: `${name.split(' ')[0].toLowerCase()}@example.com`,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      courseName: ["CS101", "CS201", "CS301", "MATH101"][index % 4],
      enrolledDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      progress: Math.floor(Math.random() * 100),
      status: Math.random() > 0.2 ? "active" : "inactive",
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      attendance: Math.floor(Math.random() * 20) + 80,
      grade: Math.floor(Math.random() * 30) + 70
    }));
  };

  const generateMockCourses = () => {
    return [
      { id: "course1", courseName: "CS101 - Introduction to Programming" },
      { id: "course2", courseName: "CS201 - Data Structures" },
      { id: "course3", courseName: "CS301 - Algorithms" },
      { id: "course4", courseName: "MATH101 - Calculus" }
    ];
  };

  useEffect(() => {
    let filtered = students;
    
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCourse !== "all") {
      filtered = filtered.filter(student => student.courseId === selectedCourse);
    }
    
    setFilteredStudents(filtered);
  }, [searchQuery, selectedCourse, students]);

  const handleSendMessage = (studentId) => {
    navigate(`/faculty/messages?student=${studentId}`);
  };

  const handleViewProfile = (studentId) => {
    navigate(`/faculty/students/${studentId}`);
  };

  const exportStudentData = () => {
    toast.success("Export feature coming soon!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Students</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your students across courses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportStudentData}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <FiDownload size={16} />
            Export
          </button>
          <button
            onClick={() => navigate("/faculty/messages/compose")}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-xl transition-all flex items-center gap-2 shadow-md"
          >
            <FiMessageSquare size={16} />
            Message All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 dark:from-cyan-900/20 dark:to-blue-900/20 p-5 rounded-2xl border border-cyan-200/50 dark:border-cyan-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-700 dark:text-cyan-400 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <FiUsers className="text-cyan-500 dark:text-cyan-400 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 dark:from-emerald-900/20 dark:to-green-900/20 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Active Now</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.active}</p>
            </div>
            <FiUserCheck className="text-emerald-500 dark:text-emerald-400 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Avg. Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.avgAttendance}%</p>
            </div>
            <FiTrendingUp className="text-amber-500 dark:text-amber-400 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 dark:from-purple-900/20 dark:to-violet-900/20 p-5 rounded-2xl border border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">Courses Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
            </div>
            <FiBookOpen className="text-purple-500 dark:text-purple-400 text-2xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search students by name, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </select>
            <button className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
              <FiFilter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Last Active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                        {student.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{student.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{student.courseName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Enrolled {student.enrolledDate?.toLocaleDateString() || "Recently"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' :
                      'bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20'}`}>
                      {student.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {student.lastActive ? (
                        <>
                          {student.lastActive.toLocaleDateString()}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {student.lastActive.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </>
                      ) : "Recently"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewProfile(student.id)}
                        className="p-2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                        title="View Profile"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleSendMessage(student.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Send Message"
                      >
                        <FiMessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/faculty/attendance?student=${student.id}`)}
                        className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="View Attendance"
                      >
                        <FiUserCheck size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <MdOutlineGroup className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No students found</p>
                      <p className="text-sm mt-2">
                        {searchQuery ? "Try a different search term" : "Students will appear here when they enroll in your courses"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Students;