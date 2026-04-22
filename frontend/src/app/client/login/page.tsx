import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { studentAuthService } from "../../../services/studentAuthService";
import { loginLecturer } from "../../../services/authService";
import type { StudentLoginRequest } from "../../../types/studentAuth";
import logo from "../../../assets/logo.jpeg";
import { AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type PortalType = "STUDENT" | "LECTURER";

const emptyStudentForm: StudentLoginRequest = {
  studentId: "",
  password: "",
};

const emptyLecturerForm = {
  email: "",
  password: "",
};

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const [activePortal, setActivePortal] = useState<PortalType>("STUDENT");
  const [formData, setFormData] = useState<StudentLoginRequest>(emptyStudentForm);
  const [lecturerFormData, setLecturerFormData] = useState(emptyLecturerForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLecturerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLecturerFormData((prev) => ({
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

      if (!response.success || (response.role && response.role.toUpperCase() !== "STUDENT")) {
        setError(response.message || "Student login failed");
        return;
      }

      const studentRole = (response.role || "STUDENT").trim().toUpperCase();
      localStorage.setItem("user", response.name || "Student");
      localStorage.setItem("role", studentRole);
      localStorage.setItem("studentId", response.studentId || "");
      localStorage.setItem("studentName", response.name || "Student");
      localStorage.setItem("name", response.name || "Student");
      localStorage.setItem("id", response.id ? String(response.id) : (response.studentId || ""));
      localStorage.setItem("email", response.email || "");

      setSuccessMessage("Student login successful");
      navigate("/client/resources");
    } catch (err: any) {
      setError(err.message || "Student login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLecturerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const trimmedEmail = lecturerFormData.email.trim();
      const trimmedPassword = lecturerFormData.password.trim();

      if (!trimmedEmail) {
        setError("Email is required.");
        return;
      }

      if (!trimmedPassword) {
        setError("Password is required.");
        return;
      }

      const response = await loginLecturer({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (!response.success || response.role !== "LECTURER") {
        setError(response.message || "Lecturer login failed");
        return;
      }

      localStorage.setItem("user", response.name || "Lecturer");
      localStorage.setItem("role", "LECTURER");
      localStorage.setItem("name", response.name || "Lecturer");
      localStorage.setItem("email", response.email || trimmedEmail);
      localStorage.setItem("id", response.id ? String(response.id) : "");

      setSuccessMessage("Lecturer login successful");
      navigate("/client/resources");
    } catch (err: any) {
      setError(err.message || "Lecturer login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedCharactersLoginPage
      brandName="Northbridge University"
      heading="University Access Portal"
      subheading="Secure entry for students and academic staff"
      topBadge="Common Access Authentication Gateway"
      isTyping={isTyping}
      isPasswordVisible={showPassword}
      hasPasswordValue={
        activePortal === "STUDENT"
          ? formData.password.length > 0
          : lecturerFormData.password.length > 0
      }
      logo={
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
          <img
            src={logo}
            alt="Northbridge University Logo"
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
      }
    >
      <div className="flex w-full rounded-xl bg-slate-200/70 p-0.5 mb-5">
        <button
          type="button"
          onClick={() => {
            setActivePortal("STUDENT");
            setError("");
            setSuccessMessage("");
            setFormData(emptyStudentForm);
            setShowPassword(false);
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
            setLecturerFormData(emptyLecturerForm);
            setShowPassword(false);
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

      {activePortal === "STUDENT" ? (
        <form onSubmit={handleStudentLogin} className="space-y-4">
          <div>
            <Label
              htmlFor="studentId"
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f3d63]"
            >
              Student ID
            </Label>
            <Input
              id="studentId"
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              placeholder="Enter your student ID"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[#002147] focus:bg-white"
            />
          </div>

          <div>
            <Label
              htmlFor="studentPassword"
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f3d63]"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="studentPassword"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder="Enter your password"
                className="w-full pr-10 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[#002147] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
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

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Checkbox id="studentRemember" />
              <Label htmlFor="studentRemember" className="text-xs font-normal">
                Remember me
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#002147] py-3 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-md transition hover:bg-[#001733] disabled:opacity-70"
          >
            {loading ? "Authorizing..." : "Authorize Entry"}
          </Button>

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
        <form onSubmit={handleLecturerLogin} className="space-y-4">
          <div>
            <Label
              htmlFor="lecturerEmail"
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f3d63]"
            >
              Lecturer Email
            </Label>
            <Input
              id="lecturerEmail"
              type="email"
              name="email"
              value={lecturerFormData.email}
              onChange={handleLecturerChange}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[#002147] focus:bg-white"
            />
          </div>

          <div>
            <Label
              htmlFor="lecturerPassword"
              className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f3d63]"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="lecturerPassword"
                type={showPassword ? "text" : "password"}
                name="password"
                value={lecturerFormData.password}
                onChange={handleLecturerChange}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder="Enter your password"
                className="w-full pr-10 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[#002147] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
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

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Checkbox id="lecturerRemember" />
              <Label htmlFor="lecturerRemember" className="text-xs font-normal">
                Remember me
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#002147] py-3 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-md transition hover:bg-[#001733] disabled:opacity-70"
          >
            {loading ? "Authorizing..." : "Authorize Entry"}
          </Button>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
              Authorized Lecturer Access Only
            </p>
          </div>
        </form>
      )}

      <div className="text-center mt-4">
        <button
          type="button"
          className="text-sm font-semibold text-[#385071] transition hover:text-[#002147]"
        >
          ← HOME PORTAL
        </button>
      </div>
    </AnimatedCharactersLoginPage>
  );
}
