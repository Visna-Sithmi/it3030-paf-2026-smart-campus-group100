import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.jpeg";
import { bookingService } from "../../../services/bookingService";
import { resourceService } from "../../../services/resource.service";
import type { BookingResponseDTO } from "../../../types/booking";

export default function BookingHistoryPage() {
  const navigate = useNavigate();
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartPalette = ["#0f766e", "#1d4ed8", "#7c3aed", "#d97706", "#be123c", "#059669", "#4f46e5", "#c2410c"];
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED" | "CANCELLED">("ALL");
  const [historyResourceTypeFilter, setHistoryResourceTypeFilter] = useState("ALL");
  const [resourceTypeOptions, setResourceTypeOptions] = useState<string[]>([]);
  const [analyticsYearFilter, setAnalyticsYearFilter] = useState("ALL");
  const [analyticsMonthFilter, setAnalyticsMonthFilter] = useState("ALL");
  const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED" | "CANCELLED">("ALL");
  const [analyticsResourceTypeFilter, setAnalyticsResourceTypeFilter] = useState("ALL");
  const [analyticsFromDate, setAnalyticsFromDate] = useState("");
  const [analyticsToDate, setAnalyticsToDate] = useState("");

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

  const fetchResourceTypes = async () => {
    try {
      const resources = await resourceService.getAllResources();
      const allTypes = Array.from(
        new Set(
          (resources || [])
            .map((resource) => (resource.type || "").trim())
            .filter((type) => type.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b));

      setResourceTypeOptions(allTypes);
    } catch {
      // Keep dropdown usable by falling back to booking-derived values.
      setResourceTypeOptions([]);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "BOOKING_MANAGER") {
      navigate("/manager/login");
      return;
    }

    fetchBookings();
    fetchResourceTypes();
  }, [navigate]);

  const bookingDerivedTypes = useMemo(() => {
    const types = Array.from(
      new Set(
        bookings
          .map((booking) => (booking.resourceType || "").trim())
          .filter((type) => type.length > 0)
      )
    );

    return types.sort((a, b) => a.localeCompare(b));
  }, [bookings]);

  const historyResourceTypeOptions = useMemo(() => {
    if (resourceTypeOptions.length > 0) {
      return resourceTypeOptions;
    }
    return bookingDerivedTypes;
  }, [resourceTypeOptions, bookingDerivedTypes]);

  const actionedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "APPROVED" || booking.status === "REJECTED" || booking.status === "CANCELLED"),
    [bookings]
  );

  const availableAnalyticsYears = useMemo(() => {
    const years = Array.from(
      new Set(
        actionedBookings
          .map((booking) => (booking.bookingDate || "").slice(0, 4))
          .filter((year) => /^\d{4}$/.test(year))
      )
    );

    return years.sort((a, b) => Number(b) - Number(a));
  }, [actionedBookings]);

  const analyticsFilteredBookings = useMemo(() => {
    return actionedBookings.filter((booking) => {
      const bookingYear = (booking.bookingDate || "").slice(0, 4);
      const bookingMonth = (booking.bookingDate || "").slice(5, 7);

      const matchesYear = analyticsYearFilter === "ALL" || bookingYear === analyticsYearFilter;
      const matchesMonth = analyticsMonthFilter === "ALL" || bookingMonth === analyticsMonthFilter;
      const matchesStatus = analyticsStatusFilter === "ALL" || booking.status === analyticsStatusFilter;
      const matchesResourceType =
        analyticsResourceTypeFilter === "ALL" || (booking.resourceType || "") === analyticsResourceTypeFilter;
      const matchesFromDate = !analyticsFromDate || booking.bookingDate >= analyticsFromDate;
      const matchesToDate = !analyticsToDate || booking.bookingDate <= analyticsToDate;

      return matchesYear && matchesMonth && matchesStatus && matchesResourceType && matchesFromDate && matchesToDate;
    });
  }, [
    actionedBookings,
    analyticsYearFilter,
    analyticsMonthFilter,
    analyticsStatusFilter,
    analyticsResourceTypeFilter,
    analyticsFromDate,
    analyticsToDate,
  ]);

  const analyticsStatusSummary = useMemo(() => {
    return {
      APPROVED: analyticsFilteredBookings.filter((booking) => booking.status === "APPROVED").length,
      REJECTED: analyticsFilteredBookings.filter((booking) => booking.status === "REJECTED").length,
      CANCELLED: analyticsFilteredBookings.filter((booking) => booking.status === "CANCELLED").length,
    };
  }, [analyticsFilteredBookings]);

  const resourceTypeChartData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const booking of analyticsFilteredBookings) {
      const key = (booking.resourceType || "UNKNOWN").trim() || "UNKNOWN";
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [analyticsFilteredBookings]);

  const totalTypeCount = resourceTypeChartData.reduce((acc, item) => acc + item.count, 0);

  const pieSegments = resourceTypeChartData.reduce<{ color: string; from: number; to: number; type: string; count: number }[]>((acc, item, index) => {
    const previousTo = acc.length ? acc[acc.length - 1].to : 0;
    const ratio = totalTypeCount > 0 ? (item.count / totalTypeCount) * 100 : 0;
    const to = previousTo + ratio;

    acc.push({
      color: chartPalette[index % chartPalette.length],
      from: previousTo,
      to,
      type: item.type,
      count: item.count,
    });

    return acc;
  }, []);

  const pieChartBackground = pieSegments.length
    ? `conic-gradient(${pieSegments
        .map((segment) => `${segment.color} ${segment.from.toFixed(2)}% ${segment.to.toFixed(2)}%`)
        .join(", ")})`
    : "#e2e8f0";

  const monthlyChartYear = analyticsYearFilter === "ALL"
    ? availableAnalyticsYears[0] || String(new Date().getFullYear())
    : analyticsYearFilter;

  const monthlyChartData = useMemo(() => {
    const monthCounts = Array.from({ length: 12 }, (_, i) => ({ month: monthLabels[i], monthIndex: i + 1, count: 0 }));

    actionedBookings
      .filter((booking) => (booking.bookingDate || "").slice(0, 4) === monthlyChartYear)
      .filter((booking) => analyticsStatusFilter === "ALL" || booking.status === analyticsStatusFilter)
      .filter((booking) => analyticsResourceTypeFilter === "ALL" || (booking.resourceType || "") === analyticsResourceTypeFilter)
      .forEach((booking) => {
        const monthNumber = Number((booking.bookingDate || "").slice(5, 7));
        if (monthNumber >= 1 && monthNumber <= 12) {
          monthCounts[monthNumber - 1].count += 1;
        }
      });

    return monthCounts;
  }, [actionedBookings, monthlyChartYear, analyticsStatusFilter, analyticsResourceTypeFilter, monthLabels]);

  const annualChartData = useMemo(() => {
    const annualCounts = new Map<string, number>();

    actionedBookings
      .filter((booking) => analyticsStatusFilter === "ALL" || booking.status === analyticsStatusFilter)
      .filter((booking) => analyticsResourceTypeFilter === "ALL" || (booking.resourceType || "") === analyticsResourceTypeFilter)
      .filter((booking) => analyticsMonthFilter === "ALL" || (booking.bookingDate || "").slice(5, 7) === analyticsMonthFilter)
      .forEach((booking) => {
        const year = (booking.bookingDate || "").slice(0, 4);
        if (/^\d{4}$/.test(year)) {
          annualCounts.set(year, (annualCounts.get(year) || 0) + 1);
        }
      });

    return Array.from(annualCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [actionedBookings, analyticsStatusFilter, analyticsResourceTypeFilter, analyticsMonthFilter]);

  const maxMonthlyCount = Math.max(1, ...monthlyChartData.map((item) => item.count));
  const maxAnnualCount = Math.max(1, ...annualChartData.map((item) => item.count));

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

        <section className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[#002147]">History Analytics</h3>
            <p className="text-sm text-slate-600">Analyze booking outcomes by resource type, month, and year.</p>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Year</label>
              <select
                value={analyticsYearFilter}
                onChange={(e) => setAnalyticsYearFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#002147]"
              >
                <option value="ALL">All Years</option>
                {availableAnalyticsYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Month</label>
              <select
                value={analyticsMonthFilter}
                onChange={(e) => setAnalyticsMonthFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#002147]"
              >
                <option value="ALL">All Months</option>
                {monthLabels.map((month, index) => (
                  <option key={month} value={`${index + 1}`.padStart(2, "0")}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Status</label>
              <select
                value={analyticsStatusFilter}
                onChange={(e) => setAnalyticsStatusFilter(e.target.value as "ALL" | "APPROVED" | "REJECTED" | "CANCELLED")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#002147]"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Resource Type</label>
              <select
                value={analyticsResourceTypeFilter}
                onChange={(e) => setAnalyticsResourceTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#002147]"
              >
                <option value="ALL">All Types</option>
                {historyResourceTypeOptions.map((type) => (
                  <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">From Date</label>
              <input
                type="date"
                value={analyticsFromDate}
                onChange={(e) => setAnalyticsFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">To Date</label>
              <input
                type="date"
                value={analyticsToDate}
                onChange={(e) => setAnalyticsToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#002147]"
              />
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p>
              Analyzing <span className="font-semibold text-slate-800">{analyticsFilteredBookings.length}</span> actioned booking(s)
            </p>
            <button
              type="button"
              onClick={() => {
                setAnalyticsYearFilter("ALL");
                setAnalyticsMonthFilter("ALL");
                setAnalyticsStatusFilter("ALL");
                setAnalyticsResourceTypeFilter("ALL");
                setAnalyticsFromDate("");
                setAnalyticsToDate("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-white"
            >
              Reset Analytics Filters
            </button>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Total Actioned</p>
              <p className="mt-1 text-2xl font-bold text-[#002147]">{analyticsFilteredBookings.length}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs uppercase tracking-widest text-emerald-700">Approved</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{analyticsStatusSummary.APPROVED}</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs uppercase tracking-widest text-red-700">Rejected</p>
              <p className="mt-1 text-2xl font-bold text-red-800">{analyticsStatusSummary.REJECTED}</p>
            </div>
            <div className="rounded-lg border border-slate-300 bg-slate-100 p-3">
              <p className="text-xs uppercase tracking-widest text-slate-600">Cancelled</p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{analyticsStatusSummary.CANCELLED}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-700">Resource Type Distribution (Pie)</h4>
              {resourceTypeChartData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No data for selected filters.</p>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="relative h-44 w-44 rounded-full border border-slate-200" style={{ background: pieChartBackground }}>
                    <div className="absolute inset-10 rounded-full bg-white" />
                  </div>
                  <div className="w-full space-y-2">
                    {pieSegments.map((segment) => (
                      <div key={segment.type} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                          <span className="font-semibold text-slate-700">{segment.type.replaceAll("_", " ")}</span>
                        </div>
                        <span className="text-slate-600">
                          {segment.count} ({totalTypeCount > 0 ? ((segment.count / totalTypeCount) * 100).toFixed(1) : "0.0"}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-700">Monthly Trend ({monthlyChartYear})</h4>
              <div className="mt-4 grid h-52 grid-cols-12 items-end gap-2">
                {monthlyChartData.map((item) => {
                  const heightPercent = (item.count / maxMonthlyCount) * 100;
                  const isSelectedMonth = analyticsMonthFilter !== "ALL" && analyticsMonthFilter === `${item.monthIndex}`.padStart(2, "0");
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-1">
                      <div className="text-[10px] font-semibold text-slate-500">{item.count}</div>
                      <div
                        className={`w-full rounded-t-md ${isSelectedMonth ? "bg-[#0b4a8b]" : "bg-[#6da1d4]"}`}
                        style={{ height: `${Math.max(heightPercent, item.count > 0 ? 8 : 2)}%` }}
                      />
                      <div className="text-[10px] text-slate-500">{item.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <h4 className="text-sm font-semibold text-slate-700">Annual Trend</h4>
              {annualChartData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No annual data for selected filters.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {annualChartData.map((item) => {
                    const widthPercent = (item.count / maxAnnualCount) * 100;
                    return (
                      <div key={item.year} className="grid grid-cols-[64px_1fr_40px] items-center gap-3 text-sm">
                        <span className="font-semibold text-slate-700">{item.year}</span>
                        <div className="h-3 rounded-full bg-slate-100">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-[#0b4a8b] to-[#1e73be]"
                            style={{ width: `${Math.max(widthPercent, item.count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className="text-right text-slate-600">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

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
