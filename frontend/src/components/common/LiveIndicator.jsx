import React from "react";

export function LiveIndicator({ text = "LIVE RTDB SYNC", pulse = true, size = "md" }) {
  const dotSize = size === "sm" ? "w-2 h-2" : size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";
  
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wider uppercase">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full bg-cyan-500 ${dotSize}`}></span>
      </span>
      <span>{text}</span>
    </div>
  );
}
