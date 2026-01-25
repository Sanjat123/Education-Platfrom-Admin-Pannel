import React from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { format } from "date-fns";

const RecentActivities = ({ activities }) => {
  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-4 relative">
          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-full z-10 ${
              activity.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {activity.status === 'success' ? <FiCheckCircle size={14}/> : <FiInfo size={14}/>}
            </div>
            <div className="w-0.5 h-full bg-slate-100 absolute top-8"></div>
          </div>
          <div className="pb-6">
            <p className="text-sm font-black text-slate-800">{activity.action}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{activity.details}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">
              {activity.timestamp ? format(activity.timestamp, "MMM dd • hh:mm a") : "Just now"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivities;