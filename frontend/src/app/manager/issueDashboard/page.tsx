import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.jpeg";
import { issueManagerProfileService } from "../../../services/issueManagerProfileService";
import {
  addResolutionNotes,
  assignStaff,
  getAllTickets,
  getAssignableStaff,
  updateTicketStatus,
} from "../../../services/ticketService";

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
};

type Staff = {
  id: number;
  name: string;
  role: string;
  email: string;
};

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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ticketsRes, staffRes] = await Promise.all([getAllTickets(), getAssignableStaff()]);
      setTickets(ticketsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (e: any) {
      setError(e?.response?.data || "Failed to load issue dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const image = localStorage.getItem("profileImageUrl");
    const role = localStorage.getItem("role");
    if (!name || role !== "ISSUE_MANAGER") {
      navigate("/manager/login");
      return;
    }
    setUserName(name);
    setUserEmail(email || "");
    setProfileImageUrl(image || "");
    loadData();
  }, [navigate]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
      closed: tickets.filter((t) => t.status === "CLOSED").length,
      rejected: tickets.filter((t) => t.status === "REJECTED").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const text = `${ticket.id} ${ticket.category} ${ticket.description} ${ticket.createdByName}`.toLowerCase();
      const searchOk = text.includes(query.toLowerCase());
      const statusOk = statusFilter === "ALL" || ticket.status === statusFilter;
      return searchOk && statusOk;
    });
  }, [tickets, query, statusFilter]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/manager/login");
  };

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setProfileError("");

    const idRaw = localStorage.getItem("id");
    const managerId = idRaw ? Number(idRaw) : 0;
    if (!managerId) return;

    try {
      const latestProfile = await issueManagerProfileService.getProfile(managerId);
      setUserName(latestProfile.name || "");
      setUserEmail(latestProfile.email || "");
      setProfileImageUrl(latestProfile.profileImageUrl || "");
      localStorage.setItem("name", latestProfile.name || "");
      localStorage.setItem("email", latestProfile.email || "");
      localStorage.setItem("profileImageUrl", latestProfile.profileImageUrl || "");
    } catch (e: any) {
      setProfileError(e?.response?.data?.message || e?.message || "Failed to load profile");
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
    const idRaw = localStorage.getItem("id");
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
      localStorage.setItem("name", updated.name || "");
      localStorage.setItem("email", updated.email || "");
      localStorage.setItem("profileImageUrl", updated.profileImageUrl || "");
      setShowProfileModal(false);
    } catch (e: any) {
      setProfileError(e?.response?.data?.message || e?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const updateStatusForTicket = async (ticketId: number, status: string) => {
    const reason = rejectReasons[ticketId]?.trim();
    if (status === "REJECTED" && !reason) {
      setError("Rejection reason is required to reject a ticket.");
      return;
    }
    try {
      await updateTicketStatus(ticketId, status, reason);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data || "Failed to update ticket status");
    }
  };

  const assignStaffForTicket = async (ticketId: number) => {
    const selected = assignments[ticketId];
    if (!selected) return;
    try {
      await assignStaff(ticketId, Number(selected));
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data || "Failed to assign staff");
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
    } catch (e: any) {
      setError(e?.response?.data || "Failed to save resolution notes");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6]">
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
        <div className="mb-6 grid gap-4 md:grid-cols-6">
          <div className="rounded-xl bg-white p-4 shadow">Total: {stats.total}</div>
          <div className="rounded-xl bg-white p-4 shadow">Open: {stats.open}</div>
          <div className="rounded-xl bg-white p-4 shadow">In Progress: {stats.inProgress}</div>
          <div className="rounded-xl bg-white p-4 shadow">Resolved: {stats.resolved}</div>
          <div className="rounded-xl bg-white p-4 shadow">Closed: {stats.closed}</div>
          <div className="rounded-xl bg-white p-4 shadow">Rejected: {stats.rejected}</div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticket id, category, description, reporter..."
            className="rounded-lg border px-3 py-2"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2">
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button onClick={loadData} className="rounded-lg bg-[#002147] px-4 py-2 text-white">
            Refresh
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-6 shadow">Loading tickets...</div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl bg-white p-5 shadow">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#002147]">
                      Ticket #{ticket.id} - {ticket.category}
                    </p>
                    <p className="text-sm text-slate-600">
                      Reported by: {ticket.createdByName} | Priority: {ticket.priority}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold">{ticket.status}</span>
                </div>

                <p className="mb-3 text-sm text-slate-700">{ticket.description}</p>
                <p className="mb-3 text-xs text-slate-500">Created: {new Date(ticket.createdAt).toLocaleString()}</p>

                <div className="mb-3 grid gap-2 md:grid-cols-3">
                  <button onClick={() => updateStatusForTicket(ticket.id, "IN_PROGRESS")} className="rounded border px-3 py-2">
                    Set In Progress
                  </button>
                  <button onClick={() => updateStatusForTicket(ticket.id, "RESOLVED")} className="rounded border px-3 py-2">
                    Set Resolved
                  </button>
                  <button onClick={() => updateStatusForTicket(ticket.id, "CLOSED")} className="rounded border px-3 py-2">
                    Set Closed
                  </button>
                </div>

                <div className="mb-3 grid gap-2 md:grid-cols-2">
                  <input
                    placeholder="Rejection reason (required for reject)"
                    value={rejectReasons[ticket.id] || ""}
                    onChange={(e) => setRejectReasons((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    className="rounded border px-3 py-2"
                  />
                  <button onClick={() => updateStatusForTicket(ticket.id, "REJECTED")} className="rounded bg-yellow-500 px-3 py-2 text-white">
                    Reject Ticket
                  </button>
                </div>

                <div className="mb-3 grid gap-2 md:grid-cols-2">
                  <textarea
                    placeholder="Resolution notes"
                    value={notes[ticket.id] || ticket.resolutionNotes || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    className="min-h-[80px] rounded border px-3 py-2"
                  />
                  <button onClick={() => saveResolutionNotes(ticket.id)} className="rounded bg-green-600 px-3 py-2 text-white">
                    Save Resolution Notes
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <select
                    value={assignments[ticket.id] || ""}
                    onChange={(e) => setAssignments((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    className="rounded border px-3 py-2"
                  >
                    <option value="">Assign staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                  <button onClick={() => assignStaffForTicket(ticket.id)} className="rounded bg-[#002147] px-3 py-2 text-white">
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
            {filteredTickets.length === 0 && <div className="rounded-xl bg-white p-6 shadow">No tickets found.</div>}
          </div>
        )}
      </main>

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