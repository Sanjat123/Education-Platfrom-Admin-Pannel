// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const githubProvider = new GithubAuthProvider();

// Teacher Services - Comprehensive teacher data management
const teacherServices = {
  // 1. Teacher Profile Management
  async getTeacherProfile(teacherId) {
    try {
      const teacherDoc = await getDoc(doc(db, "teachers", teacherId));
      return teacherDoc.exists() ? teacherDoc.data() : null;
    } catch (error) {
      console.error("Error getting teacher profile:", error);
      return null;
    }
  },

  async createTeacherProfile(teacherId, data) {
    try {
      const teacherProfile = {
        uid: teacherId,
        name: data.name || data.email?.split('@')[0],
        email: data.email,
        role: 'teacher',
        department: data.department || 'General',
        qualifications: data.qualifications || ['Masters Degree'],
        expertise: data.expertise || ['Web Development', 'React', 'JavaScript'],
        bio: data.bio || 'Experienced instructor passionate about teaching',
        profileImage: data.photoURL || '',
        phone: data.phone || '',
        address: data.address || '',
        socialLinks: data.socialLinks || {},
        permissions: [
          'view_dashboard',
          'manage_courses',
          'conduct_live',
          'manage_assignments',
          'manage_grades',
          'view_students',
          'send_messages',
          'view_analytics',
          'view_schedule',
          'manage_attendance',
          'manage_resources',
          'access_support'
        ],
        settings: {
          notifications: true,
          emailUpdates: true,
          darkMode: false,
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        stats: {
          totalCourses: 0,
          activeCourses: 0,
          completedCourses: 0,
          totalStudents: 0,
          totalLectures: 0,
          totalAssignments: 0,
          totalResources: 0,
          averageRating: 0,
          totalReviews: 0,
          totalRevenue: 0,
          totalHours: 0
        },
        performance: {
          rating: 0,
          completion: 0,
          engagement: 0,
          satisfaction: 0,
          assignments: 0,
          liveSessions: 0,
          students: 0,
          revenue: 0
        },
        metadata: {
          joinDate: new Date().toISOString(),
          lastActive: serverTimestamp(),
          status: 'active',
          isProfileComplete: false,
          verified: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "teachers", teacherId), teacherProfile);
      
      // Create initial activity
      await addDoc(collection(db, "activities"), {
        userId: teacherId,
        userType: 'teacher',
        type: 'profile_created',
        title: 'Teacher Profile Created',
        description: 'New teacher account setup completed',
        metadata: {
          action: 'profile_creation',
          source: 'registration',
          timestamp: new Date().toISOString()
        },
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      return teacherProfile;
    } catch (error) {
      console.error("Error creating teacher profile:", error);
      throw error;
    }
  },

  async updateTeacherProfile(teacherId, updates) {
    try {
      const teacherRef = doc(db, "teachers", teacherId);
      await updateDoc(teacherRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error updating teacher profile:", error);
      throw error;
    }
  },

  // 2. Course Management
  async getTeacherCourses(teacherId) {
    try {
      const coursesQuery = query(
        collection(db, "courses"),
        where("instructorId", "==", teacherId),
        orderBy("createdAt", "desc")
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      const courses = await Promise.all(
        coursesSnapshot.docs.map(async (docSnap) => {
          const courseData = docSnap.data();
          const courseId = docSnap.id;
          
          // Get enrollment count
          const enrollmentsQuery = query(
            collection(db, "enrollments"),
            where("courseId", "==", courseId),
            where("status", "==", "active")
          );
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
          
          // Get completion rate
          const completedQuery = query(
            collection(db, "enrollments"),
            where("courseId", "==", courseId),
            where("progress", "==", 100)
          );
          const completedSnapshot = await getDocs(completedQuery);
          
          // Get average rating
          const reviewsQuery = query(
            collection(db, "reviews"),
            where("courseId", "==", courseId)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          
          let totalRating = 0;
          reviewsSnapshot.forEach(reviewDoc => {
            totalRating += reviewDoc.data().rating || 0;
          });
          
          return {
            id: courseId,
            ...courseData,
            enrolledStudents: enrollmentsSnapshot.size,
            completedStudents: completedSnapshot.size,
            averageRating: reviewsSnapshot.size > 0 ? 
              parseFloat((totalRating / reviewsSnapshot.size).toFixed(1)) : 0,
            totalReviews: reviewsSnapshot.size,
            completionRate: enrollmentsSnapshot.size > 0 ? 
              Math.round((completedSnapshot.size / enrollmentsSnapshot.size) * 100) : 0
          };
        })
      );
      
      return courses;
    } catch (error) {
      console.error("Error fetching teacher courses:", error);
      return [];
    }
  },

  async createCourse(teacherId, courseData) {
    try {
      const course = {
        ...courseData,
        instructorId: teacherId,
        instructorName: courseData.instructorName || "Teacher",
        status: 'draft',
        enrolledStudents: 0,
        averageRating: 0,
        totalReviews: 0,
        completionRate: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "courses"), course);
      
      // Update teacher stats
      await this.updateTeacherStats(teacherId, {
        totalCourses: increment(1),
        activeCourses: increment(1)
      });

      // Record activity
      await addDoc(collection(db, "activities"), {
        userId: teacherId,
        userType: 'teacher',
        type: 'course_created',
        title: 'Course Created',
        description: `Created new course: ${courseData.title}`,
        metadata: {
          action: 'course_creation',
          courseId: docRef.id,
          courseTitle: courseData.title,
          timestamp: new Date().toISOString()
        },
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      return { id: docRef.id, ...course };
    } catch (error) {
      console.error("Error creating course:", error);
      throw error;
    }
  },

  // 3. Live Sessions Management
  async getTeacherLiveSessions(teacherId) {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const sessionsQuery = query(
        collection(db, "live_sessions"),
        where("instructorId", "==", teacherId),
        where("scheduledTime", ">=", Timestamp.fromDate(weekAgo)),
        orderBy("scheduledTime", "desc")
      );
      
      const sessionsSnapshot = await getDocs(sessionsQuery);
      return sessionsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        scheduledTime: docSnap.data().scheduledTime?.toDate() || new Date()
      }));
    } catch (error) {
      console.error("Error fetching live sessions:", error);
      return [];
    }
  },

  async createLiveSession(teacherId, sessionData) {
    try {
      const session = {
        ...sessionData,
        instructorId: teacherId,
        status: 'scheduled',
        studentsEnrolled: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "live_sessions"), session);

      // Record activity
      await addDoc(collection(db, "activities"), {
        userId: teacherId,
        userType: 'teacher',
        type: 'live_session_scheduled',
        title: 'Live Session Scheduled',
        description: `Scheduled live session: ${sessionData.title}`,
        metadata: {
          action: 'live_session_scheduling',
          sessionId: docRef.id,
          sessionTitle: sessionData.title,
          scheduledTime: sessionData.scheduledTime,
          timestamp: new Date().toISOString()
        },
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      return { id: docRef.id, ...session };
    } catch (error) {
      console.error("Error creating live session:", error);
      throw error;
    }
  },

  // 4. Assignments Management
  async getTeacherAssignments(teacherId) {
    try {
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("instructorId", "==", teacherId),
        orderBy("createdAt", "desc")
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      return assignmentsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        dueDate: docSnap.data().dueDate?.toDate() || new Date()
      }));
    } catch (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }
  },

  // 5. Student Management
  async getTeacherStudents(teacherId) {
    try {
      // First get teacher's courses
      const coursesQuery = query(
        collection(db, "courses"),
        where("instructorId", "==", teacherId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      const courseIds = coursesSnapshot.docs.map(doc => doc.id);
      
      if (courseIds.length === 0) return [];
      
      // Get all enrollments for these courses
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("courseId", "in", courseIds.slice(0, 10)) // Firestore limit
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const studentIds = [...new Set(enrollmentsSnapshot.docs.map(doc => doc.data().studentId))];
      
      // Get student details
      const students = await Promise.all(
        studentIds.slice(0, 50).map(async (studentId) => {
          const studentDoc = await getDoc(doc(db, "users", studentId));
          const enrollmentDocs = enrollmentsSnapshot.docs.filter(
            doc => doc.data().studentId === studentId
          );
          
          return {
            id: studentId,
            ...studentDoc.data(),
            enrolledCourses: enrollmentDocs.length,
            totalProgress: enrollmentDocs.reduce((sum, doc) => sum + (doc.data().progress || 0), 0) / enrollmentDocs.length
          };
        })
      );
      
      return students;
    } catch (error) {
      console.error("Error fetching teacher students:", error);
      return [];
    }
  },

  // 6. Analytics & Statistics
  async getTeacherAnalytics(teacherId) {
    try {
      const courses = await this.getTeacherCourses(teacherId);
      const liveSessions = await this.getTeacherLiveSessions(teacherId);
      const assignments = await this.getTeacherAssignments(teacherId);
      const students = await this.getTeacherStudents(teacherId);
      
      // Calculate statistics
      const totalStudents = [...new Set(students.map(s => s.id))].length;
      const pendingAssignments = assignments.filter(a => 
        a.status === 'submitted' || a.status === 'pending'
      ).length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingClasses = liveSessions.filter(session => 
        session.scheduledTime >= today
      ).length;
      
      const totalRevenue = courses.reduce((sum, course) => {
        return sum + (course.enrolledStudents * (course.price || 0));
      }, 0);
      
      const averageRating = courses.length > 0 ? 
        parseFloat((courses.reduce((sum, course) => sum + course.averageRating, 0) / courses.length).toFixed(1)) : 0;
      
      return {
        totalCourses: courses.length,
        activeCourses: courses.filter(c => c.status === 'active' || c.status === 'published').length,
        completedCourses: courses.filter(c => c.status === 'completed').length,
        totalStudents,
        pendingAssignments,
        upcomingClasses,
        liveSessionsCount: liveSessions.length,
        totalRevenue,
        averageRating,
        completionRate: courses.length > 0 ? 
          parseFloat((courses.reduce((sum, course) => sum + course.completionRate, 0) / courses.length).toFixed(1)) : 0
      };
    } catch (error) {
      console.error("Error calculating analytics:", error);
      return null;
    }
  },

  async updateTeacherStats(teacherId, updates) {
    try {
      const teacherRef = doc(db, "teachers", teacherId);
      await updateDoc(teacherRef, {
        [`stats.${Object.keys(updates)[0]}`]: updates[Object.keys(updates)[0]]
      });
      return true;
    } catch (error) {
      console.error("Error updating teacher stats:", error);
      throw error;
    }
  },

  // 7. Performance Management
  async updateTeacherPerformance(teacherId, updates) {
    try {
      const teacherRef = doc(db, "teachers", teacherId);
      await updateDoc(teacherRef, {
        [`performance.${Object.keys(updates)[0]}`]: updates[Object.keys(updates)[0]]
      });
      return true;
    } catch (error) {
      console.error("Error updating teacher performance:", error);
      throw error;
    }
  },

  // 8. Resource Management
  async getTeacherResources(teacherId) {
    try {
      const resourcesQuery = query(
        collection(db, "resources"),
        where("instructorId", "==", teacherId),
        orderBy("createdAt", "desc")
      );
      
      const resourcesSnapshot = await getDocs(resourcesQuery);
      return resourcesSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date()
      }));
    } catch (error) {
      console.error("Error fetching resources:", error);
      return [];
    }
  },

  async uploadResource(teacherId, resourceData, file) {
    try {
      // Upload file to storage
      const storageRef = ref(storage, `resources/${teacherId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const resource = {
        ...resourceData,
        instructorId: teacherId,
        fileUrl: downloadURL,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        downloadCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "resources"), resource);

      // Update teacher stats
      await this.updateTeacherStats(teacherId, {
        totalResources: increment(1)
      });

      // Record activity
      await addDoc(collection(db, "activities"), {
        userId: teacherId,
        userType: 'teacher',
        type: 'resource_uploaded',
        title: 'Resource Uploaded',
        description: `Uploaded resource: ${resourceData.title}`,
        metadata: {
          action: 'resource_upload',
          resourceId: docRef.id,
          resourceTitle: resourceData.title,
          fileType: file.type,
          timestamp: new Date().toISOString()
        },
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      return { id: docRef.id, ...resource };
    } catch (error) {
      console.error("Error uploading resource:", error);
      throw error;
    }
  },

  // 9. Activity Recording
  async recordActivity(teacherId, type, title, description, metadata = {}) {
    try {
      await addDoc(collection(db, "activities"), {
        userId: teacherId,
        userType: 'teacher',
        type,
        title,
        description,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error recording activity:", error);
      throw error;
    }
  },

  // 10. Dashboard Data
  async getDashboardData(teacherId) {
    try {
      const [
        courses,
        liveSessions,
        assignments,
        students,
        analytics,
        resources
      ] = await Promise.all([
        this.getTeacherCourses(teacherId),
        this.getTeacherLiveSessions(teacherId),
        this.getTeacherAssignments(teacherId),
        this.getTeacherStudents(teacherId),
        this.getTeacherAnalytics(teacherId),
        this.getTeacherResources(teacherId)
      ]);

      return {
        courses,
        liveSessions,
        assignments,
        students,
        analytics,
        resources,
        stats: analytics || {},
        recentActivities: await this.getRecentActivities(teacherId, 5),
        todaySchedule: await this.getTodaySchedule(teacherId),
        upcomingClasses: await this.getUpcomingClasses(teacherId)
      };
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      return null;
    }
  },

  async getRecentActivities(teacherId, limitCount = 10) {
    try {
      const activitiesQuery = query(
        collection(db, "activities"),
        where("userId", "==", teacherId),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      
      const activitiesSnapshot = await getDocs(activitiesQuery);
      return activitiesSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  },

  async getTodaySchedule(teacherId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const scheduleQuery = query(
        collection(db, "live_sessions"),
        where("instructorId", "==", teacherId),
        where("scheduledTime", ">=", Timestamp.fromDate(today)),
        where("scheduledTime", "<", Timestamp.fromDate(tomorrow)),
        orderBy("scheduledTime", "asc")
      );
      
      const scheduleSnapshot = await getDocs(scheduleQuery);
      return scheduleSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          scheduledTime: data.scheduledTime?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error("Error fetching today's schedule:", error);
      return [];
    }
  },

  async getUpcomingClasses(teacherId) {
    try {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingQuery = query(
        collection(db, "live_sessions"),
        where("instructorId", "==", teacherId),
        where("scheduledTime", ">", Timestamp.fromDate(now)),
        where("scheduledTime", "<=", Timestamp.fromDate(weekFromNow)),
        orderBy("scheduledTime", "asc"),
        limit(10)
      );
      
      const upcomingSnapshot = await getDocs(upcomingQuery);
      return upcomingSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          scheduledTime: data.scheduledTime?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error("Error fetching upcoming classes:", error);
      return [];
    }
  }
};

// Student Services
const studentServices = {
  async getStudentProfile(studentId) {
    try {
      const studentDoc = await getDoc(doc(db, "students", studentId));
      return studentDoc.exists() ? studentDoc.data() : null;
    } catch (error) {
      console.error("Error getting student profile:", error);
      return null;
    }
  },

  async createStudentProfile(studentId, data) {
    try {
      const studentProfile = {
        uid: studentId,
        name: data.name || data.email?.split('@')[0],
        email: data.email,
        role: 'student',
        enrollmentDate: new Date().toISOString(),
        enrolledCourses: [],
        completedCourses: [],
        progress: {},
        preferences: {
          notifications: true,
          emailUpdates: true,
          learningPath: 'default',
          difficulty: 'beginner'
        },
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          totalAssignments: 0,
          completedAssignments: 0,
          totalHours: 0,
          streak: 0
        },
        metadata: {
          status: 'active',
          lastActive: serverTimestamp(),
          isProfileComplete: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "students", studentId), studentProfile);
      return studentProfile;
    } catch (error) {
      console.error("Error creating student profile:", error);
      throw error;
    }
  }
};

// Course Services
const courseServices = {
  async getCourse(courseId) {
    try {
      const courseDoc = await getDoc(doc(db, "courses", courseId));
      return courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null;
    } catch (error) {
      console.error("Error getting course:", error);
      return null;
    }
  },

  async enrollStudent(courseId, studentId) {
    try {
      const enrollment = {
        courseId,
        studentId,
        enrolledAt: serverTimestamp(),
        progress: 0,
        status: 'active',
        lastAccessed: serverTimestamp()
      };

      await setDoc(doc(collection(db, "enrollments"), `${courseId}_${studentId}`), enrollment);
      
      // Update course enrollment count
      await updateDoc(doc(db, "courses", courseId), {
        enrolledStudents: increment(1)
      });

      return enrollment;
    } catch (error) {
      console.error("Error enrolling student:", error);
      throw error;
    }
  }
};

// Export everything
export { 
  app, 
  auth, 
  db, 
  storage,
  googleProvider,
  facebookProvider,
  githubProvider,
  teacherServices,
  studentServices,
  courseServices
};