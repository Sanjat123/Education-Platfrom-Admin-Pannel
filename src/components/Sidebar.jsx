import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Video,
  CreditCard,
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Teachers", path: "/teachers", icon: GraduationCap },
  { name: "Students", path: "/students", icon: Users },
  { name: "Courses", path: "/courses", icon: BookOpen },
  { name: "Live Classes", path: "/live-classes", icon: Video },
  { name: "Payments", path: "/payments", icon: CreditCard },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-[#0f0f1a] border-r border-purple-500/20 p-5">
      <h1 className="text-2xl font-bold text-purple-400 mb-8">
        Student Nagari
      </h1>

      <nav className="space-y-3">
        {menu.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:bg-purple-500/10 hover:text-white"
              }`
            }
          >
            <item.icon size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
