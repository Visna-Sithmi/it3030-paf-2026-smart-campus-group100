import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { bookingService } from "../../../services/bookingService";
import { resourceService } from "../../../services/resource.service";
import type { Resource } from "../../../types/resource.types";
import type { BookingResponseDTO, BookingStatus } from "../../../types/booking";

type DisplayBookingStatus = BookingStatus | "COMPLETED";

const statusBadge: Record<DisplayBookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-700",
  COMPLETED: "bg-indigo-100 text-indigo-800",
};

const statusLabel: Record<DisplayBookingStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const statusAccent: Record<DisplayBookingStatus, string> = {
  PENDING: "from-amber-500 to-orange-500",
  APPROVED: "from-emerald-500 to-teal-500",
  REJECTED: "from-rose-500 to-red-500",
  CANCELLED: "from-slate-400 to-slate-500",
  COMPLETED: "from-indigo-500 to-blue-500",
};

const toReadable = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

const formatDate = (dateValue: string) => {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatBookingTime = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return "N/A";
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
};

const toDateTime = (dateValue: string, timeValue: string) => {
  if (!dateValue || !timeValue) return null;

  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isBookingOverdue = (booking: BookingResponseDTO) => {
  if (booking.status !== "APPROVED" && booking.status !== "PENDING") return false;

  const bookingEnd = toDateTime(booking.bookingDate, booking.endTime);
  if (!bookingEnd) return false;

  return bookingEnd.getTime() < Date.now();
};

const getFallbackImageLabel = (booking: BookingResponseDTO) => {
  const label = booking.resourceName || booking.resourceCode || "Resource";
  return label.slice(0, 2).toUpperCase();
};

const getResourceImageUrl = (resource: Resource | undefined) => {
  if (!resource?.imageUrl) return null;

  return resource.imageUrl.startsWith("http")
    ? resource.imageUrl
    : `http://localhost:8081${resource.imageUrl}`;
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [resourceMap, setResourceMap] = useState<Record<number, Resource>>({});
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState<"ALL" | DisplayBookingStatus>("ALL");
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

  useEffect(() => {
    const loadResourceDetails = async () => {
      const uniqueResourceIds = Array.from(
        new Set(bookings.map((booking) => booking.resourceId).filter((resourceId) => resourceId > 0))
      );

      if (!uniqueResourceIds.length) {
        setResourceMap({});
        return;
      }

      try {
        setResourcesLoading(true);

        const entries = await Promise.all(
          uniqueResourceIds.map(async (resourceId) => {
            try {
              const resource = await resourceService.getResourceById(resourceId);
              return [resourceId, resource] as const;
            } catch {
              return [resourceId, undefined] as const;
            }
          })
        );

        const nextResourceMap: Record<number, Resource> = {};
        entries.forEach(([resourceId, resource]) => {
          if (resource) {
            nextResourceMap[resourceId] = resource;
          }
        });

        setResourceMap(nextResourceMap);
      } finally {
        setResourcesLoading(false);
      }
    };

    loadResourceDetails();
  }, [bookings]);

  const displayBookings = useMemo(() => {
    return bookings.map((booking) => {
      const overdue = isBookingOverdue(booking);
      const displayStatus: DisplayBookingStatus = overdue ? "COMPLETED" : booking.status;

      return {
        booking,
        overdue,
        displayStatus,
      };
    });
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const base = activeStatus === "ALL"
      ? displayBookings
      : displayBookings.filter(({ displayStatus }) => displayStatus === activeStatus);

    return [...base].sort((a, b) => {
      if (a.displayStatus === "COMPLETED" && b.displayStatus !== "COMPLETED") return 1;
      if (a.displayStatus !== "COMPLETED" && b.displayStatus === "COMPLETED") return -1;
      return 0;
    });
  }, [displayBookings, activeStatus]);

  const counts = useMemo(() => {
    const base = { ALL: displayBookings.length, PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0, COMPLETED: 0 };
    displayBookings.forEach(({ displayStatus }) => {
      base[displayStatus] += 1;
    });
    return base;
  }, [displayBookings]);

  const visibleBookings = useMemo(() => {
    return filteredBookings.map(({ booking, displayStatus }) => ({
      booking,
      displayStatus,
      resource: resourceMap[booking.resourceId],
    }));
  }, [filteredBookings, resourceMap]);

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
        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 bg-gradient-to-br from-[#002147] via-[#0f3460] to-[#163a63] px-6 py-8 text-white lg:grid-cols-[1.4fr_0.6fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">Booking archive</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">My Booking History</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Review every request in one place, see the booked resource image, and manage active bookings without digging through a table.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {([
                ["All", counts.ALL],
                ["Pending", counts.PENDING],
                ["Approved", counts.APPROVED],
                ["Finalized", counts.REJECTED + counts.CANCELLED + counts.COMPLETED],
              ] as const).map(([label, count]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-100/90">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {resourcesLoading && !loading && bookings.length > 0 && (
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Loading booked resource images...
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          {([
            ["ALL", counts.ALL],
            ["PENDING", counts.PENDING],
            ["APPROVED", counts.APPROVED],
            ["REJECTED", counts.REJECTED],
            ["CANCELLED", counts.CANCELLED],
            ["COMPLETED", counts.COMPLETED],
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bookings</h2>
                <p className="text-sm text-slate-500">Each booking includes a visual snapshot of the booked resource.</p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {filteredBookings.length} visible
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No bookings found for selected status.</div>
          ) : (
            <div className="grid gap-5 p-4 sm:p-6">
              {visibleBookings.map(({ booking, displayStatus, resource }) => {
                const imageUrl = getResourceImageUrl(resource);

                return (
                  <article
                    key={booking.bookingId}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                      <div className="relative min-h-[220px] bg-slate-900">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={booking.resourceName}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-[#002147] via-[#123b63] to-[#375b86] px-6 text-center text-white">
                            <div>
                              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-bold backdrop-blur">
                                {getFallbackImageLabel(booking)}
                              </div>
                              <p className="mt-4 text-sm uppercase tracking-[0.35em] text-sky-100/80">No image available</p>
                              <p className="mt-2 text-lg font-semibold">{booking.resourceType || "Resource"}</p>
                            </div>
                          </div>
                        )}

                        <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${statusAccent[displayStatus]} opacity-90`} />
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Resource</p>
                            <h3 className="mt-1 text-xl font-bold leading-tight">{booking.resourceName}</h3>
                            <p className="mt-1 text-sm text-white/85">{booking.resourceCode}</p>
                          </div>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
                            {statusLabel[displayStatus]}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-5 bg-white p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Booking details</p>
                            <p className="mt-2 text-sm text-slate-600">
                              Requested by <span className="font-semibold text-slate-800">{booking.requestedByName}</span> · {booking.requestedByRole}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[displayStatus]}`}>
                            {toReadable(displayStatus)}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Date</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(booking.bookingDate)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Time</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatBookingTime(booking.startTime, booking.endTime)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Attendees</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{booking.expectedAttendees}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Updated</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(booking.updatedAt)}</p>
                          </div>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Purpose</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{booking.purpose || "No purpose provided."}</p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Admin note</p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{booking.adminReason || "No admin note yet."}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                          <div className="text-xs text-slate-500">
                            Booking ID <span className="font-semibold text-slate-700">#{booking.bookingId}</span>
                            {resource?.location ? <span> · {resource.location}</span> : null}
                          </div>

                          {(displayStatus === "PENDING" || displayStatus === "APPROVED") ? (
                            <button
                              onClick={() => cancelBooking(booking.bookingId)}
                              disabled={actionLoadingId === booking.bookingId}
                              className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionLoadingId === booking.bookingId ? "Cancelling..." : "Cancel booking"}
                            </button>
                          ) : (
                            <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">No action available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
