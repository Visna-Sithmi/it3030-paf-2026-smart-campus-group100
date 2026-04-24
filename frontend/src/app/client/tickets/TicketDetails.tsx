import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { getTicketById, addComment } from "../../../services/ticketService";
import { ArrowLeft, MessageCircle, AlertCircle, CheckCircle2, Clock, Send } from "lucide-react";

interface Ticket {
  id: number;
  category: string;
  description: string;
  status: string;
  priority: string;
  resourceId: string;
  resourceName?: string;
  createdByName?: string;
  assignedToName?: string;
  preferredContact: string;
  createdAt: string;
  rejectionReason?: string;
  resolutionNotes?: string;
  attachmentUrls?: string[];
  comments?: Array<{
    id: number;
    commentText: string;
    userName: string;
    createdAt: string;
  }>;
}


export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    const userIdLocal = localStorage.getItem("id");

    if (!role || !["STUDENT", "LECTURER"].includes(role) || !userIdLocal) {
      navigate("/client/login");
      return;
    }

    if (!id) {
      setError("Invalid ticket ID");
      return;
    }

    const loadTicket = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getTicketById(Number(id));
        
        if (!res.data) {
          setError("No ticket data received from server");
          return;
        }
        
        const ticketData = res.data;
        setTicket({
          ...ticketData,
          resourceId: String(ticketData.resourceId || ""),
          preferredContact: ticketData.preferredContact || "",
          createdAt: ticketData.createdAt || "",
        });
      } catch (err: any) {
        const errorMessage = 
          err?.response?.status === 404 ? "Ticket not found" :
          err?.response?.data?.message || 
          err?.message ||
          "Failed to load ticket details";
        setError(errorMessage);
        console.error("Error loading ticket:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id, navigate]);

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
        const res = await getTicketById(Number(id));
        const ticketData = res.data;
        setTicket({
          ...ticketData,
          resourceId: String(ticketData.resourceId || ""),
          preferredContact: ticketData.preferredContact || "",
          createdAt: ticketData.createdAt || "",
        });
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
  }, [comment, id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-5 h-5" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-5 h-5" />;
      case "CLOSED":
        return <CheckCircle2 className="w-5 h-5" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-32">
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
        <main className="flex-grow flex items-center justify-center pt-32">
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header />

      <main className="flex-grow mx-auto w-full max-w-4xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/my-tickets")}
          className="mb-6 flex items-center gap-2 text-[#002147] font-semibold hover:text-[#001733] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to All Tickets
        </button>

        {/* Ticket Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm font-semibold text-slate-500">
                  Ticket #{ticket.id}
                </span>
                <span
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {getStatusIcon(ticket.status)}
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {ticket.category}
              </h1>
            </div>
            <div className={`rounded-lg px-4 py-2 text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority} Priority
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 pt-6 border-t border-slate-200">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                Resource ID
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {ticket.resourceId || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                Category
              </p>
              <p className="text-lg font-semibold text-slate-900">{ticket.category}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                Created Date
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {ticket.createdAt
                  ? new Date(ticket.createdAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                Contact
              </p>
              <p className="text-lg font-semibold text-slate-900 truncate">
                {ticket.preferredContact || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
          <p className="text-slate-700 leading-relaxed">{ticket.description}</p>
        </div>

        {/* Attachments Section */}
        {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Attachments ({ticket.attachmentUrls.length})
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {ticket.attachmentUrls.map((url, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 aspect-square"
                >
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Comments ({ticket.comments?.length || 0})
            </h2>
          </div>

          {/* Comments List */}
          {ticket.comments && ticket.comments.length > 0 ? (
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {ticket.comments.map((com) => (
                <div key={com.id} className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900">{com.userName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(com.createdAt).toLocaleDateString()} at{" "}
                      {new Date(com.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="text-slate-700">{com.commentText}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-6 mb-6">No comments yet</p>
          )}

          {/* Add Comment Form */}
          <div className="border-t border-slate-200 pt-6">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Add a Comment
            </label>
            <div className="flex flex-col gap-3">
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setCommentError("");
                }}
                placeholder="Share an update or question about this ticket... (min 2 characters)"
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
              />
              <div className="flex justify-between">
                <div />
                <p className="text-xs text-slate-500">
                  {comment.length}/2000 characters
                </p>
              </div>
              {commentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{commentError}</p>
                </div>
              )}
              {commentSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{commentSuccess}</p>
                </div>
              )}
              <button
                onClick={handleAddComment}
                disabled={commentLoading || !comment.trim() || comment.trim().length < 2}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#002147] px-6 py-2.5 text-white font-semibold hover:bg-[#001733] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {commentLoading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}