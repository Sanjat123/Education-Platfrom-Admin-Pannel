import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiVideo, FiPlus, FiX, FiCalendar, FiClock, FiTrash2, 
  FiPlayCircle, FiUsers, FiUser, FiBookOpen, FiMessageSquare,
  FiMic, FiMicOff, FiVideoOff, FiVideo as FiVideoIcon,
  FiShare2, FiCopy, FiBell, FiSend, FiSettings, FiAlertCircle,
  FiChevronDown, FiChevronUp, FiGrid, FiList, FiCheck,
  FiEye, FiEyeOff, FiLock, FiUnlock, FiFileText, FiDownload
} from "react-icons/fi";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, query, 
  orderBy, where, updateDoc, getDocs, serverTimestamp,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import toast from "react-hot-toast";

// Direct WebRTC implementation without third-party
class DirectWebRTC {
  constructor() {
    this.peerConnections = {};
    this.localStream = null;
    this.dataChannel = null;
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  async initializeLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }

  async createPeerConnection(remoteId, onStreamReceived) {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      if (onStreamReceived) {
        onStreamReceived(event.streams[0], remoteId);
      }
    };

    // Data channel for chat
    if (!this.dataChannel) {
      this.dataChannel = pc.createDataChannel('chat');
    }

    this.peerConnections[remoteId] = pc;
    return pc;
  }

  async createOffer(remoteId) {
    const pc = this.peerConnections[remoteId];
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  async handleAnswer(remoteId, answer) {
    const pc = this.peerConnections[remoteId];
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleOffer(remoteId, offer, onStreamReceived) {
    const pc = await this.createPeerConnection(remoteId, onStreamReceived);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  stop() {
    // Stop all tracks in local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(this.peerConnections).forEach(pc => pc.close());
    
    this.peerConnections = {};
    this.localStream = null;
    this.dataChannel = null;
  }
}

const LiveClasses = () => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [isAdminMeeting, setIsAdminMeeting] = useState(false);
  const [formData, setFormData] = useState({ 
    topic: "", 
    instructor: userProfile?.role === 'admin' ? "" : userProfile?.name, 
    date: "", 
    time: "",
    duration: 60,
    courseId: "",
    description: "",
    isPrivate: false,
    password: "",
    assignedTeacherId: ""
  });
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or speaker
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const webRTCRef = useRef(new DirectWebRTC());
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const chatContainerRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    setupNotifications();
    
    // Check for upcoming live classes
    const interval = setInterval(checkUpcomingClasses, 60000); // Every minute
    
    return () => {
      webRTCRef.current.stop();
      clearInterval(interval);
    };
  }, [userProfile]);

  const loadInitialData = async () => {
    try {
      // Load all teachers (for admin)
      if (userProfile?.role === 'admin') {
        const teachersSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "teacher"))
        );
        setAllTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }

      // Load courses
      const coursesSnap = await getDocs(collection(db, "courses"));
      const coursesList = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesList);

      // Load live classes
      const q = query(
        collection(db, "liveClasses"), 
        orderBy("scheduledAt", "asc"),
        where("scheduledAt", ">", new Date())
      );
      const unsub = onSnapshot(q, (snap) => {
        const liveClasses = snap.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            scheduledAt: data.scheduledAt?.toDate(),
            createdAt: data.createdAt?.toDate()
          };
        });
        
        // Filter based on role
        if (userProfile?.role === 'teacher') {
          const teacherClasses = liveClasses.filter(cls => 
            cls.instructorId === userProfile.uid || 
            cls.assignedTeacherId === userProfile.uid
          );
          setClasses(teacherClasses);
        } else if (userProfile?.role === 'admin') {
          setClasses(liveClasses);
        } else {
          // Student: show classes for enrolled courses
          const studentClasses = liveClasses.filter(cls => 
            cls.participants?.includes(userProfile?.uid) || 
            !cls.isPrivate
          );
          setClasses(studentClasses);
        }
      });

      return () => unsub();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const setupNotifications = () => {
    if (!userProfile?.uid) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userProfile.uid),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const newNotifications = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setNotifications(newNotifications);
      setNotificationCount(newNotifications.length);
    });

    return () => unsub();
  };

  const checkUpcomingClasses = () => {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    
    classes.forEach(cls => {
      if (cls.scheduledAt && cls.scheduledAt > now && cls.scheduledAt <= nextHour) {
        sendNotification({
          title: "Live Class Starting Soon",
          message: `"${cls.topic}" starts in less than 1 hour`,
          type: "reminder",
          userId: userProfile?.uid,
          classId: cls.id
        });
      }
    });
  };

  const sendNotification = async (notification) => {
    try {
      await addDoc(collection(db, "notifications"), {
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);
      
      // Determine participants
      let participants = [];
      if (formData.courseId) {
        // Get enrolled students for the course
        const enrollmentSnap = await getDocs(
          query(collection(db, "enrollments"), where("courseId", "==", formData.courseId))
        );
        participants = enrollmentSnap.docs.map(doc => doc.data().studentId);
      }

      const liveClassData = {
        topic: formData.topic,
        description: formData.description,
        instructor: formData.instructor,
        instructorId: userProfile?.uid,
        courseId: formData.courseId,
        scheduledAt: scheduledAt,
        duration: parseInt(formData.duration),
        status: "scheduled",
        isPrivate: formData.isPrivate,
        password: formData.isPrivate ? formData.password : "",
        maxParticipants: 100,
        createdAt: serverTimestamp(),
        participants: participants,
        assignedTeacherId: formData.assignedTeacherId || null
      };

      const docRef = await addDoc(collection(db, "liveClasses"), liveClassData);

      // Send notifications to participants
      participants.forEach(async (studentId) => {
        await sendNotification({
          title: "New Live Class Scheduled",
          message: `"${formData.topic}" has been scheduled for ${formData.date} at ${formData.time}`,
          type: "class_scheduled",
          userId: studentId,
          classId: docRef.id
        });
      });

      // Notify assigned teacher
      if (formData.assignedTeacherId && formData.assignedTeacherId !== userProfile?.uid) {
        await sendNotification({
          title: "Live Class Assigned",
          message: `You've been assigned to host "${formData.topic}"`,
          type: "teacher_assigned",
          userId: formData.assignedTeacherId,
          classId: docRef.id
        });
      }

      toast.success("Live class scheduled successfully!");
      setIsModalOpen(false);
      setFormData({ 
        topic: "", 
        instructor: userProfile?.role === 'admin' ? "" : userProfile?.name, 
        date: "", 
        time: "",
        duration: 60,
        courseId: "",
        description: "",
        isPrivate: false,
        password: "",
        assignedTeacherId: ""
      });
      
    } catch (error) {
      console.error("Error scheduling class:", error);
      toast.error("Failed to schedule live class");
    }
  };

  const startAdminMeeting = async () => {
    try {
      setIsAdminMeeting(true);
      setIsLiveActive(true);
      
      // Create meeting room
      const meetingId = `admin_meeting_${Date.now()}`;
      setActiveRoom({
        id: meetingId,
        type: 'admin_meeting',
        topic: "Admin Meeting",
        participants: [],
        isPrivate: false
      });

      // Initialize WebRTC
      await webRTCRef.current.initializeLocalStream();
      
      // Display local video
      if (localVideoRef.current && webRTCRef.current.localStream) {
        localVideoRef.current.srcObject = webRTCRef.current.localStream;
      }

      // Notify all teachers
      allTeachers.forEach(async (teacher) => {
        await sendNotification({
          title: "Admin Meeting Started",
          message: "Join the admin meeting now",
          type: "admin_meeting",
          userId: teacher.id,
          meetingId: meetingId
        });
      });

      toast.success("Admin meeting started. Teachers have been notified.");
      
    } catch (error) {
      console.error("Error starting admin meeting:", error);
      toast.error("Failed to start admin meeting");
    }
  };

  const joinLiveClass = async (liveClass) => {
    try {
      setIsLiveActive(true);
      setActiveRoom(liveClass);

      // Initialize WebRTC
      await webRTCRef.current.initializeLocalStream();
      
      // Display local video
      if (localVideoRef.current && webRTCRef.current.localStream) {
        localVideoRef.current.srcObject = webRTCRef.current.localStream;
      }

      // Update participant count
      await updateDoc(doc(db, "liveClasses", liveClass.id), {
        currentParticipants: arrayUnion(userProfile?.uid),
        lastActivity: serverTimestamp()
      });

      // Add chat message
      await addDoc(collection(db, "liveChats"), {
        classId: liveClass.id,
        userId: userProfile?.uid,
        userName: userProfile?.name,
        message: `${userProfile?.name} joined the class`,
        type: "system",
        timestamp: serverTimestamp()
      });

      toast.success("Joined live class successfully!");
      
    } catch (error) {
      console.error("Error joining live class:", error);
      toast.error("Failed to join live class");
    }
  };

  const toggleAudio = () => {
    if (webRTCRef.current.localStream) {
      const audioTrack = webRTCRef.current.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (webRTCRef.current.localStream) {
      const videoTrack = webRTCRef.current.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = webRTCRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        
        setScreenSharing(true);
        
        // Handle screen sharing stop
        videoTrack.onended = () => {
          setScreenSharing(false);
        };
      } else {
        // Switch back to camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        const sender = webRTCRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
        setScreenSharing(false);
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast.error("Failed to share screen");
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return;

    try {
      await addDoc(collection(db, "liveChats"), {
        classId: activeRoom.id,
        userId: userProfile?.uid,
        userName: userProfile?.name,
        message: newMessage,
        type: "chat",
        timestamp: serverTimestamp()
      });

      setNewMessage("");
      
      // Scroll to bottom of chat
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      
    } catch (error) {
      console.error("Error sending chat message:", error);
    }
  };

  const endLiveSession = async () => {
    try {
      if (activeRoom) {
        await updateDoc(doc(db, "liveClasses", activeRoom.id), {
          status: "completed",
          endedAt: serverTimestamp()
        });
      }

      // Stop all media
      webRTCRef.current.stop();
      
      setIsLiveActive(false);
      setActiveRoom(null);
      setIsAdminMeeting(false);
      
      toast.success("Live session ended successfully!");
      
    } catch (error) {
      console.error("Error ending live session:", error);
      toast.error("Failed to end live session");
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/live/${activeRoom?.id}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const renderLiveStudio = () => {
    return (
      <div className="fixed inset-0 z-[10000] bg-slate-900 flex flex-col">
        {/* Top Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">
              {isAdminMeeting ? "Admin Meeting" : activeRoom?.topic}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full">
              <FiUsers className="text-slate-400" />
              <span className="text-sm text-white">
                {activeRoom?.currentParticipants?.length || 1} online
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={copyInviteLink}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              <FiCopy />
              Copy Invite
            </button>
            <button 
              onClick={endLiveSession}
              className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Grid */}
          <div className={`flex-1 p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col'}`}>
            {/* Local Video */}
            <div className={`relative ${viewMode === 'speaker' ? 'flex-1' : ''}`}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover rounded-lg bg-slate-800"
              />
              <div className="absolute bottom-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-lg text-sm">
                You ({userProfile?.name})
                {isAudioMuted && <FiMicOff className="inline ml-2 text-rose-500" />}
                {isVideoOff && <FiVideoOff className="inline ml-2 text-rose-500" />}
              </div>
            </div>

            {/* Remote Videos will be added here dynamically */}
          </div>

          {/* Chat Sidebar */}
          <div className="w-80 border-l border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white">Chat</h3>
            </div>
            
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {/* Chat messages will be loaded here */}
              <div className="text-center text-slate-500 text-sm py-8">
                Chat messages will appear here
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={sendChatMessage}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                >
                  <FiSend />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-6">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${isAudioMuted ? 'bg-rose-600' : 'bg-slate-800'} text-white hover:scale-105 transition-all`}
          >
            {isAudioMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-rose-600' : 'bg-slate-800'} text-white hover:scale-105 transition-all`}
          >
            {isVideoOff ? <FiVideoOff size={20} /> : <FiVideoIcon size={20} />}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${screenSharing ? 'bg-emerald-600' : 'bg-slate-800'} text-white hover:scale-105 transition-all`}
          >
            <FiShare2 size={20} />
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
            className="p-3 rounded-full bg-slate-800 text-white hover:scale-105 transition-all"
          >
            {viewMode === 'grid' ? <FiGrid size={20} /> : <FiList size={20} />}
          </button>
          
          <button
            onClick={endLiveSession}
            className="p-3 rounded-full bg-rose-600 text-white hover:bg-rose-700 hover:scale-105 transition-all"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderNotificationBell = () => {
    return (
      <div className="relative">
        <button 
          className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          onClick={() => setNotificationCount(0)}
        >
          <FiBell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>
        
        {notifications.length > 0 && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-900">Notifications</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      notification.type === 'reminder' ? 'bg-amber-100 text-amber-600' :
                      notification.type === 'class_scheduled' ? 'bg-emerald-100 text-emerald-600' :
                      notification.type === 'admin_meeting' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <FiBell size={16} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-slate-900">{notification.title}</h5>
                      <p className="text-sm text-slate-600">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {notification.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLiveActive) {
    return renderLiveStudio();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live Classes</h1>
          <p className="text-slate-600">Schedule and join interactive live sessions</p>
        </div>
        
        <div className="flex items-center gap-4">
          {renderNotificationBell()}
          
          {userProfile?.role === 'admin' && (
            <button
              onClick={startAdminMeeting}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2"
            >
              <FiVideo />
              Start Admin Meeting
            </button>
          )}
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
          >
            <FiPlus />
            Schedule Live Class
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{classes.length}</h3>
              <p className="text-sm text-slate-600">Scheduled Classes</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <FiCalendar size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {classes.filter(c => c.status === 'live').length}
              </h3>
              <p className="text-sm text-slate-600">Live Now</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
              <FiPlayCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {allTeachers.length}
              </h3>
              <p className="text-sm text-slate-600">Teachers</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <FiUser size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {classes.reduce((acc, cls) => acc + (cls.participants?.length || 0), 0)}
              </h3>
              <p className="text-sm text-slate-600">Total Participants</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <FiUsers size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Live Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((liveClass) => (
          <div key={liveClass.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    liveClass.status === 'live' ? 'bg-emerald-100 text-emerald-700' :
                    liveClass.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {liveClass.status === 'live' ? 'LIVE NOW' : 
                     liveClass.status === 'completed' ? 'COMPLETED' : 'SCHEDULED'}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{liveClass.topic}</h3>
                  <p className="text-sm text-slate-600 mt-1">{liveClass.description}</p>
                </div>
                
                {liveClass.isPrivate && (
                  <FiLock className="text-slate-400" />
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FiUser />
                  <span>{liveClass.instructor}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FiCalendar />
                  <span>{liveClass.scheduledAt?.toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FiClock />
                  <span>{liveClass.scheduledAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-xs text-slate-500">({liveClass.duration} mins)</span>
                </div>
                
                {liveClass.courseId && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FiBookOpen />
                    <span>Course: {courses.find(c => c.id === liveClass.courseId)?.title || 'N/A'}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FiUsers />
                  <span>{liveClass.participants?.length || 0} participants</span>
                </div>
                
                {liveClass.status === 'scheduled' && (
                  <button
                    onClick={() => joinLiveClass(liveClass)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800"
                  >
                    Join Now
                  </button>
                )}
                
                {liveClass.status === 'live' && userProfile?.role === 'admin' && (
                  <button
                    onClick={() => joinLiveClass(liveClass)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
                  >
                    Join Live
                  </button>
                )}
                
                {(userProfile?.role === 'admin' || liveClass.instructorId === userProfile?.uid) && (
                  <button
                    onClick={() => deleteDoc(doc(db, "liveClasses", liveClass.id))}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Scheduling */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Schedule Live Class</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Class Topic *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                      placeholder="Enter class topic"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Instructor *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      value={formData.instructor}
                      onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                      placeholder="Instructor name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe what this class will cover"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Course (Optional)
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {userProfile?.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Assign Teacher (Optional)
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        value={formData.assignedTeacherId}
                        onChange={(e) => setFormData({...formData, assignedTeacherId: e.target.value})}
                      >
                        <option value="">Select a teacher</option>
                        {allTeachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Private Class
                      </label>
                      <p className="text-sm text-slate-500">Require password to join</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                    </label>
                  </div>
                  
                  {formData.isPrivate && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        required={formData.isPrivate}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter class password"
                      />
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                  >
                    Schedule Live Class
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* No Classes Message */}
      {classes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <FiVideo className="text-slate-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Live Classes Scheduled</h3>
          <p className="text-slate-600 mb-6">Schedule your first live class to get started</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
          >
            Schedule First Class
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveClasses;