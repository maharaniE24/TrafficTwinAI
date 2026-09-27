import React from "react";
import { BellRing, MapPin, AlertTriangle, Info, CheckCircle2, Navigation } from "lucide-react";
import { useDistrict } from "../context/DistrictContext";

export function CitizenAlertsView() {
  const { selectedDistrictId, notifications, activeDistrictData } = useDistrict();
  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();

  // Filter alerts relevant to the active district
  const scopedAlerts = notifications.filter(
    (n) => !n.districtId || n.districtId.toLowerCase() === selectedDistrictId.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-cyan-400" />
            My Commuter & Route Alerts
          </h1>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30">
            Citizen Filter
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Showing personalized safety advisories, road closures, and dynamic delay alerts for {districtName}.
        </p>
      </div>

      <div className="space-y-3">
        {scopedAlerts.length > 0 ? (
          scopedAlerts.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all ${
                n.type === "critical"
                  ? "bg-rose-950/40 border-rose-500/30"
                  : n.type === "warning"
                  ? "bg-amber-950/30 border-amber-500/30"
                  : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 mt-0.5">
                    {n.type === "critical" ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Info className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{n.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {n.districtId ? n.districtId.toUpperCase() : "GLOBAL"}
                      </span>
                      <span>•</span>
                      <span>{new Date(n.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {n.resolved ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Cleared
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                    Active Advisory
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No Active Delays on Your Commute</h3>
            <p className="text-xs text-slate-500">
              Corridors in {districtName} are currently operating with normal flow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
