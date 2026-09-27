import React, { useState } from "react";
import { 
  CloudRain, 
  Wind, 
  Eye, 
  Thermometer, 
  AlertTriangle, 
  PlusCircle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Send,
  MapPin,
  Car
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { useAuth } from "../context/AuthContext";
import { TrafficMap } from "../components/map/TrafficMap";
import { HealthBadge } from "../components/common/HealthBadge";
import { LiveIndicator } from "../components/common/LiveIndicator";
import { JunctionTelemetryTable } from "../components/common/JunctionTelemetryTable";
import { api } from "../api/client";

export function DistrictExplorerView() {
  const { 
    selectedDistrictId, 
    activeDistrictData, 
    districtsList,
    formatSpeed,
    formatTemp 
  } = useDistrict();
  
  const { user, role } = useAuth();

  const [selectedJunction, setSelectedJunction] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [incidentType, setIncidentType] = useState("accident");
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();
  const traffic = activeDistrictData?.trafficLive || {};
  const weather = activeDistrictData?.weatherLive || {};
  const junctions = activeDistrictData?.junctions ? Object.values(activeDistrictData.junctions) : [];
  const edges = activeDistrictData?.graph?.edges || [];

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setReportSuccess(false);

    try {
      await api.reportIncident({
        districtId: selectedDistrictId,
        incidentType,
        severity,
        title: title.trim(),
        description: description.trim(),
        junctionId: selectedJunction?.id || "",
        reportedBy: user?.name || "Citizen User",
        reporterRole: role
      });
      setReportSuccess(true);
      setTitle("");
      setDescription("");
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
      }, 1500);
    } catch (err) {
      alert("Failed to report incident: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">
              {districtName} — District Traffic Operations
            </h1>
            <LiveIndicator text="LIVE JUNCTION STREAM" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time arterial flow monitoring, environmental weather telemetry, and citizen reporting node.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <HealthBadge score={traffic.healthScore || 75} size="lg" />
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Grid: Map + Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Center */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">
              Junction Topology ({junctions.length} active intersections)
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              Click junction icon for signal split
            </span>
          </div>

          <TrafficMap
            center={[activeDistrictData?.info?.lat || 13.0827, activeDistrictData?.info?.lng || 80.2707]}
            zoom={13}
            junctions={junctions}
            edges={edges}
            onSelectJunction={(j) => setSelectedJunction(j)}
            height="460px"
          />

          {/* Selected Junction Details Card */}
          {selectedJunction && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 glass-panel shadow-2xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                  <h4 className="text-sm font-bold text-white">{selectedJunction.name}</h4>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  Congestion: {selectedJunction.congestion}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Queue Units</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">{selectedJunction.queueLength} vehicles</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Flow Speed</span>
                  <span className="text-sm font-bold text-white font-mono">{formatSpeed(selectedJunction.avgSpeed)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Cycle Length</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">{selectedJunction.signalTiming?.cycleTime || 120}s</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Green Phase Split</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    N:{selectedJunction.signalTiming?.north}s S:{selectedJunction.signalTiming?.south}s E:{selectedJunction.signalTiming?.east}s W:{selectedJunction.signalTiming?.west}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Weather + Active Incidents Feed */}
        <div className="space-y-4">
          {/* Live Weather Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                Live Weather Telemetry
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">
                OpenWeather Sync
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white font-mono">
                  {formatTemp(weather.temperature || 31)}
                </span>
                <p className="text-xs text-slate-300 font-medium">{weather.condition || "Clear Skies"}</p>
              </div>
              <div className="text-right text-xs font-mono space-y-1 text-slate-400">
                <p className="flex items-center gap-1 justify-end">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <span>{weather.windSpeed || 4.2} km/h wind</span>
                </p>
                <p className="flex items-center gap-1 justify-end">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{weather.visibility || 10} km vis</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Humidity</span>
                <span className="font-bold text-slate-200 font-mono">{weather.humidity || 68}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Precipitation</span>
                <span className="font-bold text-cyan-400 font-mono">{weather.rainfall || 0} mm/hr</span>
              </div>
            </div>

            {weather.weatherAlert && (
              <div className="mt-3 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{weather.weatherAlert}</span>
              </div>
            )}
          </div>

          {/* District Incident & Road Condition Feed */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Active District Incidents
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {traffic.incidentCount || 0} active
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Arterial Heavy Density</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300">
                    Auto-Detected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Peak volume active on primary arterial crossings. Digital twin dynamically updating delays.
                </p>
              </div>

              {traffic.incidentCount > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-200">Lane Hazard Reported</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900 text-rose-200">
                      High Severity
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Citizen reported localized road blockage affecting approach capacity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Junction Real-Time Telemetry Table */}
      <JunctionTelemetryTable 
        junctions={junctions} 
        selectedJunctionId={selectedJunction?.id} 
        onSelectJunction={(j) => setSelectedJunction(j)} 
      />

      {/* Citizen Incident Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 glass-panel-glow animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Report Traffic Incident</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ESC / Close
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">Incident Submitted Successfully</h4>
                <p className="text-xs text-slate-400">Validated through Data Validator and updated in Digital Twin.</p>
              </div>
            ) : (
              <form onSubmit={handleIncidentSubmit} className="space-y-4 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Incident Type</label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="accident">Accident / Collision</option>
                      <option value="pothole">Severe Pothole</option>
                      <option value="flooding">Water Logging / Flooding</option>
                      <option value="breakdown">Vehicle Breakdown</option>
                      <option value="roadwork">Road Construction</option>
                      <option value="hazard">General Road Hazard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Severity Level</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="low">Low (Minor delay)</option>
                      <option value="medium">Medium (Lane partially blocked)</option>
                      <option value="high">High (Major artery blocked)</option>
                      <option value="critical">Critical (Complete standstill)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Headline / Short Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Waterlogging near South Arterial Crossing"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Description & Landmarks</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details to assist controllers and fellow commuters..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Validating & Submitting..." : "Submit Incident Report"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
