import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import logo from "../../../assets/logo.jpeg";
import { bookingService } from "../../../services/bookingService";
import type { BookingResponseDTO } from "../../../types/booking";
import { managerProfileService } from "../../../services/managerProfileService";
import type { ManagerProfile } from "../../../types/managerProfile";
import { resourceService } from "../../../services/resource.service";
import type { Resource } from "../../../types/resource.types";

type RejectReasonKey = "RESOURCE_ALREADY_BOOKED" | "TIME_NOT_SUITABLE" | "CAPACITY_LIMIT" | "INCOMPLETE_DETAILS" | "OTHER";

const REJECT_REASON_OPTIONS: Array<{
  key: RejectReasonKey;
  label: string;
  note: string;
}> = [
  {
    key: "RESOURCE_ALREADY_BOOKED",
    label: "Resource already booked",
    note: "Your booking request was rejected because the resource is already booked for the selected time.",
  },
  {
    key: "TIME_NOT_SUITABLE",
    label: "Time not suitable",
    note: "Your booking request was rejected because the requested time is not suitable for this resource.",
  },
  {
    key: "CAPACITY_LIMIT",
    label: "Capacity limit exceeded",
    note: "Your booking request was rejected because the expected attendees exceed the resource capacity.",
  },
  {
    key: "INCOMPLETE_DETAILS",
    label: "Incomplete details",
    note: "Your booking request was rejected because the booking details are incomplete or need clarification.",
  },
  {
    key: "OTHER",
    label: "Other",
    note: "",
  },
];

const APPROVAL_NOTE_TEMPLATE = "Your booking request is confirmed.";

const BookingDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState<RejectReasonKey | "">("");
  const [otherRejectReason, setOtherRejectReason] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("ALL");
  const [heroIndex, setHeroIndex] = useState(0);
  const [resourceSlotsDate, setResourceSlotsDate] = useState(new Date().toISOString().split("T")[0]);
  const [showResourceSlotsId, setShowResourceSlotsId] = useState<number | null>(null);
  const [selectedRequesterBooking, setSelectedRequesterBooking] = useState<BookingResponseDTO | null>(null);

  const fetchBookings = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }

    try {
      const data = await bookingService.getAllBookings();
      setBookings(data);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load booking dashboard data");
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const fetchAvailableResources = async () => {
    try {
      setResourcesLoading(true);
      const [availableResult, allResult] = await Promise.allSettled([
        resourceService.getAvailableResources(),
        resourceService.getAllResources(),
      ]);

      if (availableResult.status === "fulfilled") {
        setAvailableResources(availableResult.value || []);
      } else {
        setAvailableResources([]);
      }

      if (allResult.status === "fulfilled") {
        setAllResources(allResult.value || []);
      } else {
        setAllResources([]);
      }

      if (availableResult.status === "rejected" && allResult.status === "rejected") {
        throw availableResult.reason || allResult.reason;
      }

      setResourcesError("");
    } catch (err: any) {
      setResourcesError(err?.response?.data?.message || err.message || "Failed to load available resources");
    } finally {
      setResourcesLoading(false);
    }
  };

  useEffect(() => {
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    if (!name || role !== "BOOKING_MANAGER") {
      navigate("/manager/login");
      return;
    }

    setUserName(name);
    setUserEmail(email || "");

    const profileImageUrl = localStorage.getItem("profileImageUrl");
    const idRaw = localStorage.getItem("id");
    const id = idRaw ? Number(idRaw) : 0;
    setProfile({
      id,
      name,
      email: email || "",
      role,
      profileImageUrl: profileImageUrl || null,
    });

    fetchBookings();
    fetchAvailableResources();

    const intervalId = window.setInterval(() => {
      fetchBookings(true);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/manager/login");
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setProfileError("");
  };

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setProfileError("");

    const idRaw = localStorage.getItem("id");
    const managerId = idRaw ? Number(idRaw) : 0;

    if (!managerId) {
      setProfileError("Manager session not found. Please login again.");
      return;
    }

    try {
      const latestProfile = await managerProfileService.getProfile(managerId);
      setProfile(latestProfile);
      setUserName(latestProfile.name || "");
      setUserEmail(latestProfile.email || "");
      localStorage.setItem("name", latestProfile.name || "");
      localStorage.setItem("email", latestProfile.email || "");
      localStorage.setItem("profileImageUrl", latestProfile.profileImageUrl || "");
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || err.message || "Failed to load profile");
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, profileImageUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  const updateProfileField = (field: keyof ManagerProfile, value: string | null) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!profile.name?.trim()) {
      setProfileError("Name is required.");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError("");

      const updated = await managerProfileService.updateProfile(profile.id, {
        name: profile.name.trim(),
        profileImageUrl: profile.profileImageUrl || null,
      });

      setProfile(updated);
      setUserName(updated.name || "");
      setUserEmail(updated.email || "");
      localStorage.setItem("name", updated.name || "");
      localStorage.setItem("email", updated.email || "");
      localStorage.setItem("profileImageUrl", updated.profileImageUrl || "");
      localStorage.setItem("user", JSON.stringify({
        ...(JSON.parse(localStorage.getItem("user") || "{}")),
        name: updated.name,
        email: updated.email,
        profileImageUrl: updated.profileImageUrl || null,
      }));
      closeProfileModal();
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleApprove = async (bookingId: number) => {
    try {
      setActionLoadingId(bookingId);
      await bookingService.approveBooking(bookingId);
      await fetchBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to approve booking");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setSelectedRejectReason("");
    setOtherRejectReason("");
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedBookingId(null);
    setSelectedRejectReason("");
    setOtherRejectReason("");
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBookingId) return;
    if (!selectedRejectReason) {
      setError("Please select a rejection reason.");
      return;
    }

    const selectedReason = REJECT_REASON_OPTIONS.find((option) => option.key === selectedRejectReason);
    const rejectionNote =
      selectedRejectReason === "OTHER"
        ? otherRejectReason.trim()
          ? `Your booking request was rejected because ${otherRejectReason.trim()}.`
          : ""
        : selectedReason?.note || "";

    if (!rejectionNote) {
      setError("Please provide the rejection reason details.");
      return;
    }

    try {
      setActionLoadingId(selectedBookingId);
      await bookingService.rejectBooking(selectedBookingId, rejectionNote);
      closeRejectModal();
      await fetchBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to reject booking");
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalBookings = bookings.length;
  const pendingBookingsCount = bookings.filter((b) => b.status === "PENDING").length;

  const pendingRequestBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING"),
    [bookings]
  );

  const upcomingApprovedBookings = useMemo(() => {
    const now = new Date();

    return bookings
      .filter((booking) => booking.status === "APPROVED")
      .filter((booking) => {
        const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
        return Number.isFinite(bookingDateTime.getTime()) && bookingDateTime >= now;
      })
      .sort((a, b) => {
        const aTime = new Date(`${a.bookingDate}T${a.startTime}`).getTime();
        const bTime = new Date(`${b.bookingDate}T${b.startTime}`).getTime();
        return aTime - bTime;
      });
  }, [bookings]);

  const activeBookings = upcomingApprovedBookings.length;

  const upcomingHeroBooking = upcomingApprovedBookings[heroIndex] || null;

  const resourceById = useMemo(() => {
    const map = new Map<number, Resource>();
    for (const resource of allResources) {
      map.set(resource.id, resource);
    }
    for (const resource of availableResources) {
      map.set(resource.id, resource);
    }
    return map;
  }, [allResources, availableResources]);

  const getResourceImageUrl = (resource?: Resource) => {
    if (!resource?.imageUrl) return null;
    return resource.imageUrl.startsWith("http") ? resource.imageUrl : `http://localhost:8081${resource.imageUrl}`;
  };

  const formatResourceType = (value?: string | null) => {
    if (!value) return "N/A";
    return value.replaceAll("_", " ");
  };

  useEffect(() => {
    if (heroIndex >= upcomingApprovedBookings.length) {
      setHeroIndex(0);
    }
  }, [upcomingApprovedBookings.length, heroIndex]);

  useEffect(() => {
    if (upcomingApprovedBookings.length <= 1) return;

    const slideTimer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % upcomingApprovedBookings.length);
    }, 4500);

    return () => {
      window.clearInterval(slideTimer);
    };
  }, [upcomingApprovedBookings.length]);

  const pendingResourceTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        pendingRequestBookings
          .map((booking) => (booking.resourceType || "").trim())
          .filter((type) => type.length > 0)
      )
    );

    return types.sort((a, b) => a.localeCompare(b));
  }, [pendingRequestBookings]);

  const filteredPendingBookings = useMemo(() => {
    const search = bookingSearch.trim().toLowerCase();

    return pendingRequestBookings.filter((booking) => {
      const matchesDate = !dateFilter || booking.bookingDate === dateFilter;
      const matchesResourceType =
        resourceTypeFilter === "ALL" || (booking.resourceType || "") === resourceTypeFilter;
      const matchesSearch =
        !search ||
        (booking.resourceName || "").toLowerCase().includes(search) ||
        (booking.resourceCode || "").toLowerCase().includes(search) ||
        (booking.requestedByName || "").toLowerCase().includes(search) ||
        (booking.purpose || "").toLowerCase().includes(search);

      return matchesDate && matchesResourceType && matchesSearch;
    });
  }, [pendingRequestBookings, bookingSearch, dateFilter, resourceTypeFilter]);

  const toResourceImageUrl = (resource: Resource): string => {
    const rawImage = (resource as any).imageUrl ?? (resource as any).image_url ?? "";
    if (!rawImage) return "";
    return String(rawImage).startsWith("http") ? String(rawImage) : `http://localhost:8081${rawImage}`;
  };

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const formatTime12 = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${`${minutes}`.padStart(2, "0")} ${period}`;
  };

  const formatDate = (dateInput: string) => {
    const parsed = new Date(dateInput);
    if (!Number.isFinite(parsed.getTime())) return dateInput;
    return parsed.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateInput?: string | null) => {
    if (!dateInput) return "N/A";
    const parsed = new Date(dateInput);
    if (!Number.isFinite(parsed.getTime())) return dateInput;
    return parsed.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const resolveRequesterImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return "";
    return imageUrl.startsWith("http") ? imageUrl : `http://localhost:8081${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  };

  const parseAvailabilityConfig = (availabilityWindows?: string) => {
    try {
      if (availabilityWindows) {
        const parsed = JSON.parse(availabilityWindows);
        if (parsed?.startTime && parsed?.endTime && parsed?.slotDurationMinutes) {
          return {
            startTime: parsed.startTime as string,
            endTime: parsed.endTime as string,
            slotDurationMinutes: Number(parsed.slotDurationMinutes),
          };
        }
      }
    } catch {
      // fall through to default
    }
    return {
      startTime: "08:30",
      endTime: "20:30",
      slotDurationMinutes: 60,
    };
  };

  const generateSlots = (availabilityWindows?: string) => {
    const config = parseAvailabilityConfig(availabilityWindows);
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

  const getSlotState = (resourceId: number, slotStart: string, slotEnd: string, date: string): "AVAILABLE" | "PENDING" | "BOOKED" => {
    const startMins = toMinutes(slotStart);
    const endMins = toMinutes(slotEnd);
    const overlaps = bookings.filter((booking) => {
      if (booking.resourceId !== resourceId) return false;
      if (booking.bookingDate !== date) return false;
      if (booking.status !== "PENDING" && booking.status !== "APPROVED") return false;
      const bookingStart = toMinutes(booking.startTime.slice(0, 5));
      const bookingEnd = toMinutes(booking.endTime.slice(0, 5));
      return startMins < bookingEnd && endMins > bookingStart;
    });

    if (overlaps.some((b) => b.status === "APPROVED")) return "BOOKED";
    if (overlaps.some((b) => b.status === "PENDING")) return "PENDING";
    return "AVAILABLE";
  };

  const heroResource = upcomingHeroBooking ? resourceById.get(upcomingHeroBooking.resourceId) : null;
  const heroImageUrl = heroResource ? toResourceImageUrl(heroResource) : "";

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <header className="bg-[#002147] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="text-xl font-bold">Northbridge University</h1>
              <p className="text-xs text-slate-300">Booking Manager Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-white/30 bg-white/10">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="Manager" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {(userName || "M").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm">Welcome, {userName}</span>
            <button
              onClick={openProfileModal}
              className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#002147]">Booking Overview</h2>
          <p className="text-slate-600">Manage facility and resource bookings</p>
          <p className="text-xs text-slate-500">Signed in as {userEmail || "booking manager"}</p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => navigate("/manager/booking/history")}
              className="rounded-lg border border-[#002147] bg-white px-4 py-2 text-sm font-semibold text-[#002147] transition hover:bg-slate-100"
            >
              View Booking History
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b2d5c] via-[#11407d] to-[#1a589f] p-6 text-white shadow-xl">
          {upcomingHeroBooking ? (
            <>
              <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                    Upcoming Booked Resource
                  </p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight md:text-3xl">{upcomingHeroBooking.resourceName}</h3>
                  <p className="mt-1 text-sm text-blue-100">
                    {(upcomingHeroBooking.resourceType || "N/A").replaceAll("_", " ")} • {upcomingHeroBooking.resourceCode || "N/A"}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-blue-50 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-white">Date:</span> {formatDate(upcomingHeroBooking.bookingDate)}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Time:</span> {formatTime12(upcomingHeroBooking.startTime.slice(0, 5))} - {formatTime12(upcomingHeroBooking.endTime.slice(0, 5))}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Booked By:</span> {upcomingHeroBooking.requestedByName}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Purpose:</span> {upcomingHeroBooking.purpose || "N/A"}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHeroIndex((prev) => (prev - 1 + upcomingApprovedBookings.length) % upcomingApprovedBookings.length)}
                      className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroIndex((prev) => (prev + 1) % upcomingApprovedBookings.length)}
                      className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
                    >
                      Next
                    </button>
                    <span className="text-xs text-blue-100">
                      {heroIndex + 1} / {upcomingApprovedBookings.length}
                    </span>
                  </div>
                </div>

                <div className="w-full shrink-0 md:w-72">
                  <div className="relative h-44 overflow-hidden rounded-xl border border-white/20 bg-white/10">
                    {heroImageUrl ? (
                      <>
                        <div
                          className="absolute inset-0 scale-110 bg-cover bg-center blur-lg"
                          style={{ backgroundImage: `url(${heroImageUrl})` }}
                        />
                        <div className="absolute inset-0 bg-black/25" />
                        <img
                          src={heroImageUrl}
                          alt={upcomingHeroBooking.resourceName}
                          className="relative z-10 h-full w-full object-contain p-2"
                        />
                      </>
                    ) : (
                      <div className="relative z-10 flex h-full items-center justify-center px-4 text-center text-sm text-blue-100">
                        Resource image unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {upcomingApprovedBookings.length > 1 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {upcomingApprovedBookings.map((booking, index) => (
                    <button
                      key={booking.bookingId}
                      type="button"
                      onClick={() => setHeroIndex(index)}
                      className={`h-2.5 rounded-full transition ${
                        index === heroIndex ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
                      }`}
                      aria-label={`Go to booking ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Upcoming Booked Resource</p>
              <h3 className="mt-2 text-2xl font-bold">No upcoming approved bookings</h3>
              <p className="mt-1 text-sm text-blue-100">Approved future bookings will appear here as a slideshow.</p>
            </div>
          )}
        </section>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Total Bookings</h3>
            <p className="text-3xl font-bold text-[#002147]">{loading ? "..." : totalBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Pending Approvals</h3>
            <p className="text-3xl font-bold text-[#002147]">{loading ? "..." : pendingBookingsCount}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Active Bookings</h3>
            <p className="text-3xl font-bold text-[#002147]">{loading ? "..." : activeBookings}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-[#002147] via-[#0f3460] to-[#163a63] px-6 py-5 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sky-100/90">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">Pending approvals</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-sky-200/80">Booking Requests</span>
                </div>
                <h3 className="mt-2 text-2xl font-bold">Review requests with resource previews</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-200">
                  Each booking card includes the resource image, booking metadata, and animated approve/reject actions for quicker decisions.
                </p>
              </div>
              <button
                onClick={() => fetchBookings()}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Search Bookings</label>
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Resource, code, requester, purpose"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#002147] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Date Filter</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#002147] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Resource Type</label>
                <select
                  value={resourceTypeFilter}
                  onChange={(e) => setResourceTypeFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#002147] focus:bg-white"
                >
                  <option value="ALL">All Resource Types</option>
                  {pendingResourceTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p>Showing {filteredPendingBookings.length} pending request(s)</p>
              <button
                type="button"
                onClick={() => {
                  setBookingSearch("");
                  setDateFilter("");
                  setResourceTypeFilter("ALL");
                }}
                className="rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-white"
              >
                Clear Filters
              </button>
            </div>

            {loading ? (
              <p className="pt-6 text-sm text-slate-500">Loading booking data...</p>
            ) : filteredPendingBookings.length === 0 ? (
              <p className="pt-6 text-sm text-slate-500">No pending booking requests. Actioned items are moved to Booking History.</p>
            ) : (
              <div className="mt-5 grid gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredPendingBookings.map((booking) => {
                    const resource = resourceById.get(booking.resourceId);
                    const imageUrl = resource ? getResourceImageUrl(resource) : null;
                    const loadingThisCard = actionLoadingId === booking.bookingId;

                    return (
                      <motion.article
                        key={booking.bookingId}
                        layout
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -24, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        whileHover={{ y: -4 }}
                        className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                      >
                        <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
                          <div className="relative min-h-[260px] bg-slate-900">
                            {imageUrl ? (
                              <img src={imageUrl} alt={booking.resourceName} className="absolute inset-0 h-full w-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-[#002147] via-[#123b63] to-[#375b86] px-6 text-center text-white">
                                <div>
                                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-bold backdrop-blur">
                                    {(booking.resourceName || booking.resourceCode || "R").slice(0, 2).toUpperCase()}
                                  </div>
                                  <p className="mt-4 text-sm uppercase tracking-[0.35em] text-sky-100/80">No image available</p>
                                  <p className="mt-2 text-lg font-semibold">{formatResourceType(booking.resourceType)}</p>
                                </div>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-100/90">Resource</p>
                              <h4 className="mt-1 text-2xl font-bold leading-tight">{booking.resourceName}</h4>
                              <p className="mt-1 text-sm text-slate-100/90">{booking.resourceCode}</p>
                              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]">
                                <span className={`rounded-full px-2.5 py-1 ${booking.status === "PENDING" ? "bg-amber-400/20 text-amber-100" : "bg-white/10 text-white"}`}>
                                  {booking.status}
                                </span>
                                <span className="rounded-full bg-white/10 px-2.5 py-1 text-white">
                                  {booking.resourceType ? formatResourceType(booking.resourceType) : "Unknown Type"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Booking details</p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRequesterBooking(booking)}
                                  className="mt-2 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-[#002147] hover:bg-[#002147]/5"
                                >
                                  <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                    {resolveRequesterImageUrl(booking.requestedByProfileImageUrl) ? (
                                      <img
                                        src={resolveRequesterImageUrl(booking.requestedByProfileImageUrl)}
                                        alt={booking.requestedByName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                                        {(booking.requestedByName || "U").charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{booking.requestedByName}</p>
                                    <p className="text-xs text-slate-500">{booking.requestedByRole} · Requested {formatDateTime(booking.createdAt)}</p>
                                  </div>
                                </button>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  booking.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : booking.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : booking.status === "REJECTED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {booking.status}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Date</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(booking.bookingDate)}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Time</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{booking.startTime} - {booking.endTime}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Requester</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{booking.requestedByName}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Purpose</p>
                                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{booking.purpose || "No purpose provided."}</p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Admin note</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{booking.adminReason || "No admin note yet."}</p>
                              </div>

                              <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Actions</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {booking.status === "PENDING" ? (
                                    <>
                                      <motion.button
                                        type="button"
                                        onClick={() => handleApprove(booking.bookingId)}
                                        disabled={loadingThisCard}
                                        whileTap={{ scale: 0.96 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                      >
                                        {loadingThisCard ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        {loadingThisCard ? "Approving..." : "Approve"}
                                      </motion.button>
                                      <motion.button
                                        type="button"
                                        onClick={() => openRejectModal(booking.bookingId)}
                                        disabled={loadingThisCard}
                                        whileTap={{ scale: 0.96 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                                      >
                                        {loadingThisCard ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                        {loadingThisCard ? "Rejecting..." : "Reject"}
                                      </motion.button>
                                    </>
                                  ) : (
                                    <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">Completed</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {loadingThisCard && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"
                              >
                                <div className="flex h-full items-center justify-center">
                                  <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-md">
                                    Processing booking action...
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#002147]">Available Resources</h3>
            <button
              type="button"
              onClick={fetchAvailableResources}
              className="rounded-lg border border-[#002147] px-3 py-1.5 text-xs font-semibold text-[#002147] transition hover:bg-slate-100"
            >
              Refresh Resources
            </button>
          </div>

          {resourcesError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {resourcesError}
            </div>
          )}

          {resourcesLoading ? (
            <p className="text-sm text-slate-500">Loading available resources...</p>
          ) : availableResources.length === 0 ? (
            <p className="text-sm text-slate-500">No available resources right now.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableResources.map((resource) => {
                const imageUrl = toResourceImageUrl(resource);
                return (
                  <div key={resource.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <div className="h-36 w-full bg-slate-200">
                      {imageUrl ? (
                        <img src={imageUrl} alt={resource.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No image</div>
                      )}
                    </div>
                    <div className="space-y-1 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{resource.resourceCode || "N/A"}</p>
                      <h4 className="text-base font-bold text-slate-900">{resource.name}</h4>
                      <p className="text-sm text-slate-600">Type: {(resource.type || "N/A").replaceAll("_", " ")}</p>
                      <p className="text-sm text-slate-600">Capacity: {resource.capacity || 0}</p>
                      <p className="text-sm text-slate-600">Location: {resource.location || "N/A"}</p>

                      <button
                        type="button"
                        onClick={() => setShowResourceSlotsId(showResourceSlotsId === resource.id ? null : resource.id)}
                        className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {showResourceSlotsId === resource.id ? "Hide Availability Slots" : "View Availability Slots"}
                      </button>

                      {showResourceSlotsId === resource.id && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Date</label>
                          <input
                            type="date"
                            value={resourceSlotsDate}
                            onChange={(e) => setResourceSlotsDate(e.target.value)}
                            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#002147]"
                          />

                          <div className="grid grid-cols-1 gap-2">
                            {generateSlots(resource.availabilityWindows).map((slot, idx) => {
                              const state = getSlotState(resource.id, slot.start, slot.end, resourceSlotsDate);
                              return (
                                <div
                                  key={`${resource.id}-${idx}-${slot.start}`}
                                  className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                                    state === "BOOKED"
                                      ? "border-red-200 bg-red-50 text-red-700"
                                      : state === "PENDING"
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-green-200 bg-green-50 text-green-700"
                                  }`}
                                >
                                  {slot.label} {state === "BOOKED" ? "(Booked)" : state === "PENDING" ? "(Pending)" : "(Available)"}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
      {showRejectModal && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Reject Booking</h3>
              <p className="mt-1 text-sm text-slate-500">Provide a reason for rejection.</p>
            </div>

            <form onSubmit={handleReject} className="p-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Rejection Reason
                </p>

                <div className="grid gap-2">
                  {REJECT_REASON_OPTIONS.map((option) => {
                    const isSelected = selectedRejectReason === option.key;
                    return (
                      <label
                        key={option.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                          isSelected
                            ? "border-[#002147] bg-[#002147]/5"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="rejectReason"
                          value={option.key}
                          checked={isSelected}
                          onChange={() => setSelectedRejectReason(option.key)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                          {option.note && <p className="mt-1 text-xs leading-5 text-slate-500">{option.note}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {selectedRejectReason === "OTHER" && (
                  <textarea
                    rows={4}
                    value={otherRejectReason}
                    onChange={(e) => setOtherRejectReason(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                    placeholder="Write the custom rejection note"
                    required
                  />
                )}

                {selectedRejectReason && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-slate-700">
                    <span className="font-semibold uppercase tracking-widest text-sky-700">Preview note</span>
                    <p className="mt-2 leading-6">
                      {selectedRejectReason === "OTHER"
                        ? otherRejectReason.trim()
                          ? `Your booking request was rejected because ${otherRejectReason.trim()}.`
                          : "Your booking request was rejected because ..."
                        : REJECT_REASON_OPTIONS.find((option) => option.key === selectedRejectReason)?.note}
                    </p>
                  </div>
                )}
              </div>

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
                  disabled={!selectedRejectReason || (selectedRejectReason === "OTHER" && !otherRejectReason.trim())}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Reject Booking
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showProfileModal && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            initial={{ y: 18, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Manager Profile</h3>
              <p className="mt-1 text-sm text-slate-500">Update your profile details</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-4 px-6 py-5 text-sm">
              {profileError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {profileError}
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
                      {(profile?.name || "M").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Profile Picture
                  </label>
                  <input type="file" accept="image/*" onChange={handleProfileFileChange} className="block w-full text-sm text-slate-600" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Name</label>
                <input
                  type="text"
                  value={profile?.name || ""}
                  onChange={(e) => updateProfileField("name", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Email (Read-only)</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                  disabled
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-lg bg-[#002147] px-4 py-2 text-sm font-semibold text-white hover:bg-[#001733] disabled:opacity-60"
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {selectedRequesterBooking && (
        <motion.div
          className="fixed inset-0 z-[78] flex items-center justify-center bg-black/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            initial={{ y: 18, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Requester Details</h3>
              <p className="mt-1 text-sm text-slate-500">Full information for the booking requester</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {resolveRequesterImageUrl(selectedRequesterBooking.requestedByProfileImageUrl) ? (
                    <img
                      src={resolveRequesterImageUrl(selectedRequesterBooking.requestedByProfileImageUrl)}
                      alt={selectedRequesterBooking.requestedByName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
                      {(selectedRequesterBooking.requestedByName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-lg font-semibold text-slate-900">{selectedRequesterBooking.requestedByName}</p>
                  <p className="text-sm text-slate-500">{selectedRequesterBooking.requestedByRole}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Requester ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">#{selectedRequesterBooking.requestedById}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Email</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRequesterBooking.requestedByEmail || "N/A"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Requested At</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(selectedRequesterBooking.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Booking Time</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRequesterBooking.startTime} - {selectedRequesterBooking.endTime}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Purpose</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{selectedRequesterBooking.purpose || "No purpose provided."}</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedRequesterBooking(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <footer className="mt-8 border-t border-white/10 bg-[#002147] px-6 py-4 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-sm">© 2024 Northbridge University. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BookingDashboard;