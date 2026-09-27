import logging
from flask import Blueprint, request, jsonify
from backend.config import get_firebase_admin
from backend.services.routing_service import compute_route_recommendations
from backend.middleware.auth import require_auth

logger = logging.getLogger("TrafficTwin.Routes.Routing")
routing_bp = Blueprint("routing_bp", __name__)

@routing_bp.route("/recommend", methods=["POST"])
def recommend_route():
    data = request.get_json() or {}
    district_id = data.get("districtId", "chennai").lower()
    
    start_lat = data.get("startLat")
    start_lng = data.get("startLng")
    end_lat = data.get("endLat")
    end_lng = data.get("endLng")
    
    # Or startJunctionId / endJunctionId
    start_j_id = data.get("startJunctionId")
    end_j_id = data.get("endJunctionId")
    
    weights = data.get("weights", {
        "w1_congestion": 0.30,
        "w2_travelTime": 0.35,
        "w3_distance": 0.15,
        "w4_weather": 0.10,
        "w5_incidents": 0.10
    })
    
    _, db_mod, _ = get_firebase_admin()
    if not db_mod:
        return jsonify({"error": "Database service unavailable"}), 500
        
    district_data = db_mod.reference(f"districts/{district_id}").get()
    if not district_data:
        return jsonify({"error": f"District '{district_id}' not found"}), 404
        
    graph_data = district_data.get("graph", {})
    weather_data = district_data.get("weatherLive", {})
    
    # If junction IDs provided, look up coordinates
    junctions = district_data.get("junctions", {})
    if start_j_id and start_j_id in junctions:
        start_lat = junctions[start_j_id]["lat"]
        start_lng = junctions[start_j_id]["lng"]
    if end_j_id and end_j_id in junctions:
        end_lat = junctions[end_j_id]["lat"]
        end_lng = junctions[end_j_id]["lng"]
        
    if start_lat is None or start_lng is None or end_lat is None or end_lng is None:
        # Fallback to default first and last junction
        j_keys = list(junctions.keys())
        if len(j_keys) >= 2:
            start_lat = junctions[j_keys[0]]["lat"]
            start_lng = junctions[j_keys[0]]["lng"]
            end_lat = junctions[j_keys[-1]]["lat"]
            end_lng = junctions[j_keys[-1]]["lng"]
        else:
            return jsonify({"error": "Start and destination coordinates are required."}), 400
            
    # Fetch active incidents in district
    incidents_data = db_mod.reference("IncidentReports").get()
    incidents = []
    if incidents_data and isinstance(incidents_data, dict):
        incidents = [inc for inc in incidents_data.values() if inc.get("districtId") == district_id]
        
    result = compute_route_recommendations(
        graph_data=graph_data,
        start_lat=float(start_lat),
        start_lng=float(start_lng),
        end_lat=float(end_lat),
        end_lng=float(end_lng),
        weights=weights,
        weather_data=weather_data,
        incidents=incidents
    )
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 400
        
    return jsonify(result)
