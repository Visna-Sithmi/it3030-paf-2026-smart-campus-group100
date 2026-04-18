import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import { resourceService } from "../../../services/resource.service";
import { bookingService } from "../../../services/bookingService";
import type { Resource } from "../../../types/resource.types";

interface BookingLocationState {
  resourceId?: number;
  resourceCode?: string;
  resourceName?: string;
  resourceType?: string;
}

const today = new Date().toISOString().split("T")[0];

export default function ResourceBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as BookingLocationState;

  const [resource, setResource] = useState<Resource | null>(null);
  const [loadingResource, setLoadingResource] = useState(true);

  const [bookingDate, setBookingDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState(1);

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

  const maxCapacity = useMemo(() => {
    return resource?.capacity && resource.capacity > 0 ? resource.capacity : 500;
  }, [resource]);

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

    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
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

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#002147]">Resource Booking Request</h1>
            <p className="mt-1 text-sm text-slate-600">Submit a booking request for review and admin approval.</p>
          </div>

          <Link
            to="/my-bookings"
            className="rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#001733]"
          >
            My Bookings
          </Link>
        </div>

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

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-lg font-bold text-slate-900">Selected Resource</h2>

            {loadingResource ? (
              <p className="mt-4 text-sm text-slate-500">Loading resource...</p>
            ) : resource ? (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Name</p>
                  <p className="font-semibold">{resource.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Code</p>
                  <p className="font-semibold">{resource.resourceCode || state.resourceCode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Type</p>
                  <p className="font-semibold">{resource.type?.replaceAll("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Location</p>
                  <p className="font-semibold">{resource.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Capacity</p>
                  <p className="font-semibold">{resource.capacity || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No resource selected.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">Booking Details</h2>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={today}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Purpose
                </label>
                <textarea
                  rows={4}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Explain why you need this resource"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                  required
                />
              </div>

              <div className="max-w-xs">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Expected Attendees
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxCapacity}
                  value={expectedAttendees}
                  onChange={(e) => setExpectedAttendees(Number(e.target.value || 1))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Max capacity: {maxCapacity}</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !resourceId}
                  className="rounded-lg bg-[#002147] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001733] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Booking Request"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/client/resources")}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
