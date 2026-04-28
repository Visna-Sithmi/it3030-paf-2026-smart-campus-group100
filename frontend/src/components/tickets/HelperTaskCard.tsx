// HelperTaskCard.tsx - The task card component with the "Mark as Completed" button
import { CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";

export interface HelperTaskCardProps {
  ticket: {
    id: number;
    category: string;
    description: string;
    status: string;
    priority: string;
    resourceId: string;
    assignedToName?: string;
    assignedToRole?: string;
  };
  completing: boolean;
  onViewDetails: (ticketId: number) => void;
  onComplete: (ticketId: number) => void;
  canComplete: boolean;
}

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

export default function HelperTaskCard({ ticket, completing, onViewDetails, onComplete, canComplete }: HelperTaskCardProps) {
  const getStatusLabel = (status: string) => {
    if (status === "COMPLETED_BY_STAFF") return "Completed";
    return status.replace(/_/g, " ");
  };

  return (
    <div
      className="p-6 hover:bg-slate-50 cursor-pointer transition-colors rounded-2xl border border-slate-200 bg-white"
      onClick={() => onViewDetails(ticket.id)}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-mono text-xs font-semibold text-slate-500">Ticket #{ticket.id}</span>
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              {getStatusLabel(ticket.status)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {ticket.priority || "UNKNOWN"} Priority
            </span>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-1">{ticket.category || "Untitled ticket"}</h3>
          <p className="text-sm text-slate-600 line-clamp-2">{ticket.description || "No description available."}</p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>Resource ID: {ticket.resourceId || "N/A"}</span>
            {ticket.assignedToName && (
              <>
                <span>•</span>
                <span>
                  Assigned: {ticket.assignedToName} ({ticket.assignedToRole || "STAFF"})
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 md:ml-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(ticket.id);
            }}
            className="rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white hover:bg-[#001733] transition-colors"
          >
            View Details
          </button>
          {canComplete && ticket.status !== "COMPLETED_BY_STAFF" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(ticket.id);
              }}
              disabled={completing}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {completing ? "Marking..." : "Mark as Completed"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}