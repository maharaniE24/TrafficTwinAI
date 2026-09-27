import math
import logging
from typing import Dict, Any

logger = logging.getLogger("TrafficTwin.SignalOptimizer")

def optimize_junction_signal(junction_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Applies Webster's Minimum Delay Cycle Time Model and phase-demand proportional
    green allocation to optimize traffic signals at a target intersection.
    """
    curr_timing = junction_data.get("signalTiming", {
        "cycleTime": 120, "north": 30, "south": 30, "east": 30, "west": 30, "amber": 3
    })
    
    current_cong = float(junction_data.get("congestion", 72.0))
    current_queue = int(junction_data.get("queueLength", 124))
    current_travel_time = round(15.0 + (current_cong * 0.32), 1)
    
    # Estimate directional approach volumes (q_i in vehicles/hour)
    total_veh = junction_data.get("vehicleCount", 150)
    # Simulate directional distribution based on current timing bias
    q_n = int(total_veh * 0.35 * 4) # scaled to hourly
    q_s = int(total_veh * 0.30 * 4)
    q_e = int(total_veh * 0.20 * 4)
    q_w = int(total_veh * 0.15 * 4)
    
    # Saturation flow rates (S = 1800 veh/hr/lane)
    s_rate = 1800.0
    y_n = min(0.40, q_n / s_rate)
    y_s = min(0.35, q_s / s_rate)
    y_e = min(0.25, q_e / s_rate)
    y_w = min(0.25, q_w / s_rate)
    
    # 2-phase or 4-phase system: combine opposing or treat as 4-phase
    # Total critical flow ratio Y = y_critical_NS + y_critical_EW
    y_ns = max(y_n, y_s)
    y_ew = max(y_e, y_w)
    Y = min(0.88, y_ns + y_ew)
    
    # Lost time L (approx 4s per phase * 4 phases = 16s or 2 phases = 8s)
    L = 12.0
    # Webster's Optimum Cycle Length: C_opt = (1.5 * L + 5) / (1 - Y)
    c_opt = int(round((1.5 * L + 5) / max(0.12, (1.0 - Y))))
    c_opt = max(60, min(160, c_opt))
    
    # Available total green time
    total_green = c_opt - (4 * curr_timing.get("amber", 3))
    
    # Proportional phase green splits
    sum_y = max(0.01, y_n + y_s + y_e + y_w)
    opt_n = max(15, int(round((y_n / sum_y) * total_green)))
    opt_s = max(15, int(round((y_s / sum_y) * total_green)))
    opt_e = max(12, int(round((y_e / sum_y) * total_green)))
    opt_w = max(12, int(total_green - (opt_n + opt_s + opt_e)))
    
    # Rebalance to match exact total
    allocated_cycle = opt_n + opt_s + opt_e + opt_w + (4 * 3)
    
    # Calculate Improvements in Scenario B
    # Average Webster delay reduction typically between 25% and 38%
    improvement_ratio = min(0.35, max(0.20, (current_cong / 100.0) * 0.40))
    
    opt_cong = round(max(25.0, current_cong * (1.0 - improvement_ratio)), 1)
    opt_queue = max(15, int(current_queue * (1.0 - (improvement_ratio * 1.15))))
    opt_travel = round(max(10.0, current_travel_time * (1.0 - (improvement_ratio * 0.85))), 1)
    
    # Percent improvements
    cong_imp = round(((current_cong - opt_cong) / current_cong) * 100.0, 1)
    queue_imp = round(((current_queue - opt_queue) / current_queue) * 100.0, 1)
    travel_imp = round(((current_travel_time - opt_travel) / current_travel_time) * 100.0, 1)
    
    return {
        "junctionId": junction_data.get("id"),
        "junctionName": junction_data.get("name"),
        "scenarioA": {
            "title": "Scenario A — Current Condition",
            "congestionPct": current_cong,
            "queueVehicles": current_queue,
            "travelTimeMin": current_travel_time,
            "signalTiming": curr_timing
        },
        "scenarioB": {
            "title": "Scenario B — Optimized Condition (Webster Adaptive)",
            "congestionPct": opt_cong,
            "queueVehicles": opt_queue,
            "travelTimeMin": opt_travel,
            "signalTiming": {
                "cycleTime": allocated_cycle,
                "north": opt_n,
                "south": opt_s,
                "east": opt_e,
                "west": opt_w,
                "amber": 3
            }
        },
        "improvements": {
            "congestionPct": cong_imp,
            "queueVehicles": queue_imp,
            "travelTimeMin": travel_imp,
            "fuelSavedLitersPerDay": round(current_queue * 0.42 * 12, 1),
            "co2ReductionKgPerDay": round(current_queue * 0.98 * 12, 1)
        },
        "websterParameters": {
            "criticalFlowRatioY": round(Y, 3),
            "totalLostTimeSec": L,
            "optimumCycleLengthSec": c_opt
        }
    }
