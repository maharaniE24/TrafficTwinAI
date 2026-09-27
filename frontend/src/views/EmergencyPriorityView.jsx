import React, { useState, useEffect } from "react";
import { 
  Siren, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Clock, 
  TrendingDown, 
  ShieldAlert, 
  ArrowRight,
  Zap
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { TrafficMap } from "../components/map/TrafficMap";
import { api } from "../api/client";

export function EmergencyPriorityView() {
  const { selectedDistrictId, activeDistrictData, formatSpeed } = useDistrict();
  const junctions = activeDistrictData?.junctions ? Object.values(activeDistrictData.junctions) : [];
  const edges = activeDistrictData?.graph?.edges || [];

  const [vehicleType, setVehicleType] = useState("Ambulance");
  const [startJunctionId, setStartJunctionId] = useState("");
  const [endJunctionId, setEndJunctionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [corridorPlan, setCorridorPlan] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentVehiclePos, setCurrentVehiclePos] = useState(null);
  const [stuckAlertActive, setStuckAlertActive] = useState(null);
  const [resolvedStuck, setResolvedStuck] = useState(false);

  useEffect(() => {
    if (junctions.length >= 2) {
      setStartJunctionId(junctions[0].id);
      setEndJunctionId(junctions[junctions.length - 1].id);
    }
  }, [selectedDistrictId, junctions.length]);

  const handlePlanCorridor = async (e) => {
    e?.preventDefault();
    if (!startJunctionId || !endJunctionId || startJunctionId === endJunctionId) {
      alert("Select distinct start and destination nodes.");
      return;
    }

    setLoading(true);
    setCorridorPlan(null);
    setActiveStepIndex(0);
    setIsSimulating(false);
    setStuckAlertActive(null);
    setResolvedStuck(false);

    try {
      const res = await api.planEmergencyCorridor({
        districtId: selectedDistrictId,
        vehicleType,
        startJunctionId,
        endJunctionId
      });
      setCorridorPlan(res);
      if (res.pathCoordinates && res.pathCoordinates.length > 0) {
        setCurrentVehiclePos(res.pathCoordinates[0]);
      }
    } catch (err) {
      alert("Emergency corridor planning failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step-by-step passage animation runner
  const runPassageAnimation = () => {
    if (!corridorPlan || !corridorPlan.pathCoordinates) return;
    setIsSimulating(true);
    setActiveStepIndex(6); // Step 7: Simulate Emergency Passage

    const coords = corridorPlan.pathCoordinates;
    const stuckList = corridorPlan.stuckSegments || [];
    let currentIdx = 0;

    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < coords.length) {
        setCurrentVehiclePos(coords[currentIdx]);

        // Check if current segment index is stuck
        if (stuckList.length > 0 && currentIdx === 1 && !resolvedStuck) {
          setStuckAlertActive(corridorPlan.stuckAlerts[0] || {
            title: `🚨 ${vehicleType} Delayed near ${corridorPlan.segments[0]?.fromJunctionName}`,
            message: `Segment congestion exceeds 70%. Queue delay active.`,
            junctionId: corridorPlan.segments[0]?.fromJunctionId
          });
        }
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setActiveStepIndex(7); // Step 8: Restore Normal Signal Timing
      }
    }, 1200);
  };

  const handleApplyResolution = async () => {
    if (!stuckAlertActive) return;
    try {
      await api.resolveStuckEmergency({
        eventId: corridorPlan.eventId,
        junctionId: stuckAlertActive.junctionId,
        action: "Extend Green Corridor (+45s green split)"
      });
      setResolvedStuck(true);
      setStuckAlertActive(null);
    } catch (e) {
      console.warn("Resolve alert error:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/30 shadow-xl glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Siren className="w-5 h-5 text-rose-400 animate-pulse" />
              Emergency Vehicle Priority Dispatcher
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs border border-rose-500/30">
              Virtual Green Corridor
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Preempts cross-traffic signal timings, creates virtual green waves, and monitors segment choke-points in real time.
          </p>
        </div>

        <div className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400">
          ⚠️ SIMULATION PROTOCOL
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vehicle & Route Selector */}
        <div className="space-y-4">
          <form onSubmit={handlePlanCorridor} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4 text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Siren className="w-4 h-4 text-rose-400" />
              Dispatch Configuration
            </h3>

            {/* Vehicle Type */}
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Vehicle Classification</label>
              <div className="grid grid-cols-3 gap-2">
                {["Ambulance", "Fire Truck", "Police"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVehicleType(t)}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-bold border transition-all ${
                      vehicleType === t
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {t === "Ambulance" ? "🚑" : t === "Fire Truck" ? "🚒" : "🚓"} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Origin */}
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Emergency Origin Node</label>
              <select
                value={startJunctionId}
                onChange={(e) => setStartJunctionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              >
                {junctions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} (Load: {j.congestion}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Target Hospital / Crisis Node</label>
              <select
                value={endJunctionId}
                onChange={(e) => setEndJunctionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
              >
                {junctions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} (Load: {j.congestion}%)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? "Engaging Green Wave..." : "Generate Virtual Green Corridor"}</span>
            </button>
          </form>

          {/* 8-Stage Workflow Steps */}
          {corridorPlan && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  8-Stage Priority Workflow
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Automated Pipeline</span>
              </div>

              <div className="space-y-1.5">
                {corridorPlan.workflowSteps.map((step, sIdx) => {
                  const isDone = sIdx <= activeStepIndex;
                  const isCurrent = sIdx === activeStepIndex;
                  return (
                    <div
                      key={step.step}
                      className={`p-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                        isCurrent
                          ? "bg-rose-950/60 border-rose-500 text-rose-200"
                          : isDone
                          ? "bg-slate-950/70 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center">
                          {step.step}
                        </span>
                        <span className="font-medium">{step.name}</span>
                      </div>
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Wait</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={runPassageAnimation}
                disabled={isSimulating}
                className="w-full mt-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Vehicle Transiting Corridor..." : "Simulate Emergency Passage"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Map + Stuck Alert Banner + Improvement Metrics */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Stuck Alert Popup */}
          {stuckAlertActive && (
            <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500 text-slate-950 animate-bounce">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-rose-200">{stuckAlertActive.title}</h4>
                  <p className="text-xs text-rose-300/90 mt-0.5">{stuckAlertActive.message}</p>
                  <p className="text-[11px] text-amber-300 font-mono mt-1">
                    ⚡ Auto-Action: Extend green corridor (+45s) to purge queue
                  </p>
                </div>
              </div>

              <button
                onClick={handleApplyResolution}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs whitespace-nowrap shadow-lg shadow-amber-400/20 transition-all self-start sm:self-auto"
              >
                1-Click Apply Override
              </button>
            </div>
          )}

          {resolvedStuck && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Corrective green extension active. Bottleneck cleared, emergency vehicle resuming transit.</span>
            </div>
          )}

          <TrafficMap
            center={[activeDistrictData?.info?.lat || 13.0827, activeDistrictData?.info?.lng || 80.2707]}
            zoom={13}
            junctions={junctions}
            edges={edges}
            routeCoordinates={corridorPlan?.pathCoordinates || []}
            emergencyVehicle={
              currentVehiclePos
                ? {
                    position: currentVehiclePos,
                    type: vehicleType,
                    speed: 58
                  }
                : null
            }
            height="420px"
          />

          {/* Performance Improvement Comparison */}
          {corridorPlan && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Normal Commute</span>
                <span className="text-base font-bold text-slate-300">{corridorPlan.metrics.normalTimeMinutes} min</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Priority Transit</span>
                <span className="text-base font-bold text-emerald-400">{corridorPlan.metrics.priorityTimeMinutes} min</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Time Saved</span>
                <span className="text-base font-bold text-cyan-300">{corridorPlan.metrics.timeSavedMinutes} min</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 block font-sans">Improvement %</span>
                <span className="text-lg font-extrabold text-emerald-400">+{corridorPlan.metrics.improvementPct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
