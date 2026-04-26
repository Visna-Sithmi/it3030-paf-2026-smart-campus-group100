import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import logo from "../../../assets/logo.jpeg";
import { bookingService } from "../../../services/bookingService";
import { resourceService } from "../../../services/resource.service";
import type { BookingResponseDTO } from "../../../types/booking";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getAuthItem } from "../../../services/authSession";

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
  const [historyPage, setHistoryPage] = useState(1);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(startOfMonth(new Date()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("");

  const userName = getAuthItem("name") || "Booking Manager";

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
    const role = getAuthItem("role");
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

  const monthlyChartYear = analyticsYearFilter === "ALL"
    ? availableAnalyticsYears[0] || String(new Date().getFullYear())
    : analyticsYearFilter;

  useEffect(() => {
    const targetYear = Number(monthlyChartYear);
    if (Number.isNaN(targetYear)) return;

    const targetMonth = analyticsMonthFilter === "ALL" ? 0 : Math.max(0, Number(analyticsMonthFilter) - 1);
    setCurrentCalendarMonth(startOfMonth(new Date(targetYear, targetMonth, 1)));
  }, [monthlyChartYear, analyticsMonthFilter]);

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

  const maxMonthlyCount = Math.max(1, ...monthlyChartData.map((item) => item.count));

  const monthlyCalendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentCalendarMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentCalendarMonth), { weekStartsOn: 1 }),
      }),
    [currentCalendarMonth]
  );

  const monthlyCalendarBookingCounts = useMemo(() => {
    const counts = new Map<string, number>();

    analyticsFilteredBookings
      .filter((booking) => (booking.bookingDate || "").slice(0, 4) === monthlyChartYear)
      .forEach((booking) => {
        const dateKey = booking.bookingDate || "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
        }
      });

    return counts;
  }, [analyticsFilteredBookings, monthlyChartYear]);

  const selectedCalendarDateCount = selectedCalendarDate ? (monthlyCalendarBookingCounts.get(selectedCalendarDate) || 0) : 0;

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

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, historyDateFilter, historyStatusFilter, historyResourceTypeFilter]);

  const pageSize = 10;
  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistoryBookings.length / pageSize));

  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(totalHistoryPages);
    }
  }, [historyPage, totalHistoryPages]);

  const paginatedHistoryBookings = useMemo(() => {
    const startIndex = (historyPage - 1) * pageSize;
    return filteredHistoryBookings.slice(startIndex, startIndex + pageSize);
  }, [filteredHistoryBookings, historyPage]);

  const visibleHistoryPageNumbers = useMemo(() => {
    const pages: Array<number | "..."> = [];

    if (totalHistoryPages <= 7) {
      for (let i = 1; i <= totalHistoryPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    if (historyPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, historyPage - 1);
    const end = Math.min(totalHistoryPages - 1, historyPage + 1);
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (historyPage < totalHistoryPages - 2) {
      pages.push("...");
    }
    pages.push(totalHistoryPages);

    return pages;
  }, [historyPage, totalHistoryPages]);

  const handleDeleteHistoryBooking = async (bookingId: number) => {
    const confirmed = window.confirm("Delete this booking record from history?");
    if (!confirmed) return;

    try {
      setDeletingBookingId(bookingId);
      setError("");
      await bookingService.deleteBooking(bookingId);
      setBookings((prev) => prev.filter((booking) => booking.bookingId !== bookingId));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to delete booking history record");
    } finally {
      setDeletingBookingId(null);
    }
  };

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
              <h4 className="text-sm font-semibold text-slate-700">Resource Type Distribution</h4>
              {resourceTypeChartData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No data for selected filters.</p>
              ) : (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={resourceTypeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {resourceTypeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => value}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                    {resourceTypeChartData
                      .sort((a, b) => b.count - a.count)
                      .map((item, idx) => {
                        const percentage = totalTypeCount > 0 ? ((item.count / totalTypeCount) * 100) : 0;
                        return (
                          <div key={item.type} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartPalette[idx % chartPalette.length] }} />
                              <span className="font-semibold text-slate-700">{item.type.replaceAll("_", " ")}</span>
                            </div>
                            <span className="text-slate-600">
                              {item.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-700">Monthly Trend ({monthlyChartYear})</h4>
              <div className="mt-4 grid h-52 grid-cols-12 items-end gap-2">
                {monthlyChartData.map((item) => {
                  const barHeightPx = item.count > 0
                    ? Math.max((item.count / maxMonthlyCount) * 136, 8)
                    : 4;
                  const isSelectedMonth = analyticsMonthFilter !== "ALL" && analyticsMonthFilter === `${item.monthIndex}`.padStart(2, "0");
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-1">
                      <div className="text-[10px] font-semibold text-slate-500">{item.count}</div>
                      <div
                        className={`w-full rounded-t-md ${isSelectedMonth ? "bg-[#0b4a8b]" : "bg-[#6da1d4]"}`}
                        style={{ height: `${barHeightPx}px` }}
                      />
                      <div className="text-[10px] text-slate-500">{item.month}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(2,33,71,0.08)]">
                <div className="rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-[#002147] via-[#0f3460] to-[#1f4e79] px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-white/10 p-2">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Booking Calendar ({monthlyChartYear})</p>
                      <p className="text-xs text-slate-200">Dates with bookings are highlighted.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth((month) => addMonths(month, -1))}
                      className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <h5 className="text-sm font-semibold text-slate-900">
                      {format(currentCalendarMonth, "MMMM yyyy")}
                    </h5>

                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth((month) => addMonths(month, 1))}
                      className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="py-1.5">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {monthlyCalendarDays.map((day) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const bookingCount = monthlyCalendarBookingCounts.get(dateKey) || 0;
                      const isHighlighted = bookingCount > 0;
                      const isCurrentMonthDay = isSameMonth(day, currentCalendarMonth);
                      const isSelected = selectedCalendarDate ? isSameDay(day, new Date(selectedCalendarDate)) : false;

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => setSelectedCalendarDate(dateKey)}
                          className={`relative flex h-9 w-full items-center justify-center rounded-full text-xs font-semibold transition ${
                            !isCurrentMonthDay
                              ? "text-slate-300"
                              : isSelected
                                ? "bg-[#002147] text-white shadow-lg shadow-[#002147]/20"
                                : isHighlighted
                                  ? "bg-[#dbeafe] text-[#0b4a8b] ring-1 ring-[#60a5fa]/60"
                                  : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {format(day, "d")}
                          {isHighlighted && !isSelected && (
                            <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[#0b4a8b]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-700">
                        {selectedCalendarDate ? format(new Date(selectedCalendarDate), "EEE, MMM d, yyyy") : "Select a date"}
                      </span>
                      <span className="rounded-full bg-[#e6eef8] px-2 py-0.5 font-semibold text-[#0b4a8b]">
                        {selectedCalendarDate ? `${selectedCalendarDateCount} booking(s)` : "No date selected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
            <p>
              Showing {filteredHistoryBookings.length} actioned booking(s) · Page {historyPage} of {totalHistoryPages}
            </p>
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
                    <th className="px-4 py-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedHistoryBookings.map((booking) => (
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
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryBooking(booking.bookingId)}
                          disabled={deletingBookingId === booking.bookingId}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingBookingId === booking.bookingId ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredHistoryBookings.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                disabled={historyPage === 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {visibleHistoryPageNumbers.map((page, index) => (
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-xs text-slate-500">...</span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setHistoryPage(page)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      historyPage === page
                        ? "border-[#002147] bg-[#002147] text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
                disabled={historyPage === totalHistoryPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
