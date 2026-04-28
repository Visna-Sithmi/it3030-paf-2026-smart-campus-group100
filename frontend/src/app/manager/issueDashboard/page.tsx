import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBarChart2 } from "react-icons/fi";
import logo from "../../../assets/logo.jpeg";
import { issueManagerProfileService } from "../../../services/issueManagerProfileService";
import RejectTicketModal from "../../../components/modals/RejectTicketModal";
import {
  addResolutionNotes,
  assignStaff,
  closeTicket,
  downloadTicketReport,
  getAllTickets,
  getAssignableStaff,
  updateTicketStatus,
} from "../../../services/ticketService";
import { clearAuthSession, getAuthItem, setAuthItem } from "../../../services/authSession";

type Ticket = {
  id: number;
  category: string;
  description: string;
  priority: string;
  status: string;
  createdByName: string;
  assignedToId?: number;
  assignedToName?: string;
  assignedToRole?: string;
  rejectionReason?: string;
  resolutionNotes?: string;
  createdAt: string;
  completedAt?: string;
  closedAt?: string;
  resolvedBy?: number;
};

type Staff = {
  id: number;
  name: string;
  role: string;
  email: string;
};

function toErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: unknown }; message?: string } | null;
  const data = e?.response?.data;
  if (!data) return e?.message || "Request failed";
  if (typeof data === "string") return data;
  if (typeof data === "object" && data && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  try {
    return JSON.stringify(data);
  } catch {
    return "Request failed";
  }
}

function AnalyticsNavButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#002147] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#001733] hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#002147]/60 focus:ring-offset-2 md:w-auto"
      aria-label="View Analytics"
    >
      <FiBarChart2 className="h-4 w-4 opacity-95 transition group-hover:opacity-100" />
      <span>View Analytics</span>
    </button>
  );
}

const IssueDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assignedToFilter, setAssignedToFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTicketId, setRejectTicketId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const didInitialLoadRef = useRef(false);

  const currentRole = (getAuthItem("role") || "").toUpperCase();
  const isIssueManager = currentRole === "ISSUE_MANAGER";
  const currentUserId = Number(getAuthItem("id") || "0");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  };

  const getNextManagerStatus = (current: string): string | null => {
    switch (current) {
      case "OPEN":
        return "IN_PROGRESS";
      case "IN_PROGRESS":
        return "RESOLVED";
      case "RESOLVED":
        return "CLOSED";
      default:
        return null;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ticketsRes, staffRes] = await Promise.all([getAllTickets(), getAssignableStaff()]);
      setTickets(ticketsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (e: unknown) {
      setError(toErrorMessage(e) || "Failed to load issue dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const syncProfileFromStorage = () => {
      const name = getAuthItem("name");
      const email = getAuthItem("email");

      if (name) {
        setUserName(name);
      }
      setUserEmail(email || "");
    };

    const name = getAuthItem("name");
    const role = getAuthItem("role");
    if (!name || role !== "ISSUE_MANAGER") {
      navigate("/manager/login");
      return;
    }

    syncProfileFromStorage();

    // Ensure tickets/staff load on initial mount (page refresh),
    // while guarding against duplicate calls in dev (StrictMode).
    if (!didInitialLoadRef.current) {
      didInitialLoadRef.current = true;
      void loadData();
    }

    const handleProfileUpdated = () => syncProfileFromStorage();
    window.addEventListener("profile-updated", handleProfileUpdated);
    window.addEventListener("storage", handleProfileUpdated);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdated);
      window.removeEventListener("storage", handleProfileUpdated);
    };
  }, [navigate]);

  useEffect(() => {
    if (!isIssueManager) return;
    const interval = window.setInterval(() => {
      void loadData();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [isIssueManager]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN" || t.status === "PENDING").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED" || t.status === "COMPLETED_BY_STAFF").length,
      closed: tickets.filter((t) => t.status === "CLOSED").length,
      rejected: tickets.filter((t) => t.status === "REJECTED").length,
      completedByStaff: tickets.filter((t) => t.status === "COMPLETED_BY_STAFF").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const text = `${ticket.id} ${ticket.category} ${ticket.description} ${ticket.createdByName}`.toLowerCase();
      const searchOk = text.includes(query.toLowerCase());
      const statusOk = statusFilter === "ALL" || ticket.status === statusFilter;
      const priorityOk = priorityFilter === "ALL" || String(ticket.priority || "").toUpperCase() === priorityFilter;
      const assignedOk =
        assignedToFilter === "ALL" || String(ticket.assignedToId || "") === String(assignedToFilter || "");
      const created = ticket.createdAt ? new Date(ticket.createdAt) : null;
      const fromOk = !fromDate || (created ? created >= new Date(`${fromDate}T00:00:00`) : true);
      const toOk = !toDate || (created ? created <= new Date(`${toDate}T23:59:59`) : true);

      return searchOk && statusOk && priorityOk && assignedOk && fromOk && toOk;
    });
  }, [tickets, query, statusFilter, priorityFilter, assignedToFilter, fromDate, toDate]);

  const completedTickets = useMemo(() => filteredTickets.filter((ticket) => ticket.status === "COMPLETED_BY_STAFF"), [filteredTickets]);
  const activeTickets = useMemo(() => filteredTickets.filter((ticket) => ticket.status !== "COMPLETED_BY_STAFF"), [filteredTickets]);

  const closeCompletedTicket = async (ticketId: number) => {
    if (!isIssueManager) return;
    try {
      await closeTicket(ticketId);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: "CLOSED" } : t)));
      showToast("success", "Ticket closed.");
    } catch (e: unknown) {
      const msg = toErrorMessage(e) || "Failed to close ticket";
      showToast("error", msg);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/manager/login");
  };

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setProfileError("");

    const idRaw = getAuthItem("id");
    const managerId = idRaw ? Number(idRaw) : 0;
    if (!managerId) return;

    try {
      const latestProfile = await issueManagerProfileService.getProfile(managerId);
      setUserName(latestProfile.name || "");
      setUserEmail(latestProfile.email || "");
      setProfileImageUrl(latestProfile.profileImageUrl || "");
      setAuthItem("name", latestProfile.name || "");
      setAuthItem("email", latestProfile.email || "");
      setAuthItem("profileImageUrl", latestProfile.profileImageUrl || "");
    } catch (e: unknown) {
      setProfileError(toErrorMessage(e) || "Failed to load profile");
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImageUrl(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const saveProfileImage = async () => {
    const idRaw = getAuthItem("id");
    const managerId = idRaw ? Number(idRaw) : 0;
    if (!managerId) {
      setProfileError("Manager session not found. Please login again.");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError("");
      const updated = await issueManagerProfileService.updateProfile(managerId, {
        name: userName.trim(),
        profileImageUrl: profileImageUrl || null,
      });
      setUserName(updated.name || "");
      setUserEmail(updated.email || "");
      setProfileImageUrl(updated.profileImageUrl || "");
      setAuthItem("name", updated.name || "");
      setAuthItem("email", updated.email || "");
      setAuthItem("profileImageUrl", updated.profileImageUrl || "");
      setShowProfileModal(false);
    } catch (e: unknown) {
      setProfileError(toErrorMessage(e) || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const updateStatusForTicket = async (ticketId: number, status: string) => {
    try {
      await updateTicketStatus(ticketId, status);
      await loadData();
    } catch (e: unknown) {
      setError(toErrorMessage(e) || "Failed to update ticket status");
    }
  };

  const openRejectModal = (ticketId: number) => {
    if (!isIssueManager) return;
    setRejectOpen(true);
    setRejectTicketId(ticketId);
    setRejectReason("");
    setRejectError("");
  };

  const closeRejectModal = () => {
    setRejectOpen(false);
    setRejectTicketId(null);
    setRejectReason("");
    setRejectError("");
    setRejectSubmitting(false);
  };

  const submitReject = async () => {
    if (!isIssueManager) return;
    if (!rejectTicketId) return;

    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Reject reason is required.");
      return;
    }

    if (!Number.isFinite(currentUserId) || currentUserId <= 0) {
      setRejectError("Your session is missing userId. Please login again.");
      return;
    }

    try {
      setRejectSubmitting(true);
      setRejectError("");
      await updateTicketStatus(rejectTicketId, "REJECTED", reason);

      setTickets((prev) =>
        prev.map((t) => (t.id === rejectTicketId ? { ...t, status: "REJECTED", rejectionReason: reason } : t))
      );

      showToast("success", "Ticket rejected.");
      closeRejectModal();
    } catch (e: unknown) {
      const msg = toErrorMessage(e) || "Failed to reject ticket";
      setRejectError(msg);
      showToast("error", msg);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const assignStaffForTicket = async (ticketId: number) => {
    const selected = assignments[ticketId];
    if (!selected) return;
    try {
      await assignStaff(ticketId, Number(selected));
      await loadData();
    } catch (e: unknown) {
      setError(toErrorMessage(e) || "Failed to assign staff");
    }
  };

  const saveResolutionNotes = async (ticketId: number) => {
    const value = notes[ticketId]?.trim();
    if (!value) {
      setError("Resolution notes cannot be empty.");
      return;
    }
    try {
      await addResolutionNotes(ticketId, value);
      await loadData();
    } catch (e: unknown) {
      setError(toErrorMessage(e) || "Failed to save resolution notes");
    }
  };

  const downloadReport = async () => {
    if (!isIssueManager) return;
    try {
      setReportLoading(true);
      setReportError("");
      await downloadTicketReport({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: statusFilter,
        priority: priorityFilter,
        assignedTo: assignedToFilter,
        search: query,
      });
      showToast("success", "Report download started.");
    } catch (e: unknown) {
      const msg = toErrorMessage(e) || "Failed to download report";
      setReportError(msg);
      showToast("error", msg);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <header className="bg-[#002147] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-xl font-bold">Northbridge University</h1>
              <p className="text-xs text-slate-300">Issue Manager Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-white/30 bg-white/10">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Manager" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {(userName || "M").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm">Welcome, {userName}</span>
            <button
              onClick={openProfileModal}
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Profile
            </button>
            <button onClick={handleLogout} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Issue Manager</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Issue Dashboard</h2>
          </div>
          <AnalyticsNavButton onClick={() => navigate("/manager/analytics")} />
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed right-4 top-6 z-80 w-[calc(100%-2rem)] max-w-sm">
            <div
              className={`rounded-xl border px-4 py-3 shadow-lg ${
                toast.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{toast.message}</p>
                <button className="rounded-md p-1 hover:bg-black/5" onClick={() => setToast(null)} aria-label="Close notification">
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

<div className="mb-8 grid gap-3 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-7">

  {/* Total */}
  <div className="rounded-xl bg-gradient-to-r from-[#0B1F3A] to-[#112E57] px-3 py-3 text-white shadow">
    <p className="text-[15px] opacity-80">Total</p>
    <h3 className="text-1xl font-bold">{stats.total}</h3>
  </div>

  {/* Open */}
  <div className="rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-3 py-3 text-white shadow">
    <p className="text-[15px] opacity-80">Open</p>
    <h3 className="text-1xl font-bold">{stats.open}</h3>
  </div>

  {/* In Progress */}
  <div className="rounded-xl bg-gradient-to-r from-[#1e40af] to-[#3B82F6] px-3 py-3 text-white shadow">
    <p className="text-[15px] opacity-80">In Progress</p>
    <h3 className="text-1xl font-bold">{stats.inProgress}</h3>
  </div>

  {/* Completed */}
  <div className="rounded-xl bg-gradient-to-r from-[#0E7490] to-[#0284C7] px-3 py-3 text-white shadow">
    <p className="text-[15px] opacity-80">Completed</p>
    <h3 className="text-1xl font-bold">{stats.completedByStaff}</h3>
  </div>

  {/* Resolved */}
  <div className="rounded-xl bg-gradient-to-r from-[#065F46] to-[#059669] px-3 py-3 text-white shadow">
    <p className="text-[15px] opacity-80">Resolved</p>
    <h3 className="text-1xl font-bold">{stats.resolved}</h3>
  </div>

  {/* Rejected */}
  <div className="rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#DC2626] px-3 py-3 text-white shadow">
    <p className="text-[15px] opacity-80">Rejected</p>
    <h3 className="text-1xl font-bold">{stats.rejected}</h3>
  </div>

  {/* Closed */}
  <div className="rounded-xl bg-gradient-to-r from-[#1F2937] to-[#374151] px-3 py-3 text-white shadow">
    <p className="text-[15px] opacity-80">Closed</p>
    <h3 className="text-1xl font-bold">{stats.closed}</h3>
  </div>

</div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search tickets..."
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-400"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-400"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED_BY_STAFF">Completed by Staff</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={loadData}
            className="rounded-xl bg-[#002147] px-4 py-2 text-white shadow-md transition hover:bg-[#001733] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#002147]/50"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-6">
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">From</p>
            <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} type="date" className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">To</p>
            <input value={toDate} onChange={(e) => setToDate(e.target.value)} type="date" className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Priority</p>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="ALL">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Assigned staff</p>
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="ALL">Any</option>
              {staff.map((member) => (
                <option key={member.id} value={String(member.id)}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-white p-4 shadow md:col-span-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Ticket History Report</p>
            {!isIssueManager ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Report download is available only for Issue Managers.
              </div>
            ) : (
              <div className="flex flex-col gap-2 md:flex-row">
                <button
                  onClick={downloadReport}
                  disabled={reportLoading}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reportLoading ? "Generating..." : "Download Report (PDF)"}
                </button>
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setPriorityFilter("ALL");
                    setAssignedToFilter("ALL");
                    setStatusFilter("ALL");
                    setQuery("");
                    setReportError("");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </div>
            )}
            {reportError && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{reportError}</div>}
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-6 shadow">Loading tickets...</div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl bg-white/90 p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Completed Tasks</p>
                  <h3 className="text-xl font-bold text-slate-900">Awaiting manager review</h3>
                </div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">
                  {completedTickets.length} completed
                </span>
              </div>

              {completedTickets.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No helper-completed tasks have arrived yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {completedTickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">Ticket #{ticket.id} — {ticket.category}</p>
                          <p className="text-sm text-slate-600">{ticket.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
                            Completed
                          </span>
                          <button
                            onClick={() => closeCompletedTicket(ticket.id)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            Close Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white/90 p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current Tickets</p>
                  <h3 className="text-xl font-bold text-slate-900">Active ticket queue</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {filteredTickets.filter((ticket) => ticket.status !== "COMPLETED_BY_STAFF").length} active
                </span>
              </div>

              {filteredTickets.filter((ticket) => ticket.status !== "COMPLETED_BY_STAFF").length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  {filteredTickets.length === 0 ? "No tickets found." : "No active tickets match the current filters."}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.filter((ticket) => ticket.status !== "COMPLETED_BY_STAFF").map((ticket) => (
                    <div key={ticket.id} className="rounded-2xl bg-white/90 backdrop-blur p-6 shadow-md hover:shadow-xl transition">
                      {ticket.status === "REJECTED" && (
                        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          This ticket has been rejected. Further actions are disabled.
                        </div>
                      )}
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#002147]">
                            Ticket #{ticket.id} - {ticket.category}
                          </p>
                          <p className="text-sm text-slate-600">
                            Reported by: {ticket.createdByName} | Priority: {ticket.priority}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold text-white
                            ${
                              ticket.status === "OPEN" ? "bg-blue-500" :
                              ticket.status === "IN_PROGRESS" ? "bg-yellow-500" :
                              ticket.status === "RESOLVED" ? "bg-green-500" :
                              ticket.status === "COMPLETED_BY_STAFF" ? "bg-cyan-500" :
                              ticket.status === "CLOSED" ? "bg-gray-600" :
                              ticket.status === "REJECTED" ? "bg-red-500" :
                              "bg-slate-400"
                            }
                          `}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <p className="mb-3 text-sm text-slate-700">{ticket.description}</p>
                      <p className="mb-3 text-xs text-slate-500">Created: {new Date(ticket.createdAt).toLocaleString()}</p>

                      <div className="mb-3">
                        {(() => {
                          if (ticket.status === "REJECTED" || ticket.status === "CLOSED") {
                            return (
                              <div className="rounded border bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                No further status action available.
                              </div>
                            );
                          }
                          if (ticket.status === "COMPLETED_BY_STAFF") {
                            return (
                              <button
                                onClick={() => {
                                  const ok = window.confirm("Close this ticket? This action cannot be undone.");
                                  if (!ok) return;
                                  void closeCompletedTicket(ticket.id);
                                }}
                                className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                              >
                                Review & Close
                              </button>
                            );
                          }
                          const next = getNextManagerStatus(ticket.status);
                          if (!next) {
                            return <div className="rounded border bg-slate-50 px-3 py-2 text-sm text-slate-600">No further status action available.</div>;
                          }
                          const label =
                            next === "IN_PROGRESS" ? "Set In Progress" : next === "RESOLVED" ? "Set Resolved" : "Set Closed";
                          return (
                            <button
                              onClick={() => updateStatusForTicket(ticket.id, next)}
                              className="w-full rounded-xl bg-indigo-50 text-indigo-700 font-semibold px-3 py-2 hover:bg-indigo-100 transition"
                              disabled={ticket.status === "REJECTED"}
                            >
                              {label}
                            </button>
                          );
                        })()}
                      </div>

                      {isIssueManager && ticket.status !== "REJECTED" && ticket.status !== "CLOSED" && (
                        <div className="mb-3">
                          <button
                            onClick={() => openRejectModal(ticket.id)}
                            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Reject Ticket
                          </button>
                        </div>
                      )}

                      <div className="mb-3 grid gap-2 md:grid-cols-2">
                        <textarea
                          placeholder="Resolution notes"
                          value={notes[ticket.id] || ticket.resolutionNotes || ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                          className="min-h-[80px] rounded border px-3 py-2"
                          disabled={ticket.status === "REJECTED" || ticket.status === "CLOSED"}
                        />
                        <button
                          onClick={() => saveResolutionNotes(ticket.id)}
                          className="rounded bg-green-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={ticket.status === "REJECTED" || ticket.status === "CLOSED"}
                        >
                          Save Resolution Notes
                        </button>
                      </div>

                      <div className="grid gap-2 md:grid-cols-3">
                        <select
                          value={assignments[ticket.id] || ""}
                          onChange={(e) => setAssignments((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                          className="rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                          disabled={ticket.status === "REJECTED" || ticket.status === "CLOSED"}
                        >
                          <option value="">Assign staff member</option>
                          {staff.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.role})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignStaffForTicket(ticket.id)}
                          className="rounded bg-[#002147] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={ticket.status === "REJECTED" || ticket.status === "CLOSED"}
                        >
                          Assign
                        </button>
                        <div className="rounded border px-3 py-2 text-sm">
                          Current: {ticket.assignedToName ? `${ticket.assignedToName} (${ticket.assignedToRole})` : "Unassigned"}
                        </div>
                      </div>

                      <div className="mt-3">
                        <button
                          onClick={() => navigate(`/ticket/${ticket.id}`)}
                          className="rounded border border-[#002147] px-3 py-2 text-sm font-semibold text-[#002147]"
                        >
                          View comments
                        </button>
                      </div>

                      {ticket.rejectionReason && (
                        <p className="mt-3 rounded bg-yellow-100 p-2 text-sm text-yellow-800">Rejection reason: {ticket.rejectionReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      <RejectTicketModal
        open={rejectOpen}
        ticketId={rejectTicketId}
        reason={rejectReason}
        error={rejectError}
        submitting={rejectSubmitting}
        onClose={closeRejectModal}
        onSubmit={submitReject}
        onReasonChange={(value) => {
          setRejectReason(value);
          setRejectError("");
        }}
      />

      {showProfileModal && (
        <div className="fixed inset-0 z-75 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Manager Profile</h3>
              <p className="mt-1 text-sm text-slate-500">Update your profile picture</p>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm">
              {profileError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {profileError}
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
                      {(userName || "M").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Role</p>
                  <p className="font-semibold text-slate-700">Issue Manager</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Profile Picture</label>
                <input type="file" accept="image/*" onChange={handleProfileFileChange} className="block w-full text-sm text-slate-600" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Name</label>
                <input
                  type="text"
                  value={userName}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                  disabled
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                  disabled
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={saveProfileImage}
                  disabled={profileSaving}
                  className="rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white hover:bg-[#001733] disabled:opacity-60"
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default IssueDashboard;
