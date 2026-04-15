import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LoginResponse } from "../../../types/auth";
import logo from "../../../assets/logo.jpeg";
import { 
  loginBookingManager, 
  loginResourceManager, 
  loginIssueManager 
} from "../../../services/authService";

type ManagerType = "BOOKING" | "RESOURCE" | "ISSUE";

const ManagerLoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [managerType, setManagerType] = useState<ManagerType>("BOOKING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getLoginFunction = () => {
    switch (managerType) {
      case "BOOKING":
        return loginBookingManager;
      case "RESOURCE":
        return loginResourceManager;
      case "ISSUE":
        return loginIssueManager;
      default:
        return loginBookingManager;
    }
  };

  const getManagerTitle = () => {
    switch (managerType) {
      case "BOOKING":
        return "Booking Manager Portal";
      case "RESOURCE":
        return "Resource Manager Portal";
      case "ISSUE":
        return "Issue Handling Portal";
      default:
        return "Manager Portal";
    }
  };

  const getManagerDescription = () => {
    switch (managerType) {
      case "BOOKING":
        return "Manage facility and resource bookings";
      case "RESOURCE":
        return "Oversee university resource allocation";
      case "ISSUE":
        return "Handle and resolve campus issues";
      default:
        return "Secure Manager Access";
    }
  };

  const getPlaceholderEmail = () => {
    switch (managerType) {
      case "BOOKING":
        return "booking.m@campus.com";
      case "RESOURCE":
        return "resource.m@campus.com";
      case "ISSUE":
        return "issue.m@campus.com";
      default:
        return "manager@campus.com";
    }
  };

  const getDashboardPath = () => {
    switch (managerType) {
      case "BOOKING":
        return "/manager/booking/dashboard";
      case "RESOURCE":
        return "/manager/resource/dashboard";
      case "ISSUE":
        return "/manager/issue/dashboard";
      default:
        return "/manager/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const loginFn = getLoginFunction();
      const data: LoginResponse = await loginFn(formData);

      console.log("Login response:", data);

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("role", data.role || "");
        localStorage.setItem("name", data.name || "");
        localStorage.setItem("email", data.email || "");
        localStorage.setItem("id", data.id?.toString() || "");
        localStorage.setItem("managerType", managerType);

        setSuccessMessage(data.message || "Login successful");

        // Navigate to respective dashboard based on manager type
        const dashboardPath = getDashboardPath();
        console.log("Navigating to:", dashboardPath);
        
        setTimeout(() => {
          navigate(dashboardPath);
        }, 1000);
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#eef2f6] text-slate-900 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-4">
        <div className="w-full max-w-md">
          <div className="mb-3 text-center">
            <nav className="flex items-center justify-center gap-2 text-[11px] italic text-[#002147]/70">
              <span>Manager Access</span>
              <span>›</span>
              <span>Authentication Gateway</span>
            </nav>
          </div>

          <div className="mb-4 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white p-2 shadow-[0_12px_30px_rgba(0,33,71,0.16)] ring-4 ring-white/80">
              <div className="h-full w-full overflow-hidden rounded-full border border-slate-200">
                <img
                  src={logo}
                  alt="Northbridge University Logo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#002147] md:text-4xl">
              {getManagerTitle()}
            </h1>

            <p className="mt-1.5 text-xs text-slate-600">
              {getManagerDescription()}
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setManagerType("BOOKING");
                setFormData({ email: "", password: "" });
                setError("");
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all duration-200 ${
                managerType === "BOOKING"
                  ? "bg-[#002147] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Booking
            </button>
            <button
              type="button"
              onClick={() => {
                setManagerType("RESOURCE");
                setFormData({ email: "", password: "" });
                setError("");
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all duration-200 ${
                managerType === "RESOURCE"
                  ? "bg-[#002147] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Resource
            </button>
            <button
              type="button"
              onClick={() => {
                setManagerType("ISSUE");
                setFormData({ email: "", password: "" });
                setError("");
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all duration-200 ${
                managerType === "ISSUE"
                  ? "bg-[#002147] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Issue
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_24px_48px_rgba(0,33,71,0.08)] backdrop-blur-sm md:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#002147]/85"
                >
                  Institutional Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={getPlaceholderEmail()}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#002147] focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#002147]/85"
                >
                  Access Key
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#002147] focus:bg-white"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="rounded-md bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-700">
                    {successMessage}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#000a1e] to-[#002147] px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-white shadow-[0_10px_24px_rgba(0,33,71,0.28)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(0,33,71,0.32)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Authorizing..." : "Authorize Entry"}
              </button>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-center text-[10px] uppercase leading-6 tracking-[0.14em] text-slate-600">
                Authorized Manager Access Only
              </p>
              <p className="mt-1 text-center text-[9px] text-slate-500">
                Unauthorized access attempts are monitored and recorded
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/admin/login"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:text-[#002147]"
            >
              ← Admin Portal
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#002147] px-5 py-4 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:flex-row">
          <div className="text-center md:text-left">
            <p className="text-lg italic">Northbridge University</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              © 2024 Northbridge University. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-wider text-slate-300">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Accessibility</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ManagerLoginPage;