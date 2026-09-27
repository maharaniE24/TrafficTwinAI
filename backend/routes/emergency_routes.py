import time
import logging
from flask import Blueprint, request, jsonify
from backend.config import get_firebase_admin
from backend.services.emergency_corridor import emergency_service
from backend.middleware.auth import require_role

logger = logging.getLogger("TrafficTwin.Routes.Emergency")
emergency_bp = Blueprint("emergency_bp", __name__)

@emergency_bp.route("/plan", methods=["POST"])
@require_role("controller")
def plan_emergency_corridor():
    data = request.get_json() or {}
    district_id = data.get("districtId", "chennai").lower()
    vehicle_type = data.get("vehicleType", "Ambulance")
    
    start_lat = data.get("startLat")
    start_lng = data.get("startLng")
    end_lat = data.get("endLat")
    end_lng = data.get("endLng")
    
    start_j_id = data.get("startJunctionId")
    end_j_id = data.get("endJunctionId")
    
    _, db_mod, _ = get_firebase_admin()
    if not db_mod:
        return jsonify({"error": "Database service unavailable"}), 500
        
    district_data = db_mod.reference(f"districts/{district_id}").get()
    if not district_data:
        return jsonify({"error": f"District '{district_id}' not found"}), 404
        
    junctions = district_data.get("junctions", {})
    if start_j_id and start_j_id in junctions:
        start_lat = junctions[start_j_id]["lat"]
        start_lng = junctions[start_j_id]["lng"]
    if end_j_id and end_j_id in junctions:
        end_lat = junctions[end_j_id]["lat"]
        end_lng = junctions[end_j_id]["lng"]
        
    if start_lat is None or start_lng is None or end_lat is None or end_lng is None:
        j_keys = list(junctions.keys())
        if len(j_keys) >= 2:
            start_lat = junctions[j_keys[0]]["lat"]
            start_lng = junctions[j_keys[0]]["lng"]
            end_lat = junctions[j_keys[-1]]["lat"]
            end_lng = junctions[j_keys[-1]]["lng"]
        else:
            return jsonify({"error": "Start and destination coordinates are required."}), 400
            
    result = emergency_service.plan_corridor(
        district_data=district_data,
        vehicle_type=vehicle_type,
        start_lat=float(start_lat),
        start_lng=float(start_lng),
        end_lat=float(end_lat),
        end_lng=float(end_lng)
    )
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 400
        
    # Persist event in EmergencyEvents
    try:
        db_mod.reference(f"EmergencyEvents/{result['eventId']}").set({
            "eventId": result["eventId"],
            "districtId": district_id,
            "vehicleType": vehicle_type,
            "metrics": result["metrics"],
            "stuckCount": len(result["stuckSegments"]),
            "timestamp": int(time.time()),
            "status": "in_progress"
        })
    except Exception as e:
        logger.warning(f"Error persisting emergency event: {e}")
        
    return jsonify(result)

@emergency_bp.route("/resolve-stuck", methods=["POST"])
@require_role("controller")
def resolve_stuck_alert():
    data = request.get_json() or {}
    event_id = data.get("eventId", "")
    junction_id = data.get("junctionId", "")
    action = data.get("action", "Extend Green Wave (+45s)")
    
    result = emergency_service.resolve_stuck_corridor(event_id, junction_id, action)
    return jsonify(result)
