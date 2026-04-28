import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import HelperTaskCard from "../../../components/tickets/HelperTaskCard";
import { completeTicket, getMyTickets } from "../../../services/ticketService";
import { Plus, Search, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

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

  const canCompleteTicket = (ticket: Ticket) => {
    if (!isStaffRole) return false;
    if (!Number.isFinite(currentUserId) || currentUserId <= 0) return false;
    if (ticket.assignedToId == null) return false;
    if (Number(ticket.assignedToId) !== currentUserId) return false;
    return ["OPEN", "IN_PROGRESS", "RESOLVED"].includes(ticket.status);
  };

  const handleComplete = async (ticketId: number) => {
    try {
      setCompletingTicketId(ticketId);
      await completeTicket(ticketId);
      
      // Update local state to reflect the change
      setTickets((prev) => 
        prev.map((t) => 
          t.id === ticketId ? { ...t, status: "COMPLETED_BY_STAFF" } : t
        )
      );
      
      toast.success("Task marked as completed.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || 
                  err?.response?.data || 
                  err?.message || 
                  "Failed to complete ticket";
      toast.error(String(msg));
    } finally {
      setCompletingTicketId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Header />
      <Toaster position="top-right" />

      <main className="grow mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
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
                <HelperTaskCard
                  key={ticket.id}
                  ticket={ticket}
                  completing={completingTicketId === ticket.id}
                  canComplete={canCompleteTicket(ticket)}
                  onViewDetails={(ticketId) => navigate(`/ticket/${ticketId}`)}
                  onComplete={(ticketId) => void handleComplete(ticketId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}