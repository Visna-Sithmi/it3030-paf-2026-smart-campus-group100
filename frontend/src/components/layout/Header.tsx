import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, Home, LogIn, LogOut, Menu, Package, User, X } from "lucide-react";
import logo from "../../assets/logo.jpeg";

type HeaderUser = {
  name: string;
  studentId: string;
  email: string;
  role: string;
  profileImageUrl?: string;
};

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = !!user;

  const syncLoggedInUser = () => {
    const storedRole = localStorage.getItem("role");
    const storedStudentId = localStorage.getItem("studentId");
    const storedName = localStorage.getItem("studentName") || localStorage.getItem("name") || "";
    const storedEmail = localStorage.getItem("email") || "";
    const profileImageUrl = localStorage.getItem("profileImageUrl") || "";

    if (storedRole === "STUDENT" && storedStudentId) {
      setUser({
        name: storedName || "Student",
        studentId: storedStudentId,
        email: storedEmail || `${storedStudentId}@northbridge.edu`,
        role: storedRole,
        profileImageUrl,
      });
      return;
    }

    setUser(null);
  };

  useEffect(() => {
    syncLoggedInUser();

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    const handleProfileUpdated = () => syncLoggedInUser();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("student-profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("student-profile-updated", handleProfileUpdated);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("studentId");
    localStorage.removeItem("studentName");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("id");
    localStorage.removeItem("profileImageUrl");
    setUser(null);
    navigate("/client/login");
  };

  const navItems = [
    { name: "Home", path: isLoggedIn ? "/client/dashboard" : "/client/login", icon: Home },
    { name: "Resources", path: "/client/resources", icon: Package },
    { name: "My Bookings", path: "/my-bookings", icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? "bg-[#001a2f] py-2 shadow-2xl" : "bg-[#002147] py-3"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            <Link to={isLoggedIn ? "/client/dashboard" : "/client/login"} className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl bg-white/10">
                <img src={logo} alt="Northbridge University Logo" className="h-full w-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">Northbridge</h1>
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/60">University</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive(item.path)
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {isLoggedIn && user ? (
                <>
                  <Link
                    to="/client/profile"
                    className="hidden items-center gap-3 rounded-full border border-white/20 bg-white/10 px-3 py-2 transition hover:bg-white/20 md:flex"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-[10px] text-white/70">{user.studentId}</p>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/client/login"
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-white transition hover:bg-white/20"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </Link>
              )}

              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="mt-4 border-t border-white/10 pb-4 pt-4 md:hidden">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive(item.path)
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {isLoggedIn ? (
                  <>
                    <Link
                      to="/client/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/client/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <LogIn size={16} />
                    <span>Login</span>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <div className="h-[60px] md:h-[64px]"></div>
    </>
  );
};

export default Header;