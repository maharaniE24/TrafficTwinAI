import React, { useEffect, useState } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  CircleMarker, 
  useMap 
} from "react-leaflet";
import L from "leaflet";
import { Layers, Zap, AlertTriangle, Navigation, Clock, Gauge, Car } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Auto Recenter Component when coordinates change
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

export function TrafficMap({ 
  center = [13.0827, 80.2707], 
  zoom = 12, 
  districts = [], 
  junctions = [], 
  edges = [], 
  routeCoordinates = [], 
  routeCandidates = [],
  emergencyVehicle = null,
  selectedJunctionId = null,
  onSelectDistrict = null,
  onSelectJunction = null,
  height = "520px"
}) {
  const { isDark } = useTheme();
  const [mapLayer, setMapLayer] = useState("auto"); // 'auto' | 'standard' | 'satellite'

  // Helper for Status color
  const getCongestionColor = (cong = 50) => {
    if (cong >= 90) return "#EF4444"; // Red (Critical)
    if (cong >= 70) return "#F97316"; // Orange/Amber (Heavy)
    if (cong >= 40) return "#06B6D4"; // Cyan/Blue (Moderate)
    return "#10B981"; // Green (Low)
  };

  const getStatusLabel = (cong = 50) => {
    if (cong >= 90) return "CRITICAL";
    if (cong >= 70) return "HEAVY";
    if (cong >= 40) return "MODERATE";
    return "LOW";
  };

  // Custom Icon Generators
  const createJunctionIcon = (j) => {
    const cong = j.congestion || 50;
    const color = getCongestionColor(cong);
    const isSelected = selectedJunctionId === j.id;

    return L.divIcon({
      className: "custom-junction-marker",
      html: `
        <div style="
          width: ${isSelected ? '28px' : '22px'}; 
          height: ${isSelected ? '28px' : '22px'}; 
          border-radius: 50%; 
          background: ${color}; 
          border: ${isSelected ? '3px solid #00F2FE' : '2px solid #FFFFFF'}; 
          box-shadow: 0 0 ${isSelected ? '20px #00F2FE' : '10px ' + color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: black;
          font-weight: bold;
          font-size: 9px;
          font-family: monospace;
          transition: all 0.2s ease;
        ">
        </div>
      `,
      iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
      iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11]
    });
  };

  const createEmergencyIcon = (vehicleType = "Ambulance") => {
    return L.divIcon({
      className: "custom-emergency-marker",
      html: `
        <div style="
          width: 34px; 
          height: 34px; 
          border-radius: 50%; 
          background: #EF4444; 
          border: 3px solid #FFFFFF; 
          box-shadow: 0 0 25px #EF4444;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          animation: pulse 1s infinite;
        ">
          🚑
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  };

  // Reliable Open Tile URLs (Zero API Key Needed!)
  const tileUrls = {
    standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  const activeTileUrl = mapLayer === "satellite" ? tileUrls.satellite : tileUrls.standard;
  const isLayerDarkFiltered = (mapLayer === "auto" && isDark) || mapLayer === "dark";

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 dark:border-slate-800 light:border-slate-300 shadow-2xl glass-panel">
      {/* Map Layer Mode Switcher Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/85 dark:bg-slate-950/85 light:bg-white/90 backdrop-blur-md border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs font-mono shadow-md">
        <button
          onClick={() => setMapLayer("auto")}
          className={`px-2.5 py-1 rounded-lg transition-colors ${
            mapLayer === "auto" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-black"
          }`}
        >
          {isDark ? "Dark View" : "Light View"}
        </button>
        <button
          onClick={() => setMapLayer("standard")}
          className={`px-2.5 py-1 rounded-lg transition-colors ${
            mapLayer === "standard" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-black"
          }`}
        >
          Standard OSM
        </button>
        <button
          onClick={() => setMapLayer("satellite")}
          className={`px-2.5 py-1 rounded-lg transition-colors ${
            mapLayer === "satellite" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-black"
          }`}
        >
          Satellite
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: "100%" }}
        zoomControl={false}
        className={isLayerDarkFiltered ? "dark-tile-layer" : ""}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url={activeTileUrl}
          maxZoom={19}
        />
        <MapRecenter center={center} zoom={zoom} />

        {/* 1. All Tamil Nadu District Centroids */}
        {districts.map((d) => {
          const cong = d.congestionPct || 50;
          const color = getCongestionColor(cong);
          return (
            <CircleMarker
              key={d.id}
              center={[d.lat, d.lng]}
              radius={zoom > 10 ? 8 : 12}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.65,
                weight: 2
              }}
              eventHandlers={{
                click: () => onSelectDistrict && onSelectDistrict(d.id)
              }}
            >
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <h4 className="font-bold text-white dark:text-white light:text-slate-900 text-sm">{d.name}</h4>
                  <div className="mt-1 space-y-0.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                    <p>Congestion: <span className="font-bold text-cyan-400">{cong}% ({getStatusLabel(cong)})</span></p>
                    <p>Flow Speed: <span className="font-bold">{d.avgSpeed || 35} km/h</span></p>
                    <p>Health Score: <span className="font-bold text-emerald-400">{d.healthScore || 75}/100</span></p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* 2. Road Network Edges / Segments */}
        {edges.map((e, idx) => {
          const cong = e.currentCongestion || 45;
          const color = getCongestionColor(cong);
          return (
            <Polyline
              key={e.id || idx}
              positions={e.coordinates || []}
              pathOptions={{
                color: color,
                weight: 4,
                opacity: 0.75,
                dashArray: e.roadType === "Secondary" ? "4, 6" : undefined
              }}
            />
          );
        })}

        {/* 3. Junction Markers with Detailed Telemetry Popups */}
        {junctions.map((j) => {
          const delaySec = Math.round(((j.queueLength || 15) * 2.8) + ((j.congestion || 40) * 0.45));
          const vph = Math.round((j.vehicleCount || 120) * 12);

          return (
            <Marker
              key={j.id}
              position={[j.lat, j.lng]}
              icon={createJunctionIcon(j)}
              eventHandlers={{
                click: () => onSelectJunction && onSelectJunction(j)
              }}
            >
              <Popup>
                <div className="text-xs p-1.5 font-sans min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-700 dark:border-slate-700 light:border-slate-200 pb-1 mb-1.5">
                    <h4 className="font-bold text-white dark:text-white light:text-slate-900 text-xs truncate">{j.name}</h4>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">
                      {j.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-300 dark:text-slate-300 light:text-slate-700 text-[11px]">
                    <div className="flex justify-between">
                      <span>Congestion:</span>
                      <span className="font-bold font-mono" style={{ color: getCongestionColor(j.congestion) }}>
                        {j.congestion}% ({getStatusLabel(j.congestion)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vehicle Count:</span>
                      <span className="font-bold font-mono">{vph} vph</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Speed:</span>
                      <span className="font-bold font-mono">{j.avgSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue Length:</span>
                      <span className="font-bold font-mono text-amber-400">{j.queueLength} vehicles</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intersection Delay:</span>
                      <span className="font-bold font-mono text-cyan-400">{delaySec}s</span>
                    </div>

                    {j.signalTiming && (
                      <div className="mt-2 pt-1.5 border-t border-slate-700 dark:border-slate-700 light:border-slate-200 text-[10px] font-mono text-slate-400">
                        Cycle: {j.signalTiming.cycleTime}s | N:{j.signalTiming.north}s S:{j.signalTiming.south}s E:{j.signalTiming.east}s W:{j.signalTiming.west}s
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Active Route Polyline Overlay */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: "#00F2FE",
              weight: 6,
              opacity: 0.95
            }}
          />
        )}

        {/* 5. Alternative Candidate Route Overlays */}
        {routeCandidates.map((cand, idx) => {
          if (cand.isRecommended) return null;
          return (
            <Polyline
              key={`alt_${idx}`}
              positions={cand.coordinates || []}
              pathOptions={{
                color: idx === 1 ? "#F59E0B" : "#A855F7",
                weight: 4,
                opacity: 0.7,
                dashArray: "6, 8"
              }}
            />
          );
        })}

        {/* 6. Emergency Vehicle Marker */}
        {emergencyVehicle && emergencyVehicle.position && (
          <Marker
            position={emergencyVehicle.position}
            icon={createEmergencyIcon(emergencyVehicle.type)}
          >
            <Popup>
              <div className="text-xs p-1 font-sans">
                <h4 className="font-bold text-rose-400 flex items-center gap-1">
                  🚨 {emergencyVehicle.type || "Ambulance"} Priority
                </h4>
                <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 mt-1">
                  Status: <span className="font-bold text-emerald-400">Green Wave Active</span>
                </p>
                <p className="text-slate-300 dark:text-slate-300 light:text-slate-700">
                  Speed: <span className="font-bold">{emergencyVehicle.speed || 55} km/h</span>
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
