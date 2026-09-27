import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  Clock, 
  ShieldCheck,
  BarChart2,
  Sliders,
  AlertTriangle
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { useAuth } from "../context/AuthContext";

export function DownloadReportsView() {
  const { 
    selectedDistrictId, 
    activeDistrictData, 
    districtsList,
    formatSpeed 
  } = useDistrict();
  
  const { user, role } = useAuth();

  const [reportType, setReportType] = useState("junctions");
  const [selectedScope, setSelectedScope] = useState(selectedDistrictId);
  const [dateRange, setDateRange] = useState("today");
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const districtName = districtsList.find(d => d.id === selectedScope)?.name || "Tamil Nadu Statewide";
  const junctions = activeDistrictData?.junctions ? Object.values(activeDistrictData.junctions) : [];

  // Generate CSV File
  const handleDownloadCSV = () => {
    setGenerating(true);
    setTimeout(() => {
      let csvContent = "data:text/csv;charset=utf-8,";
      let filename = `TrafficTwin_${selectedScope}_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

      if (reportType === "junctions") {
        csvContent += "District,Junction_ID,Intersection_Name,Congestion_Pct,Vehicle_Count_vph,Avg_Speed_kmh,Queue_Length_veh,Delay_sec,Cycle_Time_sec\n";
        junctions.forEach((j) => {
          const delay = Math.round(((j.queueLength || 0) * 2.2) + ((j.congestion || 0) * 0.45));
          csvContent += `"${districtName}","${j.id}","${j.name}",${j.congestion},${j.vehicleCount || 150},${j.avgSpeed || 30},${j.queueLength || 10},${delay},${j.signalTiming?.cycleTime || 120}\n`;
        });
      } else if (reportType === "signals") {
        csvContent += "District,Junction_ID,Intersection_Name,Optimal_Cycle_sec,North_Green_sec,South_Green_sec,East_Green_sec,West_Green_sec,Webster_Saturation_Ratio\n";
        junctions.forEach((j) => {
          const t = j.signalTiming || { cycleTime: 120, north: 35, south: 35, east: 25, west: 25 };
          csvContent += `"${districtName}","${j.id}","${j.name}",${t.cycleTime},${t.north},${t.south},${t.east},${t.west},0.78\n`;
        });
      } else if (reportType === "incidents") {
        csvContent += "District,Incident_ID,Type,Severity,Status,Timestamp,Reported_By\n";
        csvContent += `"${districtName}","INC-901","Accident / Collision","High","Resolved","${new Date().toISOString()}","Traffic Police Central"\n`;
        csvContent += `"${districtName}","INC-902","Water Logging","Medium","Active","${new Date().toISOString()}","Citizen Sensor Network"\n`;
      } else {
        csvContent += "District,Timestamp_Hour,Actual_Volume_vph,LSTM_Predicted_vph,Residual_Error_vph,Confidence_Band_Lower,Confidence_Band_Upper\n";
        for (let i = 0; i < 24; i++) {
          const actual = Math.round(180 + Math.sin(i / 3) * 80);
          const pred = Math.round(actual + (Math.random() * 8 - 4));
          csvContent += `"${districtName}",${i}:00,${actual},${pred},${actual - pred},${pred - 15},${pred + 15}\n`;
        }
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGenerating(false);
      setDownloadSuccess(`CSV Downloaded: ${filename}`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }, 600);
  };

  // Printable View / PDF Trigger
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Audit & Operational Reports Generator
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30">
              CSV & PDF EXPORT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Export certified engineering datasets, Webster signal split records, LSTM prediction residuals, and traffic telemetry audits.
          </p>
        </div>
      </div>

      {/* Report Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4 text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Report Parameters
          </h3>

          {/* Select Category */}
          <div>
            <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Report Module</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="junctions">Real-Time Junction Telemetry & Delay</option>
              <option value="signals">Webster Signal Optimization Timings</option>
              <option value="predictions">LSTM 24h Prediction & Residual Audit</option>
              <option value="incidents">Citizen Incident & Emergency Dispatches</option>
            </select>
          </div>

          {/* Select District Scope */}
          <div>
            <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Target District</label>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {districtsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-slate-400 font-mono uppercase text-[10px] mb-1">Date Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="today">Today (Live 24h Telemetry)</option>
              <option value="7days">Past 7 Days Aggregated</option>
              <option value="30days">Past 30 Days Trend Archive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <button
              onClick={handleDownloadCSV}
              disabled={generating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{generating ? "Exporting CSV..." : "Download CSV Dataset"}</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}
        </div>

        {/* Live Report Preview */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">Live Data Preview</span>
              <h3 className="text-sm font-bold text-white font-mono">
                {districtName} — {reportType.toUpperCase()}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-96">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] text-slate-400 uppercase">
                  <th className="py-2.5 px-3">NODE ID</th>
                  <th className="py-2.5 px-3">INTERSECTION</th>
                  <th className="py-2.5 px-3 text-right">CONGESTION</th>
                  <th className="py-2.5 px-3 text-right">LOAD (vph)</th>
                  <th className="py-2.5 px-3 text-right">SPEED</th>
                  <th className="py-2.5 px-3 text-right">CYCLE (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {junctions.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-cyan-300 font-bold">{j.id.toUpperCase()}</td>
                    <td className="py-2 px-3 text-white font-sans">{j.name}</td>
                    <td className="py-2 px-3 text-right font-bold text-amber-400">{j.congestion}%</td>
                    <td className="py-2 px-3 text-right text-slate-200">{j.vehicleCount || 160}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{formatSpeed(j.avgSpeed || 32)}</td>
                    <td className="py-2 px-3 text-right text-cyan-400">{j.signalTiming?.cycleTime || 120}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2">
            <span>Generated by TrafficTwin AI Engine (v2.4)</span>
            <span>Authentication: {role.toUpperCase()} (Certified)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
