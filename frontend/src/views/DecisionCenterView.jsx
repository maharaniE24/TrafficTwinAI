import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Sparkles, 
  TrendingUp, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Activity,
  Layers
} from "lucide-react";
import { useDistrict } from "../context/DistrictContext";
import { api } from "../api/client";

export function DecisionCenterView() {
  const { selectedDistrictId, activeDistrictData } = useDistrict();
  const districtName = activeDistrictData?.info?.name || selectedDistrictId.toUpperCase();

  const [decisions, setDecisions] = useState(null);
  const [strategicPlan, setStrategicPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [decRes, stratRes] = await Promise.all([
          api.getDecisionRecommendations(selectedDistrictId),
          api.getStrategicPlanning(selectedDistrictId)
        ]);
        setDecisions(decRes);
        setStrategicPlan(stratRes);
      } catch (err) {
        console.warn("Decision center load note:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDistrictId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              Decision Recommendation & Strategic Infrastructure Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/30">
              AI Decision Support
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated tactical action synthesis and long-term civil engineering bottleneck analytics for {districtName}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 font-mono">
          Synthesizing AI Decision Rules and Infrastructure Metrics...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Dynamic Tactical Decision Recommendation Engine */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Tactical Recommendation Engine</span>
                <h3 className={`text-base font-extrabold flex items-center gap-2 ${
                  decisions?.color === 'red' ? 'text-rose-400' : decisions?.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {decisions?.statusBanner || "OPTIMAL TRAFFIC FLOW"}
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                AI Confidence: {decisions?.decisionConfidence || 92}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {decisions?.recommendedActions?.map((act, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${act.priority === 'P1' ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                      {act.category}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {act.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{act.action}</p>
                  <p className="text-[11px] text-cyan-400/90 font-mono">Impact: {act.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Strategic Civil Engineering Infrastructure Improvements */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 glass-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">Civil Infrastructure Planning</span>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  Chronic Bottleneck Scanner & Capital Improvement Feasibility
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Infrastructure Grade:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {strategicPlan?.overallInfrastructureGrade || "B+"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {strategicPlan?.strategicSummary}
            </p>

            <div className="space-y-3 mt-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Identified Chronic Congestion Locations
              </h4>
              <div className="space-y-3">
                {strategicPlan?.chronicBottlenecks?.map((bot, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h5 className="text-xs font-bold text-white">{bot.junctionName}</h5>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-400">Chronic Frequency:</span>
                        <span className="text-rose-400 font-bold">{bot.chronicCongestionFrequencyPct}% of peak hours</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">{bot.civilRecommendation}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500 block">Estimated CapEx:</span>
                        <span className="text-amber-400 font-bold">{bot.capexEstimate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Horizon:</span>
                        <span className="text-slate-300">{bot.implementationHorizon}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Expected ROI:</span>
                        <span className="text-emerald-400">{bot.expectedBenefit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
