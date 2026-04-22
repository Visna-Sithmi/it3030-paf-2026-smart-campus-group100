import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { resourceService } from "../../../services/resource.service";
import { bookingService } from "../../../services/bookingService";
import { MeetingScheduler } from "../../../components/ui/meeting-scheduler";
import type { Resource } from "../../../types/resource.types";
import type { BookingSlotDTO } from "../../../types/booking";

interface BookingLocationState {
  resourceId?: number;
  resourceCode?: string;
  resourceName?: string;
  resourceType?: string;
}

const getLocalDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface AvailabilityConfig {
  mode: "FIXED_DAILY";
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

interface TimeSlot {
  start: string;
  end: string;
  label: string;
  state: "AVAILABLE" | "PENDING" | "BOOKED" | "PAST";
}

const DEFAULT_AVAILABILITY_CONFIG: AvailabilityConfig = {
  mode: "FIXED_DAILY",
  startTime: "08:30",
  endTime: "20:30",
  slotDurationMinutes: 60,
};

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toHHmm = (value?: string) => {
  if (!value) return "00:00";
  return String(value).slice(0, 5);
};

const formatTime12 = (time24: string) => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${`${minutes}`.padStart(2, "0")} ${period}`;
};

const getResourceImageUrl = (resource?: Resource | null) => {
  if (!resource?.imageUrl) return null;
  return resource.imageUrl.startsWith("http") ? resource.imageUrl : `http://localhost:8081${resource.imageUrl}`;
};

const parseAvailabilityConfig = (availabilityWindows?: string): AvailabilityConfig => {
  if (!availabilityWindows || availabilityWindows.trim() === "") {
    return DEFAULT_AVAILABILITY_CONFIG;
  }

  try {
    const parsed = JSON.parse(availabilityWindows);
    if (
      parsed &&
      parsed.mode === "FIXED_DAILY" &&
      parsed.startTime &&
      parsed.endTime &&
      parsed.slotDurationMinutes
    ) {
      return {
        mode: "FIXED_DAILY",
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        slotDurationMinutes: Number(parsed.slotDurationMinutes),
      };
    }
    return DEFAULT_AVAILABILITY_CONFIG;
  } catch {
    return DEFAULT_AVAILABILITY_CONFIG;
  }
};

const generateSlots = (config: AvailabilityConfig): Array<{ start: string; end: string; label: string }> => {
  const slots: Array<{ start: string; end: string; label: string }> = [];
  for (let current = toMinutes(config.startTime); current < toMinutes(config.endTime); current += config.slotDurationMinutes) {
    const sh = `${Math.floor(current / 60)}`.padStart(2, "0");
    const sm = `${current % 60}`.padStart(2, "0");
    const next = current + config.slotDurationMinutes;
    const eh = `${Math.floor(next / 60)}`.padStart(2, "0");
    const em = `${next % 60}`.padStart(2, "0");
    const start = `${sh}:${sm}`;
    const end = `${eh}:${em}`;
    slots.push({ start, end, label: `${formatTime12(start)} - ${formatTime12(end)}` });
  }
  return slots;
};

