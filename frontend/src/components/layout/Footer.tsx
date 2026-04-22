import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  FileText,
  HelpCircle,
  ArrowUp,
  ChevronRight,
} from "lucide-react";
import logo from "../../assets/logo.jpeg";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "About University", path: "/about" },
    { name: "Academic Programs", path: "/academics" },
    { name: "Research", path: "/research" },
    { name: "Campus Life", path: "/campus-life" },
    { name: "Library", path: "/library" },
  ];

  const resourceLinks = [
    { name: "Book a Resource", path: "/client/resources" },
    { name: "Report an Issue", path: "/issues" },
    { name: "Booking History", path: "/my-bookings" },
    { name: "Resource Availability", path: "/availability" },
    { name: "FAQs", path: "/faqs" },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative mt-16 bg-[#081220] text-white border-t border-white/10">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#0f2f57] via-[#1d4d82] to-[#0f2f57]" />

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="absolute -top-5 left-1/2 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0f2f57] shadow-xl transition duration-300 hover:scale-105 hover:bg-[#17406f]"
        aria-label="Scroll to top"
      >
        <ArrowUp size={18} />
      </button>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-16 pb-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
                <img
                  src={logo}
                  alt="Northbridge University Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Northbridge
                </h2>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                  University
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              Northbridge University is dedicated to academic excellence,
              innovation, and student success by providing a modern environment
              for learning, research, and growth.
            </p>

            {/* Social Media */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:bg-[#1877f2] hover:text-white"
              >
                f
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:bg-[#1DA1F2] hover:text-white"
              >
                X
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:bg-[#0A66C2] hover:text-white"
              >
                in
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:bg-[#C13584] hover:text-white"
              >
                ig
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                  >
                    <ChevronRight
                      size={15}
                      className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white"
                    />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Resources
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                  >
                    <ChevronRight
                      size={15}
                      className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white"
                    />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-lg font-semibold text-white">
              Contact & Hours
            </h3>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <MapPin size={16} className="text-slate-200" />
                </div>
                <span>123 University Avenue, Colombo, Sri Lanka</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Phone size={16} className="text-slate-200" />
                </div>
                <span>+94 11 234 5678</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Mail size={16} className="text-slate-200" />
                </div>
                <span>info@northbridge.edu</span>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Clock size={16} className="text-slate-200" />
                </div>
                <div>
                  <p>Mon - sun: 8:30 AM - 8:30 PM</p>

                </div>
              </li>
            </ul>
          </div>
        </div>

        

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-5 text-sm">
            <Link
              to="/privacy"
              className="flex items-center gap-2 text-slate-400 transition hover:text-white"
            >
              <Shield size={15} />
              <span>Privacy Policy</span>
            </Link>

            <Link
              to="/terms"
              className="flex items-center gap-2 text-slate-400 transition hover:text-white"
            >
              <FileText size={15} />
              <span>Terms of Service</span>
            </Link>

            <Link
              to="/support"
              className="flex items-center gap-2 text-slate-400 transition hover:text-white"
            >
              <HelpCircle size={15} />
              <span>Help Center</span>
            </Link>
          </div>

          <p className="text-sm text-slate-500">
            © {currentYear} Northbridge University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;