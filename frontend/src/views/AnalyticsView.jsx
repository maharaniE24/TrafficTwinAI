import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Download, 
  FileText, 
  Calendar, 
  Layers, 
  Sparkles, 
  Play, 
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useDistrict } from "../context/DistrictContext";
import { api } from "../api/client";
import { HealthBadge } from "../components/common/HealthBadge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AnalyticsView() {
  const { selectedDistrictId, districtsList, activeDistrictData, formatSpeed } = useDistrict();
  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();

  const [days, setDays] = useState(7);
  const [trendData, setTrendData] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // District Comparison State
  const [compareD1, setCompareD1] = useState("chennai");
  const [compareD2, setCompareD2] = useState("coimbatore");
  const [comparisonResult, setComparisonResult] = useState(null);

  // Scenario Library State
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioResult, setActiveScenarioResult] = useState(null);
  const [runningScenarioId, setRunningScenarioId] = useState(null);

  useEffect(() => {
    async function loadTrends() {
      setLoadingTrends(true);
      try {
        const res = await api.getHistoricalTrends(selectedDistrictId, days);
        setTrendData(res.data || []);
      } catch (err) {
        console.warn("Trend load error:", err);
      } finally {
        setLoadingTrends(false);
      }
    }
    loadTrends();
  }, [selectedDistrictId, days]);

  useEffect(() => {
    async function loadComparisonAndScenarios() {
      try {
        const [compRes, scenRes] = await Promise.all([
          api.compareDistricts(compareD1, compareD2),
          api.getScenarios()
        ]);
        setComparisonResult(compRes);
        setScenarios(scenRes.scenarios || []);
      } catch (err) {
        console.warn("Analytics extras note:", err);
      }
    }
    loadComparisonAndScenarios();
  }, [compareD1, compareD2]);

  const handleRunScenario = async (scen) => {
    setRunningScenarioId(scen.id);
    try {
      const res = await api.runSimulation({
        districtId: selectedDistrictId,
        parameters: scen.params
      });
      setActiveScenarioResult({ scenario: scen, result: res });
    } catch (err) {
      alert("Scenario execution note: " + err.message);
    } finally {
      setRunningScenarioId(null);
    }
  };

  // Chart Config
  const chartLabels = trendData.map((d, i) => `D-${Math.floor((trendData.length - i) / 24)} H${d.hour}`);
  const chartConfig = {
    labels: chartLabels.slice(-48), // Last 48 hours for crisp rendering
    datasets: [
      {
        label: "Congestion Percentage (%)",
        data: trendData.slice(-48).map((d) => d.congestionPct),
        borderColor: "#00F2FE",
        backgroundColor: "rgba(0, 242, 254, 0.15)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5
      },
      {
        label: "Flow Speed (km/h)",
        data: trendData.slice(-48).map((d) => d.avgSpeed),
        borderColor: "#10B981",
        backgroundColor: "transparent",
        tension: 0.35,
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#94A3B8", font: { family: "JetBrains Mono", size: 11 } }
      },
      tooltip: {
        backgroundColor: "#0F172A",
        titleColor: "#00F2FE",
        bodyColor: "#F8FAFC",
        borderColor: "#1E293B",
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { color: "#1E293B" }, ticks: { color: "#64748B", font: { family: "JetBrains Mono", size: 9 }, maxTicksLimit: 12 } },
      y: { grid: { color: "#1E293B" }, ticks: { color: "#64748B", font: { family: "JetBrains Mono", size: 10 } } }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Historical Analytics, Scenarios & Reports
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30">
              Reporting Deck
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Time-series trend analysis, 1-click viva scenario library, side-by-side comparison, and export generation.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={api.getExportUrl(selectedDistrictId, "csv")}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV Export</span>
          </a>
          <a
            href={api.getExportUrl(selectedDistrictId, "pdf")}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Academic Report</span>
          </a>
        </div>
      </div>

      {/* 1. Historical Trends Graph */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Historical Traffic & Speed Trends ({districtName})
            </h3>
            <p className="text-[11px] text-slate-400">Diurnal commuter patterns, weather correlation, and off-peak baselines</p>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  days === d
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          {loadingTrends ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Loading historical time series...
            </div>
          ) : (
            <Line data={chartConfig} options={chartOptions} />
          )}
        </div>
      </div>

      {/* 2. One-Click Scenario Library (S1-S8) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              1-Click Viva Scenario Library (S1 – S8)
            </h3>
            <p className="text-[11px] text-slate-400">Pre-configured operational stress tests for fast interactive evaluation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((scen) => (
            <button
              key={scen.id}
              onClick={() => handleRunScenario(scen)}
              disabled={runningScenarioId === scen.id}
              className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                activeScenarioResult?.scenario?.id === scen.id
                  ? "bg-amber-950/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <span className="text-xs font-bold text-white block">{scen.name}</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{scen.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                <span>{runningScenarioId === scen.id ? "Running..." : "Trigger Preset"}</span>
                <Play className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>

        {/* Active Scenario Result Toast / Card */}
        {activeScenarioResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 mt-3 animate-in fade-in space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-300">
                Active Scenario Result: {activeScenarioResult.scenario.name}
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Simulated on {districtName}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Simulated Congestion</span>
                <span className="text-base font-bold text-amber-400">{activeScenarioResult.result.simulated.congestionPct}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Simulated Speed</span>
                <span className="text-base font-bold text-white">{activeScenarioResult.result.simulated.avgSpeedKmh} km/h</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Queue Length</span>
                <span className="text-base font-bold text-slate-300">{activeScenarioResult.result.simulated.queueVehicles} veh</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Delay Impact</span>
                <span className="text-base font-bold text-cyan-300">+{activeScenarioResult.result.simulated.waitingDelaySec}s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. District Comparison Mode */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              District Comparison Mode
            </h3>
            <p className="text-[11px] text-slate-400">Side-by-side comparative analysis between two Tamil Nadu districts</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={compareD1}
              onChange={(e) => setCompareD1(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {districtsList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <span className="text-slate-500 font-mono">VS</span>
            <select
              value={compareD2}
              onChange={(e) => setCompareD2(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {districtsList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {comparisonResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* District 1 */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white">{comparisonResult.district1.name}</h4>
                <HealthBadge score={comparisonResult.district1.traffic.healthScore || 75} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>Congestion: <span className="font-bold text-cyan-400">{comparisonResult.district1.traffic.congestionPct}%</span></div>
                <div>Avg Speed: <span className="font-bold text-white">{formatSpeed(comparisonResult.district1.traffic.avgSpeed)}</span></div>
                <div>Queue Length: <span className="font-bold text-amber-400">{comparisonResult.district1.traffic.queueLength} veh</span></div>
                <div>Temperature: <span className="font-bold text-slate-300">{comparisonResult.district1.weather.temperature}°C</span></div>
              </div>
            </div>

            {/* District 2 */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white">{comparisonResult.district2.name}</h4>
                <HealthBadge score={comparisonResult.district2.traffic.healthScore || 75} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>Congestion: <span className="font-bold text-cyan-400">{comparisonResult.district2.traffic.congestionPct}%</span></div>
                <div>Avg Speed: <span className="font-bold text-white">{formatSpeed(comparisonResult.district2.traffic.avgSpeed)}</span></div>
                <div>Queue Length: <span className="font-bold text-amber-400">{comparisonResult.district2.traffic.queueLength} veh</span></div>
                <div>Temperature: <span className="font-bold text-slate-300">{comparisonResult.district2.weather.temperature}°C</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
