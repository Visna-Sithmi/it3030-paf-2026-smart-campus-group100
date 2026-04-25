import React from "react";

type RejectTicketModalProps = {
  open: boolean;
  ticketId: number | null;
  reason: string;
  error?: string;
  submitting?: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function RejectTicketModal({
  open,
  ticketId,
  reason,
  error,
  submitting = false,
  onReasonChange,
  onClose,
  onSubmit,
}: RejectTicketModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reject ticket</h3>
            <p className="mt-1 text-sm text-slate-500">
              Provide a reason. This will set the status to REJECTED.
              {ticketId != null ? ` (Ticket #${ticketId})` : ""}
            </p>
          </div>
          <button
            className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-60"
            onClick={onClose}
            aria-label="Close reject modal"
            disabled={submitting}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-2 block text-sm font-semibold text-slate-900">
            Reject reason <span className="text-red-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            placeholder="Explain why this ticket is being rejected..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002147]"
          />

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting || reason.trim().length === 0}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {submitting ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

