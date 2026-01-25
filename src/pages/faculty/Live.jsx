import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiVideo, FiUsers, FiMessageSquare, FiShare2,
  FiCopy, FiMic, FiMicOff, FiCamera, FiCameraOff,
  FiMonitor, FiMoreVertical, FiBell, FiSettings
} from "react-icons/fi";

const Live = () => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: "John Doe", message: "Good morning everyone!", time: "10:00" },
    { id: 2, user: "Jane Smith", message: "Can you repeat the last point?", time: "10:02" },
    { id: 3, user: "You", message: "Sure, let me go over it again", time: "10:03" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  
  const participants = [
    { id: 1, name: "You", isHost: true, isSpeaking: true },
    { id: 2, name: "John Doe", isSpeaking: false },
    { id: 3, name: "Jane Smith", isSpeaking: true },
    { id: 4, name: "Alex Johnson", isSpeaking: false },
    { id: 5, name: "Sam Wilson", isSpeaking: false },
    { id: 6, name: "Taylor Brown", isSpeaking: false },
  ];

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setChatMessages([...chatMessages, {
      id: chatMessages.length + 1,
      user: "You",
      message: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage("");
  };

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-2rem)] animate-auth-entry">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 h-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
              <FiVideo className="text-rose-600 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">React Advanced Patterns</h1>
              <p className="text-xs text-slate-500">Live Session • Full Stack Batch</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold">LIVE</span>
            </div>
            
            <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-sky-600 transition-all">
              <FiShare2 /> Share
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Video Area */}
          <div className="lg:w-3/4 p-4 md:p-6 flex flex-col">
            {/* Main Video */}
            <div className="flex-1 bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden relative mb-4">
              {/* Video Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <FiCamera className="text-slate-400 text-3xl" />
                  </div>
                  <p className="text-slate-400">Your camera is {isCameraOn ? 'on' : 'off'}</p>
                </div>
              </div>
              
              {/* Participants Count */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                <FiUsers className="inline mr-2" />
                {participants.length} participants
              </div>
              
              {/* Session Info */}
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-xl">
                <div className="text-sm font-bold">React Advanced Patterns</div>
                <div className="text-xs opacity-75">10:00 AM - 12:00 PM</div>
              </div>
            </div>
            
            {/* Participants Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {participants.map((p) => (
                <div key={p.id} className="bg-slate-50 rounded-xl p-3 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center ${
                    p.isHost ? 'bg-gradient-to-br from-sky-100 to-blue-100' : 'bg-gradient-to-br from-slate-100 to-slate-200'
                  }`}>
                    <span className={`font-bold ${p.isHost ? 'text-sky-600' : 'text-slate-600'}`}>
                      {p.name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 truncate w-full text-center">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {p.isSpeaking && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    )}
                    <span className="text-xs text-slate-500">
                      {p.isHost ? 'Host' : 'Student'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sidebar - Chat & Controls */}
          <div className="lg:w-1/4 border-l border-slate-100 flex flex-col">
            
            {/* Chat */}
            <div className="flex-1 p-4 border-b border-slate-100 flex flex-col">
              <h3 className="font-bold text-slate-900 mb-3">Live Chat</h3>
              
              <div className="flex-1 overflow-y-auto mb-3 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`p-2 rounded-lg ${msg.user === 'You' ? 'bg-sky-50' : 'bg-slate-50'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-bold ${msg.user === 'You' ? 'text-sky-700' : 'text-slate-700'}`}>
                        {msg.user}
                      </span>
                      <span className="text-xs text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-sm text-slate-900 mt-1">{msg.message}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..." 
                  className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-sm"
                />
                <button 
                  onClick={sendMessage}
                  className="bg-sky-500 text-white p-2 rounded-lg hover:bg-sky-600"
                >
                  <FiMessageSquare />
                </button>
              </div>
            </div>
            
            {/* Controls */}
            <div className="p-4">
              <h3 className="font-bold text-slate-900 mb-3">Controls</h3>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button 
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center ${isMicOn ? 'bg-slate-900 text-white' : 'bg-rose-100 text-rose-700'}`}
                >
                  {isMicOn ? <FiMic size={20} /> : <FiMicOff size={20} />}
                  <span className="text-xs mt-1">Mic</span>
                </button>
                
                <button 
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center ${isCameraOn ? 'bg-slate-900 text-white' : 'bg-rose-100 text-rose-700'}`}
                >
                  {isCameraOn ? <FiCamera size={20} /> : <FiCameraOff size={20} />}
                  <span className="text-xs mt-1">Camera</span>
                </button>
                
                <button 
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center ${isScreenSharing ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}
                >
                  <FiMonitor size={20} />
                  <span className="text-xs mt-1">Share</span>
                </button>
                
                <button className="p-3 rounded-xl flex flex-col items-center justify-center bg-slate-100 text-slate-700">
                  <FiMoreVertical size={20} />
                  <span className="text-xs mt-1">More</span>
                </button>
              </div>
              
              <div className="space-y-2">
                <button className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all">
                  Start Recording
                </button>
                <button className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition-all">
                  End Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Live;