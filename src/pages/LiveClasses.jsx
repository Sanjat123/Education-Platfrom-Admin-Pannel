import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiVideo, FiPlus, FiX, FiCalendar, FiClock, FiTrash2, 
  FiPlayCircle, FiUsers, FiUser, FiBookOpen, FiMessageSquare,
  FiMic, FiMicOff, FiVideoOff, FiVideo as FiVideoIcon,
  FiShare2, FiCopy, FiSend, FiGrid, FiList, FiUsers as FiUsersIcon,
  FiMaximize2, FiMinimize2, FiLock, FiUnlock, FiSettings,
  FiChevronDown, FiChevronUp, FiEye, FiEyeOff, FiCheck,
  FiMoreVertical, FiEdit, FiDownload, FiShare, FiVolume2, FiVolumeX
} from "react-icons/fi";
import { FaRegHandPaper, FaChalkboardTeacher, FaNetworkWired } from "react-icons/fa";
import { MdScreenShare, MdGroups, MdAdminPanelSettings, MdVideocam, MdVideocamOff } from "react-icons/md";
import { RiSignalWifiLine, RiSignalWifiOffLine } from "react-icons/ri";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, query, 
  orderBy, where, updateDoc, getDocs, serverTimestamp,
  arrayUnion, arrayRemove, getDoc
} from "firebase/firestore";
import toast from "react-hot-toast";

// ZegoCloud SDK
const ZegoUIKitPrebuilt = window.ZegoUIKitPrebuilt;

