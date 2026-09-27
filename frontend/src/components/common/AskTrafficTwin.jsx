import React, { useState } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, User } from "lucide-react";
import { useDistrict } from "../../context/DistrictContext";
import { useAuth } from "../../context/AuthContext";

export function AskTrafficTwin() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { activeDistrictData, selectedDistrictId, districtsList } = useDistrict();
  const { role } = useAuth();

  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();
  const traffic = activeDistrictData?.trafficLive || {};
  const weather = activeDistrictData?.weatherLive || {};
  const cong = traffic.congestionPct ?? 52;
  const speed = traffic.avgSpeed ?? 34;

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hello! I am your AI TrafficTwin Digital Twin Assistant. Ask me anything about traffic congestion, weather impacts, signal optimization, or routing in Tamil Nadu cities!`
    }
  ]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const userText = query.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setQuery("");

    // Rule-based + Digital Twin inference reasoning
    setTimeout(() => {
      let reply = "";
      const lower = userText.toLowerCase();

      if (lower.includes("why") && (lower.includes("congestion") || lower.includes("traffic") || lower.includes("slow"))) {
        reply = `In ${districtName}, current congestion is at ${cong}%. Key factors: 1) Peak commuter flow, 2) ${weather.rainfall > 0 ? `${weather.rainfall}mm rainfall reducing average speeds to ${speed} km/h` : "Clear weather but high junction approach demand"}, 3) Active incidents: ${traffic.incidentCount || 0}. Recommended action: Adjust arterial signal splits by +15s or divert through bypass.`;
      } else if (lower.includes("weather") || lower.includes("rain")) {
        reply = `Current weather in ${districtName}: ${weather.condition || "Clear"}, ${weather.temperature || 31}°C with ${weather.rainfall || 0}mm rainfall. Rain increases road friction delay by approx ${weather.rainfall ? Math.round(weather.rainfall * 2.2) : 0}%.`;
      } else if (lower.includes("signal") || lower.includes("timing") || lower.includes("optimize")) {
        reply = `Signal optimization in ${districtName} uses Webster's Minimum Delay Formulation. Dynamic cycle times range between 90s-140s. Running optimization typically cuts junction queues by 25-38%.`;
      } else if (lower.includes("emergency") || lower.includes("ambulance")) {
        reply = `Emergency Vehicle Priority module computes real-time Green Waves with sub-second signal preemption. If a segment exceeds 70% congestion, automated 'Stuck Alert' notifications trigger with 1-click green corridor extensions.`;
      } else if (lower.includes("best route") || lower.includes("route") || lower.includes("dijkstra")) {
        reply = `The Route Recommender evaluates both Dijkstra's shortest travel-time algorithm and A* multi-factor heuristic (scoring distance, time, congestion, rain, and active citizen incident reports).`;
      } else if (lower.includes("district") || lower.includes("compare") || lower.includes("tamil nadu")) {
        reply = `TrafficTwin AI monitors all 38 Tamil Nadu districts. Chennai, Coimbatore, Madurai, and Trichy represent Tier-1 high-density hubs, whereas Salem and Erode serve as critical industrial transport corridors.`;
      } else {
        reply = `Based on the real-time Digital Twin telemetry for ${districtName}: Congestion is ${cong}%, average speed is ${speed} km/h, and Health Score is ${traffic.healthScore || 75}/100. Would you like to check route recommendations or signal optimization for this district?`;
      }

      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 450);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-full shadow-[0_0_25px_rgba(0,242,254,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Open AI Traffic Assistant"
        >
          <Sparkles className="w-5 h-5 text-slate-950 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Ask TrafficTwin</span>
        </button>
      )}

      {isOpen && (
        <div className="w-96 max-w-[90vw] h-[500px] flex flex-col glass-panel-glow bg-slate-950/95 rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/30 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  TrafficTwin AI Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[11px] text-slate-400">Scoped to {districtName}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-cyan-500 text-slate-950 font-medium rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {m.text}
                </div>
                {m.sender === "user" && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => { setQuery(`Why is traffic congested in ${districtName}?`); }}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 whitespace-nowrap border border-slate-700/60 transition-colors"
            >
              Why high congestion?
            </button>
            <button
              onClick={() => { setQuery(`Explain signal timing optimization`); }}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 whitespace-nowrap border border-slate-700/60 transition-colors"
            >
              Signal optimization?
            </button>
            <button
              onClick={() => { setQuery(`How does rain affect delay?`); }}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 whitespace-nowrap border border-slate-700/60 transition-colors"
            >
              Weather impact?
            </button>
          </div>

          {/* Input form */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about traffic, weather, routes..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-lg font-bold transition-all"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
