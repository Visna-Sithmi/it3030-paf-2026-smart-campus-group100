import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Clock, Flame, Layers, TrendingDown, TrendingUp, Users } from "lucide-react";

const THEME_COLORS = {
  primary: "#1E3A8A",
  secondary: "#2563EB",
  accent: "#3B82F6",
  teal: "#0EA5E9",
  green: "#059669",
  emerald: "#10B981",
  red: "#DC2626",
  muted: "#64748B"
};

import { getManagerAnalytics, type ManagerAnalytics } from "../../../services/ticketService";

const PIE_COLORS = [
  THEME_COLORS.primary,
  THEME_COLORS.secondary,
  THEME_COLORS.accent,
  THEME_COLORS.teal,
  THEME_COLORS.emerald,
  THEME_COLORS.green,
  THEME_COLORS.muted
];

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function formatHours(h: number) {
  if (!Number.isFinite(h) || h <= 0) return "—";
  return `${h.toFixed(2)}h`;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-3 w-40 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function ChartSkeleton({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mt-4 h-[260px] w-full animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function ManagerDashboard() {
  const [data, setData] = useState<ManagerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log("Fetching manager analytics...");
        const response = await getManagerAnalytics();
        console.log("Analytics response:", response);
        
        if (!mounted) return;
        
        setData(response?.data || {
          totalTickets: 0,
          activeTickets: 0,
          avgResolutionTime: 0,
          slaBreachPercentage: 0,
          categoryStats: {},
          ticketsPerDay: {},
          topTechnicians: []
        });

      } catch (err: any) {
        console.error("Analytics fetch error:", err);
        if (!mounted) return;
        
        const errorMessage = err?.response?.data || err?.message || "Failed to load analytics";
        setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const categoryData = useMemo(() => {
    if (!data?.categoryStats || Object.keys(data.categoryStats).length === 0) {
      return [{ name: "No Data", value: 1 }];
    }
    return Object.entries(data.categoryStats)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const perDayData = useMemo(() => {
    if (!data?.ticketsPerDay || Object.keys(data.ticketsPerDay).length === 0) {
      return [{ date: "No Data", count: 0 }];
    }
    return Object.entries(data.ticketsPerDay)
      .map(([date, count]) => ({ date, count: Number(count) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const topTechData = useMemo(() => {
    if (!data?.topTechnicians || data.topTechnicians.length === 0) {
      return [{ name: "No Data", count: 0 }];
    }
    return data.topTechnicians.map((t) => ({ name: t.name, count: Number(t.count) }));
  }, [data]);

  const totalTickets = useMemo(() => {
    if (typeof data?.totalTickets === "number") return data.totalTickets;
    return categoryData.reduce((sum, x) => sum + (Number(x.value) || 0), 0);
  }, [data, categoryData]);

  const activeTickets = useMemo(() => {
    if (typeof data?.activeTickets === "number") return data.activeTickets;
    return 0;
  }, [data]);

  const avgResolution = Number(data?.avgResolutionTime || 0);
  const slaBreachPct = clampPct(Number(data?.slaBreachPercentage || 0));

  const mostCommonCategory = categoryData[0]?.name !== "No Data" ? categoryData[0]?.name : "—";
  const topTechnician = topTechData[0]?.name !== "No Data" ? topTechData[0]?.name : "—";

  const ticketsTrend = useMemo(() => {
    if (perDayData.length < 2) return 0;
    const a = perDayData[perDayData.length - 2]?.count ?? 0;
    const b = perDayData[perDayData.length - 1]?.count ?? 0;
    const diff = b - a;
    if (!Number.isFinite(diff)) return 0;
    return diff;
  }, [perDayData]);

  const hasRealData = categoryData.length > 0 && categoryData[0]?.name !== "No Data";

  if (loading) {
    return (
      <div className="rounded-3xl bg-linear-to-br from-indigo-50 via-slate-50 to-emerald-50 p-1 shadow-sm">
        <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-900">Manager Analytics</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Ticket Performance Dashboard</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <ChartSkeleton title="Category distribution" />
            <ChartSkeleton title="Tickets per day" />
            <ChartSkeleton title="Top technicians" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl bg-linear-to-br from-indigo-50 via-slate-50 to-emerald-50 p-1 shadow-sm">
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-900">Manager Analytics</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Ticket Performance Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">
              Workload, trends, resolution performance, and SLA health for Issue Managers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900">
              Clean insights
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Manager-focused
            </span>
          </div>
        </div>

        {false && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Error: {error}
          </div>
        )}

        {!error && !hasRealData && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            No ticket data available. Create some tickets to see analytics.
          </div>
        )}

        {/* KPIs */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total Tickets</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{totalTickets}</p>
                <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Layers className="h-4 w-4 text-indigo-900" />
                  Overall workload snapshot
                </p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-900">
                <Layers className="h-6 w-6" />
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Avg Resolution</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{formatHours(avgResolution)}</p>
                <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Created → Resolved (mean)
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </motion.div>



          <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Active Tickets</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{activeTickets || "—"}</p>
                <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Flame className="h-4 w-4 text-rose-600" />
                  Not Closed / Rejected
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
                <Flame className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Category distribution</p>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900">
                {categoryData.filter(c => c.name !== "No Data").length} categories
              </span>
            </div>
            <div className="mt-4 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <PieChart>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff"
                    }}
                    labelStyle={{ color: "#93C5FD" }}
                  />
                  <Legend verticalAlign="bottom" height={70} />
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}>
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Tickets per day</p>
              {perDayData[0]?.date !== "No Data" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    ticketsTrend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                  title="Compared to previous day"
                >
                  {ticketsTrend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {ticketsTrend >= 0 ? `+${ticketsTrend}` : `${ticketsTrend}`}
                </span>
              )}
            </div>
            <div className="mt-4 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <LineChart data={perDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={18} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff"
                    }}
                    labelStyle={{ color: "#93C5FD" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={THEME_COLORS.secondary} 
                    strokeWidth={3} 
                    dot={{ r: 3 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Top technicians</p>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Resolved volume</span>
            </div>
            <div className="mt-4 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <BarChart data={topTechData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "10px",
                      color: "#fff"
                    }}
                    labelStyle={{ color: "#93C5FD" }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={THEME_COLORS.green} 
                    radius={[10, 10, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Insights */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">Performance insights</p>
              <div className="rounded-2xl bg-slate-50 p-2 text-slate-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Top performing technician</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{topTechnician}</p>
                <p className="mt-1 text-xs text-slate-600">Highest resolved ticket volume.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Most common issue category</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{mostCommonCategory}</p>
                <p className="mt-1 text-xs text-slate-600">Good candidate for preventive maintenance or SOP improvement.</p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">Manager notes</p>
              <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-900">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="font-semibold text-indigo-900">SLA health</p>
                <p className="mt-1 text-sm text-indigo-900/80">
                  {slaBreachPct > 10
                    ? "Breach rate is elevated. Consider rebalancing assignments or tightening triage."
                    : "Breach rate looks healthy. Keep monitoring high-priority categories."}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="font-semibold text-emerald-900">Resolution efficiency</p>
                <p className="mt-1 text-sm text-emerald-900/80">
                  {avgResolution > 24
                    ? "Average resolution time is above 24h. Review bottlenecks in peak categories."
                    : "Resolution time is within a good range. Watch for spikes on busy days."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}