const LiveClasses = () => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
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
    assignedTeacherId: "",
    assignedStudentIds: [],
    meetingType: "class",
    maxParticipants: 50,
    enableChat: true,
    enableScreenShare: true,
    enableRecording: false,
    allowAllParticipantsVideo: true,
    allowAllParticipantsAudio: true,
    autoRecord: false
  });
  
  const [courses, setCourses] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState("upcoming");
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [videoLayout, setVideoLayout] = useState("grid");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [activeMeetingMenu, setActiveMeetingMenu] = useState(null);
  const [meetingPassword, setMeetingPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMeeting, setPasswordMeeting] = useState(null);
  
  const videoContainerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const participantsRef = useRef(null);
  const zegoInstanceRef = useRef(null);

  // ZegoCloud Credentials
  const appID = 942355460;
  const serverSecret = "975421711c18fe32b88ac71689c3e077";

  useEffect(() => {
    loadInitialData();
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      leaveMeeting();
    };
  }, [userProfile]);

  const loadInitialData = async () => {
    try {
      // Load all teachers (for admin)
      if (userProfile?.role === 'admin') {
        const teachersSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "teacher"))
        );
        const teachersData = teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllTeachers(teachersData);
        
        const studentsSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"))
        );
        setAllStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }

      const coursesSnap = await getDocs(collection(db, "courses"));
      setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load live classes/meetings
      const q = query(collection(db, "liveMeetings"), orderBy("scheduledAt", "desc"));
      
      const unsub = onSnapshot(q, (snap) => {
        const meetings = snap.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            scheduledAt: data.scheduledAt?.toDate(),
            createdAt: data.createdAt?.toDate(),
            startedAt: data.startedAt?.toDate(),
            endedAt: data.endedAt?.toDate()
          };
        });
        
        // Filter meetings based on user role
        const filteredMeetings = meetings.filter(meeting => {
          if (userProfile?.role === 'admin') return true;
          
          if (meeting.meetingType === 'teacher') {
            return meeting.assignedTeacherIds?.includes(userProfile?.uid) || 
                   userProfile?.uid === meeting.instructorId;
          }
          
          if (meeting.meetingType === 'student') {
            return meeting.assignedStudentIds?.includes(userProfile?.uid);
          }
          
          if (meeting.meetingType === 'admin') {
            return userProfile?.role === 'admin';
          }
          
          // For class meetings
          if (meeting.isPrivate) {
            return meeting.participants?.includes(userProfile?.uid) || 
                   userProfile?.uid === meeting.instructorId;
          }
          
          return true;
        });
        
        setClasses(filteredMeetings);
      });

      return () => unsub();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load meetings");
    }
  };

  const startZegoCloudMeeting = async (meeting, isHost = false) => {
    if (!ZegoUIKitPrebuilt) {
      toast.error("Video SDK loading... Please refresh");
      return;
    }

    try {
      const roomID = meeting.id;
      const userName = userProfile?.name || "Guest";
      const userID = userProfile?.uid || `guest_${Date.now()}`;
      
      // Generate Kit Token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        roomID, 
        userID, 
        userName
      );

      // Create ZegoCloud instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;

      // User role based on host status
      let userRole = ZegoUIKitPrebuilt.Audience;
      if (isHost || userProfile?.uid === meeting.instructorId || userProfile?.role === 'admin') {
        userRole = ZegoUIKitPrebuilt.Host;
      }

      // Configuration for video call
      const config = {
        container: videoContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference, // Group video call
        },
        showPreJoinView: false,
        turnOnMicrophoneWhenJoining: userRole === ZegoUIKitPrebuilt.Host,
        turnOnCameraWhenJoining: userRole === ZegoUIKitPrebuilt.Host,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: meeting.enableScreenShare,
        showTextChat: meeting.enableChat,
        showUserList: true,
        showLayoutButton: true,
        lowerLeftNotification: {
          showUserJoinAndLeave: true,
          showTextChat: true
        },
        maxUsers: meeting.maxParticipants || 50,
        layout: "Grid", // Auto grid layout
        sharedLinks: [
          {
            name: 'Join via link',
            url: `${window.location.origin}/meeting/${roomID}`
          }
        ],
        onJoinRoom: () => {
          console.log("✅ Successfully joined meeting");
          setIsLiveActive(true);
          setActiveRoom(meeting);
          
          // Update participant in Firestore
          updateParticipantPresence(meeting.id, 'join');
          
          toast.success(`Joined ${meeting.topic}`);
        },
        onLeaveRoom: () => {
          console.log("Left meeting");
          leaveMeeting();
        },
        onUserJoin: (users) => {
          console.log("User joined:", users);
          toast.info(`${users[0]?.userName} joined`);
        },
        onUserLeave: (users) => {
          console.log("User left:", users);
          toast.info(`${users[0]?.userName} left`);
        }
      };

      // Join the room
      zp.joinRoom(config);

      // If host, update meeting status
      if (isHost) {
        await updateDoc(doc(db, "liveMeetings", meeting.id), {
          status: 'live',
          startedAt: serverTimestamp(),
          hostId: userProfile?.uid,
          currentParticipants: arrayUnion({
            userId: userProfile?.uid,
            name: userProfile?.name,
            role: userProfile?.role,
            joinedAt: new Date().toISOString()
          })
        });

        toast.success(`🎉 ${meeting.meetingType === 'teacher' ? 'Teacher' : meeting.meetingType === 'admin' ? 'Admin' : meeting.meetingType === 'student' ? 'Student' : 'Class'} meeting started!`);
      }
      
    } catch (error) {
      console.error("❌ Error starting meeting:", error);
      toast.error("Failed to start video conference");
    }
  };

  const updateParticipantPresence = async (meetingId, action) => {
    try {
      const meetingRef = doc(db, "liveMeetings", meetingId);
      
      if (action === 'join') {
        await updateDoc(meetingRef, {
          currentParticipants: arrayUnion({
            userId: userProfile?.uid,
            name: userProfile?.name,
            joinedAt: new Date().toISOString(),
            role: userProfile?.role
          })
        });
      } else if (action === 'leave') {
        await updateDoc(meetingRef, {
          currentParticipants: arrayRemove(userProfile?.uid)
        });
        
        // Check if meeting should end (no participants left)
        const meetingDoc = await getDoc(meetingRef);
        const participants = meetingDoc.data().currentParticipants || [];
        
        if (participants.length === 0 && meetingDoc.data().status === 'live') {
          await updateDoc(meetingRef, {
            status: 'completed',
            endedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Error updating participant:", error);
    }
  };

  const handleJoinMeeting = async (meeting) => {
    // Check if meeting is private and requires password
    if (meeting.isPrivate && 
        !meeting.participants?.includes(userProfile?.uid) && 
        userProfile?.uid !== meeting.instructorId) {
      
      setPasswordMeeting(meeting);
      setShowPasswordModal(true);
      return;
    }

    const isHost = userProfile?.uid === meeting.instructorId || 
                   userProfile?.role === 'admin' || 
                   meeting.meetingType === 'admin';
    
    await startZegoCloudMeeting(meeting, isHost);
  };

  const verifyPasswordAndJoin = async () => {
    if (!passwordMeeting) return;
    
    if (meetingPassword === passwordMeeting.password) {
      setShowPasswordModal(false);
      setMeetingPassword("");
      
      const isHost = userProfile?.uid === passwordMeeting.instructorId || 
                     userProfile?.role === 'admin';
      
      await startZegoCloudMeeting(passwordMeeting, isHost);
      setPasswordMeeting(null);
    } else {
      toast.error("Incorrect password");
      setMeetingPassword("");
    }
  };

  const startMeeting = async (meeting) => {
    const isHost = userProfile?.uid === meeting.instructorId || 
                   userProfile?.role === 'admin';
    
    if (meeting.status === 'scheduled') {
      // Update status to live before starting
      await updateDoc(doc(db, "liveMeetings", meeting.id), {
        status: 'live',
        startedAt: serverTimestamp()
      });
    }
    
    await startZegoCloudMeeting(meeting, isHost);
  };

  const leaveMeeting = async () => {
    if (zegoInstanceRef.current) {
      zegoInstanceRef.current.destroy();
      zegoInstanceRef.current = null;
    }
    
    if (activeRoom) {
      await updateParticipantPresence(activeRoom.id, 'leave');
    }
    
    setIsLiveActive(false);
    setActiveRoom(null);
    toast.success("Left the meeting");
  };

  const endMeetingForAll = async () => {
    if (window.confirm("End meeting for all participants?")) {
      try {
        await updateDoc(doc(db, "liveMeetings", activeRoom.id), {
          status: 'completed',
          endedAt: serverTimestamp(),
          endedBy: userProfile?.uid
        });
        
        toast.success("Meeting ended for all");
        leaveMeeting();
      } catch (error) {
        console.error("Error ending meeting:", error);
        toast.error("Failed to end meeting");
      }
    }
  };

  const deleteMeeting = async (meetingId) => {
    if (window.confirm("Delete this meeting permanently?")) {
      try {
        await deleteDoc(doc(db, "liveMeetings", meetingId));
        toast.success("Meeting deleted");
      } catch (error) {
        console.error("Error deleting meeting:", error);
        toast.error("Failed to delete");
      }
    }
  };

  const copyInviteLink = () => {
    if (!activeRoom) return;
    
    const inviteLink = `${window.location.origin}/meeting/${activeRoom.id}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied to clipboard!");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen().catch(err => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      userId: userProfile?.uid,
      userName: userProfile?.name,
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage("");
    
    // Auto scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const renderMeetingStudio = () => {
    if (!activeRoom) return null;

    return (
      <div className={`fixed inset-0 z-50 bg-gray-900 flex flex-col ${isFullscreen ? '' : 'p-2 md:p-4'}`}>
        {/* Top Control Bar */}
        <div className="flex-shrink-0 p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-sm font-bold text-white">LIVE</span>
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-white">
                {activeRoom.topic}
              </h2>
              <p className="text-xs text-gray-400">
                {activeRoom.meetingType === 'teacher' ? '👨‍🏫 Teacher Meeting' : 
                 activeRoom.meetingType === 'admin' ? '🛡️ Admin Meeting' : 
                 activeRoom.meetingType === 'student' ? '👨‍🎓 Student Meeting' : '🎓 Live Class'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowParticipantsList(!showParticipantsList)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center gap-2"
            >
              <FiUsers />
              Participants
            </button>
            
            <button
              onClick={copyInviteLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <FiShare />
              Invite
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
            </button>
            
            {/* Host Controls */}
            {(userProfile?.uid === activeRoom.instructorId || userProfile?.role === 'admin') && (
              <button
                onClick={endMeetingForAll}
                className="px-4 py-2 bg-red-700 text-white rounded-lg font-bold hover:bg-red-800"
              >
                End Meeting
              </button>
            )}
            
            <button
              onClick={leaveMeeting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Main Video Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Container */}
          <div className="flex-1 bg-black relative">
            <div 
              ref={videoContainerRef}
              className="w-full h-full"
            />
            
            {/* Floating Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-900/80 backdrop-blur-sm px-6 py-3 rounded-full">
              <button
                onClick={() => {
                  if (zegoInstanceRef.current) {
                    zegoInstanceRef.current.toggleMicrophone();
                    setIsMicMuted(!isMicMuted);
                  }
                }}
                className={`p-3 rounded-full ${isMicMuted ? 'bg-red-600' : 'bg-gray-700'} text-white hover:opacity-90`}
              >
                {isMicMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
              </button>
              
              <button
                onClick={() => {
                  if (zegoInstanceRef.current) {
                    zegoInstanceRef.current.toggleCamera();
                    setIsCameraOff(!isCameraOff);
                  }
                }}
                className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600' : 'bg-gray-700'} text-white hover:opacity-90`}
              >
                {isCameraOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
              </button>
              
              {activeRoom.enableScreenShare && (
                <button
                  onClick={() => {
                    if (zegoInstanceRef.current) {
                      zegoInstanceRef.current.toggleScreenSharing();
                    }
                  }}
                  className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:opacity-90`}
                >
                  <MdScreenShare size={20} />
                </button>
              )}
              
              {/* Layout Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVideoLayout("grid")}
                  className={`p-2 rounded ${videoLayout === "grid" ? "bg-blue-600" : "bg-gray-700"} text-white`}
                >
                  <FiGrid size={18} />
                </button>
                <button
                  onClick={() => setVideoLayout("speaker")}
                  className={`p-2 rounded ${videoLayout === "speaker" ? "bg-blue-600" : "bg-gray-700"} text-white`}
                >
                  <FiUsers size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex">
            {/* Participants Panel */}
            {showParticipantsList && (
              <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="font-bold text-white">
                    👥 Participants ({activeRoom.currentParticipants?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowParticipantsList(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {activeRoom.currentParticipants?.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {p.name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.role}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Panel */}
            {activeRoom.enableChat && (
              <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <FiMessageSquare />
                    Chat
                  </h3>
                </div>
                
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`p-3 rounded-lg ${msg.userId === userProfile?.uid ? 'bg-blue-900/30' : 'bg-gray-800/50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{msg.userName}</span>
                        {msg.userId === userProfile?.uid && (
                          <span className="text-xs text-gray-400">(You)</span>
                        )}
                      </div>
                      <p className="text-white text-sm">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={sendChatMessage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FiSend />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="p-3 bg-gray-900/90 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-400">
            🔒 Secure • 📹 Powered by ZegoCloud • 👥 {activeRoom.currentParticipants?.length || 1} online
          </span>
        </div>
      </div>
    );
  };

  const getFilteredClasses = () => {
    const now = new Date();
    
    return classes.filter(cls => {
      if (viewMode === 'upcoming') {
        return cls.status === 'scheduled' && cls.scheduledAt > now;
      } else if (viewMode === 'live') {
        return cls.status === 'live';
      } else if (viewMode === 'past') {
        return cls.status === 'completed' || (cls.scheduledAt < now && cls.status !== 'live');
      }
      return true;
    });
  };

  const renderMeetingCard = (meeting) => {
    const isHost = userProfile?.uid === meeting.instructorId || userProfile?.role === 'admin';
    const canJoin = meeting.status === 'live' || (meeting.status === 'scheduled' && meeting.scheduledAt <= new Date(new Date().getTime() + 30 * 60000));
    
    return (
      <div key={meeting.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  meeting.status === 'live' ? 'bg-red-100 text-red-700 animate-pulse' :
                  meeting.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {meeting.status === 'live' ? '🔴 LIVE' : 
                   meeting.status === 'completed' ? '✅ ENDED' : '📅 UPCOMING'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  meeting.meetingType === 'teacher' ? 'bg-purple-100 text-purple-700' :
                  meeting.meetingType === 'admin' ? 'bg-yellow-100 text-yellow-700' :
                  meeting.meetingType === 'student' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {meeting.meetingType.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{meeting.topic}</h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{meeting.description}</p>
            </div>
            
            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setActiveMeetingMenu(activeMeetingMenu === meeting.id ? null : meeting.id)}
                className="p-2 text-gray-400 hover:text-gray-700"
              >
                <FiMoreVertical />
              </button>
              
              {activeMeetingMenu === meeting.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  <button
                    onClick={() => {
                      setActiveMeetingMenu(null);
                      navigator.clipboard.writeText(`${window.location.origin}/meeting/${meeting.id}`);
                      toast.success("Link copied!");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FiCopy /> Copy Link
                  </button>
                  
                  {(userProfile?.role === 'admin' || isHost) && (
                    <>
                      <div className="border-t"></div>
                      <button
                        onClick={() => {
                          setActiveMeetingMenu(null);
                          deleteMeeting(meeting.id);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FiTrash2 /> Delete Meeting
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <FiUser />
              <span className="font-medium">{meeting.instructor}</span>
              {isHost && <span className="text-xs text-blue-600">(Host)</span>}
            </div>
            
            {meeting.scheduledAt && (
              <div className="flex items-center gap-2 text-gray-700">
                <FiCalendar />
                <span>{meeting.scheduledAt.toLocaleDateString()}</span>
                <FiClock className="ml-2" />
                <span>{meeting.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-gray-700">
              <FiUsers />
              <span>{meeting.participants?.length || 0} invited</span>
              {meeting.currentParticipants?.length > 0 && (
                <span className="text-green-600 font-medium">
                  • {meeting.currentParticipants.length} online
                </span>
              )}
            </div>
            
            {/* Features */}
            <div className="flex flex-wrap gap-2 pt-3">
              {meeting.enableChat && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">💬 Chat</span>
              )}
              {meeting.enableScreenShare && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">🖥️ Share</span>
              )}
              {meeting.isPrivate && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">🔒 Private</span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div>
              {meeting.status === 'live' && meeting.currentParticipants?.length > 0 && (
                <div className="flex -space-x-2">
                  {meeting.currentParticipants.slice(0, 3).map((p, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                      {p.name?.charAt(0)}
                    </div>
                  ))}
                  {meeting.currentParticipants.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs border-2 border-white">
                      +{meeting.currentParticipants.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {(userProfile?.role === 'admin' || isHost) && meeting.status !== 'completed' && (
                <button
                  onClick={() => deleteMeeting(meeting.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              )}
              
              {canJoin ? (
                <button
                  onClick={() => handleJoinMeeting(meeting)}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    meeting.status === 'live' 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <FiVideo />
                  {meeting.status === 'live' ? 'Join Now' : isHost ? 'Start' : 'Join'}
                </button>
              ) : (
                <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                  Not available
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Password Modal
  const renderPasswordModal = () => {
    if (!showPasswordModal || !passwordMeeting) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Private Meeting</h3>
          <p className="text-gray-600 mb-6">
            Enter password to join <strong>{passwordMeeting.topic}</strong>
          </p>
          
          <input
            type="password"
            value={meetingPassword}
            onChange={(e) => setMeetingPassword(e.target.value)}
            placeholder="Enter meeting password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordMeeting(null);
                setMeetingPassword("");
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={verifyPasswordAndJoin}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLiveActive) {
    return (
      <>
        {renderMeetingStudio()}
        {renderPasswordModal()}
      </>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Meetings</h1>
          <p className="text-gray-600">Schedule and join video meetings like Zoom/Google Meet</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* View Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['upcoming', 'live', 'past'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                  viewMode === mode 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          
          {/* Schedule Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus />
            Schedule Meeting
          </button>
          
          {/* Quick Meeting for Admin */}
          {userProfile?.role === 'admin' && (
            <button
              onClick={async () => {
                const meetingId = `instant_${Date.now()}`;
                const meetingData = {
                  id: meetingId,
                  topic: "Instant Admin Meeting",
                  instructor: userProfile.name,
                  instructorId: userProfile.uid,
                  meetingType: 'admin',
                  scheduledAt: new Date(),
                  status: 'live',
                  enableChat: true,
                  enableScreenShare: true,
                  isPrivate: false,
                  createdAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "liveMeetings"), meetingData);
                await startMeeting({...meetingData, id: meetingId});
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2"
            >
              <MdAdminPanelSettings />
              Quick Meeting
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Meetings</p>
              <h3 className="text-2xl font-bold text-gray-900">{classes.length}</h3>
            </div>
            <FiVideo className="text-blue-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Live Now</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {classes.filter(c => c.status === 'live').length}
              </h3>
            </div>
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {classes.filter(c => c.status === 'scheduled').length}
              </h3>
            </div>
            <FiCalendar className="text-green-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Participants</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {classes.reduce((sum, c) => sum + (c.currentParticipants?.length || 0), 0)}
              </h3>
            </div>
            <FiUsers className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Meetings Grid */}
      {getFilteredClasses().length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredClasses().map(renderMeetingCard)}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border">
          <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <FiVideo className="text-blue-500 text-4xl" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No {viewMode} meetings</h3>
          <p className="text-gray-600 mb-6">
            {viewMode === 'upcoming' 
              ? 'Schedule your first meeting to get started' 
              : viewMode === 'live' 
              ? 'No live meetings at the moment' 
              : 'No past meetings found'}
          </p>
          {viewMode === 'upcoming' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              Schedule Meeting
            </button>
          )}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Schedule Meeting</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiX />
                </button>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  const scheduledAt = new Date(`${formData.date}T${formData.time}`);
                  
                  let participants = [];
                  let assignedTeacherIds = [];
                  let assignedStudentIds = [];
                  
                  switch (formData.meetingType) {
                    case 'teacher':
                      assignedTeacherIds = selectedTeachers.map(t => t.id);
                      break;
                    case 'student':
                      assignedStudentIds = selectedStudents.map(s => s.id);
                      break;
                    case 'class':
                      if (formData.courseId) {
                        const enrollSnap = await getDocs(
                          query(collection(db, "enrollments"), where("courseId", "==", formData.courseId))
                        );
                        participants = enrollSnap.docs.map(doc => doc.data().studentId);
                      }
                      break;
                    case 'admin':
                      const adminsSnap = await getDocs(
                        query(collection(db, "users"), where("role", "==", "admin"))
                      );
                      participants = adminsSnap.docs.map(doc => doc.id);
                      break;
                  }

                  const meetingData = {
                    topic: formData.topic,
                    description: formData.description,
                    instructor: formData.instructor || userProfile.name,
                    instructorId: userProfile.uid,
                    meetingType: formData.meetingType,
                    scheduledAt: scheduledAt,
                    duration: formData.duration,
                    status: "scheduled",
                    isPrivate: formData.isPrivate,
                    password: formData.isPrivate ? formData.password : "",
                    maxParticipants: formData.maxParticipants,
                    enableChat: formData.enableChat,
                    enableScreenShare: formData.enableScreenShare,
                    enableRecording: formData.enableRecording,
                    createdAt: serverTimestamp(),
                    participants: participants,
                    assignedTeacherIds: assignedTeacherIds,
                    assignedStudentIds: assignedStudentIds,
                    courseId: formData.courseId || null
                  };

                  await addDoc(collection(db, "liveMeetings"), meetingData);

                  toast.success(`${formData.meetingType.charAt(0).toUpperCase() + formData.meetingType.slice(1)} meeting scheduled!`);
                  
                  setIsModalOpen(false);
                  setFormData({ 
                    topic: "", 
                    instructor: userProfile?.role === 'admin' ? "" : userProfile.name, 
                    date: "", 
                    time: "",
                    duration: 60,
                    courseId: "",
                    description: "",
                    isPrivate: false,
                    password: "",
                    assignedTeacherId: "",
                    assignedStudentIds: [],
                    meetingType: "class",
                    maxParticipants: 50,
                    enableChat: true,
                    enableScreenShare: true,
                    enableRecording: false,
                    allowAllParticipantsVideo: true,
                    allowAllParticipantsAudio: true,
                    autoRecord: false
                  });
                  setSelectedTeachers([]);
                  setSelectedStudents([]);
                  
                } catch (error) {
                  console.error("Error:", error);
                  toast.error("Failed to schedule meeting");
                }
              }} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                
                {/* Meeting Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Type *</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'class', label: 'Class', desc: 'For students', icon: '🎓' },
                      { id: 'teacher', label: 'Teacher', desc: 'Staff meetings', icon: '👨‍🏫' },
                      { id: 'student', label: 'Student', desc: 'Student meetings', icon: '👨‍🎓' },
                      { id: 'admin', label: 'Admin', desc: 'Admin meetings', icon: '🛡️' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({...formData, meetingType: type.id})}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          formData.meetingType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Topic *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                      placeholder="Meeting topic"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                      <option value="180">3 hours</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Meeting agenda and details..."
                  />
                </div>
                
                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>

                {/* Course Selection for Class Meetings */}
                {formData.meetingType === 'class' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course (Optional)</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    >
                      <option value="">Select course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Teacher Selection */}
                {formData.meetingType === 'teacher' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Teachers
                      <span className="ml-2 text-sm text-gray-500">({selectedTeachers.length} selected)</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTeacherSelector(!showTeacherSelector)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex justify-between items-center"
                      >
                        <span>
                          {selectedTeachers.length === 0 
                            ? "Select teachers..." 
                            : `${selectedTeachers.length} teachers selected`}
                        </span>
                        {showTeacherSelector ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                      
                      {showTeacherSelector && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {allTeachers.map(teacher => (
                            <label key={teacher.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTeachers.some(t => t.id === teacher.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTeachers([...selectedTeachers, teacher]);
                                  } else {
                                    setSelectedTeachers(selectedTeachers.filter(t => t.id !== teacher.id));
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <div>
                                <p className="font-medium">{teacher.name}</p>
                                <p className="text-sm text-gray-500">{teacher.email}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {selectedTeachers.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedTeachers.map(teacher => (
                          <span key={teacher.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            {teacher.name}
                            <button
                              type="button"
                              onClick={() => setSelectedTeachers(prev => prev.filter(t => t.id !== teacher.id))}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FiX size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-700">Private Meeting</p>
                      <p className="text-sm text-gray-500">Require password to join</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  {formData.isPrivate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                      <input
                        type="password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Set meeting password"
                      />
                    </div>
                  )}
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Features</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.enableChat}
                        onChange={(e) => setFormData({...formData, enableChat: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">Chat</p>
                        <p className="text-sm text-gray-500">Enable text chat</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.enableScreenShare}
                        onChange={(e) => setFormData({...formData, enableScreenShare: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">Screen Share</p>
                        <p className="text-sm text-gray-500">Allow sharing</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.enableRecording}
                        onChange={(e) => setFormData({...formData, enableRecording: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">Recording</p>
                        <p className="text-sm text-gray-500">Record meeting</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Submit */}
                <div className="pt-6 border-t">
                  <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                  >
                    Schedule {formData.meetingType.charAt(0).toUpperCase() + formData.meetingType.slice(1)} Meeting
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Powered by ZegoCloud • Secure video conferencing
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      {renderPasswordModal()}

      {/* CSS for toggle switch */}
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: #3b82f6;
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 34px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default LiveClasses;