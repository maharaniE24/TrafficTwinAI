import React, { useState } from "react";
import { 
  Activity, 
  Search, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  Clock, 
  Gauge, 
  Layers,
  ChevronRight
} from "lucide-react";
import { useDistrict } from "../../context/DistrictContext";

export function JunctionTelemetryTable({ 
  junctions = [], 
  selectedJunctionId = null, 
  onSelectJunction = () => {} 
}) {
  const { formatSpeed } = useDistrict();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("congestion");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterLevel, setFilterLevel] = useState("ALL");

  // Determine Congestion Badge
  const getCongestionBadge = (congestion) => {
    const val = Number(congestion) || 0;
    if (val >= 80) {
      return {
        label: "CRITICAL",
        color: "bg-rose-500/15 text-rose-400 border-rose-500/40",
        dot: "bg-rose-400"
      };
    } else if (val >= 60) {
      return {
        label: "HEAVY",
        color: "bg-amber-500/15 text-amber-400 border-amber-500/40",
        dot: "bg-amber-400"
      };
    } else if (val >= 35) {
      return {
        label: "MODERATE",
        color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
        dot: "bg-cyan-400"
      };
    } else {
      return {
        label: "LOW",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
        dot: "bg-emerald-400"
      };
    }
  };

  // Helper for computing delay estimation from queue & congestion
  const getDelaySeconds = (j) => {
    if (j.delay) return j.delay;
    const queue = j.queueLength || 0;
    const cong = j.congestion || 0;
    return Math.round((queue * 2.2) + (cong * 0.45));
  };

  // Filter & Sort
  const filtered = junctions.filter((j) => {
    const nameMatch = (j.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (j.id || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (!nameMatch) return false;

    if (filterLevel === "ALL") return true;
    const badge = getCongestionBadge(j.congestion);
    return badge.label === filterLevel;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "delay") {
      aVal = getDelaySeconds(a);
      bVal = getDelaySeconds(b);
    }

    if (typeof aVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal - bVal) : (bVal - aVal);
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800 dark:border-slate-800 p-4 sm:p-5 shadow-xl glass-panel space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Real-Time Traffic Junction Telemetry
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE TELEMETRY / SIMULATED
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live capacity, vehicle throughput, queuing delays, and AI-predicted intersection states.
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          {["ALL", "CRITICAL", "HEAVY", "MODERATE", "LOW"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                filterLevel === lvl
                  ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm"
                  : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by intersection ID or name..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-xs font-mono self-end sm:self-center">
          <span>Total Nodes: <strong className="text-white">{junctions.length}</strong></span>
          <span>Showing: <strong className="text-cyan-400">{sorted.length}</strong></span>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              <th 
                className="py-3 px-3 cursor-pointer hover:text-white"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 cursor-pointer hover:text-white"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  <span>INTERSECTION NAME</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 cursor-pointer hover:text-white"
                onClick={() => handleSort("congestion")}
              >
                <div className="flex items-center gap-1">
                  <span>CONGESTION LEVEL</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("vehicleCount")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>VEHICLE COUNT (vph)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("avgSpeed")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>AVG SPEED (km/h)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("queueLength")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>QUEUE LENGTH (veh)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("delay")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>DELAY (s)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {sorted.length > 0 ? (
              sorted.map((j) => {
                const badge = getCongestionBadge(j.congestion);
                const delaySec = getDelaySeconds(j);
                const isSelected = selectedJunctionId === j.id;

                return (
                  <tr
                    key={j.id}
                    onClick={() => onSelectJunction(j)}
                    className={`cursor-pointer transition-all hover:bg-slate-800/40 ${
                      isSelected
                        ? "bg-cyan-950/40 border-l-2 border-l-cyan-400 font-medium"
                        : ""
                    }`}
                  >
                    {/* ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                      {j.id.toUpperCase()}
                    </td>

                    {/* Intersection Name */}
                    <td className="py-2.5 px-3 text-white font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{j.name}</span>
                        {j.congestion >= 80 && (
                          <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>

                    {/* Congestion Level */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label} ({j.congestion}%)
                        </span>
                      </div>
                    </td>

                    {/* Vehicle Count (vph) */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      {j.vehicleCount ? `${j.vehicleCount} vph` : "—"}
                    </td>

                    {/* Average Speed (km/h) */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className={`${j.avgSpeed < 20 ? 'text-rose-400 font-bold' : j.avgSpeed < 35 ? 'text-amber-300' : 'text-emerald-400'}`}>
                        {j.avgSpeed ? `${j.avgSpeed} km/h` : "—"}
                      </span>
                    </td>

                    {/* Queue Length (veh) */}
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                      {j.queueLength ? `${j.queueLength} veh` : "0 veh"}
                    </td>

                    {/* Delay (s) */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={`${delaySec > 60 ? 'text-rose-400' : delaySec > 30 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {delaySec}s
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJunction(j);
                        }}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-400 transition-colors"
                        title="Focus on Map"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-slate-500 font-mono">
                  No intersection telemetry found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
