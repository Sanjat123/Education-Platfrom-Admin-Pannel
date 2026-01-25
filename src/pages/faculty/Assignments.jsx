import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiFileText, FiSearch, FiFilter, FiDownload, FiUpload,
  FiCalendar, FiClock, FiUsers, FiCheckCircle, FiAlertCircle,
  FiEdit2, FiTrash2, FiEye, FiShare2, FiPlus
} from "react-icons/fi";
import { MdAssignment, MdOutlineGrade } from "react-icons/md";
import { db } from "../../firebase";
import { 
  collection, query, where, getDocs, orderBy, addDoc,
  serverTimestamp, onSnapshot, doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Assignments = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    totalPoints: 100,
    type: "homework",
    attachments: []
  });

  useEffect(() => {
    if (!userProfile?.uid) return;
    fetchAssignments();
  }, [userProfile]);

  const fetchAssignments = async () => {
    try {
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("instructorId", "==", userProfile.uid),
        orderBy("createdAt", "desc")
      );
      
      const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
        const assignmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setAssignments(assignmentsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      const assignmentData = {
        ...newAssignment,
        instructorId: userProfile.uid,
        instructorName: userProfile.name,
        status: "active",
        submissions: 0,
        graded: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "assignments"), assignmentData);
      toast.success("Assignment created successfully!");
      setShowCreateModal(false);
      setNewAssignment({
        title: "",
        description: "",
        courseId: "",
        dueDate: "",
        totalPoints: 100,
        type: "homework",
        attachments: []
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment!");
    }
  };

  const handleGradeAssignment = (assignmentId) => {
    navigate(`/faculty/assignments/${assignmentId}/grade`);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create, manage, and grade student assignments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-xl transition-all flex items-center gap-2 shadow-md"
        >
          <FiPlus size={16} />
          Create Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-5 rounded-2xl border border-cyan-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-700 font-medium">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{assignments.length}</p>
            </div>
            <MdAssignment className="text-cyan-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 p-5 rounded-2xl border border-emerald-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {assignments.filter(a => a.status === 'submitted').length}
              </p>
            </div>
            <FiAlertCircle className="text-emerald-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-5 rounded-2xl border border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Graded</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {assignments.filter(a => a.status === 'graded').length}
              </p>
            </div>
            <FiCheckCircle className="text-amber-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 p-5 rounded-2xl border border-purple-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Avg. Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">78%</p>
            </div>
            <MdOutlineGrade className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="submitted">Pending Review</option>
              <option value="graded">Graded</option>
              <option value="overdue">Overdue</option>
            </select>
            <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
              <FiFilter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Assignments Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assignment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submissions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                          <FiFileText />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{assignment.title}</div>
                          <div className="text-xs text-gray-500">{assignment.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{assignment.courseName || "General"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {assignment.dueDate?.toLocaleDateString() || "No due date"}
                      </div>
                      {assignment.dueDate && (
                        <div className="text-xs text-gray-500">
                          {assignment.dueDate?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full"
                            style={{ width: `${(assignment.graded || 0) / (assignment.submissions || 1) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {assignment.graded || 0}/{assignment.submissions || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.status === 'graded' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                        assignment.status === 'submitted' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                        assignment.status === 'overdue' ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20' :
                        'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                      }`}>
                        {assignment.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGradeAssignment(assignment.id)}
                          className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Grade Assignment"
                        >
                          <MdOutlineGrade size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/faculty/assignments/${assignment.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/faculty/assignments/${assignment.id}/edit`)}
                          className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Edit Assignment"
                        >
                          <FiEdit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiFileText className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No assignments found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? "Try a different search term" : "Create your first assignment to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create New Assignment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  placeholder="e.g., JavaScript Fundamentals Quiz"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  rows="3"
                  placeholder="Describe the assignment requirements..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Points
                  </label>
                  <input
                    type="number"
                    value={newAssignment.totalPoints}
                    onChange={(e) => setNewAssignment({...newAssignment, totalPoints: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={newAssignment.type}
                    onChange={(e) => setNewAssignment({...newAssignment, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="homework">Homework</option>
                    <option value="quiz">Quiz</option>
                    <option value="project">Project</option>
                    <option value="exam">Exam</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    value={newAssignment.courseId}
                    onChange={(e) => setNewAssignment({...newAssignment, courseId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="">Select Course</option>
                    {/* Courses will be populated here */}
                  </select>
                </div>
              </div>
              
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Files (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-cyan-500 transition-colors cursor-pointer">
                  <FiUpload className="text-3xl text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, Word, Excel, Images (Max 10MB each)
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-lg transition-colors"
                >
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;