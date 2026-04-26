import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { completeTicket, getMyTickets } from "../../../services/ticketService";
import { Plus, Filter, Search, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Ticket {
  id: number;
  category: string;
  status: string;
  priority: string;
  description: string;
  resourceId: string;
  preferredContact: string;
  createdAt: string;
  assignedToName?: string;
  assignedToRole?: string;
  assignedToId?: number;
}

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [completingTicketId, setCompletingTicketId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  useEffect(() => {
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("id");

    if (!role || !["STUDENT", "LECTURER", "TECHNICIAN", "CLEANER", "SECURITY", "STAFF"].includes(role) || !id) {
      navigate("/client/login");
      return;
    }

    const loadTickets = async () => {
      try {
        setLoading(true);
        const res = await getMyTickets();
        setTickets(res.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load tickets");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [navigate]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toString().includes(searchTerm);

      const matchesStatus = filterStatus === "ALL" || ticket.status === filterStatus;
      const matchesPriority = filterPriority === "ALL" || ticket.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, filterStatus, filterPriority]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN" || t.status === "PENDING").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED" || t.status === "COMPLETED_BY_STAFF").length,
    };
  }, [tickets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED_BY_STAFF":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "OPEN":
        return <AlertCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      case "COMPLETED_BY_STAFF":
        return <CheckCircle2 className="w-4 h-4" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-4 h-4" />;
      case "CLOSED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-50 border-l-4 border-red-500";
      case "MEDIUM":
        return "bg-yellow-50 border-l-4 border-yellow-500";
      case "LOW":
        return "bg-blue-50 border-l-4 border-blue-500";
      default:
        return "bg-slate-50 border-l-4 border-slate-500";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const role = (localStorage.getItem("role") || "").toUpperCase();
  const isStaffRole = role === "STAFF" || ["TECHNICIAN", "CLEANER", "SECURITY"].includes(role);
  const currentUserId = Number(localStorage.getItem("id") || "0");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  };

  const canCompleteTicket = (ticket: Ticket) => {
    if (!isStaffRole) return false;
    if (!Number.isFinite(currentUserId) || currentUserId <= 0) return false;
    if (ticket.assignedToId == null) return false;
    if (Number(ticket.assignedToId) !== currentUserId) return false;
    return ticket.status === "IN_PROGRESS" || ticket.status === "RESOLVED";
  };

  const handleComplete = async (ticketId: number) => {
    try {
      console.log("[MyTickets] Mark as Completed clicked", { ticketId, role, currentUserId });
      setCompletingTicketId(ticketId);
      await completeTicket(ticketId);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: "COMPLETED_BY_STAFF" } : t)));
      showToast("success", "Ticket marked as completed. Waiting for manager review.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || "Failed to complete ticket";
      showToast("error", String(msg));
    } finally {
      setCompletingTicketId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Header />

      <main className="grow mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
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

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#002147] mb-2">Issue Reporting & Tracking</h1>
          <p className="text-slate-600">
            {isStaffRole
              ? "View and track tickets assigned to you by the issue manager."
              : "Create incident tickets, track their status, and manage maintenance requests for campus resources."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total Tickets</p>
            <h3 className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Open</p>
            <h3 className="mt-2 text-3xl font-bold text-red-600">{stats.open}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">In Progress</p>
            <h3 className="mt-2 text-3xl font-bold text-blue-600">{stats.inProgress}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-widest text-green-600">Resolved</p>
            <h3 className="mt-2 text-3xl font-bold text-green-600">{stats.resolved}</h3>
          </div>
        </div>

        {/* Action Button and Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {!isStaffRole && (
              <button
                onClick={() => navigate("/create-ticket")}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#002147] px-6 py-3 text-white font-semibold hover:bg-[#001733] transition-colors shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                Create New Ticket
              </button>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
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

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
              >
                <option value="ALL">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tickets List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">Loading tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-lg">No tickets found</p>
              <p className="text-slate-400 text-sm mt-1">
                {searchTerm || filterStatus !== "ALL" || filterPriority !== "ALL"
                  ? "Try adjusting your filters"
                  : "Create your first ticket to report an issue"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/ticket/${ticket.id}`)}
                  className={`p-6 hover:bg-slate-50 cursor-pointer transition-colors ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          Ticket #{ticket.id}
                        </span>
                        <span
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace("_", " ")}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeColor(ticket.priority)}`}>
                          {ticket.priority} Priority
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{ticket.category}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Resource ID: {ticket.resourceId}</span>
                        {ticket.assignedToName && (
                          <>
                            <span>•</span>
                            <span>
                              Assigned: {ticket.assignedToName} ({ticket.assignedToRole || "STAFF"})
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 md:ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ticket/${ticket.id}`);
                        }}
                        className="rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white hover:bg-[#001733] transition-colors"
                      >
                        View Details
                      </button>
                      {canCompleteTicket(ticket) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleComplete(ticket.id);
                          }}
                          disabled={completingTicketId === ticket.id}
                          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {completingTicketId === ticket.id ? "Marking..." : "Mark as Completed"}
                        </button>
                      )}
                    </div>
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