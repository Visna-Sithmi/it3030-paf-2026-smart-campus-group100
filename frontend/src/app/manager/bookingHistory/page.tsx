import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.jpeg";
import { bookingService } from "../../../services/bookingService";
import type { BookingResponseDTO } from "../../../types/booking";

export default function BookingHistoryPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED" | "CANCELLED">("ALL");
  const [historyResourceTypeFilter, setHistoryResourceTypeFilter] = useState("ALL");

  const userName = localStorage.getItem("name") || "Booking Manager";

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAllBookings();
      setBookings(data || []);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load booking history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "BOOKING_MANAGER") {
      navigate("/manager/login");
      return;
    }

    fetchBookings();
  }, [navigate]);

  const historyResourceTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        bookings
          .map((booking) => (booking.resourceType || "").trim())
          .filter((type) => type.length > 0)
      )
    );

    return types.sort((a, b) => a.localeCompare(b));
  }, [bookings]);

  const filteredHistoryBookings = useMemo(() => {
    const search = historySearch.trim().toLowerCase();

    return bookings
      .filter((booking) => booking.status === "APPROVED" || booking.status === "REJECTED" || booking.status === "CANCELLED")
      .filter((booking) => {
        const matchesStatus = historyStatusFilter === "ALL" || booking.status === historyStatusFilter;
        const matchesDate = !historyDateFilter || booking.bookingDate === historyDateFilter;
        const matchesResourceType =
          historyResourceTypeFilter === "ALL" || (booking.resourceType || "") === historyResourceTypeFilter;
        const matchesSearch =
          !search ||
          (booking.resourceName || "").toLowerCase().includes(search) ||
          (booking.resourceCode || "").toLowerCase().includes(search) ||
          (booking.requestedByName || "").toLowerCase().includes(search) ||
          (booking.purpose || "").toLowerCase().includes(search);

        return matchesStatus && matchesDate && matchesResourceType && matchesSearch;
      });
  }, [bookings, historySearch, historyDateFilter, historyStatusFilter, historyResourceTypeFilter]);

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <header className="bg-[#002147] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-xl font-bold">Northbridge University</h1>
              <p className="text-xs text-slate-300">Booking Manager History</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {userName}</span>
            <button
              type="button"
              onClick={() => navigate("/manager/booking/dashboard")}
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back To Overview
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#002147]">Booking History</h2>
          <p className="text-slate-600">Approved, rejected, and cancelled bookings.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 rounded-xl bg-white p-6 shadow-md">
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Search History</label>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Resource, requester, purpose"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Status Filter</label>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value as "ALL" | "APPROVED" | "REJECTED" | "CANCELLED")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#002147]"
              >
                <option value="ALL">All History Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Date Filter</label>
              <input
                type="date"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Resource Type</label>
              <select
                value={historyResourceTypeFilter}
                onChange={(e) => setHistoryResourceTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#002147]"
              >
                <option value="ALL">All Resource Types</option>
                {historyResourceTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
            <p>Showing {filteredHistoryBookings.length} actioned booking(s)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchBookings()}
                className="rounded-lg border border-[#002147] px-3 py-1.5 font-semibold text-[#002147] transition hover:bg-slate-100"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setHistorySearch("");
                  setHistoryDateFilter("");
                  setHistoryStatusFilter("ALL");
                  setHistoryResourceTypeFilter("ALL");
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading booking history...</p>
          ) : filteredHistoryBookings.length === 0 ? (
            <p className="text-sm text-slate-500">No approved/rejected/cancelled records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Resource</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Requester</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Time</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Reason / Actioned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistoryBookings.map((booking) => (
                    <tr key={booking.bookingId}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{booking.resourceName}</p>
                        <p className="text-xs text-slate-500">{booking.resourceCode}</p>
                        <p className="text-xs text-slate-500">{(booking.resourceType || "N/A").replaceAll("_", " ")}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{booking.requestedByName}</td>
                      <td className="px-4 py-3 text-slate-700">{booking.bookingDate}</td>
                      <td className="px-4 py-3 text-slate-700">{booking.startTime} - {booking.endTime}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            booking.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : booking.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p>{booking.adminReason || (booking.status === "CANCELLED" ? "Cancelled by requester" : "-")}</p>
                        <p className="mt-1 text-slate-500">{booking.approvedOrRejectedByName || "-"}</p>
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
  );
}
