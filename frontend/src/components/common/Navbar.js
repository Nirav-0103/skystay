import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useTheme } from "../../context/ThemeContext";
import AuthModal from "../auth/AuthModal";
import {
  FiBell, FiUser, FiLogOut, FiSettings,
  FiMoon, FiSun, FiHeart, FiBriefcase,
  FiPercent, FiStar, FiGlobe, FiChevronRight,
  FiChevronDown, FiX, FiMenu, FiRefreshCw, FiTrash2, FiClock,
  FiCheckCircle, FiEye, FiZap
} from "react-icons/fi";
import { MdFlight, MdHotel, MdMap } from "react-icons/md";

export default function Navbar() {
  const { 
    user, logout, 
    markNotifRead, markAllNotifsRead, clearAllNotifs, deleteNotif 
  } = useAuth();
  const { currency, changeCurrency, currencies } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [profile, setProfile] = useState(false);
  const [menu, setMenu] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const currencyRef = useRef(null);

  // 🔹 Logic to handle transparency: Only transparent on Home page when NOT scrolled
  const isHome = router.pathname === "/";
  const isSolid = true; // Forcing solid as requested by user previously

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setShowCurrencyMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu]);

  const handleMarkAllRead = async () => {
    await markAllNotifsRead();
  };

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    await markNotifRead(id);
  };

  const handleClearAll = async () => {
    if (confirm('Clear all notifications?')) await clearAllNotifs();
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    await deleteNotif(id);
  };

  const handleNotifClick = async (n) => {
    setSelectedNotif(n);
    if (!n.read) {
      await markNotifRead(n._id);
    }
  };

  const NAV_LINKS = [
    { href: "/ai-trip-planner", label: "AI Planner", icon: <FiZap size={17} />,    color: "#eab308" },
    { href: "/hotels",       label: "Hotels",   icon: <MdHotel size={17} />,   color: "#2563eb" },
    { href: "/flights",      label: "Flights",  icon: <MdFlight size={17} />,  color: "#7c3aed" },
    { href: "/deals",        label: "Deals",    icon: <FiPercent size={15} />, color: "#d97706" },
    { href: "/destinations", label: "Explore",  icon: <MdMap size={17} />,     color: "#059669" },
    { href: "/feed",         label: "SkyFeed",  icon: <FiStar size={15} />,    color: "#db2777" },
  ];

  const MOBILE_ACCOUNT_LINKS = [
    { href: "/bookings",          icon: <FiBriefcase size={17} />, label: "My Bookings"       },
    { href: "/refunds",           icon: <FiRefreshCw size={17} />, label: "My Refunds"        },
    { href: "/loyalty",           icon: <FiStar size={17} />,      label: "Rewards Program"   },
    { href: "/feed",              icon: <FiStar size={17} />,      label: "SkyFeed"           },
    { href: "/profile",           icon: <FiUser size={17} />,      label: "Profile Settings"  },
    { href: "/wishlist",          icon: <FiHeart size={17} />,     label: "Wishlist"          },
    ...(user?.role === "admin" ? [{ href: "/admin", icon: <FiSettings size={17} />, label: "Admin Portal" }] : []),
    { href: "/bookings/checkin",  icon: <MdFlight size={17} />,    label: "Online Check-in", accent: true },
  ];

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + "/");
  const closeAll = () => { setProfile(false); setShowNotifs(false); setShowCurrencyMenu(false); setMenu(false); };

  const isDark = theme === "dark";
  const unreadCount = user?.notifications?.filter(n => !n.read).length || 0;

  // 🔹 Auto-mark as read when dropdown is opened
  useEffect(() => {
    if (showNotifs && unreadCount > 0) {
      handleMarkAllRead();
    }
  }, [showNotifs]);

  const PROFILE_LINKS = [
    { href: "/profile",  icon: <FiUser size={16} />,     label: "Profile Settings" },
    { href: "/bookings", icon: <FiBriefcase size={16} />, label: "Manage Bookings" },
    { href: "/wishlist", icon: <FiHeart size={16} />,     label: "My Wishlist" },
    { href: "/loyalty",  icon: <FiStar size={16} />,      label: "Rewards Program" },
    ...(user?.role === "admin" ? [{ href: "/admin", icon: <FiSettings size={16} />, label: "Admin Portal" }] : []),
  ];

  return (
    <>
      {/* Container wrapper for the floating island effect */}
      <div className={`fixed top-0 w-full z-50 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${scrolled ? 'pt-6 px-4 md:px-8' : 'pt-0 px-0'}`}>
        
        <nav className={`relative pointer-events-auto mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${scrolled 
            ? `max-w-5xl rounded-[32px] ${isDark ? 'bg-slate-900/60 border border-white/10' : 'bg-white/60 border border-black/5'} shadow-2xl`
            : `max-w-full rounded-none ${isDark ? 'bg-slate-900/80 border-b border-white/5' : 'bg-white/80 border-b border-black/5'} shadow-sm`
          }`}
          style={{
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            boxShadow: scrolled 
              ? (isDark ? 'inset 0 1px 1px rgba(255,255,255,0.1), 0 32px 64px rgba(0,0,0,0.4)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 32px 64px rgba(0,0,0,0.08)')
              : 'none'
          }}
        >
        
        {/* Animated Gloss Shine (Apple signature detail) */}
        {scrolled && (
          <div className="absolute inset-0 pointer-events-none rounded-[32px] z-[-1]" style={{
             background: 'linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)',
             opacity: isDark ? 0.05 : 0.4
          }} />
        )}

        <div className={`mx-auto px-6 flex items-center justify-between transition-all duration-700 ${scrolled ? 'py-3' : 'py-4 max-w-7xl'}`}>

          {/* LOGO */}
          <Link href="/" onClick={closeAll} className="flex items-center cursor-pointer group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 transition group-hover:scale-105 shadow-[0_8px_16px_rgba(37,99,235,0.2)] shrink-0">
              <MdFlight size={20} color="white" />
            </div>
            <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${scrolled ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-2'}`}>
              <span className={`text-2xl font-black tracking-[-0.05em] whitespace-nowrap ${isDark ? "text-white" : "text-gray-900"}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                SkyStay
              </span>
            </div>
          </Link>

          {/* NAV LINKS — Desktop */}
          <div className="hidden md:flex gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200
                  ${isActive(link.href)
                    ? "bg-blue-600/15 text-blue-600"
                    : `${isDark ? "text-slate-300 hover:text-blue-400 hover:bg-slate-800" : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"}`
                  }`}
              >
                <span className={isActive(link.href) ? "text-blue-600" : `${isDark ? "text-slate-500 group-hover:text-blue-400" : "text-gray-500 group-hover:text-blue-500"}`}>{link.icon}</span>
                <span>{link.label}</span>
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] bg-blue-600 rounded-full transition-all duration-300
                  ${isActive(link.href) ? "w-4" : "w-0 group-hover:w-4"}`} />
              </Link>
            ))}
            {user && (
              <Link
                href="/bookings"
                className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200
                  ${isActive("/bookings")
                    ? "bg-blue-600/15 text-blue-600"
                    : `${isDark ? "text-slate-300 hover:text-blue-400 hover:bg-slate-800" : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"}`
                  }`}
              >
                <FiBriefcase size={15} className={isActive("/bookings") ? "text-blue-600" : `${isDark ? "text-slate-500 group-hover:text-blue-400" : "text-gray-500 group-hover:text-blue-500"}`} />
                <span>My Trips</span>
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] bg-blue-600 rounded-full transition-all duration-300
                  ${isActive("/bookings") ? "w-4" : "w-0 group-hover:w-4"}`} />
              </Link>
            )}
          </div>

          {/* RIGHT ACTIONS — Desktop */}
          <div className="hidden md:flex items-center gap-4">

            {/* Currency */}
            <div ref={currencyRef} className="relative">
              <div
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition text-sm font-medium ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              >
                <FiGlobe size={14} />
                {currency}
                <FiChevronDown size={14} className={`transition ${showCurrencyMenu ? "rotate-180" : ""}`} />
              </div>
              {showCurrencyMenu && (
                <div className={`absolute right-0 mt-3 w-44 rounded-xl ${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/90 border"} backdrop-blur-xl shadow-lg border p-2 z-50`}>
                  <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-gray-400"}`}>Currency</div>
                  {Object.keys(currencies).map(code => (
                    <button
                      key={code}
                      onClick={() => { changeCurrency(code); setShowCurrencyMenu(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition cursor-pointer
                        ${currency === code ? `${isDark ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600 font-semibold"}` : `${isDark ? "hover:bg-slate-800 text-slate-200" : "hover:bg-gray-100 text-gray-700"}`}`}
                    >
                      <span>{currencies[code].symbol}</span>
                      <span className="flex-1 text-left">{currencies[code].label}</span>
                      {currency === code && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className={`p-2 rounded-lg transition ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative cursor-pointer">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className={`relative p-2 rounded-lg transition ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    <FiBell size={17} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                <div className={`absolute right-0 mt-3 w-[360px] rounded-2xl ${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-gray-100"} backdrop-blur-xl shadow-2xl border z-50 overflow-hidden`} style={{ animation: 'fadeInDown 0.2s ease' }}>
                  <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-white/5 bg-slate-900" : "border-gray-50 bg-white/50"}`}>
                    <div>
                      <span className={`font-bold ${isDark ? "text-white" : "text-gray-800"} text-[16px]`}>Notifications</span>
                      {unreadCount > 0 && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-bold">{unreadCount} New</span>}
                    </div>
                    <div className="flex gap-3">
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight transition-colors">Mark all read</button>
                      )}
                      {user.notifications?.length > 0 && (
                        <button onClick={handleClearAll} className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-tight transition-colors">Clear all</button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {(!user.notifications || user.notifications.length === 0) ? (
                      <div className="flex flex-col items-center py-12 text-gray-300 gap-3">
                        <div className={`w-14 h-14 ${isDark ? "bg-white/5" : "bg-gray-50"} rounded-full flex items-center justify-center`}>
                          <FiBell size={24} className={`${isDark ? "text-slate-500" : "text-gray-300"}`} />
                        </div>
                        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>No notifications yet</p>
                      </div>
                    ) : (
                      [...user.notifications].reverse().map((n, i) => (
                        <div 
                          key={n._id || i} 
                          onClick={() => handleNotifClick(n)}
                          className={`group flex gap-3 px-5 py-4 border-b ${isDark ? "border-white/5 hover:bg-white/5" : "border-gray-50 hover:bg-blue-50/40"} transition-all cursor-pointer relative ${!n.read ? (isDark ? "bg-blue-500/10" : "bg-blue-50/20") : ""}`}
                        >
                          <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 transition-all duration-300 ${n.read ? (isDark ? "bg-white/10" : "bg-gray-200") : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-[14px] font-bold truncate transition-colors ${n.read ? (isDark ? "text-slate-400" : "text-gray-600") : (isDark ? "text-slate-100" : "text-gray-900")}`}>{n.title}</div>
                            <div className={`text-[13px] ${isDark ? "text-slate-400" : "text-gray-500"} mt-1 line-clamp-2 leading-relaxed`}>{n.message}</div>
                            <div className="flex items-center justify-between mt-3">
                              <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"} font-medium flex items-center gap-1.5`}>
                                <FiClock size={11} />
                                {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                {!n.read && (
                                  <button 
                                    onClick={(e) => handleMarkRead(e, n._id)}
                                    className={`p-1.5 ${isDark ? "hover:bg-blue-500/20" : "hover:bg-blue-100"} text-blue-500 rounded-lg transition-colors`}
                                    title="Mark as read"
                                  >
                                    <FiCheckCircle size={14} />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => handleDeleteNotif(e, n._id)}
                                  className={`p-1.5 ${isDark ? "hover:bg-red-500/20" : "hover:bg-red-100"} text-red-500 rounded-lg transition-colors`}
                                  title="Delete"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className={`px-5 py-4 ${isDark ? "bg-slate-900 border-white/5" : "bg-gray-50/80 border-gray-100"} border-t flex justify-center`}>
                    <Link href="/profile?tab=notifications" onClick={() => setShowNotifs(false)} className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:gap-2.5 transition-all group/link">
                      View Activity Center 
                      <FiChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setProfile(!profile)} 
                    className={`flex items-center gap-2 p-1 rounded-full border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? "bg-slate-800 border-white/10 hover:border-indigo-500/50" : "bg-gray-100 border-gray-200 hover:border-blue-500/50"}`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${isDark ? "bg-indigo-700 text-white" : "bg-blue-600 text-white"}`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </button>

                  {profile && (
                      <div className={`absolute right-0 mt-3 w-64 rounded-2xl ${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-gray-100"} backdrop-blur-xl shadow-2xl border z-50 overflow-hidden`} style={{ animation: 'fadeInDown 0.2s ease' }}>
                        <div className={`px-5 py-4 border-b ${isDark ? "border-white/5 bg-slate-900" : "border-gray-50 bg-white/50"}`}>
                          <div className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{user.name}</div>
                          <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"} truncate`}>{user.email}</div>
                          <div className="flex items-center gap-3 mt-1">
                            {user.loyaltyTier && <div className="text-xs text-amber-600 font-bold">🏅 {user.loyaltyTier}</div>}
                            <div className="text-xs text-green-600 font-bold">💳 ₹{(user.walletBalance || 0).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="py-2">
                          {PROFILE_LINKS.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setProfile(false)}
                              className={`flex items-center gap-3 px-5 py-2.5 text-sm ${isDark ? "text-slate-300 hover:bg-white/5" : "text-gray-600 hover:bg-gray-50"} transition-colors`}
                            >
                              <span className={isDark ? "text-slate-500" : "text-gray-400"}>{item.icon}</span>
                              <span className="flex-1">{item.label}</span>
                              <FiChevronRight size={13} className={isDark ? "text-slate-600" : "text-gray-400"} />
                            </Link>
                          ))}
                        </div>
                        <div className={`px-5 py-3 border-t ${isDark ? "border-white/5 bg-slate-900" : "border-gray-50 bg-gray-50/50"}`}>
                          <button
                            onClick={() => { logout(); setProfile(false); }}
                            className="flex items-center gap-3 text-sm font-bold text-red-500 hover:text-red-600 transition-colors w-full text-left"
                          >
                            <FiLogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} className={`text-sm font-medium px-4 py-1.5 rounded-lg transition ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-100"}`}>
                  Sign In
                </button>
                <button onClick={() => { setAuthMode("register"); setShowAuth(true); }} className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                  Join Now
                </button>
              </div>
            )}
          </div>

          {/* MOBILE Hamburger */}
          <button
            className={`md:hidden p-1 ${isDark ? "text-white" : "text-black"}`}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* MOBILE DRAWER */}
        {menu && (
          <div className={`${isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-gray-100"} md:hidden backdrop-blur-xl px-6 py-6 space-y-4 border-t max-h-[80vh] overflow-y-auto`}>

            {/* User card */}
            {user ? (
              <div className={`flex items-center gap-3 pb-4 border-b ${isDark ? "border-white/10" : "border-gray-100"}`}>
                <div className={`w-10 h-10 ${isDark ? "bg-indigo-700" : "bg-blue-600"} text-white rounded-xl flex items-center justify-center font-bold overflow-hidden`}>
                  {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className={`font-semibold ${isDark ? "text-white" : "text-gray-800"} text-sm`}>{user.name}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="text-xs text-yellow-500 font-bold">⭐ {user.skyPoints?.toLocaleString()} Pts</div>
                    <div className="text-xs text-green-600 font-bold">💳 ₹{(user.walletBalance || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`pb-4 border-b ${isDark ? "border-white/10" : "border-gray-100"}`}>
                <p className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Sign in to unlock exclusive member rates & SkyPoints rewards.</p>
                <button onClick={() => { setAuthMode("login"); setShowAuth(true); setMenu(false); }} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                  Sign In Now
                </button>
              </div>
            )}

            {/* Nav links */}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-gray-400"}`}>Explore</p>
              <div className="grid grid-cols-2 gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeAll}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition
                      ${isActive(link.href) ? "border-blue-500 text-blue-600 bg-blue-50" : `${isDark ? "border-slate-700 text-slate-300 hover:border-blue-400 hover:text-blue-400 hover:bg-slate-800" : "border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600"}`}`}
                  >
                    <span style={{ color: link.color }}>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Account links (logged in) */}
            {user && (
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-gray-400"}`}>My Account</p>
                <div className="flex flex-col gap-1">
                  {MOBILE_ACCOUNT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeAll}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition
                        ${item.accent ? "border-green-200 bg-green-50 text-green-700" : `${isDark ? "border-slate-700 text-slate-300 hover:border-blue-400 hover:text-blue-400 hover:bg-slate-800" : "border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600"}`}`}
                    >
                      <span>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      <FiChevronRight size={15} className="opacity-40" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Settings row */}
            <div className={`border rounded-xl overflow-hidden ${isDark ? "border-slate-700" : ""}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b cursor-pointer transition ${isDark ? "border-slate-700 hover:bg-slate-800" : "hover:bg-gray-50"}`} onClick={toggleTheme}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${isDark ? "text-white" : "text-gray-600"}`}>
                  {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                  Appearance
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{isDark ? "Dark" : "Light"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className={`flex items-center gap-2 text-sm font-semibold ${isDark ? "text-white" : "text-gray-600"}`}>
                  <FiGlobe size={16} />
                  Currency
                </div>
                <select
                  value={currency}
                  onChange={e => changeCurrency(e.target.value)}
                  className={`text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer ${isDark ? "text-blue-400" : ""}`}
                >
                  {Object.keys(currencies).map(code => <option key={code} value={code}>{code}</option>)}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex flex-col gap-3">
              {user ? (
                <button
                  onClick={() => { logout(); setMenu(false); }}
                  className="w-full py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <FiLogOut size={16} /> Sign Out of SkyStay
                </button>
              ) : (
                <button
                  onClick={() => { setAuthMode("register"); setShowAuth(true); setMenu(false); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm"
                >
                  Create Account
                </button>
              )}
              <div className={`flex items-center justify-center gap-3 text-xs ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                <Link href="/terms" onClick={closeAll}>Terms</Link>
                <span>•</span>
                <Link href="/privacy-policy" onClick={closeAll}>Privacy</Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      </div>

      {showAuth && (
        <AuthModal 
          mode={authMode} 
          onClose={() => setShowAuth(false)} 
          onSwitch={setAuthMode} 
        />
      )}

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedNotif(null)}
          />
          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade ${isDark ? "bg-slate-800 text-white" : "bg-white"}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-slate-700" : ""}`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FiBell size={20} />
                </div>
                <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Notification Detail</h3>
              </div>
              <button 
                onClick={() => setSelectedNotif(null)}
                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-gray-100 text-gray-500"}`}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
                <FiClock size={12} />
                {new Date(selectedNotif.createdAt).toLocaleDateString("en-IN", { 
                  day: "numeric", month: "long", year: "numeric", 
                  hour: "2-digit", minute: "2-digit" 
                })}
              </div>
              <h2 className={`text-2xl font-black mb-4 leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                {selectedNotif.title}
              </h2>
              <div className={`text-lg leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                {selectedNotif.message}
              </div>
            </div>
            <div className={`px-8 py-6 flex justify-end gap-3 ${isDark ? "bg-slate-900" : "bg-gray-50"}`}>
              <button 
                onClick={async () => {
                  await deleteNotif(selectedNotif._id);
                  setSelectedNotif(null);
                }}
                className="px-6 py-2.5 rounded-xl border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <FiTrash2 size={16} /> Delete
              </button>
              <button 
                onClick={() => setSelectedNotif(null)}
                className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}