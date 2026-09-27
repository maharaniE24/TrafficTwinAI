import time
import logging
from flask import Blueprint, request, jsonify
from backend.config import get_firebase_admin
from backend.services.signal_optimizer import optimize_junction_signal
from backend.services.simulation_engine import run_digital_twin_simulation
from backend.middleware.auth import require_role

logger = logging.getLogger("TrafficTwin.Routes.Optimization")
optimization_bp = Blueprint("optimization_bp", __name__)

@optimization_bp.route("/signal/optimize", methods=["POST"])
@require_role("controller")
def optimize_signal():
    data = request.get_json() or {}
    district_id = data.get("districtId", "chennai").lower()
    junction_id = data.get("junctionId")
    
    _, db_mod, _ = get_firebase_admin()
    if not db_mod:
        return jsonify({"error": "Database service unavailable"}), 500
        
    district_data = db_mod.reference(f"districts/{district_id}").get()
    if not district_data:
        return jsonify({"error": f"District '{district_id}' not found"}), 404
        
    junctions = district_data.get("junctions", {})
    if not junction_id or junction_id not in junctions:
        # Default to first junction
        if junctions:
            junction_id = list(junctions.keys())[0]
        else:
            return jsonify({"error": "No junctions found in district"}), 404
            
    junction_data = junctions[junction_id]
    result = optimize_junction_signal(junction_data)
    
    # Store optimized timings in Firebase SignalTimings node
    try:
        opt_id = f"sig_{district_id}_{junction_id}"
        db_mod.reference(f"SignalTimings/{opt_id}").set({
            "districtId": district_id,
            "junctionId": junction_id,
            "result": result,
            "updatedAt": int(time.time())
        })
        
        # Also persist to SimulationResults
        sim_id = f"sim_sig_{int(time.time())}"
        db_mod.reference(f"SimulationResults/{sim_id}").set({
            "type": "signal_optimization",
            "districtId": district_id,
            "junctionId": junction_id,
            "scenarioA": result["scenarioA"],
            "scenarioB": result["scenarioB"],
            "improvements": result["improvements"],
            "timestamp": int(time.time())
        })
        logger.info(f"Signal optimization saved to Firebase for junction {junction_id}.")
    except Exception as e:
        logger.warning(f"Error persisting signal optimization: {e}")
        
    return jsonify(result)

@optimization_bp.route("/signal/apply", methods=["POST"])
@require_role("controller")
def apply_signal_timing():
    data = request.get_json() or {}
    district_id = data.get("districtId", "chennai").lower()
    junction_id = data.get("junctionId")
    signal_timing = data.get("signalTiming")
    
    if not junction_id or not signal_timing:
        return jsonify({"error": "junctionId and signalTiming are required"}), 400
        
    _, db_mod, _ = get_firebase_admin()
    if db_mod:
        try:
            # Update junction in live district
            j_ref = db_mod.reference(f"districts/{district_id}/junctions/{junction_id}")
            j_ref.update({
                "signalTiming": signal_timing,
                "congestion": max(20, int(j_ref.child("congestion").get() or 60) - 18),
                "queueLength": max(5, int(j_ref.child("queueLength").get() or 30) - 10)
            })
            logger.info(f"Applied new signal timing for junction {junction_id} in {district_id}.")
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"status": "success", "message": f"Signal timing updated for {junction_id}"})

@optimization_bp.route("/simulator/run", methods=["POST"])
@require_role("controller")
def run_simulation():
    data = request.get_json() or {}
    district_id = data.get("districtId", "chennai").lower()
    params = data.get("parameters", {})
    
    _, db_mod, _ = get_firebase_admin()
    if not db_mod:
        return jsonify({"error": "Database service unavailable"}), 500
        
    district_data = db_mod.reference(f"districts/{district_id}").get()
    if not district_data:
        return jsonify({"error": f"District '{district_id}' not found"}), 404
        
    base_traffic = district_data.get("trafficLive", {})
    result = run_digital_twin_simulation(base_traffic, params)
    
    # Write simulation result to SimulationResults node
    try:
        sim_id = f"sim_whatif_{int(time.time())}"
        db_mod.reference(f"SimulationResults/{sim_id}").set({
            "type": "what_if_sandbox",
            "districtId": district_id,
            "inputs": result["inputs"],
            "simulated": result["simulated"],
            "deltas": result["deltas"],
            "timestamp": int(time.time())
        })
    except Exception as e:
        logger.warning(f"Error persisting what-if simulation: {e}")
        
    return jsonify(result)
