import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentAuthService } from "../../../services/studentAuthService";
import type { StudentLoginRequest } from "../../../types/studentAuth";
import logo from "../../../assets/logo.jpeg";

type PortalType = "STUDENT" | "LECTURER";

const emptyStudentForm: StudentLoginRequest = {
  studentId: "",
  password: "",
};

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [activePortal, setActivePortal] = useState<PortalType>("STUDENT");
  const [formData, setFormData] = useState<StudentLoginRequest>(emptyStudentForm);
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

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const trimmedStudentId = formData.studentId.trim();
      const trimmedPassword = formData.password.trim();

      if (!trimmedStudentId) {
        setError("Student ID is required.");
        return;
      }

      if (!trimmedPassword) {
        setError("Password is required.");
        return;
      }

      const response = await studentAuthService.login({
        studentId: trimmedStudentId,
        password: trimmedPassword,
      });

      const normalizedStudentId = response.studentId || "";
      const normalizedName = response.name || "Student";

      localStorage.setItem("user", normalizedName);
      localStorage.setItem("role", response.role || "STUDENT");
      localStorage.setItem("studentId", normalizedStudentId);
      localStorage.setItem("studentName", normalizedName);
      localStorage.setItem("id", response.id ? String(response.id) : "");
      localStorage.setItem("email", response.email || "");
      localStorage.setItem("profileImageUrl", response.profileImageUrl || "");

      setSuccessMessage("Student login successful");
      navigate("/client/dashboard");
    } catch (err: any) {
      setError(err.message || "Student login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-xs italic tracking-wide text-slate-500 mb-2">
            Common Access <span className="px-1">›</span> Authentication Gateway
          </div>

          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
              <img
                src={logo}
                alt="Northbridge University Logo"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#002147]">
            University Access Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Secure entry for students and academic staff
          </p>
        </div>

        {/* Portal Tabs */}
        <div className="flex w-full max-w-md mx-auto rounded-xl bg-slate-200/70 p-0.5 mb-5">
          <button
            type="button"
            onClick={() => {
              setActivePortal("STUDENT");
              setError("");
              setSuccessMessage("");
            }}
            className={`w-1/2 rounded-lg py-2 text-sm font-semibold transition ${
              activePortal === "STUDENT"
                ? "bg-[#002147] text-white shadow-sm"
                : "text-[#385071] hover:bg-white/60"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePortal("LECTURER");
              setError("");
              setSuccessMessage("");
            }}
            className={`w-1/2 rounded-lg py-2 text-sm font-semibold transition ${
              activePortal === "LECTURER"
                ? "bg-[#002147] text-white shadow-sm"
                : "text-[#385071] hover:bg-white/60"
            }`}
          >
            Lecturer
          </button>
        </div>

        {/* Login Form */}
        <div className="max-w-md mx-auto bg-white rounded-2xl px-6 py-6 shadow-sm">
          {activePortal === "STUDENT" ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f3d63]">
                  Student ID
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="Enter your student ID"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[#002147] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f3d63]">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[#002147] focus:bg-white"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#002147] py-3 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-md transition hover:bg-[#001733] disabled:opacity-70"
              >
                {loading ? "Authorizing..." : "Authorize Entry"}
              </button>

              <div className="border-t border-slate-100 pt-4 text-center">
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  Authorized Student Access Only
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Unauthorized access attempts are monitored and recorded.
                </p>
              </div>
            </form>
          ) : (
            <div className="py-4 text-center">
              <h2 className="text-lg font-semibold text-[#002147]">Lecturer Portal</h2>
              <p className="mt-1 text-sm text-slate-500">
                Lecturer login will be connected next.
              </p>
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-4 text-xs text-slate-400">
                This portal UI is ready. Backend and frontend authentication for
                lecturers can be plugged in later using the same structure.
              </div>
            </div>
          )}
        </div>

        {/* Home Portal Button */}
        <div className="text-center mt-4">
          <button
            type="button"
            className="text-sm font-semibold text-[#385071] transition hover:text-[#002147]"
          >
            ← HOME PORTAL
          </button>
        </div>
      </div>
    </div>
  );
}