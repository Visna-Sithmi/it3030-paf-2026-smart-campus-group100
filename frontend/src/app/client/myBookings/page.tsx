import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { bookingService } from "../../../services/bookingService";
import type { BookingResponseDTO, BookingStatus } from "../../../types/booking";

const statusBadge: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-700",
};

const toReadable = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState<"ALL" | BookingStatus>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await bookingService.getMyBookings();
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
    if (activeStatus === "ALL") return bookings;
    return bookings.filter((booking) => booking.status === activeStatus);
  }, [bookings, activeStatus]);

  const counts = useMemo(() => {
    const base = { ALL: bookings.length, PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
    bookings.forEach((b) => {
      base[b.status] += 1;
    });
    return base;
  }, [bookings]);

  const cancelBooking = async (bookingId: number) => {
    const confirmed = window.confirm("Cancel this booking?");
    if (!confirmed) return;

    try {
      setActionLoadingId(bookingId);
      await bookingService.cancelBooking(bookingId);
      await fetchBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to cancel booking");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#002147]">My Booking History</h1>
          <p className="mt-1 text-sm text-slate-600">Track your requests and cancel active bookings when needed.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {([
            ["ALL", counts.ALL],
            ["PENDING", counts.PENDING],
            ["APPROVED", counts.APPROVED],
            ["REJECTED", counts.REJECTED],
            ["CANCELLED", counts.CANCELLED],
          ] as const).map(([status, count]) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-[#002147] bg-[#002147] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-widest">{status}</p>
                <p className="mt-1 text-2xl font-bold">{count}</p>
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">Bookings</h2>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No bookings found for selected status.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-600">Resource</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Time</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Attendees</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Admin Reason</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.bookingId} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{booking.resourceName}</p>
                        <p className="text-xs text-slate-500">{booking.resourceCode}</p>
                      </td>
                      <td className="px-6 py-4">{booking.bookingDate}</td>
                      <td className="px-6 py-4">{booking.startTime} - {booking.endTime}</td>
                      <td className="px-6 py-4">{booking.expectedAttendees}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[booking.status]}`}>
                          {toReadable(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{booking.adminReason || "-"}</td>
                      <td className="px-6 py-4">
                        {(booking.status === "PENDING" || booking.status === "APPROVED") ? (
                          <button
                            onClick={() => cancelBooking(booking.bookingId)}
                            disabled={actionLoadingId === booking.bookingId}
                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            {actionLoadingId === booking.bookingId ? "Cancelling..." : "Cancel"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
