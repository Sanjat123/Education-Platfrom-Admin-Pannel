// scripts/initFirebaseData.js
import { teacherServices } from '../firebase';

export const initSampleTeacherData = async (teacherId, teacherData) => {
  try {
    // Create teacher profile
    await teacherServices.createTeacherProfile(teacherId, teacherData);
    
    // Create sample courses
    const sampleCourses = [
      {
        title: "React Masterclass 2024",
        description: "Complete React.js course from basics to advanced concepts",
        category: "Web Development",
        instructorId: teacherId,
        instructorName: teacherData.name,
        price: 99,
        duration: "8 weeks",
        level: "Intermediate",
        status: "published",
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
        curriculum: [
          { title: "Introduction to React", duration: "2 hours" },
          { title: "Components & Props", duration: "3 hours" },
          { title: "State & Lifecycle", duration: "4 hours" }
        ]
      },
      {
        title: "JavaScript Fundamentals",
        description: "Master JavaScript from scratch with hands-on projects",
        category: "Programming",
        instructorId: teacherId,
        instructorName: teacherData.name,
        price: 79,
        duration: "6 weeks",
        level: "Beginner",
        status: "published",
        thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400",
        curriculum: [
          { title: "Variables & Data Types", duration: "2 hours" },
          { title: "Functions & Scope", duration: "3 hours" },
          { title: "Arrays & Objects", duration: "4 hours" }
        ]
      }
    ];

    for (const course of sampleCourses) {
      await teacherServices.createCourse(teacherId, course);
    }
    
    // Create sample live session
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await teacherServices.createLiveSession(teacherId, {
      title: "React Hooks Deep Dive",
      courseId: "sample_course_1",
      description: "Learn about React hooks in detail",
      scheduledTime: nextWeek,
      duration: 120,
      maxParticipants: 100,
      meetingLink: "https://meet.google.com/abc-defg-hij"
    });

    console.log("Sample teacher data initialized successfully!");
    return true;
  } catch (error) {
    console.error("Error initializing sample data:", error);
    return false;
  }
};