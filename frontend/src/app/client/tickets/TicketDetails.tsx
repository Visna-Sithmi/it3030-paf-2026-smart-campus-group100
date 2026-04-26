import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { completeTicket, getTicketById, addComment, updateComment, deleteComment } from "../../../services/ticketService";
import { ArrowLeft, MessageCircle, AlertCircle, CheckCircle2, Clock, Send } from "lucide-react";

interface Ticket {
  id: number;
  category: string;
  description: string;
  status: string;
  priority: string;
  resourceId?: string | number;
  resourceName?: string;
  createdByName?: string;
  assignedToName?: string;
  assignedToId?: number;
  assignedToRole?: string;
  preferredContact?: string;
  createdAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  completedAt?: string;
  closedAt?: string;
  resolvedBy?: number;
  responseBreached: boolean;
  resolutionBreached: boolean;
  rejectionReason?: string;
  resolutionNotes?: string;
  attachmentUrls?: string[];
  comments?: Array<{
    id: number;
    userId?: number;
    commentText: string;
    userName: string;
    userRole?: string;
    createdAt: string;
  }>;
}

/** Formats API dates (ISO strings or legacy array-shaped LocalDateTime JSON). */
function formatDateTime(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value as number[];
    const date = new Date(y, m - 1, d, h, min, s);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
  }
  return "";
}

