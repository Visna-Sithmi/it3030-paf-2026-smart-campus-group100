import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.jpeg";
import ManagerDashboard from "../issueDashboard/ManagerDashboard";

export default function IssueAnalyticsPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "Manager";

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <header className="bg-[#002147] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-xl font-bold">Northbridge University</h1>
              <p className="text-xs text-slate-300">Issue Manager • Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm md:inline">Welcome, {userName}</span>
            <button
              onClick={() => navigate("/manager/issue/dashboard")}
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <ManagerDashboard />
      </main>

      <footer className="mt-8 border-t border-white/10 bg-[#002147] px-6 py-4 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-sm">© 2024 Northbridge University. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}