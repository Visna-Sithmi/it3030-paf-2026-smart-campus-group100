import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/header";
import { bookingService } from "../../../services/bookingService";
import type { BookingResponseDTO, BookingStatus } from "../../../types/booking";

const badgeMap: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-700",
};

const statusText = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

export default function AdminBookingPage() {
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>("ALL");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await bookingService.getAllBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const counters = useMemo(() => {
    const map = { ALL: bookings.length, PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
    bookings.forEach((booking) => {
      map[booking.status] += 1;
    });
    return map;
  }, [bookings]);

  const handleApprove = async (bookingId: number) => {
    try {
      setActionLoading(bookingId);
      await bookingService.approveBooking(bookingId);
      await fetchBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to approve booking");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedBookingId(null);
    setRejectReason("");
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBookingId) return;
    if (!rejectReason.trim()) {
      setError("Reject reason is required.");
      return;
    }

    try {
      setActionLoading(selectedBookingId);
      await bookingService.rejectBooking(selectedBookingId, rejectReason.trim());
      closeRejectModal();
      await fetchBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to reject booking");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeItem="Booking Management" />

      <div className="ml-72 min-h-screen">
        <Header
          title="Booking Management"
          subtitle="Review and approve/reject booking requests"
          adminName={localStorage.getItem("name") || "Admin User"}
          adminRole="System Administrator"
        />

        <main className="p-8">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {([
              ["ALL", counters.ALL],
              ["PENDING", counters.PENDING],
              ["APPROVED", counters.APPROVED],
              ["REJECTED", counters.REJECTED],
              ["CANCELLED", counters.CANCELLED],
            ] as const).map(([status, count]) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                    active
                      ? "border-[#002147] bg-[#002147] text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest">{status}</p>
                  <p className="mt-2 text-3xl font-bold">{count}</p>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">Booking Requests</h2>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No booking records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Resource</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Requester</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Date / Time</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Purpose</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Admin Reason</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.bookingId} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{booking.resourceName}</p>
                          <p className="text-xs text-slate-500">{booking.resourceCode}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{booking.requestedByName}</p>
                          <p className="text-xs text-slate-500">{booking.requestedByRole}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <p>{booking.bookingDate}</p>
                          <p className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</p>
                        </td>
                        <td className="max-w-xs px-6 py-4 text-slate-700">{booking.purpose}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeMap[booking.status]}`}>
                            {statusText(booking.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{booking.adminReason || "-"}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {booking.status === "PENDING" ? (
                              <>
                                <button
                                  onClick={() => handleApprove(booking.bookingId)}
                                  disabled={actionLoading === booking.bookingId}
                                  className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openRejectModal(booking.bookingId)}
                                  disabled={actionLoading === booking.bookingId}
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Reject Booking</h3>
              <p className="mt-1 text-sm text-slate-500">Provide a reason for rejection.</p>
            </div>

            <form onSubmit={handleReject} className="p-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Rejection Reason
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                placeholder="Reason for rejection"
                required
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Reject Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
