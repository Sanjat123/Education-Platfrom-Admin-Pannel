import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import LiveClasses from "./pages/LiveClasses";
import Payments from "./pages/Payments";

export default function App() {
  return (
    <div className="flex bg-[#0a0a0f] text-white min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/live-classes" element={<LiveClasses />} />
            <Route path="/payments" element={<Payments />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
