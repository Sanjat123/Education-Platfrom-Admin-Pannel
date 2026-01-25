import React from "react";
import { FiStar, FiBookOpen } from "react-icons/fi";

const TopCoursesTable = ({ courses }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Detail</th>
            <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollments</th>
            <th className="text-left py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
              <td className="py-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition-all">
                    <FiBookOpen />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800">{course.title}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{course.category}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-2">
                <div className="text-sm font-black text-slate-700">{course.enrollments || 0}</div>
              </td>
              <td className="py-4 px-2">
                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                  {course.rating || 0} <FiStar className="fill-amber-500" size={12} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopCoursesTable;