import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  FiPlayCircle, 
  FiClock, 
  FiUsers, 
  FiStar, 
  FiShoppingCart,
  FiEye,
  FiLock,
  FiChevronRight
} from "react-icons/fi";
import { FaChalkboardTeacher, FaPercentage } from "react-icons/fa";

const CourseCard = ({ course, viewMode, isEnrolled, onPreview, onPurchase }) => {
  const [isHovered, setIsHovered] = useState(false);

  const calculateDiscount = () => {
    if (course.discountPrice && course.price) {
      return Math.round(((course.price - course.discountPrice) / course.price) * 100);
    }
    return 0;
  };

  if (viewMode === "list") {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-xl transition-all"
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 relative">
            <img 
              src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"}
              alt={course.title}
              className="w-full h-48 md:h-full object-cover"
            />
            {course.discountPrice && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {calculateDiscount()}% OFF
              </div>
            )}
            <button
              onClick={onPreview}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <FiPlayCircle className="text-white text-4xl" />
            </button>
          </div>
          
          <div className="md:w-2/3 p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    course.level === "beginner" ? "bg-emerald-100 text-emerald-700" : 
                    course.level === "intermediate" ? "bg-blue-100 text-blue-700" : 
                    "bg-red-100 text-red-700"
                  }`}>
                    {course.level || "All Levels"}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                    {course.category || "Education"}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2">{course.title}</h3>
                <p className="text-slate-600 mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <FaChalkboardTeacher /> {course.teacherName || "Instructor"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiPlayCircle /> {course.lessonsCount || 12} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock /> {course.duration || "8 weeks"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers /> {course.studentsEnrolled || 0} students
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-end gap-2">
                  {course.discountPrice ? (
                    <>
                      <span className="text-2xl font-bold text-slate-800">₹{course.discountPrice}</span>
                      <span className="text-lg text-slate-400 line-through">₹{course.price}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-slate-800">₹{course.price || 0}</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={onPreview}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <FiEye /> Preview
                  </button>
                  {isEnrolled ? (
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                      <FiPlayCircle /> Continue
                    </button>
                  ) : (
                    <button
                      onClick={onPurchase}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <FiShoppingCart /> Enroll
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-300"
    >
      <div className="relative overflow-hidden">
        <img 
          src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"}
          alt={course.title}
          className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
        />
        
        {course.discountPrice && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {calculateDiscount()}% OFF
          </div>
        )}
        
        {isEnrolled ? (
          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Enrolled
          </div>
        ) : (
          <button
            onClick={onPreview}
            className="absolute top-4 right-4 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black transition-colors flex items-center gap-1"
          >
            <FiEye /> Preview
          </button>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-bold text-lg line-clamp-1">{course.title}</h3>
          <p className="text-white/80 text-sm line-clamp-1">{course.teacherName || "Instructor"}</p>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              course.level === "beginner" ? "bg-emerald-100 text-emerald-700" : 
              course.level === "intermediate" ? "bg-blue-100 text-blue-700" : 
              "bg-red-100 text-red-700"
            }`}>
              {course.level || "All Levels"}
            </span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <FiPlayCircle /> {course.lessonsCount || 12}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <FiStar className="text-amber-500 text-sm" />
            <span className="text-sm font-bold text-slate-700">{course.rating || 4.5}</span>
          </div>
        </div>
        
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
          <span className="flex items-center gap-1">
            <FiUsers /> {course.studentsEnrolled || 0}
          </span>
          <span className="flex items-center gap-1">
            <FiClock /> {course.duration || "8 weeks"}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            {course.discountPrice ? (
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-slate-800">₹{course.discountPrice}</span>
                <span className="text-sm text-slate-400 line-through">₹{course.price}</span>
              </div>
            ) : (
              <span className="text-xl font-bold text-slate-800">₹{course.price || 0}</span>
            )}
          </div>
          
          {isEnrolled ? (
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
              Access <FiChevronRight />
            </button>
          ) : (
            <button
              onClick={onPurchase}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FiShoppingCart /> Enroll
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;