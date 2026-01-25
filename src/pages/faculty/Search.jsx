import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiSearch, FiUsers, FiFileText, FiVideo,
  FiCalendar, FiMessageSquare, FiBookOpen,
  FiArrowRight, FiFilter, FiX
} from "react-icons/fi";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  const filters = [
    { id: "all", label: "All", icon: FiSearch, count: 124 },
    { id: "students", label: "Students", icon: FiUsers, count: 45 },
    { id: "assignments", label: "Assignments", icon: FiFileText, count: 23 },
    { id: "lectures", label: "Lectures", icon: FiVideo, count: 18 },
    { id: "schedule", label: "Schedule", icon: FiCalendar, count: 12 },
    { id: "messages", label: "Messages", icon: FiMessageSquare, count: 56 },
    { id: "resources", label: "Resources", icon: FiBookOpen, count: 34 },
  ];
  
  const searchResults = {
    students: [
      { id: 1, name: "John Doe", email: "john@example.com", batch: "Full Stack", match: "name" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", batch: "Data Science", match: "email" },
    ],
    assignments: [
      { id: 1, title: "React Component Assignment", batch: "Full Stack", due: "2024-01-20", match: "title" },
      { id: 2, title: "Database Design Project", batch: "Data Science", due: "2024-01-25", match: "description" },
    ],
    lectures: [
      { id: 1, title: "Advanced React Patterns", date: "2024-01-15", time: "10:00 AM", match: "title" },
    ]
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search logic here
    console.log("Searching for:", searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-auth-entry">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Search
          </h1>
          <p className="text-slate-400 text-xs md:text-[10px] font-black tracking-[0.3em] uppercase mt-1">
            Find anything in your dashboard
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="relative">
          <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for students, assignments, lectures, messages, resources..."
            className="w-full bg-slate-50 border-2 border-slate-50 p-4 md:p-6 pl-12 md:pl-16 rounded-2xl md:rounded-3xl outline-none focus:border-sky-500/20 text-lg font-medium placeholder-slate-400"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX size={20} />
            </button>
          )}
          
          <button
            type="submit"
            className="absolute right-24 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-sky-600 transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Filter by Category</h3>
          <FiFilter className="text-slate-400" />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${activeFilter === filter.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              <filter.icon />
              <span>{filter.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === filter.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Students Results */}
        {(activeFilter === "all" || activeFilter === "students") && searchResults.students.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FiUsers /> Students
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {searchResults.students.map((student) => (
                <div key={student.id} className="p-4 md:p-6 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                        <span className="font-bold text-sky-600">{student.name.charAt(0)}</span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-900">{student.name}</h4>
                        <p className="text-sm text-slate-600">{student.email}</p>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {student.batch}
                        </span>
                      </div>
                    </div>
                    
                    <button className="opacity-0 group-hover:opacity-100 p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                      <FiArrowRight />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Results */}
        {(activeFilter === "all" || activeFilter === "assignments") && searchResults.assignments.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FiFileText /> Assignments
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {searchResults.assignments.map((assignment) => (
                <div key={assignment.id} className="p-4 md:p-6 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{assignment.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded-full text-xs font-bold">
                          {assignment.batch}
                        </span>
                        <span>Due: {assignment.due}</span>
                      </div>
                    </div>
                    
                    <button className="opacity-0 group-hover:opacity-100 p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                      <FiArrowRight />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!searchQuery && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <FiSearch className="text-slate-400 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Start Searching
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Search for students, assignments, lectures, or any content in your dashboard. 
              Use the filters to narrow down results.
            </p>
          </div>
        )}

        {/* Empty Results */}
        {searchQuery && Object.values(searchResults).flat().length === 0 && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <FiSearch className="text-amber-600 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No Results Found
            </h3>
            <p className="text-slate-500 mb-6">
              No matches found for "<span className="font-bold">{searchQuery}</span>"
            </p>
            <button 
              onClick={clearSearch}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-600 transition-all"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;