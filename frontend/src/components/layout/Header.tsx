// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Info, 
  Package, 
  AlertTriangle, 
  User, 
  Bell, 
  LogOut, 
  LogIn,
  Menu,
  X,
  ChevronDown,
  Calendar,
  MessageSquare,
  Settings,
  Sparkles
} from 'lucide-react';
import logo from '../../assets/logo.jpeg';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from '../notifications/NotificationPanel';
import {
  getNotifications,
  markAsRead,
  type NotificationItem,
} from '../../services/notificationService';


const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; studentId?: string; email: string; role: string; profileImageUrl?: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const currentUserId = Number(localStorage.getItem("id") || localStorage.getItem("studentId") || "0");
  const canViewNotifications = Number.isFinite(currentUserId) && currentUserId > 0;
  
  const navigate = useNavigate();
  const location = useLocation();

  const syncUserFromStorage = () => {
    const storedRole = localStorage.getItem("role");
    const storedStudentId = localStorage.getItem("studentId");
    const storedId = localStorage.getItem("id");
    const storedName = localStorage.getItem("studentName") || localStorage.getItem("user");
    const storedLecturerName = localStorage.getItem("name") || storedName;
    const storedEmail = localStorage.getItem("email");
    const storedProfileImage = localStorage.getItem("profileImageUrl");
    const resolvedProfileImage = storedProfileImage
      ? (storedProfileImage.startsWith("http")
          ? storedProfileImage
          : `http://localhost:8081${storedProfileImage.startsWith("/") ? storedProfileImage : `/${storedProfileImage}`}`)
      : "";

    if (storedRole === "STUDENT" && (storedStudentId || storedId)) {
      setUser({
        name: storedName || "Student",
        studentId: storedStudentId || storedId || "",
        email: storedEmail || `${storedStudentId || storedId}@northbridge.edu`,
        role: "STUDENT",
        profileImageUrl: resolvedProfileImage,
      });
      setIsLoggedIn(true);
      return;
    }

    if (storedRole === "LECTURER" && (storedEmail || storedLecturerName || storedId)) {
      setUser({
        name: storedLecturerName || "Lecturer",
        email: storedEmail || "lecturer@northbridge.edu",
        role: "LECTURER",
        profileImageUrl: resolvedProfileImage,
      });
      setIsLoggedIn(true);
      return;
    }

    if (
      (storedRole === "TECHNICIAN" || storedRole === "CLEANER" || storedRole === "SECURITY") &&
      (storedEmail || storedLecturerName || storedId)
    ) {
      setUser({
        name: storedLecturerName || "Helper Staff",
        email: storedEmail || `${storedRole.toLowerCase()}@northbridge.edu`,
        role: storedRole,
      });
      setIsLoggedIn(true);
      return;
    }

    setUser(null);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    syncUserFromStorage();

    // Handle scroll effect with JavaScript animation
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname, isScrolled]);

      useEffect(() => {
        const handleProfileUpdate = () => syncUserFromStorage();
        window.addEventListener("profile-updated", handleProfileUpdate);
        window.addEventListener("student-profile-updated", handleProfileUpdate);
        window.addEventListener("storage", handleProfileUpdate);

        return () => {
          window.removeEventListener("profile-updated", handleProfileUpdate);
          window.removeEventListener("student-profile-updated", handleProfileUpdate);
          window.removeEventListener("storage", handleProfileUpdate);
        };
      }, []);

      useEffect(() => {
        if (!canViewNotifications) {
          setNotifications([]);
          return;
        }

        let isMounted = true;

        const loadNotifications = async () => {
          try {
            setNotificationsLoading(true);
            const data = await getNotifications(currentUserId);
            if (isMounted) {
              setNotifications(data.filter((item) => !item.read));
            }
          } catch (error) {
            console.error("Failed to fetch notifications:", error);
          } finally {
            if (isMounted) {
              setNotificationsLoading(false);
            }
          }
        };

        loadNotifications();
        const intervalId = window.setInterval(loadNotifications, 10000);

        return () => {
          isMounted = false;
          window.clearInterval(intervalId);
        };
      }, [canViewNotifications, currentUserId]);

  const handleMarkNotificationRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.filter((item) => item.id !== notificationId)
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.read);
    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      await Promise.all(unreadNotifications.map((item) => markAsRead(item.id)));
      setNotifications([]);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const unreadCount = notifications.length;

  const handleLogout = () => {
    // Clear all student-related localStorage items
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("studentId");
    localStorage.removeItem("studentName");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("id");
    localStorage.removeItem("profileImageUrl");
    
    setUser(null);
    setIsLoggedIn(false);
    setIsUserDropdownOpen(false);
    
    // Animated redirect
    document.body.style.opacity = '0';
    setTimeout(() => {
      navigate("/client/login");
      document.body.style.opacity = '1';
    }, 300);
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "About Us", path: "/about", icon: Info },
    { name: "Resources", path: "/client/resources", icon: Package },
    { name: "Issue Reporting", path: "/my-tickets", icon: AlertTriangle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-[#001a2f] shadow-2xl py-2" 
            : "bg-[#002147] py-3"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Section - Left with animation */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
              onMouseEnter={() => setActiveHover('logo')}
              onMouseLeave={() => setActiveHover(null)}
            >
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl blur-md transition-opacity duration-300 ${activeHover === 'logo' ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src={logo} 
                    alt="Northbridge University Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-['Newsreader'] text-xl font-bold tracking-tight text-white leading-tight">
                  Northbridge
                </h1>
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/60 font-medium">
                  University
                </p>
              </div>
            </Link>

            {/* Desktop Navigation - Center with animated underline */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onMouseEnter={() => setActiveHover(item.name)}
                  onMouseLeave={() => setActiveHover(null)}
                  className={`relative flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white font-medium rounded-lg transition-all duration-300 group ${
                    isActive(item.path) ? 'text-white' : ''
                  }`}
                >
                  <item.icon 
                    size={18} 
                    className={`transition-all duration-300 ${
                      activeHover === item.name ? 'scale-110 rotate-6' : ''
                    }`} 
                  />
                  <span>{item.name}</span>
                  {/* Shorter white underline on hover - only 60% width */}
                  <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-white/80 to-white transition-all duration-300 ${
                    activeHover === item.name ? 'w-12' : 'w-0'
                  } ${isActive(item.path) ? 'w-12' : ''}`}></span>
                </Link>
              ))}
            </nav>

            {/* Right Section - User Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications Icon Only with pulse animation */}
                {canViewNotifications && (
                  <div className="relative">
                    <NotificationBell
                      unreadCount={unreadCount}
                      isOpen={isNotificationsOpen}
                      onToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    />
                    {isNotificationsOpen && (
                      <NotificationPanel
                        notifications={notifications}
                        loading={notificationsLoading}
                        onMarkAsRead={handleMarkNotificationRead}
                        onMarkAllAsRead={handleMarkAllNotificationsRead}
                        onClose={() => setIsNotificationsOpen(false)}
                      />
                    )}
                  </div>
                )}

              {/* User Section */}
              {isLoggedIn && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 border border-white/20">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-[10px] text-white/60">{user.email}</p>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-white/60 group-hover:text-white transition-all duration-300 ${
                        isUserDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* User Dropdown with animation */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-[#004080] rounded-full flex items-center justify-center shadow-md">
                            {user.profileImageUrl ? (
                              <img
                                src={user.profileImageUrl}
                                alt={user.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-lg font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {user.role === "STUDENT"
                                ? `Student ID: ${user.studentId || "N/A"}`
                                : "Role: Lecturer"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link to="/client/profile" className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <User size={16} /> My Profile
                        </Link>
                        <Link to="/my-bookings" className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <Calendar size={16} /> My Bookings
                        </Link>
                        <Link to="/my-issues" className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <MessageSquare size={16} /> My Reports
                        </Link>
                        <Link to="/settings" className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <Settings size={16} /> Settings
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 py-2">
                        <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/client/login"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 border border-white/20 group"
                >
                  <LogIn size={18} className="group-hover:rotate-6 transition-transform" />
                  <span>Login</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-all"
              >
                {isMobileMenuOpen ? <X size={24} className="animate-spin-once" /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu with animation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col gap-2 pt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all ${
                      isActive(item.path) ? 'text-white bg-white/5' : ''
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                ))}
                {!isLoggedIn && (
                  <Link
                    to="/client/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-white font-semibold rounded-xl bg-white/10 mt-2"
                  >
                    <LogIn size={20} />
                    <span>Login</span>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-[60px] md:h-[64px]"></div>
    </>
  );
};

export default Header;
