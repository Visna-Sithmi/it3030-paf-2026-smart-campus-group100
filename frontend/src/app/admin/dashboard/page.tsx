import { useEffect, useState, useMemo } from "react";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import {
  Users,
  School,
  Calendar,
  Shield,
  Sparkles,
  TrendingUp,
  Loader2,
  UserCheck,
  Briefcase,
  Wrench,
  UserRound,
  Building2,
  GraduationCap,
  ChevronRight,
  LayoutDashboard,
  PieChart,
  Award,
  Target,
  AlertCircle,
  BookOpen,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Crown,
  BarChart3,
} from "lucide-react";
import { managerService } from "../../../services/managerService";
import { studentService } from "../../../services/studentService";
import type { Manager } from "../../../types/manager";
import type { Student } from "../../../types/student";

// Types
type HelperRole = "TECHNICIAN" | "CLEANER" | "SECURITY";
type ManagerRole = "RESOURCE_MANAGER" | "BOOKING_MANAGER" | "ISSUE_MANAGER";

// University Color Theme
const theme = {
  primary: "#0F2B3D",
  secondary: "#1E4A6B",
  accent: "#C49A6C",
  accentLight: "#DDB892",
  lightBg: "#F0F4F8",
  cardBg: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#475569",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  cyan: "#06B6D4",
};

const roleLabel = (role: string) => role.replaceAll("_", " ");

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
};

