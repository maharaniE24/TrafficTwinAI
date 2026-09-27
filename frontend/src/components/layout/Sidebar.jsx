import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Map, 
  Navigation, 
  Sliders, 
  Cpu, 
  Siren, 
  BrainCircuit, 
  Compass, 
  BarChart3, 
  BellRing,
  CloudRain,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDistrict } from "../../context/DistrictContext";

export function Sidebar() {
  const { isController, role } = useAuth();
  const { activeDistrictData, selectedDistrictId } = useDistrict();
  const [collapsed, setCollapsed] = useState(false);

  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();
  const congPct = activeDistrictData?.trafficLive?.congestionPct ?? 52;

  // Navigation Items
  const publicNavItems = [
    { path: "/", label: "Dashboard / TN Overview", icon: LayoutDashboard },
    { path: "/explorer", label: "Live Traffic Explorer", icon: Map },
    { path: "/weather", label: "Weather Impact Analysis", icon: CloudRain, badge: "Live" },
    { path: "/routing", label: "Route Recommender", icon: Navigation },
    { path: "/my-alerts", label: "My Route Alerts", icon: BellRing }
  ];

  const controllerNavItems = [
    { path: "/signals", label: "Signal Optimization", icon: Sliders, badge: "Webster" },
    { path: "/simulator", label: "What-If Simulator", icon: Cpu, badge: "Twin" },
    { path: "/emergency", label: "Emergency Priority", icon: Siren, badge: "Corridor" },
    { path: "/predictions", label: "LSTM Prediction Lab", icon: BrainCircuit, badge: "AI" },
    { path: "/decision-center", label: "Decision & Planning", icon: Compass },
    { path: "/analytics", label: "Historical & Scenarios", icon: BarChart3 }
  ];

  const systemNavItems = [
    { path: "/reports", label: "Download Reports", icon: FileSpreadsheet, badge: "PDF/CSV" },
    { path: "/settings", label: "System Settings", icon: Settings }
  ];

  return (
    <aside 
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-[#0B1120] dark:bg-[#0B1120] border-r border-slate-800/80 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] transition-all duration-200 select-none z-20`}
    >
      {/* District Telemetry Mini-Card */}
      {!collapsed && (
        <div className="p-3.5 border-b border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400">Target Node</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-1 truncate">{districtName}</h4>
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Congestion:</span>
              <span className={`font-mono font-bold ${congPct > 70 ? 'text-rose-400' : congPct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {congPct}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {/* Core Navigation */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Live Modules
            </div>
          )}
          <nav className="space-y-1">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-3"} py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.1)]"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Controller Modules */}
        {isController && (
          <div>
            {!collapsed && (
              <div className="px-3 mb-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-500/90 font-bold">
                <span>Controller Deck</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px]">RESTRICTED</span>
              </div>
            )}
            <nav className="space-y-1">
              {controllerNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-3"} py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? "bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110 text-amber-400/80 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* System & Tools */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              System & Export
            </div>
          )}
          <nav className="space-y-1">
            {systemNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-3"} py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-slate-800 text-white font-bold border border-slate-700"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0 text-slate-400" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Collapse Toggle & Role Footer */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-500 font-mono flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300 font-bold uppercase">{role}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white mx-auto transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
