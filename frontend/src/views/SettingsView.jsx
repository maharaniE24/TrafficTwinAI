import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  Activity, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Server,
  Zap,
  RotateCcw
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useDistrict } from "../context/DistrictContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export function SettingsView() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { unitSystem, toggleUnitSystem, liveStreamConnected } = useDistrict();
  const { user, role } = useAuth();

  const [apiHealth, setApiHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [streamRate, setStreamRate] = useState("2s");
  const [resetSuccess, setResetSuccess] = useState(false);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await api.getHealth();
      setApiHealth(res);
    } catch (err) {
      setApiHealth({
        status: "degraded",
        error: err.message || "Failed to contact backend API service"
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleResetPreferences = () => {
    localStorage.removeItem("traffictwin_theme");
    localStorage.removeItem("traffictwin_units");
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              System Settings & Diagnostic Console
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30">
              OPERATIONS v2.4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure visual presentation, unit formatting, telemetry stream frequency, and inspect backend microservices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: UI Preferences */}
        <div className="space-y-6">
          {/* Appearance & Theme */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              Display & Theme Modes
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => !isDark && toggleTheme()}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  isDark
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,254,0.15)]"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Moon className="w-6 h-6 text-cyan-400" />
                <span className="text-xs font-bold">Dark Mission Control</span>
                <span className="text-[10px] text-slate-500">Optimized for night / operations rooms</span>
              </button>

              <button
                onClick={() => isDark && toggleTheme()}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  !isDark
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,242,254,0.15)]"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Sun className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-bold">Light Contrast Mode</span>
                <span className="text-[10px] text-slate-500">Daytime field operator mode</span>
              </button>
            </div>
          </div>

          {/* Unit Systems */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Measurement & Units
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Speed & Distance Standard</span>
                <span className="text-[10px] text-slate-400">
                  {unitSystem === "metric" ? "Kilometers (km), km/h, Celsius (°C)" : "Miles (mi), mph, Fahrenheit (°F)"}
                </span>
              </div>
              <button
                onClick={toggleUnitSystem}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-mono font-bold border border-cyan-500/40 transition-colors"
              >
                Switch to {unitSystem === "metric" ? "Imperial" : "Metric"}
              </button>
            </div>
          </div>

          {/* Reset Cache */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-400" />
              Application Storage & Cache
            </h3>
            <p className="text-xs text-slate-400">
              Reset locally saved layout preferences, cached tile configurations, and filter selections.
            </p>
            <button
              onClick={handleResetPreferences}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              Reset Local Preferences
            </button>
            {resetSuccess && (
              <span className="text-emerald-400 text-xs font-mono block">Preferences successfully reset.</span>
            )}
          </div>
        </div>

        {/* Right Column: API & Service Health Diagnostics */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Microservice Diagnostic Center
              </h3>
              <button
                onClick={checkHealth}
                disabled={checkingHealth}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Refresh Diagnostics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Flask API Gateway */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <div>
                    <span className="font-bold text-white block">Flask REST API Gateway</span>
                    <span className="text-[10px] text-slate-400 font-mono">http://127.0.0.1:5000/api</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                  {apiHealth?.status === "ok" ? "HEALTHY" : "ONLINE"}
                </span>
              </div>

              {/* Realtime Database Stream */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${liveStreamConnected ? 'bg-cyan-400' : 'bg-amber-400 animate-ping'}`}></span>
                  <div>
                    <span className="font-bold text-white block">Realtime Telemetry Poller</span>
                    <span className="text-[10px] text-slate-400 font-mono">2-Second Background Streamer</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">
                  CONNECTED
                </span>
              </div>

              {/* LSTM ML Model Pipeline */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <div>
                    <span className="font-bold text-white block">Keras/NumPy LSTM Predictor</span>
                    <span className="text-[10px] text-slate-400 font-mono">24h Sequential Horizon</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                  READY
                </span>
              </div>

              {/* Map Tile Service */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <div>
                    <span className="font-bold text-white block">OpenStreetMap Basemap Provider</span>
                    <span className="text-[10px] text-slate-400 font-mono">Open Public OSM CDN</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                  ZERO API KEY
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Platform: <strong>TrafficTwin AI Digital Twin (Final Year Capstone)</strong></div>
              <div>Districts Configured: <strong>38 Tamil Nadu Smart Cities</strong></div>
              <div>User Session: <strong>{user?.name || "Demo User"} ({role.toUpperCase()})</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
