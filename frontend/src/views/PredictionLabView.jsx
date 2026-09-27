import React, { useState } from "react";
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  Clock, 
  CloudRain, 
  BarChart2, 
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

export function PredictionLabView() {
  const { selectedDistrictId, activeDistrictData } = useDistrict();
  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();

  const [includeWeather, setIncludeWeather] = useState(true);
  const [epochs, setEpochs] = useState(8);
  const [loading, setLoading] = useState(false);
  const [predResult, setPredResult] = useState(null);
  const [activeMetricTab, setActiveMetricTab] = useState("congestionPct"); // 'congestionPct' | 'avgSpeed' | 'vehicleCount' | 'queueLength'

  const handleTrainAndPredict = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const res = await api.trainAndPredict({
        districtId: selectedDistrictId,
        includeWeather,
        epochs
      });
      setPredResult(res);
    } catch (err) {
      alert("LSTM Prediction Lab note: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build Chart.js data
  const comparisonData = predResult?.comparisons?.[activeMetricTab];
  const chartLabels = comparisonData ? comparisonData.timestamps.map((t, idx) => `T-${comparisonData.timestamps.length - idx}h`) : [];
  
  const chartConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: "Actual Historical Value",
        data: comparisonData?.actual || [],
        borderColor: "#94A3B8",
        backgroundColor: "rgba(148, 163, 184, 0.1)",
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3
      },
      {
        label: `LSTM Predicted (${includeWeather ? "Traffic + Weather" : "Traffic-Only"})`,
        data: comparisonData?.predicted || [],
        borderColor: "#00F2FE",
        backgroundColor: "rgba(0, 242, 254, 0.15)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#00F2FE"
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94A3B8",
          font: { family: "JetBrains Mono", size: 11 }
        }
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
      x: {
        grid: { color: "#1E293B" },
        ticks: { color: "#64748B", font: { family: "JetBrains Mono", size: 10 } }
      },
      y: {
        grid: { color: "#1E293B" },
        ticks: { color: "#64748B", font: { family: "JetBrains Mono", size: 10 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              Deep Learning Traffic Prediction Lab
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30">
              LSTM Neural Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-variable sequence model for 15, 30, 45, and 60-minute future flow forecasting in {districtName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Feature Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setIncludeWeather(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !includeWeather ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Traffic-Only
            </button>
            <button
              onClick={() => setIncludeWeather(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                includeWeather ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Traffic + Weather
            </button>
          </div>

          <button
            onClick={handleTrainAndPredict}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "Training LSTM Model..." : "Train & Predict"}</span>
          </button>
        </div>
      </div>

      {predResult ? (
        <div className="space-y-6">
          {/* Multi-Horizon Future Forecast Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Multi-Step Horizon Predictions
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Next 60 Minutes Forecast</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {predResult.futureForecasts.map((f) => (
                <div key={f.horizonMinutes} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>+{f.horizonMinutes} MIN AHEAD</span>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-white font-mono">
                    {f.congestionPct}% <span className="text-xs text-slate-400 font-sans">cong</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-400">
                    <span>Speed: {f.avgSpeed} km/h</span>
                    <span>Queue: {f.queueLength} veh</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actual vs Predicted Graph */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Actual vs Predicted Model Curves
                </h4>
                <p className="text-[11px] text-slate-400">Comparing test set ground-truth against neural forecasts</p>
              </div>

              {/* Target Metric Tabs */}
              <div className="flex gap-1.5 overflow-x-auto text-xs font-mono">
                {[
                  { key: "congestionPct", label: "Congestion %" },
                  { key: "avgSpeed", label: "Speed (km/h)" },
                  { key: "vehicleCount", label: "Vehicle Count" },
                  { key: "queueLength", label: "Queue Length" }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveMetricTab(tab.key)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      activeMetricTab === tab.key
                        ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full">
              <Line data={chartConfig} options={chartOptions} />
            </div>
          </div>

          {/* Model Accuracy Metrics Table (MAE, RMSE, MAPE, R2) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Regression Evaluation Metrics Matrix
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Model: {predResult.modelType}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Target Variable</th>
                    <th className="py-2.5 px-3">MAE</th>
                    <th className="py-2.5 px-3">RMSE</th>
                    <th className="py-2.5 px-3">MAPE (%)</th>
                    <th className="py-2.5 px-3">R² Score</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {Object.entries(predResult.metrics).map(([col, m]) => (
                    <tr key={col} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-white capitalize">{col.replace(/([A-Z])/g, ' $1')}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{m.MAE}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{m.RMSE}</td>
                      <td className="py-2.5 px-3 text-amber-300">{m.MAPE}%</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{m.R2}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-500/30">
                          CONVERGED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel space-y-3">
          <BrainCircuit className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">LSTM Prediction Lab Ready</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Train & Predict" above to train the multi-variable LSTM Neural Network on 30-day historical time-series data for {districtName}.
          </p>
        </div>
      )}
    </div>
  );
}