// Enhanced Summary Card
const SummaryCard = ({ title, value, icon: Icon, color, trend, subtitle, delay }: any) => (
  <div
    className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
    style={{ 
      background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
      animation: `fadeInUp 0.6s ease-out ${delay || 0}s both`
    }}
  >
    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:scale-150 transition-transform duration-500">
      <Icon size={128} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <h3 className="mt-2 text-4xl font-bold text-white">
            <AnimatedCounter value={value} />
          </h3>
          {subtitle && <p className="mt-1 text-xs text-white/70">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs text-white/80">
              {trend.includes('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Role Stat Card
const RoleStatCard = ({ role, count, color, icon: Icon, delay }: any) => (
  <div 
    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105"
    style={{ animation: `fadeInLeft 0.5s ease-out ${delay}s both` }}
  >
    <div className="flex items-center gap-3">
      <div className="rounded-lg p-2 transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{roleLabel(role)}</p>
        <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>
          {count}
        </p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
  </div>
);

// Progress Ring Component
const ProgressRing = ({ value, label, color, total }: any) => {
  const percentage = (value / total) * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{Math.round(percentage)}%</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
};

// Insight Card
const InsightCard = ({ title, value, description, icon: Icon, color, delay }: any) => (
  <div 
    className="group rounded-xl bg-white p-5 shadow-md border border-slate-100 transition-all duration-300 hover:shadow-xl hover:scale-105"
    style={{ animation: `fadeInUp 0.5s ease-out ${delay}s both` }}
  >
    <div className="flex items-start gap-3">
      <div className="rounded-lg p-2 transition-all duration-300 group-hover:rotate-12" style={{ backgroundColor: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-600">{title}</h4>
        <p className="mt-1 text-2xl font-bold" style={{ color: theme.textPrimary }}>{value}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  </div>
);

// CSS Animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
`;
document.head.appendChild(styleSheet);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [lecturers, setLecturers] = useState<Manager[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [helpers, setHelpers] = useState<Manager[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");

      const [lecturerData, studentData, technicianData, cleanerData, securityData, resourceManagerData, bookingManagerData, issueManagerData] = await Promise.all([
        managerService.getManagersByRole("LECTURER"),
        studentService.getAllStudents(),
        managerService.getManagersByRole("TECHNICIAN"),
        managerService.getManagersByRole("CLEANER"),
        managerService.getManagersByRole("SECURITY"),
        managerService.getManagersByRole("RESOURCE_MANAGER"),
        managerService.getManagersByRole("BOOKING_MANAGER"),
        managerService.getManagersByRole("ISSUE_MANAGER"),
      ]);

      setLecturers(lecturerData);
      setStudents(studentData as Student[]);
      setHelpers([...technicianData, ...cleanerData, ...securityData]);
      setManagers([...resourceManagerData, ...bookingManagerData, ...issueManagerData]);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const counts = useMemo(() => {
    const helperRoles: HelperRole[] = ["TECHNICIAN", "CLEANER", "SECURITY"];
    const managerRoles: ManagerRole[] = ["RESOURCE_MANAGER", "BOOKING_MANAGER", "ISSUE_MANAGER"];
    
    const helperCounts = helperRoles.reduce((acc, role) => {
      acc[role] = helpers.filter(h => h.role === role).length;
      return acc;
    }, {} as Record<HelperRole, number>);
    
    const managerCounts = managerRoles.reduce((acc, role) => {
      acc[role] = managers.filter(m => m.role === role).length;
      return acc;
    }, {} as Record<ManagerRole, number>);
    
    return {
      lecturers: lecturers.length,
      students: students.length,
      technicians: helperCounts.TECHNICIAN || 0,
      cleaners: helperCounts.CLEANER || 0,
      security: helperCounts.SECURITY || 0,
      resourceManagers: managerCounts.RESOURCE_MANAGER || 0,
      bookingManagers: managerCounts.BOOKING_MANAGER || 0,
      issueManagers: managerCounts.ISSUE_MANAGER || 0,
      totalHelpers: helpers.length,
      totalManagers: managers.length,
      totalStaff: lecturers.length + helpers.length + managers.length,
      totalUniversityMembers: students.length + lecturers.length + helpers.length + managers.length,
    };
  }, [lecturers, students, helpers, managers]);

  const insights = useMemo(() => {
    const total = counts.totalUniversityMembers || 1;
    return {
      studentPercentage: ((counts.students / total) * 100).toFixed(1),
      staffPercentage: ((counts.totalStaff / total) * 100).toFixed(1),
      lecturerToStudentRatio: counts.lecturers ? (counts.students / counts.lecturers).toFixed(1) : "0",
      growth: "+12.5%",
    };
  }, [counts]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.lightBg }}>
        <Sidebar activeItem="Dashboard" />
        <div className="ml-72 min-h-screen">
          <Header adminName="Admin User" adminRole="Chancellor Administrator" />
          <div className="flex h-[calc(100vh-73px)] items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="mx-auto mb-4 animate-spin" size={64} style={{ color: theme.accent }} />
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-20" />
              </div>
              <p className="text-slate-500 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.lightBg }}>
      <Sidebar activeItem="Dashboard" />
      
      <div className="ml-72 min-h-screen">
        <Header adminName="Admin User" adminRole="Chancellor Administrator" />
        
        <main className="p-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2">
                <LayoutDashboard size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.primary }}>
                University Analytics Dashboard
              </h1>
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-600">Live Data</span>
              </div>
            </div>
            <p className="text-slate-500 ml-12">
              Comprehensive overview of Northbridge University's campus operations and demographics
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Main Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Students"
              value={counts.students}
              icon={GraduationCap}
              color={theme.primary}
              trend={`${insights.studentPercentage}% of total`}
              subtitle="Active Enrollments"
              delay="0"
            />
            <SummaryCard
              title="Academic Faculty"
              value={counts.lecturers}
              icon={School}
              color={theme.secondary}
              trend={`1:${insights.lecturerToStudentRatio} ratio`}
              subtitle="Teaching Staff"
              delay="0.1"
            />
            <SummaryCard
              title="Support Staff"
              value={counts.totalHelpers}
              icon={UserRound}
              color={theme.accent}
              trend="+2 this month"
              subtitle="Technicians, Cleaners & Security"
              delay="0.2"
            />
            <SummaryCard
              title="Department Managers"
              value={counts.totalManagers}
              icon={UserCheck}
              color={theme.info}
              trend="Full team"
              subtitle="Resource, Booking & Issue"
              delay="0.3"
            />
          </div>

          {/* Campus Overview Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-[#0F2B3D] to-[#1E4A6B] p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Campus Community</p>
                  <p className="mt-2 text-5xl font-bold text-white">
                    <AnimatedCounter value={counts.totalUniversityMembers} />
                  </p>
                  <div className="mt-4 flex gap-6">
                    <div>
                      <p className="text-xs text-white/70">Students</p>
                      <p className="text-xl font-semibold text-white">{counts.students}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70">Staff</p>
                      <p className="text-xl font-semibold text-white">{counts.totalStaff}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <Crown size={48} className="text-white/80" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-lg text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Star size={24} className="mx-auto mb-2" style={{ color: theme.accent }} />
                <p className="text-xs text-slate-500">Student-to-Faculty</p>
                <p className="text-2xl font-bold" style={{ color: theme.primary }}>{insights.lecturerToStudentRatio}:1</p>
                <p className="text-xs text-green-600 mt-1">Excellent Ratio</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-lg text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
                <BarChart3 size={24} className="mx-auto mb-2" style={{ color: theme.success }} />
                <p className="text-xs text-slate-500">Staff Efficiency</p>
                <p className="text-2xl font-bold" style={{ color: theme.primary }}>
                  {counts.totalUniversityMembers ? Math.round((counts.totalStaff / counts.totalUniversityMembers) * 100) : 0}%
                </p>
                <p className="text-xs text-green-600 mt-1">Optimized</p>
              </div>
            </div>
          </div>

          {/* Role Distribution Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
              <PieChart size={20} /> Staff Role Distribution
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-lg border border-slate-100">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Wrench size={14} /> Facility Support Team
                </h3>
                <div className="space-y-3">
                  <RoleStatCard role="TECHNICIAN" count={counts.technicians} color={theme.warning} icon={Wrench} delay="0" />
                  <RoleStatCard role="CLEANER" count={counts.cleaners} color={theme.info} icon={Sparkles} delay="0.1" />
                  <RoleStatCard role="SECURITY" count={counts.security} color={theme.danger} icon={Shield} delay="0.2" />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg border border-slate-100">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Briefcase size={14} /> Management Team
                </h3>
                <div className="space-y-3">
                  <RoleStatCard role="RESOURCE_MANAGER" count={counts.resourceManagers} color={theme.success} icon={Building2} delay="0" />
                  <RoleStatCard role="BOOKING_MANAGER" count={counts.bookingManagers} color={theme.accent} icon={Calendar} delay="0.1" />
                  <RoleStatCard role="ISSUE_MANAGER" count={counts.issueManagers} color={theme.danger} icon={AlertCircle} delay="0.2" />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg border border-slate-100">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Award size={14} /> Key Performance Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-600">Student Population</span>
                    <span className="text-lg font-bold" style={{ color: theme.primary }}>{counts.students}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-600">Total Staff</span>
                    <span className="text-lg font-bold" style={{ color: theme.secondary }}>{counts.totalStaff}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Staff-to-Student</span>
                    <span className="text-lg font-bold" style={{ color: theme.accent }}>
                      1:{Math.round(counts.students / counts.totalStaff) || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Rings Section */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-lg text-center">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">Student Distribution</h3>
              <ProgressRing value={counts.students} total={counts.totalUniversityMembers} label="Students" color={theme.primary} />
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-lg text-center">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">Staff Distribution</h3>
              <ProgressRing value={counts.totalStaff} total={counts.totalUniversityMembers} label="Staff Members" color={theme.secondary} />
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-lg text-center">
              <h3 className="text-sm font-semibold text-slate-500 mb-4">Management Coverage</h3>
              <ProgressRing value={counts.totalManagers} total={counts.totalStaff || 1} label="Managers Ratio" color={theme.accent} />
            </div>
          </div>

          {/* Campus Insights Section - Full Width */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
              <Target size={20} /> Campus Insights
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InsightCard
                title="Student Population"
                value={counts.students}
                description={`${insights.studentPercentage}% of total campus community`}
                icon={GraduationCap}
                color={theme.primary}
                delay="0"
              />
              <InsightCard
                title="Support Coverage"
                value={`${counts.technicians + counts.security + counts.cleaners}`}
                description="Facility & security staff available 24/7"
                icon={Shield}
                color={theme.accent}
                delay="0.1"
              />
              <InsightCard
                title="Management Efficiency"
                value={`${counts.totalStaff ? Math.round((counts.totalManagers / counts.totalStaff) * 100) : 0}%`}
                description="Optimal management-to-staff ratio"
                icon={TrendingUp}
                color={theme.success}
                delay="0.2"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
            <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-slate-400" />
                <p className="text-xs text-slate-400">
                  Northbridge University Management System — Real-time Analytics Dashboard
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}