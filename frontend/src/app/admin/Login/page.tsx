import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginAdmin } from "../../../services/authService";
import type { LoginResponse } from "../../../types/auth";
import logo from "../../../assets/logo.jpeg";
import SpinnerMorph from "@/components/ui/spinner-morph";

const GOOGLE_AUTH_URL = "http://localhost:8081/oauth2/authorization/google";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get the attempted path from location state
  // If no state exists (direct login), default to /admin/dashboard
  const from = (location.state as any)?.from || "/admin/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    const role = localStorage.getItem("role");
    
    if (isLoggedIn && role === "ADMIN") {
      // Redirect to dashboard if already logged in
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const data: LoginResponse = await loginAdmin(formData);

      if (data.success) {
        if (data.role === "ADMIN") {
          // Store complete user info in localStorage
          localStorage.setItem("user", JSON.stringify(data));
          localStorage.setItem("role", data.role || "");
          localStorage.setItem("name", data.name || "");
          localStorage.setItem("email", data.email || "");
          localStorage.setItem("id", data.id?.toString() || "");
          localStorage.setItem("adminName", data.name || "Admin User");
          localStorage.setItem("adminEmail", data.email || "");
          localStorage.setItem("adminRole", "Chancellor Administrator");
          
          // Store admin authentication (without token since backend doesn't send it)
          localStorage.setItem("isAdminLoggedIn", "true");

          setSuccessMessage(data.message || "Login successful");
          
          // Always redirect to dashboard after successful login
          navigate("/admin/dashboard", { replace: true });
        } else {
          setError("Access denied. Admin only.");
        }
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

  const handleGoogleLogin = () => {
    window.location.assign(GOOGLE_AUTH_URL);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#eef2f6] text-slate-900 flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-4">
        <div className="w-full max-w-md">
          <div className="mb-3 text-center">
            <nav className="flex items-center justify-center gap-2 text-[11px] italic text-[#002147]/70">
              <span>Central Administration</span>
              <span>›</span>
              <span>Security Gateway</span>
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
              Administrator Portal
            </h1>

            <p className="mt-1.5 text-[11px] uppercase tracking-[0.24em] text-slate-600">
              Secure Institutional Access
            </p>
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
                  placeholder="admin@campus.com"
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
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <SpinnerMorph size={20} fill="#ffffff" rotateDur="3s" morphDur="3s" />
                    Authorizing...
                  </span>
                ) : (
                  "Authorize Entry"
                )}
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#002147]/20 bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#002147] shadow-sm transition duration-200 hover:bg-[#eef4fb]"
              >
                <span className="text-base font-black leading-none">G</span>
                Continue with Google
              </button>
            </form>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-[10px] uppercase leading-6 tracking-[0.14em] text-slate-600">
                This system is restricted to authorized administrative personnel
                of Northbridge University. Unauthorized access attempts are
                monitored and recorded.
              </p>
            </div>
          </div>

          {/* Show attempted path info if they were redirected from a specific page */}
          {from !== "/admin/dashboard" && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 text-center">
                <strong>Note:</strong> You were trying to access: {from}
              </p>
            </div>
          )}
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
            <a href="#" className="hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white">
              Accessibility
            </a>
            <a href="#" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
