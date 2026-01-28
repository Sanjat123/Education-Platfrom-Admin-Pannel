// src/pages/student/LiveWatch.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const StudentLiveWatch = () => {
  const { sessionId, courseId } = useParams();
  const { user } = useAuth();
  const [isPaid, setIsPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 Minutes = 600 Seconds
  const navigate = useNavigate();
  const zpRef = useRef(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;
      // Check if student enrolled in this course
      const q = query(collection(db, "enrollments"), 
        where("studentId", "==", user.uid), 
        where("courseId", "==", courseId)
      );
      const snap = await getDocs(q);
      setIsPaid(!snap.empty);
    };
    checkAccess();
  }, [user, courseId]);

  useEffect(() => {
    // Timer Logic for Free Users
    if (!isPaid) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (zpRef.current) zpRef.current.destroy(); // Connection cut
            alert("Free preview ended. Please purchase to continue.");
            navigate(`/course/${courseId}`);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaid, courseId, navigate]);

  const myMeeting = async (element) => {
    const appID = 123456789;
    const serverSecret = "your_secret";
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, sessionId, user.uid, user.displayName);
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;

    zp.joinRoom({
      container: element,
      scenario: { mode: ZegoUIKitPrebuilt.LiveStreaming, config: { role: 'Audience' } },
      showPreJoinView: false
    });
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {!isPaid && (
        <div className="absolute top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-full font-black text-xs animate-pulse">
          FREE PREVIEW: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} LEFT
        </div>
      )}
      <div ref={myMeeting} className="w-full h-full" />
    </div>
  );
};