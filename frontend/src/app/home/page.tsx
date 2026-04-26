import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarCheck,
  GraduationCap,
  Landmark,
  LibraryBig,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import Layout from "../../components/layout/Layout";
import logo from "../../assets/logo.jpeg";
import heroGraphic from "../../assets/hero.png";

const stats = [
  { label: "Learning spaces", value: "120+" },
  { label: "Student services", value: "24/7" },
  { label: "Faculties", value: "06" },
  { label: "Resource bookings", value: "Smart" },
];

const portals = [
  {
    title: "Student and Lecturer Portal",
    description: "Book labs, halls, study rooms, and shared facilities with live availability.",
    icon: GraduationCap,
    to: "/client/resources",
    action: "Explore resources",
  },
  {
    title: "Manager Operations",
    description: "Approve booking requests, manage campus assets, and coordinate issue resolution.",
    icon: ShieldCheck,
    to: "/manager/login",
    action: "Manager access",
  },
  {
    title: "Administration",
    description: "Maintain student, lecturer, helper staff, and reporting records from one secure console.",
    icon: Landmark,
    to: "/admin/login",
    action: "Admin access",
  },
];

const campusServices = [
  {
    title: "Academic Resource Booking",
    detail: "Reserve lecture halls, computer labs, seminar rooms, and collaborative spaces.",
    icon: CalendarCheck,
  },
  {
    title: "Facilities and Maintenance",
    detail: "Report technical, cleaning, security, and building issues with transparent tracking.",
    icon: Wrench,
  },
  {
    title: "Library and Research Support",
    detail: "Connect learning resources, quiet study zones, and research-ready campus services.",
    icon: LibraryBig,
  },
  {
    title: "Student Success Services",
    detail: "A connected university experience for academic work, support, and campus life.",
    icon: Users,
  },
];

const faculties = [
  "Computing and Information Systems",
  "Business and Management",
  "Engineering Technology",
  "Health Sciences",
  "Humanities and Social Sciences",
  "Architecture and Built Environment",
];

export default function HomePage() {
  return (
    <Layout>
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#071426] text-white">
        <img
          src={logo}
          alt="Northbridge University campus identity"
          className="northbridge-slow-turn absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[#071426]/75" />

        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-6 pb-20 pt-32 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Modern campus services for the Northbridge community
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Northbridge University
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              A connected academic campus where students, lecturers, managers, and administrators coordinate learning spaces, support services, and daily university operations with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/client/resources"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#09203d] shadow-lg transition hover:bg-slate-100"
              >
                Browse campus resources
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/client/login"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in to portal
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="border-l border-white/20 bg-white/[0.06] px-5 py-4 backdrop-blur">
                <p className="text-3xl font-bold text-white">{item.value}</p>
                <p className="mt-1 text-sm text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1b4f7d]">About Northbridge</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                A university built around academic excellence and operational clarity.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Northbridge University brings together teaching, research, student support, and campus management in one coordinated environment. The digital campus platform helps the community reserve facilities, resolve service issues, and keep university operations visible.
              </p>
              <div className="mt-8 flex items-start gap-4 border-l-4 border-[#1b4f7d] bg-slate-50 p-5">
                <Building2 className="mt-1 h-6 w-6 shrink-0 text-[#1b4f7d]" />
                <p className="text-sm leading-7 text-slate-700">
                  Located in Colombo, Northbridge supports flexible learning spaces, hands-on laboratories, collaborative project rooms, and administrative services for a growing academic community.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {campusServices.map((service) => (
                <div key={service.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <service.icon className="h-7 w-7 text-[#1b4f7d]" />
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{service.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">Academic portfolio</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Faculties designed for future-ready careers.</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {faculties.map((faculty) => (
                <div key={faculty} className="flex items-center gap-3 border border-white/10 bg-white/[0.04] p-4">
                  <BookOpen className="h-5 w-5 shrink-0 text-sky-300" />
                  <span className="text-sm text-slate-200">{faculty}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between bg-white p-8 text-slate-950">
            <div>
              <img src={heroGraphic} alt="Northbridge digital campus platform" className="h-28 w-28 object-contain" />
              <h3 className="mt-8 text-2xl font-bold">One platform for daily campus work.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The Northbridge portal connects resource reservations, maintenance tickets, booking approvals, reports, and profile services so every role can act quickly.
              </p>
            </div>
            <Link
              to="/client/login"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-[#09203d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123b67]"
            >
              Enter campus portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#eef4f8] py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1b4f7d]">Access points</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">Choose your university workspace.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Each portal is tailored to the work people actually do on campus, from booking rooms to approving requests and managing institutional records.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {portals.map((portal) => (
              <Link
                key={portal.title}
                to={portal.to}
                className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <portal.icon className="h-8 w-8 text-[#1b4f7d]" />
                <h3 className="mt-6 text-xl font-semibold text-slate-950">{portal.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{portal.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1b4f7d]">
                  {portal.action}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div>
            <div className="flex items-center gap-3 text-sm font-semibold text-[#1b4f7d]">
              <MapPin className="h-4 w-4" />
              Colombo, Sri Lanka
            </div>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Ready to use the Northbridge campus platform?</h2>
          </div>
          <Link
            to="/client/resources"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#09203d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123b67]"
          >
            Start with resources
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
