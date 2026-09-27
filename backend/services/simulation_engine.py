import logging
from typing import Dict, Any

logger = logging.getLogger("TrafficTwin.Simulation")

def run_digital_twin_simulation(base_traffic: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a Digital Twin sandbox simulation evaluating multi-factor scenario stress tests.
    Leaves live state completely untouched.
    """
    # Base parameters
    base_cong = float(base_traffic.get("congestionPct", 50.0))
    base_spd = float(base_traffic.get("avgSpeed", 35.0))
    base_queue = int(base_traffic.get("queueLength", 30))
    base_travel = float(base_traffic.get("travelTimeMinutes", 20.0))
    
    # User-adjusted scenario knobs
    vol_mult = max(0.2, min(3.5, float(params.get("volumeMultiplier", 1.0))))
    signal_efficiency = max(0.4, min(2.0, float(params.get("signalEfficiency", 1.0))))
    rainfall_mm = max(0.0, min(80.0, float(params.get("rainfallMm", 0.0))))
    accidents = max(0, min(10, int(params.get("accidentCount", 0))))
    road_closures = max(0, min(5, int(params.get("roadClosureCount", 0))))
    emergency_priority = bool(params.get("emergencyPriorityActive", False))
    
    # 1. Volume Impact
    sim_cong = base_cong * (vol_mult ** 1.1)
    
    # 2. Signal Timing Efficiency Impact (higher efficiency reduces congestion)
    sim_cong = sim_cong / (signal_efficiency ** 0.6)
    
    # 3. Weather / Rain Impact
    if rainfall_mm > 0:
        sim_cong += (rainfall_mm * 0.45)
        
    # 4. Incidents & Closures
    sim_cong += (accidents * 8.5)
    sim_cong += (road_closures * 14.0)
    
    # 5. Emergency Corridor Priority (clears green wave on designated corridor)
    if emergency_priority:
        sim_cong *= 0.82
        
    # Clamp simulated congestion between 5% and 99%
    sim_cong = round(max(5.0, min(99.0, sim_cong)), 1)
    
    # Derived parameters
    speed_factor = max(0.15, 1.0 - (sim_cong / 110.0))
    sim_speed = round(max(8.0, min(75.0, 60.0 * speed_factor)), 1)
    sim_queue = int(base_queue * (vol_mult ** 1.3) * (sim_cong / max(1.0, base_cong)))
    sim_travel = round(max(5.0, base_travel * (base_spd / max(5.0, sim_speed))), 1)
    sim_waiting_delay = round(max(1.0, (sim_travel - (base_travel * 0.7)) * 60.0), 0) # in seconds
    
    # Comparative deltas
    delta_cong = round(sim_cong - base_cong, 1)
    delta_speed = round(sim_speed - base_spd, 1)
    delta_queue = sim_queue - base_queue
    delta_travel = round(sim_travel - base_travel, 1)
    
    status_level = "critical" if sim_cong > 80 else "warning" if sim_cong > 60 else "optimal"
    
    return {
        "status": "success",
        "inputs": {
            "volumeMultiplier": vol_mult,
            "signalEfficiency": signal_efficiency,
            "rainfallMm": rainfall_mm,
            "accidentCount": accidents,
            "roadClosureCount": road_closures,
            "emergencyPriorityActive": emergency_priority
        },
        "baseline": {
            "congestionPct": base_cong,
            "avgSpeedKmh": base_spd,
            "queueVehicles": base_queue,
            "travelTimeMin": base_travel
        },
        "simulated": {
            "congestionPct": sim_cong,
            "avgSpeedKmh": sim_speed,
            "queueVehicles": sim_queue,
            "travelTimeMin": sim_travel,
            "waitingDelaySec": sim_waiting_delay,
            "statusLevel": status_level
        },
        "deltas": {
            "congestionPct": delta_cong,
            "avgSpeedKmh": delta_speed,
            "queueVehicles": delta_queue,
            "travelTimeMin": delta_travel
        }
    }
