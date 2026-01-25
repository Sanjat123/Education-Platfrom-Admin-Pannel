import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell, FiCheck, FiX, FiAlertCircle,
  FiInfo, FiCalendar, FiMessageSquare,
  FiDownload, FiUsers, FiTrash2
} from "react-icons/fi";
import { format } from "date-fns";

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'assignment', 
      title: 'New Assignment Submission', 
      message: 'John Doe submitted React Component Assignment',
      time: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
      priority: 'high'
    },
    { 
      id: 2, 
      type: 'message', 
      title: 'New Message', 
      message: 'Jane Smith sent you a message regarding project',
      time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      priority: 'medium'
    },
    { 
      id: 3, 
      type: 'system', 
      title: 'System Update', 
      message: 'Platform maintenance scheduled for Sunday 2 AM',
      time: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      read: true,
      priority: 'low'
    },
    { 
      id: 4, 
      type: 'schedule', 
      title: 'Upcoming Lecture', 
      message: 'React Advanced Patterns lecture starts in 30 minutes',
      time: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      read: true,
      priority: 'medium'
    },
    { 
      id: 5, 
      type: 'student', 
      title: 'Student Enrollment', 
      message: 'New student Alex Johnson enrolled in Full Stack batch',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true,
      priority: 'low'
    },
  ]);
  
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'high'

  const getIcon = (type) => {
    switch (type) {
      case 'assignment': return <FiDownload className="text-blue-500" />;
      case 'message': return <FiMessageSquare className="text-emerald-500" />;
      case 'system': return <FiInfo className="text-amber-500" />;
      case 'schedule': return <FiCalendar className="text-purple-500" />;
      case 'student': return <FiUsers className="text-sky-500" />;
      default: return <FiBell className="text-slate-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'high') return notif.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, 'MMM dd');
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                <FiBell className="text-sky-600 text-2xl" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
                Notifications
              </h1>
              <p className="text-slate-400 text-xs md:text-[10px] font-black tracking-[0.3em] uppercase mt-1">
                Stay Updated with Activities
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="bg-slate-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All as Read
            </button>
            <button 
              onClick={clearAll}
              className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl font-bold hover:bg-rose-100 transition-all"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${filter === 'unread' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${filter === 'high' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
          >
            High Priority ({notifications.filter(n => n.priority === 'high').length})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm ${!notification.read ? 'border-l-4 border-l-sky-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900">{notification.title}</h3>
                    <span className="text-xs text-slate-500">{formatTime(notification.time)}</span>
                  </div>
                  
                  <p className="text-slate-600 mb-3">{notification.message}</p>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {notification.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all"
                      title="Mark as read"
                    >
                      <FiCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-all"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <FiBell className="text-slate-400 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {filter === 'all' ? 'No Notifications' : 
               filter === 'unread' ? 'No Unread Notifications' : 
               'No High Priority Notifications'}
            </h3>
            <p className="text-slate-500">
              {filter === 'all' ? 'You\'re all caught up! Check back later for updates.' :
               filter === 'unread' ? 'All notifications have been read.' :
               'No high priority notifications at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;