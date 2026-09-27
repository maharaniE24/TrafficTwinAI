import React from "react";

export function HealthBadge({ score = 75, showLabel = true, size = "md" }) {
  const numeric = Math.min(100, Math.max(0, Math.round(score)));
  
  let colorBg = "bg-emerald-950/80 text-emerald-400 border-emerald-500/40";
  let label = "Optimal Flow";
  let glow = "shadow-[0_0_12px_rgba(16,185,129,0.25)]";

  if (numeric < 45) {
    colorBg = "bg-rose-950/80 text-rose-400 border-rose-500/40";
    label = "Severe Gridlock";
    glow = "shadow-[0_0_12px_rgba(239,68,68,0.3)]";
  } else if (numeric < 70) {
    colorBg = "bg-amber-950/80 text-amber-400 border-amber-500/40";
    label = "Moderate Friction";
    glow = "shadow-[0_0_12px_rgba(245,158,11,0.25)]";
  }

  const badgePadding = size === "sm" ? "px-2 py-0.5 text-xs" : size === "lg" ? "px-3.5 py-1.5 text-base font-bold" : "px-2.5 py-1 text-xs";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md border font-mono font-medium ${badgePadding} ${colorBg} ${glow}`}>
      <span className="font-bold">{numeric}/100</span>
      {showLabel && <span className="opacity-80 border-l border-current/30 pl-1.5 font-sans text-[11px]">{label}</span>}
    </div>
  );
}
