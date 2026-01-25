import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { FiPlay, FiBookOpen, FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const MyCourses = () => {
  const { user, userProfile } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Step 1: Fetch enrollment records for this student
    const q = query(collection(db, "enrollments"), where("studentId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const courseIds = snapshot.docs.map(doc => doc.data().courseId);
      
      if (courseIds.length === 0) {
        setEnrolledCourses([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch actual course details from 'courses' collection
      const coursesRef = collection(db, "courses");
      const coursesSnap = await getDocs(coursesRef);
      const allCourses = coursesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(course => courseIds.includes(course.id));

      setEnrolledCourses(allCourses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Learning Library</h1>
        <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-2 italic">Your Enrolled Programs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-20 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
            Loading your courses...
          </div>
        ) : enrolledCourses.length > 0 ? (
          enrolledCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
              <div className="h-48 bg-slate-200 relative">
                <img src={course.thumbnail || "https://via.placeholder.com/400"} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => navigate(`/student/course/${course.id}`)}
                    className="bg-white text-slate-900 p-4 rounded-full shadow-xl translate-y-4 group-hover:translate-y-0 transition-all"
                  >
                    <FiPlay size={24} fill="currentColor" />
                  </button>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full">
                  {course.category || "Development"}
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{course.title}</h3>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold italic">
                    <FiBookOpen /> {course.lecturesCount || 0} Lectures
                  </div>
                  <button 
                    onClick={() => navigate(`/student/course/${course.id}`)}
                    className="text-slate-900 font-black text-xs uppercase hover:text-sky-600"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
            <FiBookOpen className="mx-auto text-slate-200 mb-6" size={60} />
            <p className="text-slate-400 font-black uppercase tracking-widest italic">No Enrolled Courses Found</p>
            <button className="mt-6 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs">Explore Marketplace</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;