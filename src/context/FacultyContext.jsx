import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const FacultyContext = createContext();

export const useFaculty = () => {
  const context = useContext(FacultyContext);
  if (!context) throw new Error("useFaculty must be used within FacultyProvider");
  return context;
};

export const FacultyProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    assignments: 0,
    liveSessions: 0,
    totalStudents: 0 // <--- STUDENT COUNT INITIALIZED
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role !== 'teacher' || userProfile?.status !== 'active') {
      setLoading(false);
      return;
    }

    // 1. Listen for Teacher's Courses
    const qCourses = query(collection(db, "courses"), where("instructorId", "==", userProfile.uid));
    const unsubCourses = onSnapshot(qCourses, (snap) => {
      setStats(prev => ({ ...prev, courses: snap.size }));
    });

    // 2. Listen for Teacher's Students (Enrollments)
    // Enrollments collection mein instructorId field teacher ki UID honi chahiye
    const qStudents = query(collection(db, "enrollments"), where("instructorId", "==", userProfile.uid));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStats(prev => ({ ...prev, totalStudents: snap.size })); // <--- SETTING REAL COUNT
      setLoading(false);
    });

    // 3. Listen for Assignments
    const qAssign = query(collection(db, "resources"), where("instructorId", "==", userProfile.uid));
    const unsubAssign = onSnapshot(qAssign, (snap) => {
      setStats(prev => ({ ...prev, assignments: snap.size }));
    });

    return () => {
      unsubCourses();
      unsubStudents();
      unsubAssign();
    };
  }, [userProfile]);

  const getQuickStats = useCallback(() => [
    { label: 'My Academy', value: stats.courses, color: 'blue', icon: 'book' },
    { label: 'Published Notes', value: stats.assignments, color: 'orange', icon: 'file' },
    { label: 'Active Students', value: stats.totalStudents, color: 'emerald', icon: 'users' }, // <--- MAPPED TO ENROLLMENTS
    { label: 'Live Events', value: stats.liveSessions, color: 'rose', icon: 'video' }
  ], [stats]);

  return (
    <FacultyContext.Provider value={{ stats, loading, getQuickStats }}>
      {children}
    </FacultyContext.Provider>
  );
};