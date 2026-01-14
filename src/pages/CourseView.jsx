import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { FiPlay, FiFileText, FiLock, FiCheckCircle, FiChevronRight } from "react-icons/fi";
import toast from "react-hot-toast";

const CourseView = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [activeLecture, setActiveLecture] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      // 1. Check Enrollment
      const enrollSnap = await getDocs(query(
        collection(db, "enrollments"), 
        where("studentId", "==", user.uid),
        where("courseId", "==", courseId)
      ));
      setIsEnrolled(!enrollSnap.empty);

      // 2. Get Course & Lectures
      const courseDoc = await getDoc(doc(db, "courses", courseId));
      setCourse(courseDoc.data());

      const lects = await getDocs(collection(db, `courses/${courseId}/lectures`));
      const lectsData = lects.docs.map(d => ({ id: d.id, ...d.data() }));
      setLectures(lectsData);
      if (lectsData.length > 0) setActiveLecture(lectsData[0]);
    };
    fetchCourseData();
  }, [courseId, user]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 p-4">
      {/* Video Section */}
      <div className="flex-1 bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        {activeLecture && (isEnrolled || activeLecture.isFree) ? (
          <iframe 
            src={activeLecture.videoUrl} 
            className="w-full h-full"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white p-10 text-center">
            <FiLock size={60} className="text-red-600 mb-4 animate-bounce" />
            <h2 className="text-2xl font-black uppercase italic">Content Locked</h2>
            <p className="text-slate-400 mt-2">Please complete the purchase to unlock this lecture.</p>
          </div>
        )}
      </div>

      {/* Playlist Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col shadow-sm">
        <div className="p-8 border-b border-slate-50">
          <h2 className="font-black text-slate-900 uppercase italic tracking-tighter">Course Content</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{lectures.length} Lectures Total</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lectures.map((lect, idx) => {
            const locked = !isEnrolled && !lect.isFree;
            return (
              <button 
                key={lect.id}
                onClick={() => !locked && setActiveLecture(lect)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  activeLecture?.id === lect.id ? "bg-red-50 text-red-600 shadow-sm" : "hover:bg-slate-50 text-slate-600"
                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="text-xs font-black">{idx + 1}</div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold leading-tight line-clamp-1">{lect.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {lect.isFree && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Free</span>}
                  </div>
                </div>
                {locked ? <FiLock /> : <FiPlay />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseView;