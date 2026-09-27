import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  MapPin, 
  Search, 
  Clock, 
  ShieldCheck, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ChevronDown,
  Gauge,
  Sun,
  Moon
} from "lucide-react";
import { useDistrict } from "../../context/DistrictContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LiveIndicator } from "../common/LiveIndicator";
import { api } from "../../api/client";

export function Navbar() {
  const { 
    selectedDistrictId, 
    selectDistrict, 
    districtsList, 
    notifications, 
    unreadNotifCount,
    unitSystem,
    toggleUnitSystem,
    liveStreamConnected
  } = useDistrict();
  
  const { user, role, logout, isController } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Live Clock (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDistricts = districtsList.filter(d => 
    (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDistrictObj = districtsList.find(d => d.id === selectedDistrictId) || { name: "Chennai", id: "chennai" };

  const handleResolveNotif = async (notifId, e) => {
    e?.stopPropagation();
    try {
      await api.resolveNotification(notifId);
    } catch (err) {
      console.warn("Could not resolve notification:", err);
    }
  };

  return (
    <header className="h-16 bg-[#070B14]/90 dark:bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.35)]">
            <Gauge className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                TrafficTwin <span className="text-cyan-400 font-mono">AI</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                TN-38
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Tamil Nadu Smart City Digital Twin</p>
          </div>
        </div>

        {/* Live sync pulse badge */}
        <div className="hidden lg:block ml-3">
          <LiveIndicator text={liveStreamConnected ? "RTDB LIVE STREAM" : "CONNECTING..."} size="sm" />
        </div>
      </div>

      {/* Center: Searchable District Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/70 hover:border-cyan-500/50 text-slate-200 transition-all shadow-inner hover:shadow-[0_0_15px_rgba(0,242,254,0.15)]"
          aria-label="Select Tamil Nadu District"
        >
          <MapPin className="w-4 h-4 text-cyan-400 animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="text-left">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono">Selected District</span>
            <span className="block text-xs font-bold text-white leading-tight flex items-center gap-1.5">
              {currentDistrictObj.name}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 max-h-80 bg-slate-950/95 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 glass-panel animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2.5 border-b border-slate-800 flex items-center gap-2 bg-slate-900/80">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 38 TN districts..."
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-60 p-1 divide-y divide-slate-800/40 font-sans">
              {filteredDistricts.length > 0 ? (
                filteredDistricts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      selectDistrict(d.id);
                      setIsDropdownOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      d.id === selectedDistrictId
                        ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{d.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Tier {d.tier || 2}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">No district found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Theme Toggle, Clock, Unit toggle, Notifications, Role Badge, Logout */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          aria-label="Toggle visual theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || "10:30:00 PM"} IST</span>
        </div>

        {/* Unit Toggle */}
        <button
          onClick={toggleUnitSystem}
          title="Toggle Metric (km, °C) / Imperial (mi, °F)"
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors hidden sm:block"
        >
          {unitSystem === "metric" ? "KM / °C" : "MI / °F"}
        </button>

        {/* Notification Bell with Live Unread Badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white relative transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 glass-panel animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mission Notifications</h4>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {notifications.length} alerts
                </span>
              </div>

              <div className="overflow-y-auto max-h-72 divide-y divide-slate-800/60 p-2 space-y-1">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl transition-colors ${
                        n.resolved
                          ? "bg-slate-900/30 opacity-60"
                          : n.type === "critical"
                          ? "bg-rose-950/40 border border-rose-500/30"
                          : n.type === "warning"
                          ? "bg-amber-950/30 border border-amber-500/20"
                          : "bg-slate-900/60 border border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {n.type === "critical" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          )}
                          <h5 className="text-xs font-bold text-slate-100">{n.title}</h5>
                        </div>
                        {isController && !n.resolved && (
                          <button
                            onClick={(e) => handleResolveNotif(n.id, e)}
                            className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-[10px] font-bold transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                        <span>{n.districtId ? n.districtId.toUpperCase() : "GLOBAL"}</span>
                        <span>{new Date(n.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">No active notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200 leading-tight">
              {user?.name || (isController ? "Traffic Controller" : "Citizen User")}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{user?.email || "demo@demo.com"}</span>
          </div>

          <div
            className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono tracking-wider uppercase border flex items-center gap-1 ${
              isController
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{isController ? "CONTROLLER" : "CITIZEN"}</span>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
