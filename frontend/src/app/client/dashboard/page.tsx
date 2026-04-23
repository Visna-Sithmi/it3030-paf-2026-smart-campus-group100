import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { resourceService } from "../../../services/resource.service";
import type { Resource } from "../../../types/resource.types";

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState(localStorage.getItem("studentName") || "Student");

  useEffect(() => {
    const syncStudentName = () => {
      setStudentName(localStorage.getItem("studentName") || "Student");
    };

    syncStudentName();

    const handleProfileUpdated = () => syncStudentName();
    window.addEventListener("student-profile-updated", handleProfileUpdated);
    window.addEventListener("profile-updated", handleProfileUpdated);
    window.addEventListener("storage", handleProfileUpdated);

    return () => {
      window.removeEventListener("student-profile-updated", handleProfileUpdated);
      window.removeEventListener("profile-updated", handleProfileUpdated);
      window.removeEventListener("storage", handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("id");

    if (!role || role !== "STUDENT" || !id) {
      navigate("/client/login");
      return;
    }

    const loadResources = async () => {
      try {
        setLoading(true);
        const data = await resourceService.getAllResources();
        setResources(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Failed to load resources");
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [navigate]);

  const stats = useMemo(() => {
    const total = resources.length;
    const active = resources.filter((r) => r.status === "ACTIVE").length;
    const available = resources.filter((r) => r.available).length;
    return { total, active, available };
  }, [resources]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#002147]">Welcome, {studentName}</h1>
          <p className="mt-1 text-sm text-slate-600">Your personalized student dashboard and quick access to resource bookings.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total Resources</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Active Resources</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">{stats.active}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Available Now</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">{stats.available}</h3>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/client/resources")}
              className="rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#001733]"
            >
              Browse Resources
            </button>
            <button
              onClick={() => navigate("/my-bookings")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate("/client/profile")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">Latest Resources</h2>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No resources available right now.</div>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              {resources.slice(0, 6).map((resource) => (
                <div key={resource.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-900">{resource.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{resource.type?.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-xs text-slate-600">{resource.location || "No location"}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        resource.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {resource.status}
                    </span>
                    <button
                      onClick={() => navigate("/client/resourceBooking", { state: { resourceId: resource.id } })}
                      className="text-xs font-semibold text-[#002147] underline"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
