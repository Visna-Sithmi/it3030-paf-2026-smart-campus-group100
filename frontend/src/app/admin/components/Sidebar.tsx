import { useNavigate } from "react-router-dom";

type SidebarProps = {
  activeItem?: string;
};

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "📊" },
  { label: "Manager Administration", path: "/admin/manager", icon: "▤" },
  { label: "Student Administration", path: "/admin/student", icon: "🎓" },
  { label: "Lecturer Management", path: "/admin/lecturers", icon: "👨‍🏫" },
  { label: "Helper Staff Management", path: "/admin/helpers", icon: "🛠" },
];

export default function Sidebar({
  activeItem = "Dashboard",  // Change default to Dashboard
}: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/admin/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-slate-50 px-6 py-6">
      <div className="mb-10 flex items-center gap-3 px-2">
        <img
          src="/src/assets/logo.jpeg"
          alt="Northbridge Logo"
          className="h-11 w-11 rounded-full object-cover shadow"
        />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Northbridge</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
            Institutional Excellence
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = activeItem === item.label;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? "border-l-4 border-slate-900 bg-slate-200 text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}