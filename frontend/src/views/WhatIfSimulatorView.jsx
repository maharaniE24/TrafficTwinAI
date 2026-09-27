import React, { useState } from "react";
import { 
  Cpu, 
  Sparkles, 
  RotateCcw, 
  TrendingUp, 
  CloudRain, 
  AlertTriangle, 
  Siren, 
  Gauge, 
  Sliders, 
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { api } from "../api/client";

export function WhatIfSimulatorView() {
  const { selectedDistrictId, activeDistrictData, formatSpeed } = useDistrict();

  const [volumeMultiplier, setVolumeMultiplier] = useState(1.2);
  const [signalEfficiency, setSignalEfficiency] = useState(1.0);
  const [rainfallMm, setRainfallMm] = useState(0);
  const [accidentCount, setAccidentCount] = useState(0);
  const [roadClosureCount, setRoadClosureCount] = useState(0);
  const [emergencyPriorityActive, setEmergencyPriorityActive] = useState(false);

  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();

  const handleRunSimulation = async (e) => {
    e?.preventDefault();
    setSimulating(true);

    try {
      const res = await api.runSimulation({
        districtId: selectedDistrictId,
        parameters: {
          volumeMultiplier,
          signalEfficiency,
          rainfallMm,
          accidentCount,
          roadClosureCount,
          emergencyPriorityActive
        }
      });
      setSimResult(res);
    } catch (err) {
      alert("Simulation failed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = () => {
    setVolumeMultiplier(1.0);
    setSignalEfficiency(1.0);
    setRainfallMm(0);
    setAccidentCount(0);
    setRoadClosureCount(0);
    setEmergencyPriorityActive(false);
    setSimResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">
              Digital Twin What-If Sandbox Simulator
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30">
              Zero Production Impact
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate synthetic demand surges, storm floods, accidents, closures, and priority overrides on {districtName}.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knobs & Controls Column */}
        <div className="space-y-4">
          <form onSubmit={handleRunSimulation} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4 text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Scenario Knobs & Parameters
            </h3>

            {/* Vehicle Volume Multiplier */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Vehicle Inflow Multiplier</span>
                <span className="font-mono text-cyan-400 font-bold">{volumeMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={volumeMultiplier}
                onChange={(e) => setVolumeMultiplier(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-cyan-400"
              />
            </div>

            {/* Signal Efficiency Multiplier */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Signal Timing Efficiency</span>
                <span className="font-mono text-cyan-400 font-bold">{signalEfficiency}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={signalEfficiency}
                onChange={(e) => setSignalEfficiency(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-cyan-400"
              />
            </div>

            {/* Monsoon Rainfall */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Rainfall Precipitation</span>
                <span className="font-mono text-cyan-400 font-bold">{rainfallMm} mm/hr</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="2"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-cyan-400"
              />
            </div>

            {/* Accidents Slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Active Collision Incidents</span>
                <span className="font-mono text-rose-400 font-bold">{accidentCount}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={accidentCount}
                onChange={(e) => setAccidentCount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-rose-500"
              />
            </div>

            {/* Road Closures */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Critical Road Closures</span>
                <span className="font-mono text-amber-400 font-bold">{roadClosureCount}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={roadClosureCount}
                onChange={(e) => setRoadClosureCount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-amber-500"
              />
            </div>

            {/* Emergency Priority Toggle */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Siren className="w-4 h-4 text-rose-400" />
                  Emergency Green Wave Active
                </span>
                <input
                  type="checkbox"
                  checked={emergencyPriorityActive}
                  onChange={(e) => setEmergencyPriorityActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Cpu className="w-4 h-4" />
              <span>{simulating ? "Simulating Digital Twin..." : "Run Twin Simulation"}</span>
            </button>
          </form>
        </div>

        {/* Results 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          {simResult ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 glass-panel flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Simulation State</span>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {simResult.simulated.statusLevel === "critical" ? (
                      <span className="text-rose-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> SEVERE GRIDLOCK RISK</span>
                    ) : simResult.simulated.statusLevel === "warning" ? (
                      <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> MODERATE NETWORK CONGESTION</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> OPTIMAL FLOW STABILITY</span>
                    )}
                  </h4>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[10px]">Predicted Delay</span>
                  <span className="font-bold text-cyan-300">+{simResult.simulated.waitingDelaySec}s / cycle</span>
                </div>
              </div>

              {/* Side by side Metrics Comparison */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Congestion */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Congestion Rate</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-white font-mono">{simResult.simulated.congestionPct}%</span>
                    <span className={`text-xs font-mono font-bold ${simResult.deltas.congestionPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {simResult.deltas.congestionPct > 0 ? `+${simResult.deltas.congestionPct}%` : `${simResult.deltas.congestionPct}%`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Baseline: {simResult.baseline.congestionPct}%</span>
                </div>

                {/* Avg Speed */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Simulated Speed</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-white font-mono">{simResult.simulated.avgSpeedKmh}</span>
                    <span className="text-xs text-slate-400">km/h</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${simResult.deltas.avgSpeedKmh < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {simResult.deltas.avgSpeedKmh > 0 ? `+${simResult.deltas.avgSpeedKmh}` : simResult.deltas.avgSpeedKmh} km/h vs base
                  </span>
                </div>

                {/* Queue Length */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Queue Accumulation</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-amber-400 font-mono">{simResult.simulated.queueVehicles}</span>
                    <span className="text-xs text-slate-400">veh</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {simResult.deltas.queueVehicles > 0 ? `+${simResult.deltas.queueVehicles}` : simResult.deltas.queueVehicles} queue delta
                  </span>
                </div>

                {/* Travel Time */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Commuter Travel</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-cyan-300 font-mono">{simResult.simulated.travelTimeMin}</span>
                    <span className="text-xs text-slate-400">min</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Baseline: {simResult.baseline.travelTimeMin} min
                  </span>
                </div>
              </div>

              {/* Stress Test Diagnostics Summary */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Digital Twin Scenario Diagnostics
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Under a <strong>{volumeMultiplier}x</strong> vehicle surge and <strong>{rainfallMm}mm</strong> rainfall, network capacity operates at <strong>{simResult.simulated.congestionPct}%</strong> with an estimated average waiting delay of <strong>{simResult.simulated.waitingDelaySec}s</strong> per major arterial intersection.
                </p>
                {simResult.simulated.congestionPct > 70 && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs mt-2">
                    💡 <strong>Twin Recommendation:</strong> Deploy adaptive Webster cycle extension and advise regional ring-road offloading before congestion locks arterial crossings.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel space-y-3">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">Sandbox Ready for Stress Testing</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Adjust the volume, weather, and incident sliders on the left and click "Run Twin Simulation" to observe real-time dynamic impacts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
