// scripts/initTeacherData.js
import { db } from '../firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

export const initSampleTeacherData = async (teacherId) => {
  try {
    // Initialize teacher profile
    const teacherProfile = {
      uid: teacherId,
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'teacher',
      department: 'Computer Science',
      qualifications: ['MSc Computer Science', 'BSc Software Engineering'],
      expertise: ['React', 'JavaScript', 'Node.js', 'Web Development'],
      bio: 'Senior instructor with 8+ years of experience in web development. Passionate about teaching and mentoring aspiring developers.',
      profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
      phone: '+1 234 567 8900',
      address: '123 Education Street, Tech City',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/johnsmith',
        twitter: 'https://twitter.com/johnsmith',
        github: 'https://github.com/johnsmith'
      },
      settings: {
        notifications: true,
        emailUpdates: true,
        darkMode: false
      },
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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active'
    };

    await setDoc(doc(db, 'teachers', teacherId), teacherProfile);

    // Initialize sample courses
    const courses = [
      {
        id: 'course_react_2024',
        title: 'React Masterclass 2024',
        description: 'Complete React.js course from basics to advanced concepts including hooks, context, and Redux.',
        category: 'Web Development',
        instructorId: teacherId,
        instructorName: 'John Smith',
        price: 99,
        duration: '8 weeks',
        enrolledStudents: 145,
        maxStudents: 200,
        status: 'published',
        level: 'Intermediate',
        prerequisites: ['Basic JavaScript', 'HTML/CSS'],
        learningOutcomes: [
          'Build professional React applications',
          'Understand React hooks and context',
          'Implement state management with Redux',
          'Test React components'
        ],
        curriculum: [
          { title: 'Introduction to React', duration: '2 hours', completed: true },
          { title: 'Components & Props', duration: '3 hours', completed: true },
          { title: 'State & Lifecycle', duration: '4 hours', completed: true },
          { title: 'React Hooks', duration: '5 hours', completed: false },
          { title: 'Context API', duration: '3 hours', completed: false },
          { title: 'Redux Fundamentals', duration: '6 hours', completed: false }
        ],
        averageRating: 4.8,
        totalReviews: 89,
        completionRate: 75,
        createdAt: Timestamp.fromDate(new Date('2024-01-15')),
        updatedAt: Timestamp.now(),
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400'
      },
      {
        id: 'course_js_fundamentals',
        title: 'JavaScript Fundamentals',
        description: 'Master JavaScript from scratch with hands-on projects and real-world examples.',
        category: 'Programming',
        instructorId: teacherId,
        instructorName: 'John Smith',
        price: 79,
        duration: '6 weeks',
        enrolledStudents: 210,
        maxStudents: 250,
        status: 'published',
        level: 'Beginner',
        prerequisites: ['Basic computer knowledge'],
        learningOutcomes: [
          'Understand JavaScript fundamentals',
          'Work with arrays and objects',
          'Handle asynchronous operations',
          'Build interactive web applications'
        ],
        curriculum: [
          { title: 'Variables & Data Types', duration: '2 hours', completed: true },
          { title: 'Functions & Scope', duration: '3 hours', completed: true },
          { title: 'Arrays & Objects', duration: '4 hours', completed: true },
          { title: 'DOM Manipulation', duration: '5 hours', completed: true },
          { title: 'Async JavaScript', duration: '4 hours', completed: false },
          { title: 'ES6+ Features', duration: '3 hours', completed: false }
        ],
        averageRating: 4.6,
        totalReviews: 124,
        completionRate: 82,
        createdAt: Timestamp.fromDate(new Date('2024-02-10')),
        updatedAt: Timestamp.now(),
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400'
      }
    ];

    for (const course of courses) {
      await setDoc(doc(db, 'courses', course.id), course);
    }

    // Initialize sample live sessions
    const liveSessions = [
      {
        id: 'live_react_hooks',
        title: 'React Hooks Deep Dive',
        courseId: 'course_react_2024',
        instructorId: teacherId,
        instructorName: 'John Smith',
        scheduledTime: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 hours from now
        duration: 120,
        status: 'upcoming',
        studentsEnrolled: 45,
        maxParticipants: 100,
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        agenda: [
          'Introduction to useState',
          'useEffect in practice',
          'Custom hooks creation',
          'Q&A session'
        ],
        resources: [
          { name: 'Hooks Cheatsheet.pdf', type: 'pdf', url: '#' },
          { name: 'Sample Code', type: 'zip', url: '#' }
        ],
        createdAt: Timestamp.now()
      }
    ];

    for (const session of liveSessions) {
      await setDoc(doc(db, 'live_sessions', session.id), session);
    }

    // Initialize sample assignments
    const assignments = [
      {
        id: 'assign_todo_app',
        title: 'React Todo App',
        courseId: 'course_react_2024',
        instructorId: teacherId,
        description: 'Create a todo application using React with CRUD operations',
        dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
        points: 100,
        status: 'submitted',
        submissionsCount: 42,
        gradedCount: 35,
        averageScore: 85,
        attachments: [
          { name: 'Assignment Brief.pdf', url: '#' }
        ],
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      }
    ];

    for (const assignment of assignments) {
      await setDoc(doc(db, 'assignments', assignment.id), assignment);
    }

    console.log('Sample teacher data initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing teacher data:', error);
    return false;
  }
};