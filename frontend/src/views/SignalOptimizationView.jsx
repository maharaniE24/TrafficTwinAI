import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  Sparkles, 
  TrendingDown, 
  CheckCircle2, 
  Zap, 
  Leaf, 
  Fuel, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { api } from "../api/client";

export function SignalOptimizationView() {
  const { selectedDistrictId, activeDistrictData } = useDistrict();
  const junctions = activeDistrictData?.junctions ? Object.values(activeDistrictData.junctions) : [];

  const [selectedJunctionId, setSelectedJunctionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [optResult, setOptResult] = useState(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  useEffect(() => {
    if (junctions.length > 0) {
      setSelectedJunctionId(junctions[0].id);
    }
  }, [selectedDistrictId, junctions.length]);

  const handleRunOptimization = async (e) => {
    e?.preventDefault();
    if (!selectedJunctionId) return;

    setLoading(true);
    setOptResult(null);
    setAppliedSuccess(false);

    try {
      const res = await api.optimizeSignal({
        districtId: selectedDistrictId,
        junctionId: selectedJunctionId
      });
      setOptResult(res);
    } catch (err) {
      alert("Signal optimization note: " + (err.message || "Failed to run Webster optimization."));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTiming = async () => {
    if (!optResult || !optResult.scenarioB) return;
    setApplying(true);

    try {
      await api.applySignalTiming({
        districtId: selectedDistrictId,
        junctionId: selectedJunctionId,
        signalTiming: optResult.scenarioB.signalTiming
      });
      setAppliedSuccess(true);
    } catch (err) {
      alert("Apply signal error: " + err.message);
    } finally {
      setApplying(false);
    }
  };

  const selectedJunctionObj = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">
              Webster Adaptive Signal Optimization
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs border border-amber-500/30">
              Controller Level
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            C_opt = (1.5L + 5) / (1 - Y) · Phase-demand saturation balancing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedJunctionId}
            onChange={(e) => setSelectedJunctionId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {junctions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name} (Load: {j.congestion}%)
              </option>
            ))}
          </select>

          <button
            onClick={handleRunOptimization}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "Computing Webster Model..." : "Run Optimization"}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {optResult ? (
        <div className="space-y-6">
          {/* Comparison Cards: Scenario A vs Scenario B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario A: Current Condition */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                  Scenario A — Current Condition
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                  Unoptimized
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Congestion</span>
                  <span className="text-lg font-bold text-rose-400 font-mono">
                    {optResult.scenarioA.congestionPct}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Queue Units</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {optResult.scenarioA.queueVehicles} veh
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Travel Time</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">
                    {optResult.scenarioA.travelTimeMin} min
                  </span>
                </div>
              </div>

              {/* Timing Split Bar */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px] text-slate-400">
                  <span>Cycle Length: {optResult.scenarioA.signalTiming.cycleTime}s</span>
                  <span>Fixed Allocation</span>
                </div>
                <div className="flex h-3 rounded-lg overflow-hidden gap-0.5">
                  <div className="bg-blue-500" style={{ width: `${(optResult.scenarioA.signalTiming.north / optResult.scenarioA.signalTiming.cycleTime) * 100}%` }} title="North"></div>
                  <div className="bg-cyan-500" style={{ width: `${(optResult.scenarioA.signalTiming.south / optResult.scenarioA.signalTiming.cycleTime) * 100}%` }} title="South"></div>
                  <div className="bg-emerald-500" style={{ width: `${(optResult.scenarioA.signalTiming.east / optResult.scenarioA.signalTiming.cycleTime) * 100}%` }} title="East"></div>
                  <div className="bg-purple-500" style={{ width: `${(optResult.scenarioA.signalTiming.west / optResult.scenarioA.signalTiming.cycleTime) * 100}%` }} title="West"></div>
                </div>
                <div className="grid grid-cols-4 text-[10px] font-mono text-slate-400 text-center pt-1">
                  <span>N: {optResult.scenarioA.signalTiming.north}s</span>
                  <span>S: {optResult.scenarioA.signalTiming.south}s</span>
                  <span>E: {optResult.scenarioA.signalTiming.east}s</span>
                  <span>W: {optResult.scenarioA.signalTiming.west}s</span>
                </div>
              </div>
            </div>

            {/* Scenario B: Optimized Condition */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 glass-panel shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Scenario B — Optimized Condition (Webster Adaptive)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  AI Optimized
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Congestion</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {optResult.scenarioB.congestionPct}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Queue Units</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {optResult.scenarioB.queueVehicles} veh
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Travel Time</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {optResult.scenarioB.travelTimeMin} min
                  </span>
                </div>
              </div>

              {/* Optimized Timing Split Bar */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px] text-slate-400">
                  <span>Optimum Cycle: {optResult.scenarioB.signalTiming.cycleTime}s</span>
                  <span className="text-amber-400 font-bold">Saturation Balanced</span>
                </div>
                <div className="flex h-3 rounded-lg overflow-hidden gap-0.5">
                  <div className="bg-blue-500" style={{ width: `${(optResult.scenarioB.signalTiming.north / optResult.scenarioB.signalTiming.cycleTime) * 100}%` }} title="North"></div>
                  <div className="bg-cyan-500" style={{ width: `${(optResult.scenarioB.signalTiming.south / optResult.scenarioB.signalTiming.cycleTime) * 100}%` }} title="South"></div>
                  <div className="bg-emerald-500" style={{ width: `${(optResult.scenarioB.signalTiming.east / optResult.scenarioB.signalTiming.cycleTime) * 100}%` }} title="East"></div>
                  <div className="bg-purple-500" style={{ width: `${(optResult.scenarioB.signalTiming.west / optResult.scenarioB.signalTiming.cycleTime) * 100}%` }} title="West"></div>
                </div>
                <div className="grid grid-cols-4 text-[10px] font-mono text-slate-300 text-center pt-1 font-bold">
                  <span>N: {optResult.scenarioB.signalTiming.north}s</span>
                  <span>S: {optResult.scenarioB.signalTiming.south}s</span>
                  <span>E: {optResult.scenarioB.signalTiming.east}s</span>
                  <span>W: {optResult.scenarioB.signalTiming.west}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency & Environmental Gains Strip */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-slate-800 glass-panel flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Congestion Cut</span>
                <span className="text-base font-bold text-emerald-400">
                  -{optResult.improvements.congestionPct}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Queue Reduced</span>
                <span className="text-base font-bold text-emerald-400">
                  -{optResult.improvements.queueVehicles}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Daily Fuel Saved</span>
                <span className="text-base font-bold text-amber-400 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" />
                  {optResult.improvements.fuelSavedLitersPerDay} L
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CO2 Reduction</span>
                <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" />
                  {optResult.improvements.co2ReductionKgPerDay} kg
                </span>
              </div>
            </div>

            <button
              onClick={handleApplyTiming}
              disabled={applying || appliedSuccess}
              className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                appliedSuccess
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 shadow-cyan-500/20"
              }`}
            >
              {appliedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Timings Applied to Network</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{applying ? "Deploying Timings..." : "Apply Timing to Live Network"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel space-y-3">
          <Sliders className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Ready for Signal Phase Optimization</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select an arterial junction from the dropdown above and click "Run Optimization" to compute Webster's minimum delay splits.
          </p>
        </div>
      )}
    </div>
  );
}
