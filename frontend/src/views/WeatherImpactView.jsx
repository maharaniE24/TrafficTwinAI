import React from "react";
import { 
  CloudRain, 
  Wind, 
  Eye, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Gauge, 
  SunMedium, 
  CloudLightning, 
  ArrowDownRight,
  Zap,
  Info
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { LiveIndicator } from "../components/common/LiveIndicator";

export function WeatherImpactView() {
  const { 
    selectedDistrictId, 
    activeDistrictData, 
    formatTemp, 
    formatSpeed 
  } = useDistrict();

  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();
  const weather = activeDistrictData?.weatherLive || {
    temperature: 32,
    humidity: 70,
    windSpeed: 4.8,
    visibility: 10,
    rainfall: 0,
    condition: "Clear Skies",
    frictionCoeff: 0.82,
    weatherAlert: null
  };

  const junctions = activeDistrictData?.junctions ? Object.values(activeDistrictData.junctions) : [];

  // Computed Weather Impact Metrics
  const rainfallMm = Number(weather.rainfall) || 0;
  const friction = weather.frictionCoeff || (rainfallMm > 15 ? 0.38 : rainfallMm > 5 ? 0.55 : 0.85);
  const rainDelayMultiplier = rainfallMm > 20 ? 1.65 : rainfallMm > 10 ? 1.35 : rainfallMm > 2 ? 1.15 : 1.0;
  const brakingDistanceIncreasePct = Math.round(((0.85 - friction) / 0.85) * 100);
  const hydroplaningRisk = rainfallMm > 15 ? "CRITICAL" : rainfallMm > 5 ? "MODERATE" : "MINIMAL";

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Weather Impact & Environmental Telemetry — {districtName}
            </h1>
            <LiveIndicator text="OPENWEATHER LIVE" size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time rainfall factor, road surface friction coefficient ($\mu$), braking distance variance, and urban flooding risk models.
          </p>
        </div>
      </div>

      {/* 4 Weather Parameter Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Surface Temperature */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SURFACE TEMP</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-white font-mono">
              {formatTemp(weather.temperature || 32)}
            </span>
            <span className="text-xs text-slate-400">Ambient Air</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Condition: <strong className="text-cyan-300">{weather.condition}</strong></p>
        </div>

        {/* Precipitation / Rainfall */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PRECIPITATION RATE</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-cyan-400 font-mono">
              {rainfallMm} <span className="text-sm font-normal">mm/h</span>
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(rainfallMm * 4, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Road Surface Friction Coefficient */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ROAD FRICTION (μ)</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl md:text-3xl font-extrabold font-mono ${friction < 0.45 ? 'text-rose-400' : friction < 0.65 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {friction.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">/ 1.00 μ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {friction >= 0.75 ? "Dry asphalt grip (Optimal)" : friction >= 0.5 ? "Damp road (Reduced grip)" : "Wet / Flooded (Hazardous)"}
          </p>
        </div>

        {/* Rain Delay Factor Multiplier */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 glass-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CORRIDOR DELAY FACTOR</span>
            <Zap className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-rose-400 font-mono">
              {rainDelayMultiplier.toFixed(2)}x
            </span>
            <span className="text-xs text-slate-400">travel duration</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Braking distance increased by <strong className="text-amber-300">+{brakingDistanceIncreasePct}%</strong>
          </p>
        </div>
      </div>

      {/* Grid: Environmental Analysis & Junction Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Impact Analysis */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Physical Model: Friction & Stopping Distance
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                AASHTO Safety Model
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Hydroplaning Risk</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hydroplaningRisk === "CRITICAL" ? 'bg-rose-400 animate-ping' : hydroplaningRisk === "MODERATE" ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className="font-bold text-sm text-white font-mono">{hydroplaningRisk}</span>
                </div>
                <p className="text-[10px] text-slate-500">Threshold at 15mm/h precipitation</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Atmospheric Visibility</span>
                <span className="font-bold text-sm text-white font-mono block">{weather.visibility || 10} km</span>
                <p className="text-[10px] text-slate-500">Optical sensor baseline range</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Relative Humidity</span>
                <span className="font-bold text-sm text-white font-mono block">{weather.humidity || 70}%</span>
                <p className="text-[10px] text-slate-500">Moisture saturation level</p>
              </div>
            </div>

            {/* Live Recommendations */}
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs space-y-2">
              <span className="font-bold text-cyan-300 font-mono uppercase text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Digital Twin Weather Advisory
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Speed recommendations automatically updated across electronic sign boards (VMS).</li>
                <li>Webster signal timings auto-extended by <strong className="text-cyan-300">{(rainDelayMultiplier * 10 - 10).toFixed(0)}%</strong> to account for slower startup lost times.</li>
                <li>Emergency corridors route dynamically around designated low-lying waterlogged nodes.</li>
              </ul>
            </div>
          </div>

          {/* Junction Weather Vulnerability Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
              Node Flood & Waterlogging Vulnerability Index
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-2.5 px-3">NODE ID</th>
                    <th className="py-2.5 px-3">INTERSECTION</th>
                    <th className="py-2.5 px-3 text-center">DRAINAGE INDEX</th>
                    <th className="py-2.5 px-3 text-right">RECOMMENDED SPEED</th>
                    <th className="py-2.5 px-3 text-right">WEATHER DELAY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {junctions.map((j, idx) => {
                    const vuln = (idx % 3 === 0) ? "Vulnerable" : "Nominal";
                    const recSpeed = rainfallMm > 10 ? 25 : rainfallMm > 2 ? 35 : 45;
                    const wDelay = rainfallMm > 10 ? "+45s" : rainfallMm > 2 ? "+15s" : "0s";

                    return (
                      <tr key={j.id} className="hover:bg-slate-800/40 text-xs">
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{j.id.toUpperCase()}</td>
                        <td className="py-2.5 px-3 text-white">{j.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${vuln === "Vulnerable" ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-slate-950 text-slate-400'}`}>
                            {vuln}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{recSpeed} km/h</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">{wDelay}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Weather Alerts & Meteorological Sensor Feed */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Meteorological Warnings
            </h3>

            {weather.weatherAlert ? (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Active Weather Alert</span>
                </div>
                <p className="text-[11px] leading-relaxed">{weather.weatherAlert}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <SunMedium className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>No extreme precipitation alerts currently active for {districtName}.</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Atmospheric Sensor Telemetry</span>
              <div className="flex justify-between text-slate-300">
                <span>Wind Velocity:</span>
                <span className="font-mono font-bold text-white">{weather.windSpeed || 4.8} km/h</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Wind Direction:</span>
                <span className="font-mono text-cyan-400">East-Northeast (ENE)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Barometric Pressure:</span>
                <span className="font-mono text-white">1012 hPa</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Dew Point:</span>
                <span className="font-mono text-slate-300">24.5 °C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
