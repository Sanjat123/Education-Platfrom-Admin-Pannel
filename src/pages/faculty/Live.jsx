import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { 
  doc, updateDoc, serverTimestamp, 
  getDoc, collection, query, where, getDocs,
  addDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const FacultyLive = () => {
  const { sessionId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeLive = async () => {
      // Check if sessionId is available
      if (!sessionId) {
        setError("Session ID is missing");
        toast.error("Invalid session link");
        navigate('/faculty/dashboard');
        return;
      }

      if (!userProfile) {
        setError("User not authenticated");
        toast.error("Please login to start live session");
        navigate('/login');
        return;
      }

      try {
        console.log("Initializing live session with ID:", sessionId);
        
        // Check if session exists
        const sessionDoc = await getDoc(doc(db, "live_sessions", sessionId));
        
        if (!sessionDoc.exists()) {
          setError("Session not found");
          toast.error("Session not found");
          navigate('/faculty/dashboard');
          return;
        }

        const sessionData = sessionDoc.data();
        console.log("Session data:", sessionData);
        
        // Check if user is the instructor of this session
        if (sessionData.instructorId !== userProfile.uid && userProfile.role !== 'admin') {
          setError("Unauthorized access");
          toast.error("You are not authorized to start this session");
          navigate('/faculty/dashboard');
          return;
        }

        setIsHost(true);
        
        // Get course details
        if (sessionData.courseId) {
          const courseDoc = await getDoc(doc(db, "courses", sessionData.courseId));
          if (courseDoc.exists()) {
            setCourseDetails(courseDoc.data());
          }
        }

        // Initialize ZegoCloud
        await startLiveSession(sessionData);
        
      } catch (error) {
        console.error("Error initializing live:", error);
        setError(error.message);
        toast.error("Failed to start live session");
        navigate('/faculty/dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeLive();

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [sessionId, userProfile, navigate]);

  const startLiveSession = async (sessionData) => {
    try {
      // ZegoCloud credentials - Replace with your actual credentials
      const appID = parseInt(process.env.REACT_APP_ZEGO_APP_ID) || 123456789;
      const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET || "your_secret";
      
      console.log("Starting ZegoCloud session with:", { appID, sessionId });
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        sessionId, 
        userProfile.uid, 
        userProfile.name
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      
      // Configure live streaming
      const config = {
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host, // Teacher is always host
          }
        },
        showPreJoinView: false,
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: true,
        showTextChat: sessionData.enableChat || true,
        showUserList: true,
        showLayoutButton: true,
        lowerLeftNotification: {
          showUserJoinAndLeave: true,
          showTextChat: true
        },
        maxUsers: sessionData.maxParticipants || 1000,
        layout: "Auto",
        sharedLinks: [
          {
            name: 'Join Live Class',
            url: `${window.location.origin}/live/${sessionId}`
          }
        ],
        onJoinRoom: async () => {
          console.log("Teacher joined the room");
          
          // Update session status in Firestore
          await updateDoc(doc(db, "live_sessions", sessionId), {
            status: "live",
            startedAt: serverTimestamp(),
            currentViewers: 0,
            isActive: true
          });

          // Notify enrolled students if course exists
          if (sessionData.courseId) {
            await notifyStudents(sessionData.courseId, sessionData.topic);
          }
          
          toast.success("Live session started! Students can now join.");
        },
        onLeaveRoom: async () => {
          console.log("Teacher left the room");
          await updateDoc(doc(db, "live_sessions", sessionId), {
            status: "ended",
            endedAt: serverTimestamp(),
            isActive: false,
            duration: new Date().getTime() - (sessionData.startedAt?.toDate().getTime() || new Date().getTime())
          });
          
          // Generate recording link if enabled
          if (sessionData.enableRecording) {
            await generateRecording(sessionId);
          }
        },
        onUserJoin: (users) => {
          console.log("Student joined:", users);
          // Update viewer count
          updateViewerCount(sessionId, 'increment');
        },
        onUserLeave: (users) => {
          console.log("Student left:", users);
          // Update viewer count
          updateViewerCount(sessionId, 'decrement');
        },
        onJoinRoomFailed: (error) => {
          console.error("Failed to join room:", error);
          toast.error("Failed to join video room");
        }
      };

      zp.joinRoom(config);

    } catch (error) {
      console.error("Error starting live:", error);
      throw error;
    }
  };

  const updateViewerCount = async (sessionId, action) => {
    try {
      const sessionRef = doc(db, "live_sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const currentCount = sessionSnap.data().currentViewers || 0;
        const newCount = action === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1);
        
        await updateDoc(sessionRef, {
          currentViewers: newCount,
          totalViews: increment(1)
        });
      }
    } catch (error) {
      console.error("Error updating viewer count:", error);
    }
  };

  const notifyStudents = async (courseId, sessionTopic) => {
    try {
      // Get all enrolled students for this course
      const enrollmentsQuery = query(
        collection(db, "enrollments"), 
        where("courseId", "==", courseId),
        where("status", "==", "active")
      );
      
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const studentIds = enrollmentsSnap.docs.map(doc => doc.data().studentId);
      
      console.log(`Notifying ${studentIds.length} students`);
      
      // Create notifications for each student
      const notifications = studentIds.map(studentId => ({
        userId: studentId,
        title: "Live Class Started",
        message: `${sessionTopic} has started! Join now.`,
        type: "live_session",
        sessionId: sessionId,
        link: `/live/${sessionId}`,
        read: false,
        createdAt: serverTimestamp()
      }));
      
      // Add notifications in batch (consider using batch writes for large numbers)
      for (const notification of notifications) {
        await addDoc(collection(db, "notifications"), notification);
      }
      
    } catch (error) {
      console.error("Error notifying students:", error);
    }
  };

  const generateRecording = async (sessionId) => {
    try {
      // In a real implementation, you would get the recording URL from ZegoCloud
      // For now, we'll just mark that recording is enabled
      await updateDoc(doc(db, "live_sessions", sessionId), {
        recordingAvailable: true,
        recordingProcessed: false
      });
      
      toast.success("Recording will be available shortly");
      
    } catch (error) {
      console.error("Error generating recording:", error);
    }
  };

  const handleEmergencyEnd = async () => {
    if (window.confirm("Are you sure you want to end the live session for all students?")) {
      try {
        await updateDoc(doc(db, "live_sessions", sessionId), {
          status: "ended",
          endedAt: serverTimestamp(),
          endedBy: userProfile.uid,
          emergencyEnd: true
        });
        
        toast.success("Live session ended");
        navigate('/faculty/dashboard');
      } catch (error) {
        console.error("Error ending session:", error);
        toast.error("Failed to end session");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg mb-2">Initializing Live Session</p>
          <p className="text-gray-400">Session ID: {sessionId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center bg-gray-800 p-8 rounded-xl max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/faculty/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Live Session Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-white font-bold">LIVE</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {courseDetails?.title || "Live Teaching Session"}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>Session: {sessionId}</span>
              <span>•</span>
              <span>Host: {userProfile?.name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href={`${window.location.origin}/live/${sessionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Student View
          </a>
          
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/live/${sessionId}`)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>
          
          <button
            onClick={handleEmergencyEnd}
            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main Video Container */}
      <div ref={containerRef} className="w-full h-[calc(100vh-80px)]" />
      
      {/* Teacher Controls Overlay */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-700">
        <div className="flex items-center gap-2 text-white">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Live Teaching Mode</span>
        </div>
        
        <div className="h-6 w-px bg-gray-600"></div>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          onClick={() => {
            // Share screen
            if (window.ZegoUIKitPrebuilt) {
              window.ZegoUIKitPrebuilt.toggleScreenSharing();
            }
          }}
        >
          Share Screen
        </button>
        
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          onClick={() => {
            // Mute all students
            toast.info("Feature coming soon: Mute all students");
          }}
        >
          Mute All
        </button>
        
        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
          onClick={() => {
            // Start poll
            toast.info("Feature coming soon: Start poll");
          }}
        >
          Start Poll
        </button>
      </div>

      {/* Session Info Sidebar */}
      <div className="fixed top-20 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 w-64 border border-gray-700">
        <h3 className="text-white font-bold mb-3">Session Info</h3>
        
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400">Course</p>
            <p className="text-white font-medium">{courseDetails?.title || "N/A"}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400">Session ID</p>
            <p className="text-white font-mono text-sm">{sessionId}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400">Started</p>
            <p className="text-white">{new Date().toLocaleTimeString()}</p>
          </div>
          
          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Students Online</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-white font-bold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLive;