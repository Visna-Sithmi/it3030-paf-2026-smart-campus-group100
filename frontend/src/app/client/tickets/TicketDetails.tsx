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
        <div className="relative rounded-3xl bg-gradient-to-br from-[#001833] via-[#002147] to-[#003366] text-white shadow-xl p-8 mb-8 overflow-hidden">

          {/* Glow layers */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/20 blur-3xl rounded-full" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative flex flex-col md:flex-row justify-between gap-6">

            {/* LEFT */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">

                <span className="text-xs px-3 py-1 bg-white/10 text-white rounded-full font-mono border border-white/20 backdrop-blur">
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
              <h1 className="text-3xl font-extrabold text-white">
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
          {/* INFO GRID (UPDATED PREMIUM STYLE) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-white/20 text-white">

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur">
                <span className="text-lg">🖥️</span>
              </div>
              <div>
                <p className="text-xs text-white/60">Resource</p>
                <p className="font-semibold">{ticket.resourceId || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <span className="text-lg">📂</span>
              </div>
              <div>
                <p className="text-xs text-white/60">Category</p>
                <p className="font-semibold">{ticket.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="text-xs text-white/60">Created</p>
                <p className="font-semibold">{formatDateTime(ticket.createdAt)}</p>
                <p className="text-xs text-blue-300">
                  {elapsedMs ? `⏱ ${formatDurationShort(elapsedMs)}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <span className="text-lg">📞</span>
              </div>
              <div>
                <p className="text-xs text-white/60">Contact</p>
                <p className="font-semibold">{ticket.preferredContact || "N/A"}</p>
              </div>
            </div>

          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="rounded-2xl bg-white shadow-sm border p-6 mb-6 flex gap-4 items-start">

          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            📄
          </div>

          <div>
            <h2 className="font-semibold text-slate-800 mb-1">Description</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {ticket.description}
            </p>
          </div>

        </div>

        {/* RESOLUTION */}
        {ticket.resolutionNotes && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 mb-6 flex gap-4 items-start">

            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              ✔
            </div>

            <div>
              <h2 className="font-semibold text-green-800 mb-1">Resolution</h2>
              <p className="text-green-700 text-sm">
                {ticket.resolutionNotes}
              </p>
            </div>

          </div>
        )}
        
        {ticket.status === "REJECTED" && ticket.rejectionReason && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 p-5 shadow-sm mb-6">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border border-red-200">
                <span className="text-red-600 text-sm">✖</span>
              </div>

              <div>
                <p className="text-sm font-semibold text-red-600">
                  Ticket Rejected
                </p>
                <p className="text-xs text-gray-500">
                  This request was not approved
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-white/70 border border-red-100 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Reason</p>
              <p className="text-sm text-gray-800 font-medium leading-relaxed">
                {ticket.rejectionReason}
              </p>
            </div>

          </div>
        )}

        {/* ATTACHMENTS */}
        {(ticket.attachmentUrls ?? []).length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm border p-6 mb-6">

            <h2 className="font-semibold mb-4">Attachments ({ticket.attachmentUrls?.length})</h2>

            <div className="space-y-4">
              {ticket.attachmentUrls?.map((url, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-xl hover:bg-slate-50 transition">

                  <img
                    src={url.startsWith("http") ? url : `http://localhost:8081${url}`}
                    className="w-28 h-16 object-cover rounded-lg border"
                  />

                  <div className="flex-1">
                    <p className="font-medium text-sm">Attachment {i + 1}</p>
                    <p className="text-xs text-slate-500">Click to preview</p>
                  </div>

                  <a
                    href={url.startsWith("http") ? url : `http://localhost:8081${url}`}
                    download
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm"
                  >
                    ⬇
                  </a>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* COMMENTS */}
<div className="rounded-2xl bg-white shadow-sm border p-6">

  <h2 className="font-semibold mb-4">
    Comments ({ticket.comments?.length || 0})
  </h2>

  <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
    {ticket.comments?.map((c) => {
      const isOwner =
        Number(c.userId) === currentUserId &&
        (c.userRole || "").toUpperCase() === currentRole;

      return (
        <div key={c.id} className="flex gap-3">

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {c.userName?.charAt(0)}
          </div>

          {/* Comment box */}
          <div className="flex-1 bg-slate-100 rounded-xl px-4 py-3">

            {/* Header */}
            <div className="flex justify-between text-xs text-slate-500 mb-1">

              <span className="font-semibold text-slate-700">
                {c.userName}
              </span>

              <div className="flex items-center gap-2">

                <span>{formatDateTime(c.createdAt)}</span>

                {/* 🔥 Edit/Delete buttons (only owner) */}
                {isOwner && editingCommentId !== c.id && (
                  <>
                    <button
                      onClick={() => startEditComment(c.id, c.commentText)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={commentActionLoading === c.id}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 🔥 Edit Mode */}
            {editingCommentId === c.id ? (
              <div className="space-y-2">

                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateComment(c.id)}
                    disabled={commentActionLoading === c.id}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs"
                  >
                    Save
                  </button>

                  <button
                    onClick={cancelEditComment}
                    className="px-3 py-1 bg-gray-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            ) : (
              <p className="text-sm text-slate-700">
                {c.commentText}
              </p>
            )}

          </div>
        </div>
      );
    })}
  </div>

  {/* ADD COMMENT */}
  {!isIssueManager && (
    <div className="flex gap-3">

      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault(); // 🔥 prevent duplicate issue
        }}
        placeholder="Type your comment..."
        className="flex-1 border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
      />

      <button
        onClick={handleAddComment}
        disabled={commentLoading || editingCommentId !== null} // 🔥 block when editing
        className="bg-[#002147] text-white px-5 rounded-xl font-medium hover:bg-[#001733]"
      >
        {commentLoading ? "..." : "Send"}
      </button>

    </div>
  )}

</div>

      </main>

      <Footer />
    </div>
  );
}