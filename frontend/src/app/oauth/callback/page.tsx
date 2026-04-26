import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SpinnerMorph from "@/components/ui/spinner-morph";
import { setAuthItem } from "@/services/authSession";

const roleDestinations: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  BOOKING_MANAGER: "/manager/booking/dashboard",
  RESOURCE_MANAGER: "/manager/resource/dashboard",
  ISSUE_MANAGER: "/manager/issue/dashboard",
  STUDENT: "/client/resources",
  LECTURER: "/client/resources",
  TECHNICIAN: "/client/resources",
  CLEANER: "/client/resources",
  SECURITY: "/client/resources",
};

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const success = searchParams.get("success") === "true";
  const role = (searchParams.get("role") || "").toUpperCase();
  const message = searchParams.get("message") || "Google login failed.";
  const expectedRole = (sessionStorage.getItem("oauthExpectedRole") || "").toUpperCase();
  const roleMismatch = success && !!expectedRole && !!role && expectedRole !== role;
  const effectiveSuccess = success && !roleMismatch;
  const effectiveMessage = roleMismatch
    ? `Wrong role selected. You chose ${expectedRole.replaceAll("_", " ")}, but this email is assigned as ${role.replaceAll("_", " ")}.`
    : message;

  const destination = useMemo(() => roleDestinations[role] || "/", [role]);

  useEffect(() => {
    if (!effectiveSuccess || !role) {
      sessionStorage.removeItem("oauthExpectedRole");
      return;
    }

    const id = searchParams.get("id") || "";
    const name = searchParams.get("name") || "";
    const email = searchParams.get("email") || "";
    const studentId = searchParams.get("studentId") || "";
    const profileImageUrl = searchParams.get("profileImageUrl") || "";

    setAuthItem("user", name || email || role);
    setAuthItem("role", role);
    setAuthItem("name", name);
    setAuthItem("email", email);
    setAuthItem("id", id);
    setAuthItem("profileImageUrl", profileImageUrl);

    if (role === "STUDENT") {
      setAuthItem("studentId", studentId);
      setAuthItem("studentName", name || "Student");
    }

    if (role === "ADMIN") {
      setAuthItem("isAdminLoggedIn", "true");
      setAuthItem("adminName", name || "Admin User");
      setAuthItem("adminEmail", email);
      setAuthItem("adminRole", "Chancellor Administrator");
    }

    if (role === "BOOKING_MANAGER") {
      setAuthItem("managerType", "BOOKING");
    } else if (role === "RESOURCE_MANAGER") {
      setAuthItem("managerType", "RESOURCE");
    } else if (role === "ISSUE_MANAGER") {
      setAuthItem("managerType", "ISSUE");
    }

    sessionStorage.removeItem("oauthExpectedRole");

    const redirectTimer = window.setTimeout(() => {
      navigate(destination, { replace: true });
    }, 700);

    return () => window.clearTimeout(redirectTimer);
  }, [destination, effectiveSuccess, navigate, role, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2f6] px-4 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_48px_rgba(0,33,71,0.1)]">
        {effectiveSuccess ? (
          <>
            <div className="mx-auto mb-5 flex justify-center">
              <SpinnerMorph size={74} fill="#002147" rotateDur="3s" morphDur="3s" />
            </div>
            <h1 className="text-2xl font-semibold text-[#002147]">Signing you in</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your registered Google email was verified.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#002147]">Google login blocked</h1>
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {effectiveMessage}
            </p>
            <div className="mt-5 flex justify-center gap-4 text-sm font-semibold text-[#002147]">
              <Link to="/client/login">Client Login</Link>
              <Link to="/manager/login">Manager Login</Link>
              <Link to="/admin/login">Admin Login</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
