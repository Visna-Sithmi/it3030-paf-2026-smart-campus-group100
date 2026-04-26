import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Handshake,
  Lightbulb,
  MapPin,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import Layout from "../../components/layout/Layout";
import logo from "../../assets/logo.jpeg";

const values = [
  {
    title: "Academic Excellence",
    description: "We support rigorous teaching, applied research, and reflective learning across every faculty.",
    icon: Award,
  },
  {
    title: "Responsible Innovation",
    description: "Students and staff use technology thoughtfully to solve real campus and community challenges.",
    icon: Lightbulb,
  },
  {
    title: "Inclusive Community",
    description: "Northbridge is designed around access, respect, collaboration, and student wellbeing.",
    icon: Users,
  },
  {
    title: "Operational Trust",
    description: "Campus services are visible, accountable, and built to help people act with confidence.",
    icon: ShieldCheck,
  },
];

const milestones = [
  "Expanded flexible learning spaces for lectures, seminars, labs, and group study.",
  "Launched a connected campus platform for booking resources and managing service requests.",
  "Strengthened academic administration through role-based dashboards and reporting.",
  "Built a service model that connects students, lecturers, managers, and support teams.",
];

const focusAreas = [
  "Computing and Information Systems",
  "Business and Management",
  "Engineering Technology",
  "Health Sciences",
  "Humanities and Social Sciences",
  "Architecture and Built Environment",
];

export default function AboutPage() {
  return (
    <Layout>
      <section className="relative overflow-hidden bg-[#071426] text-white">
        <img
          src={logo}
          alt="Northbridge University identity"
          className="northbridge-slow-turn absolute -right-32 top-8 h-[420px] w-[420px] object-cover opacity-10 sm:h-[560px] sm:w-[560px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#071426_0%,#0c2744_58%,#123b67_100%)] opacity-95" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <Building2 className="h-4 w-4" />
              About Northbridge University
            </p>
            <h1 className="mt-8 text-5xl font-bold leading-tight sm:text-6xl">
              A modern university built for learning, service, and progress.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Northbridge University brings academic programs, campus facilities, student support, and operational management into one connected environment for a stronger university experience.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1b4f7d]">Our purpose</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
              We help people learn well, work clearly, and participate fully in campus life.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Northbridge exists to create a dependable academic environment where teaching, research, student services, and facilities management support one another. The university combines strong academic foundations with practical systems that make everyday campus work easier to coordinate.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border-l-4 border-[#1b4f7d] bg-slate-50 p-5">
                <Target className="h-7 w-7 text-[#1b4f7d]" />
                <h3 className="mt-4 font-semibold text-slate-950">Mission</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  To prepare capable graduates through quality education, applied learning, and reliable student support.
                </p>
              </div>
              <div className="border-l-4 border-[#1b4f7d] bg-slate-50 p-5">
                <GraduationCap className="h-7 w-7 text-[#1b4f7d]" />
                <h3 className="mt-4 font-semibold text-slate-950">Vision</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  To be a trusted, future-ready university known for academic strength and connected campus services.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <value.icon className="h-7 w-7 text-[#1b4f7d]" />
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{value.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef4f8] py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1b4f7d]">Academic environment</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">
                Faculties and services that work together.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                Northbridge supports a broad set of disciplines while keeping campus operations close to the academic experience. Students and lecturers can access spaces, support, and services through a consistent digital workflow.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {focusAreas.map((area) => (
                  <div key={area} className="flex items-center gap-3 rounded-md bg-white p-4 shadow-sm">
                    <BookOpen className="h-5 w-5 shrink-0 text-[#1b4f7d]" />
                    <span className="text-sm font-medium text-slate-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-[#071426] p-8 text-white">
              <Handshake className="h-9 w-9 text-sky-300" />
              <h3 className="mt-6 text-2xl font-bold">How Northbridge works</h3>
              <div className="mt-6 space-y-4">
                {milestones.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1b4f7d]">Campus life</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-950">A campus designed for everyday momentum.</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              <div className="rounded-lg border border-slate-200 p-6">
                <MapPin className="h-7 w-7 text-[#1b4f7d]" />
                <h3 className="mt-5 font-semibold text-slate-950">Colombo Location</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  A city-connected academic setting with access to industry, culture, and community partnerships.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-6">
                <Users className="h-7 w-7 text-[#1b4f7d]" />
                <h3 className="mt-5 font-semibold text-slate-950">Student Support</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Services are built around clear access, quick response, and transparent communication.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-6 sm:col-span-2">
                <Building2 className="h-7 w-7 text-[#1b4f7d]" />
                <h3 className="mt-5 font-semibold text-slate-950">Facilities That Stay Useful</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Resource booking, issue reporting, and manager dashboards keep campus spaces available, maintained, and ready for teaching and learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071426] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">Northbridge portal</p>
            <h2 className="mt-3 text-3xl font-bold">Continue into the campus platform.</h2>
          </div>
          <Link
            to="/client/resources"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#09203d] transition hover:bg-slate-100"
          >
            Explore resources
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
