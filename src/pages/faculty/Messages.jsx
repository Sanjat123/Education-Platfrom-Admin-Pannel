import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiMessageSquare, FiSend, FiSearch, FiUser,
  FiPaperclip, FiSmile, FiClock, FiCheck,
  FiCheckCircle, FiMoreVertical
} from "react-icons/fi";

const Messages = () => {
  const [conversations, setConversations] = useState([
    { id: 1, name: "John Doe", batch: "Full Stack", unread: 3, lastMessage: "Can you explain the assignment?", time: "10:30 AM" },
    { id: 2, name: "Jane Smith", batch: "Data Science", unread: 0, lastMessage: "Thank you for the lecture!", time: "Yesterday" },
    { id: 3, name: "Alex Johnson", batch: "UI/UX", unread: 1, lastMessage: "Project submission query", time: "2 days ago" },
  ]);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (selectedChat) {
      setMessages([
        { id: 1, text: "Hello, I need help with the React assignment", sender: "student", time: "10:25 AM" },
        { id: 2, text: "Sure, which part are you stuck on?", sender: "faculty", time: "10:26 AM" },
        { id: 3, text: "The state management section", sender: "student", time: "10:27 AM" },
        { id: 4, text: "I'll share some additional resources. Check your email in 10 minutes.", sender: "faculty", time: "10:28 AM" },
      ]);
    }
  }, [selectedChat]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setMessages([...messages, {
      id: messages.length + 1,
      text: newMessage,
      sender: "faculty",
      time: "Just now"
    }]);
    setNewMessage("");
  };

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-2rem)] animate-auth-entry">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 h-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          
          {/* Sidebar - Conversations */}
          <div className="lg:col-span-1 border-r border-slate-100 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <h1 className="text-2xl font-black text-slate-900">Messages</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">
                Communicate with Students
              </p>
              
              {/* Search */}
              <div className="relative mt-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="w-full bg-slate-50 border-2 border-slate-50 p-3 pl-10 rounded-xl outline-none focus:border-sky-500/20 text-sm"
                />
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map(chat => (
                <motion.div 
                  key={chat.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-slate-50 cursor-pointer transition-all ${selectedChat?.id === chat.id ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                      <FiUser className="text-sky-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-900 truncate">{chat.name}</h3>
                        <span className="text-xs text-slate-400">{chat.time}</span>
                      </div>
                      
                      <p className="text-sm text-slate-600 truncate">{chat.lastMessage}</p>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {chat.batch}
                        </span>
                        
                        {chat.unread > 0 && (
                          <span className="w-5 h-5 bg-sky-500 text-white text-xs rounded-full flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                      <FiUser className="text-sky-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">{selectedChat.name}</h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Online • {selectedChat.batch}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-xl">
                    <FiMoreVertical />
                  </button>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  {messages.map(msg => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'faculty' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${msg.sender === 'faculty' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-900'} p-3 md:p-4 rounded-2xl ${msg.sender === 'faculty' ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className={`text-xs mt-2 flex items-center gap-1 ${msg.sender === 'faculty' ? 'text-sky-200' : 'text-slate-500'}`}>
                          <FiClock size={10} />
                          {msg.time}
                          {msg.sender === 'faculty' && (
                            <FiCheckCircle className="ml-1" size={12} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className="p-4 md:p-6 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button className="p-3 hover:bg-slate-50 rounded-xl">
                      <FiPaperclip />
                    </button>
                    <button className="p-3 hover:bg-slate-50 rounded-xl">
                      <FiSmile />
                    </button>
                    
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..." 
                      className="flex-1 bg-slate-50 border-2 border-slate-50 p-3 rounded-xl outline-none focus:border-sky-500/20 text-sm"
                    />
                    
                    <button 
                      onClick={sendMessage}
                      className="bg-sky-500 text-white p-3 rounded-xl hover:bg-sky-600 transition-all"
                    >
                      <FiSend />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                  <FiMessageSquare className="text-slate-400 text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-slate-500 text-center max-w-md">
                  Choose a student from the list to start messaging. 
                  All your conversations will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;