export default function ResourceBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as BookingLocationState;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const today = useMemo(() => getLocalDateValue(now), [now]);

  const [resource, setResource] = useState<Resource | null>(null);
  const [loadingResource, setLoadingResource] = useState(true);

  const [bookingDate, setBookingDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState(1);
  const [bookedSlots, setBookedSlots] = useState<BookingSlotDTO[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resourceId = state.resourceId;

  useEffect(() => {
    const loadResource = async () => {
      if (!resourceId) {
        setLoadingResource(false);
        return;
      }

      try {
        const result = await resourceService.getResourceById(resourceId);
        setResource(result);
        if (result.capacity && result.capacity > 0) {
          setExpectedAttendees(Math.min(1, result.capacity));
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Failed to load resource details");
      } finally {
        setLoadingResource(false);
      }
    };

    loadResource();
  }, [resourceId]);

  useEffect(() => {
    const loadBookedSlots = async () => {
      if (!resourceId || !bookingDate) {
        setBookedSlots([]);
        return;
      }

      try {
        setSlotsLoading(true);
        const data = await bookingService.getBookedSlots(resourceId, bookingDate);
        setBookedSlots(data || []);
      } catch (err: any) {
        setBookedSlots([]);
        setError(err?.response?.data?.message || err.message || "Failed to load slot availability");
      } finally {
        setSlotsLoading(false);
      }
    };

    loadBookedSlots();
  }, [resourceId, bookingDate]);

  useEffect(() => {
    setSelectedSlotKey("");
    setStartTime("");
    setEndTime("");
  }, [bookingDate, resourceId]);

  const maxCapacity = useMemo(() => {
    return resource?.capacity && resource.capacity > 0 ? resource.capacity : 500;
  }, [resource]);

  const resourceImageUrl = useMemo(() => getResourceImageUrl(resource), [resource]);

  const slotOptions = useMemo<TimeSlot[]>(() => {
    const config = parseAvailabilityConfig(resource?.availabilityWindows);
    const generated = generateSlots(config);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isTodayBooking = bookingDate === today;

    return generated.map((slot) => {
      const slotStart = toMinutes(slot.start);
      const slotEnd = toMinutes(slot.end);
      const isPast = isTodayBooking && slotStart < nowMinutes;

      if (isPast) {
        return {
          ...slot,
          state: "PAST",
        };
      }

      const overlapping = bookedSlots.filter((b) => {
        const bStart = toMinutes(toHHmm(b.startTime));
        const bEnd = toMinutes(toHHmm(b.endTime));
        return slotStart < bEnd && slotEnd > bStart;
      });

      const hasApproved = overlapping.some((b) => b.status === "APPROVED");
      const hasPending = !hasApproved && overlapping.some((b) => b.status === "PENDING");

      return {
        ...slot,
        state: hasApproved ? "BOOKED" : hasPending ? "PENDING" : "AVAILABLE",
      };
    });
  }, [resource?.availabilityWindows, bookedSlots, bookingDate, today, now]);

  const selectSlot = (slot: TimeSlot) => {
    if (slot.state === "BOOKED" || slot.state === "PAST") return;

    setSelectedSlotKey(`${slot.start}-${slot.end}`);
    setStartTime(slot.start);
    setEndTime(slot.end);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resourceId) {
      setError("Please select a resource from the catalogue first.");
      return;
    }

    if (!purpose.trim()) {
      setError("Purpose is required.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Please select an available time slot.");
      return;
    }

    if (bookingDate === today) {
      const selectedStartMinutes = toMinutes(startTime);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (selectedStartMinutes < nowMinutes) {
        setError("This slot is already in the past. Please choose a current or future slot.");
        return;
      }
    }

    try {
      setSubmitting(true);

      await bookingService.createBooking({
        resourceId,
        bookingDate,
        startTime,
        endTime,
        purpose: purpose.trim(),
        expectedAttendees,
      });

      setSuccess("Booking request submitted successfully. Status is PENDING.");
      setPurpose("");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to submit booking request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="relative min-h-[220px] bg-slate-950">
            {resourceImageUrl ? (
              <img
                src={resourceImageUrl}
                alt={resource?.name || "Booked resource"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#002147] via-[#0f3460] to-[#1f4e79]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">Resource booking</p>
              <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">Reserve a space that matches your session.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                Choose a date, pick an available time, and submit your request with the resource image always in view.
              </p>
            </div>
          </div>
        </section>

        {!resourceId && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
            Open this page from the resource catalogue to auto-select a resource.
            <div className="mt-2">
              <Link to="/client/resources" className="font-semibold underline">
                Go to Resource Catalogue
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
        )}

        <div className="grid gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Booking Details</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Choose a live time slot</h2>
            </div>

            <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <MeetingScheduler
                    title="Booking Date"
                    description="Pick the day for this booking."
                    value={bookingDate}
                    minDate={today}
                    onChange={setBookingDate}
                    className="border-slate-200 xl:max-w-[620px]"
                  />
                </div>

                <div>
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Selected Time Slot
                    </label>
                    <p className="text-sm font-semibold text-slate-900">
                      {startTime && endTime ? `${formatTime12(startTime)} - ${formatTime12(endTime)}` : "No slot selected"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Tap a time card to set your request instantly.</p>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Available Times
                    </label>
                    {slotsLoading && <span className="text-xs text-slate-500">Loading slots...</span>}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {slotOptions.map((slot) => {
                      const key = `${slot.start}-${slot.end}`;
                      const isSelected = selectedSlotKey === key;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => selectSlot(slot)}
                          disabled={slot.state === "BOOKED" || slot.state === "PAST"}
                          className={`group rounded-2xl border px-2.5 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                            slot.state === "BOOKED"
                              ? "cursor-not-allowed border-red-200 bg-red-50 text-red-700"
                              : slot.state === "PAST"
                              ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500"
                              : slot.state === "PENDING"
                              ? isSelected
                                ? "border-amber-600 bg-amber-500 text-white shadow-md shadow-amber-200"
                                : "border-amber-200 bg-amber-50 text-amber-700 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-100 hover:shadow-sm"
                              : isSelected
                              ? "border-[#002147] bg-[#002147] text-white shadow-md shadow-slate-200"
                              : "border-green-200 bg-green-50 text-green-700 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-100 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>{slot.label}</div>
                            <span className={`rounded-full px-1.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] ${slot.state === "BOOKED" ? "bg-red-100 text-red-700" : slot.state === "PAST" ? "bg-slate-200 text-slate-600" : slot.state === "PENDING" ? "bg-amber-100 text-amber-700" : isSelected ? "bg-white/15 text-white" : "bg-white/70 text-green-700"}`}>
                              {slot.state === "BOOKED" ? "Booked" : slot.state === "PAST" ? "Past" : slot.state === "PENDING" ? "Pending" : "Open"}
                            </span>
                          </div>
                          <div
                            className={`mt-2 text-xs ${
                              slot.state === "BOOKED"
                                ? "text-red-600"
                                : slot.state === "PAST"
                                ? "text-slate-500"
                                : slot.state === "PENDING"
                                ? isSelected
                                  ? "text-amber-100"
                                  : "text-amber-700"
                                : isSelected
                                ? "text-slate-200"
                                : "text-green-700"
                            }`}
                          >
                            {slot.state === "BOOKED"
                              ? "Booked"
                              : slot.state === "PAST"
                              ? "Past Time"
                              : slot.state === "PENDING"
                              ? "Pending Approval"
                              : "Available"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 ring-1 ring-slate-200">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Purpose
                  </label>
                  <textarea
                    rows={4}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Explain why you need this resource"
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#002147] focus:ring-4 focus:ring-[#002147]/10"
                    required
                  />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 ring-1 ring-slate-200">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Expected Attendees
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxCapacity}
                    value={expectedAttendees}
                    onChange={(e) => setExpectedAttendees(Number(e.target.value || 1))}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#002147] focus:ring-4 focus:ring-[#002147]/10"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Max capacity: {maxCapacity}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  disabled={submitting || !resourceId}
                  className="rounded-full bg-[#002147] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#001733] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Booking Request"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/client/resources")}
                  className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Back to Catalogue
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
