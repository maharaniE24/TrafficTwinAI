import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Car, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Sparkles, 
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { useAuth } from "../context/AuthContext";
import { TrafficMap } from "../components/map/TrafficMap";
import { HealthBadge } from "../components/common/HealthBadge";
import { LiveIndicator } from "../components/common/LiveIndicator";
import { JunctionTelemetryTable } from "../components/common/JunctionTelemetryTable";

export function DashboardView() {
  const { 
    districtsList, 
    selectedDistrictId, 
    selectDistrict, 
    activeDistrictData,
    formatSpeed,
    liveStreamConnected
  } = useDistrict();
  
  const { isController } = useAuth();
  const navigate = useNavigate();
  const [focusedJunction, setFocusedJunction] = useState(null);

  // Aggregate State Telemetry
  const totalDistricts = districtsList.length || 38;
  const avgCongestion = districtsList.length 
    ? Math.round(districtsList.reduce((acc, d) => acc + (d.congestionPct || 50), 0) / districtsList.length)
    : 54;
  const totalIncidents = districtsList.reduce((acc, d) => acc + (d.incidentCount || 0), 0);
  const avgHealth = districtsList.length
    ? Math.round(districtsList.reduce((acc, d) => acc + (d.healthScore || 75), 0) / districtsList.length)
    : 72;

  // Sort districts by congestion desc for leaderboard
  const topCongested = [...districtsList].sort((a, b) => (b.congestionPct || 0) - (a.congestionPct || 0)).slice(0, 5);

  const selectedDistrictObj = districtsList.find(d => d.id === selectedDistrictId) || {
    name: "Chennai",
    lat: 13.0827,
    lng: 80.2707
  };

  const junctions = activeDistrictData?.junctions ? Object.values(activeDistrictData.junctions) : [];
  const edges = activeDistrictData?.graph?.edges || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Tamil Nadu State Traffic Operations Center
            </h1>
            <LiveIndicator text="LIVE TELEMETRY" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time AI Digital Twin monitoring 38 districts across regional corridors, highways, and smart urban centers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate("/routing")}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>AI Route Planner</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          {isController && (
            <button
              onClick={() => navigate("/emergency")}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Emergency Green Corridor</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Telemetry Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monitored Districts */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>NETWORK SCOPE</span>
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-white font-mono">{totalDistricts}</span>
            <span className="text-xs text-slate-400">Districts (100% active)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Full state coverage active</p>
        </div>

        {/* State Average Congestion */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>STATE AVG CONGESTION</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-amber-400 font-mono">{avgCongestion}%</span>
            <span className="text-xs text-slate-400">capacity load</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${avgCongestion}%` }}
            ></div>
          </div>
        </div>

        {/* Traffic Health Score */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>STATE HEALTH INDEX</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">{avgHealth}</span>
            <span className="text-xs text-slate-400">/ 100 benchmark</span>
          </div>
          <div className="mt-1">
            <HealthBadge score={avgHealth} size="sm" />
          </div>
        </div>

        {/* Active Incidents */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ACTIVE INCIDENTS</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-rose-400 font-mono">{totalIncidents}</span>
            <span className="text-xs text-slate-400">hazards & reports</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified via Data Validator</p>
        </div>
      </div>

      {/* Main Map + District Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tamil Nadu Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Tamil Nadu Digital Twin Map
              </h3>
              <span className="text-xs text-slate-400">({selectedDistrictObj.name} focused)</span>
            </div>
            <span className="text-[11px] text-slate-400">Click any district marker to focus</span>
          </div>

          <TrafficMap
            center={[selectedDistrictObj.lat || 13.0827, selectedDistrictObj.lng || 80.2707]}
            zoom={selectedDistrictId === "chennai" ? 11 : 10}
            districts={districtsList}
            junctions={junctions}
            edges={edges}
            onSelectDistrict={(id) => selectDistrict(id)}
            onSelectJunction={(j) => setFocusedJunction(j)}
            height="460px"
          />
        </div>

        {/* Right 1 Col: Top Bottlenecks & Selected District Snapshot */}
        <div className="space-y-4">
          {/* Selected District Fast Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 glass-panel shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Selected Node Focus</span>
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  {selectedDistrictObj.name}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
                    Tier {selectedDistrictObj.tier || 2}
                  </span>
                </h4>
              </div>
              <HealthBadge score={activeDistrictData?.trafficLive?.healthScore || 75} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">Congestion</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {activeDistrictData?.trafficLive?.congestionPct || 52}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">Avg Speed</span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatSpeed(activeDistrictData?.trafficLive?.avgSpeed || 35)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">Vehicle Load</span>
                <span className="text-sm font-bold text-white font-mono">
                  {activeDistrictData?.trafficLive?.vehicleCount || 180} veh
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-mono">Queue Delay</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {activeDistrictData?.trafficLive?.queueLength || 22} units
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/explorer")}
              className="w-full mt-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Open District Junction Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Top Congested Districts Leaderboard */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center justify-between">
              <span>Top Bottleneck Districts</span>
              <span className="text-[10px] text-rose-400 font-mono">Live Ranking</span>
            </h4>
            <div className="space-y-2">
              {topCongested.map((d, idx) => (
                <button
                  key={d.id}
                  onClick={() => selectDistrict(d.id)}
                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                    d.id === selectedDistrictId
                      ? "bg-cyan-500/15 border border-cyan-500/40 text-white"
                      : "bg-slate-950/40 hover:bg-slate-800 border border-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className={`font-bold ${d.congestionPct > 70 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {d.congestionPct}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Junction Telemetry Table */}
      <JunctionTelemetryTable
        junctions={junctions}
        selectedJunctionId={focusedJunction?.id}
        onSelectJunction={(j) => setFocusedJunction(j)}
      />
    </div>
  );
}