function parseApiDate(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value as number[];
    const date = new Date(y, m - 1, d, h, min, s);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function formatDurationShort(ms: number): string {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getSlaStatus(ticket: Pick<Ticket, "responseBreached" | "resolutionBreached">) {
  if (ticket.resolutionBreached) return { label: "SLA Breached", tone: "red" as const };
  if (ticket.responseBreached) return { label: "Near Breach", tone: "yellow" as const };
  return { label: "Within SLA", tone: "green" as const };
}

function getSlaBadgeClasses(tone: "green" | "yellow" | "red") {
  switch (tone) {
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
    case "yellow":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-green-100 text-green-800 border-green-200";
  }
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [commentActionLoading, setCommentActionLoading] = useState<number | null>(null);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const currentRole = (localStorage.getItem("role") || "").toUpperCase();
  const currentUserId = Number(localStorage.getItem("id") || "0");
  const isIssueManager = currentRole === "ISSUE_MANAGER";
  const isStaffRole = currentRole === "STAFF" || ["TECHNICIAN", "CLEANER", "SECURITY"].includes(currentRole);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadTicket = useCallback(async () => {
    const res = await getTicketById(Number(id));
    const ticketData = (res.data || {}) as any;
    setTicket({
      ...ticketData,
      resourceId:
        ticketData.resourceId != null && ticketData.resourceId !== ""
          ? String(ticketData.resourceId)
          : undefined,
      preferredContact: String(ticketData.preferredContact || ""),
      createdAt: String(ticketData.createdAt || ""),
      assignedAt: ticketData.assignedAt ? String(ticketData.assignedAt) : undefined,
      resolvedAt: ticketData.resolvedAt ? String(ticketData.resolvedAt) : undefined,
      completedAt: ticketData.completedAt ? String(ticketData.completedAt) : undefined,
      closedAt: ticketData.closedAt ? String(ticketData.closedAt) : undefined,
      responseBreached: Boolean(ticketData.responseBreached),
      resolutionBreached: Boolean(ticketData.resolutionBreached),
    });
  }, [id]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const userIdLocal = localStorage.getItem("id");

    if (
      !role ||
      !["STUDENT", "LECTURER", "TECHNICIAN", "CLEANER", "SECURITY", "STAFF", "ISSUE_MANAGER"].includes(role) ||
      !userIdLocal
    ) {
      navigate(role === "ISSUE_MANAGER" ? "/manager/login" : "/client/login");
      return;
    }

    if (!id) {
      setError("Invalid ticket ID");
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        setError("");
        await loadTicket();
      } catch (err: any) {
        const errorMessage =
          err?.response?.status === 404
            ? "Ticket not found"
            : err?.response?.data?.message || err?.message || "Failed to load ticket details";
        setError(errorMessage);
        console.error("Error loading ticket:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, navigate, loadTicket]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleAddComment = useCallback(async () => {
    // Validation
    if (!comment || !comment.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }

    if (comment.trim().length < 2) {
      setCommentError("Comment must be at least 2 characters");
      return;
    }

    if (comment.trim().length > 2000) {
      setCommentError("Comment cannot exceed 2000 characters");
      return;
    }

    try {
      setCommentLoading(true);
      setCommentError("");
      setCommentSuccess("");
      
      // Add comment to ticket
      await addComment(Number(id), comment.trim());

      // Reload ticket to get updated comments
      try {
        await loadTicket();
        setComment("");
        setCommentSuccess("Comment posted successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setCommentSuccess("");
        }, 3000);
      } catch (reloadErr: any) {
        // If reload fails, still show success but log error
        console.error("Failed to reload ticket after comment:", reloadErr);
        setComment("");
        setCommentSuccess("Comment posted! (refresh to see updates)");
        setTimeout(() => {
          setCommentSuccess("");
        }, 3000);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add comment";
      setCommentError(errorMessage);
      console.error("Error adding comment:", err);
    } finally {
      setCommentLoading(false);
    }
  }, [comment, id, loadTicket]);

  const canManageComment = (commentUserId?: number, commentUserRole?: string) => {
    if (isIssueManager) return false;
    return (
      Number.isFinite(currentUserId) &&
      currentUserId > 0 &&
      currentUserId === Number(commentUserId || 0) &&
      currentRole === String(commentUserRole || "").toUpperCase()
    );
  };

  const startEditComment = (commentId: number, text: string) => {
    setEditingCommentId(commentId);
    setEditingText(text);
    setCommentError("");
    setCommentSuccess("");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleUpdateComment = async (commentId: number) => {
    const trimmed = editingText.trim();
    if (trimmed.length < 2) {
      setCommentError("Comment must be at least 2 characters");
      return;
    }
    if (trimmed.length > 2000) {
      setCommentError("Comment cannot exceed 2000 characters");
      return;
    }

    try {
      setCommentActionLoading(commentId);
      setCommentError("");
      await updateComment(commentId, trimmed);
      await loadTicket();
      setCommentSuccess("Comment updated successfully.");
      cancelEditComment();
    } catch (err: any) {
      setCommentError(err?.response?.data?.message || err?.message || "Failed to update comment");
    } finally {
      setCommentActionLoading(null);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      setCommentActionLoading(commentId);
      setCommentError("");
      await deleteComment(commentId);
      await loadTicket();
      setCommentSuccess("Comment deleted successfully.");
      if (editingCommentId === commentId) {
        cancelEditComment();
      }
    } catch (err: any) {
      setCommentError(err?.response?.data?.message || err?.message || "Failed to delete comment");
    } finally {
      setCommentActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-slate-100 text-slate-700 border border-slate-200";

      case "OPEN":
        return "bg-red-50 text-red-600 border border-red-200";

      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-600 border border-blue-200";

      case "COMPLETED_BY_STAFF":
        return "bg-orange-50 text-orange-600 border border-orange-200";

      case "RESOLVED":
        return "bg-green-50 text-green-600 border border-green-200";

      case "CLOSED":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";

      case "REJECTED":
        return "bg-rose-50 text-rose-600 border border-rose-200";

      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5" />;
      case "OPEN":
        return <AlertCircle className="w-5 h-5" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5" />;
      case "COMPLETED_BY_STAFF":
        return <CheckCircle2 className="w-5 h-5" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-5 h-5" />;
      case "CLOSED":
        return <CheckCircle2 className="w-5 h-5" />;
      case "REJECTED":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600 bg-red-50";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50";
      case "LOW":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  const sla = ticket ? getSlaStatus(ticket) : { label: "Within SLA", tone: "green" as const };
  const createdAtDate = ticket ? parseApiDate(ticket.createdAt) : null;
  const resolvedAtDate = ticket?.resolvedAt ? parseApiDate(ticket.resolvedAt) : null;
  const elapsedMs =
    createdAtDate == null
      ? null
      : (resolvedAtDate ? resolvedAtDate.getTime() : now) - createdAtDate.getTime();

  const canCompleteTicket = (t: Ticket | null) => {
    if (!t) return false;
    if (isIssueManager) return false;
    if (!isStaffRole) return false;
    if (!Number.isFinite(currentUserId) || currentUserId <= 0) return false;
    if (t.assignedToId == null) return false;
    if (Number(t.assignedToId) !== currentUserId) return false;
    return t.status === "IN_PROGRESS" || t.status === "RESOLVED";
  };

  const handleComplete = async (ticketId: number) => {
    try {
      console.log("[TicketDetails] Mark as Completed clicked", { ticketId, currentRole, currentUserId });
      setCompleteLoading(true);
      await completeTicket(ticketId);
      setTicket((prev) => (prev ? { ...prev, status: "COMPLETED_BY_STAFF" } : prev));
      showToast("success", "Ticket marked as completed. Waiting for manager review.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data || e?.message || "Failed to complete ticket";
      showToast("error", String(msg));
    } finally {
      setCompleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Header />
        <main className="grow flex items-center justify-center pt-32">
          <p className="text-slate-500">Loading ticket details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Header />
        <main className="grow flex items-center justify-center pt-32">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <p className="text-red-600 text-lg">{error || "Ticket not found"}</p>
            <button
              onClick={() => navigate("/my-tickets")}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002147] text-white font-semibold hover:bg-[#001733]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tickets
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex flex-col">
      <Header />

      <main className="grow mx-auto w-full max-w-5xl px-4 pb-16 pt-32">

        {/* Back */}
        <button
          onClick={() => navigate(isIssueManager ? "/manager/issue/dashboard" : "/my-tickets")}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-[#002147] transition font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tickets
        </button>

        {/* 🔥 HEADER CARD (PREMIUM) */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#002147]/10 via-white/70 to-blue-100/40 backdrop-blur-xl border border-white/40 shadow-xl p-8 mb-8 overflow-hidden">

          {/* Glow layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#002147]/20 via-transparent to-blue-300/20 pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative flex flex-col md:flex-row justify-between gap-6">

            {/* LEFT */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">

                <span className="text-xs px-3 py-1 bg-slate-200 rounded-full font-mono">
                  #{ticket.id}
                </span>

                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold shadow-sm flex items-center gap-1 ${getStatusColor(ticket.status)}`}
                >
                  {getStatusIcon(ticket.status)}
                  {ticket.status.replace(/_/g, " ")}
                </span>

                <span className={`px-3 py-1 text-xs rounded-full border font-semibold ${getSlaBadgeClasses(sla.tone)}`}>
                  {sla.label}
                </span>

              </div>

              {/* Gradient Title */}
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#002147] to-blue-700 bg-clip-text text-transparent">
                {ticket.category}
              </h1>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-end gap-3">

              <div className={`px-4 py-2 rounded-xl text-sm font-semibold shadow ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority} Priority
              </div>

              {canCompleteTicket(ticket) && (
                <button
                  onClick={() => void handleComplete(ticket.id)}
                  disabled={completeLoading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
                >
                  {completeLoading ? "Marking..." : "Mark Completed"}
                </button>
              )}
            </div>
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-400">Resource</p>
              <p className="font-semibold text-slate-800">{ticket.resourceId || "N/A"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Category</p>
              <p className="font-semibold text-slate-800">{ticket.category}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Created</p>
              <p className="font-semibold text-slate-800">{formatDateTime(ticket.createdAt)}</p>
              <p className="text-xs text-blue-500">
                {elapsedMs ? `⏱ ${formatDurationShort(elapsedMs)}` : ""}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Contact</p>
              <p className="font-semibold text-slate-800">{ticket.preferredContact || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="rounded-3xl bg-white/80 backdrop-blur border shadow-md p-8 mb-8 hover:shadow-lg transition">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Description</h2>
          <p className="text-slate-600 leading-relaxed">{ticket.description}</p>
        </div>

        {/* RESOLUTION */}
        {ticket.resolutionNotes && (
          <div className="rounded-3xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 p-8 mb-8 shadow-sm">
            <h2 className="font-bold text-green-800 mb-2">Resolution</h2>
            <p className="text-green-900">{ticket.resolutionNotes}</p>
          </div>
        )}

        {/* ATTACHMENTS */}
        console.log("TICKET FULL:", ticket);
        console.log("ATTACHMENTS:", ticket?.attachmentUrls);
        {(ticket.attachmentUrls ?? []).map((url, i) => {
          
          console.log("IMAGE URL:", url); 

          return (
            <div key={i} className="relative group rounded-xl overflow-hidden border">

              <img
                src={
                  url.startsWith("http")
                    ? url
                    : `http://localhost:8081${url}`
                }
                className="w-full h-40 object-cover rounded"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
            </div>
          );
        })}

        {/* COMMENTS */}
        <div className="rounded-3xl bg-white p-8 shadow-md">

          <h2 className="text-xl font-bold mb-6">
            Comments ({ticket.comments?.length || 0})
          </h2>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {ticket.comments?.map((c) => (
              <div key={c.id} className="flex gap-3">

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold">
                  {c.userName?.charAt(0)}
                </div>

                <div className="bg-slate-100 rounded-2xl px-4 py-3 shadow-sm w-full">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">{c.userName}</span>
                    <span>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 text-sm">{c.commentText}</p>
                </div>

              </div>
            ))}
          </div>

          {!isIssueManager && (
            <div className="mt-6 border-t pt-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment..."
                className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-blue-400 outline-none"
              />

              <button
                onClick={handleAddComment}
                disabled={commentLoading}
                className="mt-3 w-full bg-gradient-to-r from-[#002147] to-blue-900 text-white py-2 rounded-xl font-semibold shadow hover:scale-[1.02] transition"
              >
                {commentLoading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}