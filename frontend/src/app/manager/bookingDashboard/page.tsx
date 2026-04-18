import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.jpeg";
import { bookingService } from "../../../services/bookingService";
import type { BookingResponseDTO } from "../../../types/booking";
import { managerProfileService } from "../../../services/managerProfileService";
import type { ManagerProfile } from "../../../types/managerProfile";

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
  const [rejectReason, setRejectReason] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

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
      setActionLoadingId(selectedBookingId);
      await bookingService.rejectBooking(selectedBookingId, rejectReason.trim());
      closeRejectModal();
      await fetchBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to reject booking");
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const activeBookings = bookings.filter((b) => b.status === "APPROVED").length;

  const recentBookings = bookings.slice(0, 12);

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
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Total Bookings</h3>
            <p className="text-3xl font-bold text-[#002147]">{loading ? "..." : totalBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Pending Approvals</h3>
            <p className="text-3xl font-bold text-[#002147]">{loading ? "..." : pendingBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="text-sm font-semibold uppercase text-slate-500">Active Bookings</h3>
            <p className="text-3xl font-bold text-[#002147]">{loading ? "..." : activeBookings}</p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#002147]">Booking Requests</h3>
            <button
              onClick={() => fetchBookings()}
              className="rounded-lg border border-[#002147] px-3 py-1.5 text-xs font-semibold text-[#002147] transition hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading booking data...</p>
          ) : recentBookings.length === 0 ? (
            <p className="text-sm text-slate-500">No bookings found yet.</p>
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
                    <th className="px-4 py-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((booking) => (
                    <tr key={booking.bookingId}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{booking.resourceName}</p>
                        <p className="text-xs text-slate-500">{booking.resourceCode}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{booking.requestedByName}</td>
                      <td className="px-4 py-3 text-slate-700">{booking.bookingDate}</td>
                      <td className="px-4 py-3 text-slate-700">{booking.startTime} - {booking.endTime}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                      </td>
                      <td className="px-4 py-3">
                        {booking.status === "PENDING" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(booking.bookingId)}
                              disabled={actionLoadingId === booking.bookingId}
                              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(booking.bookingId)}
                              disabled={actionLoadingId === booking.bookingId}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Completed</span>
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

      {showProfileModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
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
          </div>
        </div>
      )}

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