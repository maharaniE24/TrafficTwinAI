import logging
from typing import Dict, Any, List

logger = logging.getLogger("TrafficTwin.DecisionEngine")

def generate_decision_recommendations(district_data: Dict[str, Any], predictions: Dict[str, Any]) -> Dict[str, Any]:
    """
    Synthesizes current live telemetry, multi-horizon LSTM predictions, and junction loads
    into prioritized actionable traffic controller decisions.
    """
    traffic = district_data.get("trafficLive", {})
    weather = district_data.get("weatherLive", {})
    junctions = district_data.get("junctions", {})
    
    cong_pct = float(traffic.get("congestionPct", 45.0))
    rain = float(weather.get("rainfall", 0.0))
    
    # Check predicted trend
    future = predictions.get("futureForecasts", [])
    pred_30m = future[1] if len(future) > 1 else {"congestionPct": cong_pct}
    pred_cong = pred_30m.get("congestionPct", cong_pct)
    
    trend = "Surging (+)" if pred_cong > cong_pct + 4 else "Declining (-)" if pred_cong < cong_pct - 4 else "Stable"
    
    # Identify critical junctions
    critical_junctions = []
    if isinstance(junctions, dict):
        for j_id, j in junctions.items():
            if j.get("congestion", 0) >= 65:
                critical_junctions.append(j)
                
    # Sort critical junctions by congestion desc
    critical_junctions.sort(key=lambda x: x.get("congestion", 0), reverse=True)
    
    # Determine severity
    if cong_pct >= 75 or pred_cong >= 80:
        severity = "HIGH"
        status_banner = "HIGH CONGESTION PREDICTED"
        color = "red"
    elif cong_pct >= 50 or pred_cong >= 55:
        severity = "MODERATE"
        status_banner = "MODERATE CONGESTION DETECTED"
        color = "amber"
    else:
        severity = "LOW"
        status_banner = "OPTIMAL TRAFFIC FLOW"
        color = "emerald"
        
    actions = []
    
    # 1. Signal action
    if critical_junctions:
        top_j = critical_junctions[0]
        actions.append({
            "category": "Signal Timing",
            "action": f"Increase {top_j['name']} green time split by +15s (current load: {top_j['congestion']}%)",
            "priority": "P1",
            "impact": "Reduces approach queue by ~32%"
        })
    else:
        actions.append({
            "category": "Signal Timing",
            "action": "Maintain balanced Webster cycle split across all arterial junctions",
            "priority": "P3",
            "impact": "Steady progression"
        })
        
    # 2. Route diversion
    if cong_pct > 60:
        actions.append({
            "category": "Dynamic Rerouting",
            "action": "Broadcast variable message signs (VMS) to divert through-traffic via Ring Road Bypass",
            "priority": "P1" if cong_pct > 75 else "P2",
            "impact": "Offloads 18-24% arterial volume"
        })
        
    # 3. Weather advisory
    if rain > 2.0:
        actions.append({
            "category": "Weather Protocol",
            "action": f"Wet surface advisory active ({rain} mm rain) — adjust digital speed limit to 40 km/h",
            "priority": "P2",
            "impact": "Prevents skid collisions"
        })
        
    # 4. Emergency Corridor Readiness
    actions.append({
        "category": "Emergency Dispatch",
        "action": "Virtual green corridor standby active for hospital arterial route",
        "priority": "P2" if cong_pct > 70 else "P3",
        "impact": "Ensures sub-6min transit time"
    })
    
    return {
        "districtId": district_data.get("info", {}).get("id"),
        "districtName": district_data.get("info", {}).get("name"),
        "severity": severity,
        "statusBanner": status_banner,
        "color": color,
        "currentCongestionPct": cong_pct,
        "predicted30MinCongestionPct": pred_cong,
        "trend": trend,
        "criticalJunctionCount": len(critical_junctions),
        "criticalJunctions": critical_junctions[:3],
        "recommendedActions": actions,
        "decisionConfidence": 92
    }
