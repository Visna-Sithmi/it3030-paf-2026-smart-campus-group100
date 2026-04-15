import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.jpeg";

const BookingDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    if (!name || role !== "BOOKING_MANAGER") {
      navigate("/manager/login");
      return;
    }

    setUserName(name);
    setUserEmail(email || "");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/manager/login");
  };

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <header className="bg-[#002147] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-xl font-bold">Northbridge University</h1>
              <p className="text-xs text-slate-300">Booking Manager Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {userName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#002147]">Booking Overview</h2>
          <p className="text-slate-600">Manage facility and resource bookings</p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Total Bookings</h3>
            <p className="text-3xl font-bold text-[#002147]">0</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Pending Approvals</h3>
            <p className="text-3xl font-bold text-[#002147]">0</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Active Bookings</h3>
            <p className="text-3xl font-bold text-[#002147]">0</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-[#002147]">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <button className="rounded-lg bg-[#002147] px-4 py-2 text-white transition hover:bg-[#003368]">
              Create New Booking
            </button>
            <button className="rounded-lg border border-[#002147] px-4 py-2 text-[#002147] transition hover:bg-slate-100">
              View All Bookings
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-8 border-t border-white/10 bg-[#002147] px-6 py-4 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-sm">© 2024 Northbridge University. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BookingDashboard;