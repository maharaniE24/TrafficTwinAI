import time
import logging
from flask import Blueprint, request, jsonify
from backend.config import get_firebase_admin
from backend.services.data_validator import validate_incident_report, validate_traffic_record, validate_weather_record
from backend.services.seed_data import TAMIL_NADU_DISTRICTS
from backend.middleware.auth import require_auth

logger = logging.getLogger("TrafficTwin.Routes.Traffic")
traffic_bp = Blueprint("traffic_bp", __name__)

@traffic_bp.route("/districts", methods=["GET"])
def list_districts():
    _, db_mod, _ = get_firebase_admin()
    if db_mod:
        try:
            districts_data = db_mod.reference("districts").get()
            if districts_data and isinstance(districts_data, dict):
                result = []
                for d_id, data in districts_data.items():
                    info = data.get("info", {})
                    traffic = data.get("trafficLive", {})
                    weather = data.get("weatherLive", {})
                    result.append({
                        "id": d_id,
                        "name": info.get("name", d_id.title()),
                        "lat": info.get("lat"),
                        "lng": info.get("lng"),
                        "tier": info.get("tier", 2),
                        "congestionPct": traffic.get("congestionPct", 50.0),
                        "avgSpeed": traffic.get("avgSpeed", 35.0),
                        "vehicleCount": traffic.get("vehicleCount", 150),
                        "healthScore": traffic.get("healthScore", 75),
                        "incidentCount": traffic.get("incidentCount", 0),
                        "temperature": weather.get("temperature", 30.0),
                        "weatherCondition": weather.get("condition", "Clear")
                    })
                return jsonify({"districts": result})
        except Exception as e:
            logger.warning(f"Error fetching districts from DB: {e}")
            
    # Fallback to static list if DB is initializing
    return jsonify({"districts": TAMIL_NADU_DISTRICTS})

@traffic_bp.route("/districts/<district_id>", methods=["GET"])
def get_district_details(district_id: str):
    district_id = district_id.lower()
    _, db_mod, _ = get_firebase_admin()
    if db_mod:
        try:
            data = db_mod.reference(f"districts/{district_id}").get()
            if data and isinstance(data, dict):
                return jsonify({"district": data})
        except Exception as e:
            logger.warning(f"Error fetching district {district_id}: {e}")
            
    return jsonify({"error": f"District '{district_id}' not found"}), 404

@traffic_bp.route("/incidents", methods=["POST"])
@require_auth
def report_incident():
    payload = request.get_json() or {}
    is_valid, err_msg, cleaned_report = validate_incident_report(payload)
    if not is_valid:
        return jsonify({"error": err_msg}), 400
        
    incident_id = f"inc_{int(time.time())}_{cleaned_report['districtId']}"
    cleaned_report["id"] = incident_id
    cleaned_report["reportedAt"] = int(time.time())
    
    _, db_mod, _ = get_firebase_admin()
    if db_mod:
        try:
            # 1. Save incident
            db_mod.reference(f"IncidentReports/{incident_id}").set(cleaned_report)
            
            # 2. Increment district incident count & apply congestion impact in trafficLive
            d_ref = db_mod.reference(f"districts/{cleaned_report['districtId']}")
            d_data = d_ref.get() or {}
            traffic = d_data.get("trafficLive", {})
            curr_inc = traffic.get("incidentCount", 0) + 1
            curr_cong = float(traffic.get("congestionPct", 50.0))
            new_cong = min(99.0, round(curr_cong * cleaned_report["impactCongestionMultiplier"], 1))
            
            d_ref.child("trafficLive").update({
                "incidentCount": curr_inc,
                "congestionPct": new_cong
            })
            
            # 3. Create real-time notification
            notif = {
                "id": f"notif_{incident_id}",
                "title": f"⚠️ Incident: {cleaned_report['title']}",
                "message": f"{cleaned_report['description']} reported in {cleaned_report['districtId'].title()}.",
                "type": "warning" if cleaned_report["severity"] in ["medium", "low"] else "critical",
                "districtId": cleaned_report["districtId"],
                "timestamp": int(time.time()),
                "read": False,
                "resolved": False
            }
            db_mod.reference(f"Notifications/{notif['id']}").set(notif)
            logger.info(f"Incident {incident_id} recorded and applied to traffic model.")
        except Exception as e:
            logger.error(f"Error persisting incident: {e}")
            
    return jsonify({
        "status": "success",
        "message": "Incident reported and validated successfully. Traffic digital twin updated.",
        "incident": cleaned_report
    }), 201

@traffic_bp.route("/incidents", methods=["GET"])
def list_incidents():
    district_id = request.args.get("districtId")
    _, db_mod, _ = get_firebase_admin()
    if db_mod:
        try:
            incidents = db_mod.reference("IncidentReports").get()
            if incidents and isinstance(incidents, dict):
                inc_list = list(incidents.values())
                if district_id:
                    inc_list = [inc for inc in inc_list if inc.get("districtId") == district_id.lower()]
                return jsonify({"incidents": inc_list})
        except Exception as e:
            logger.warning(f"Error fetching incidents: {e}")
            
    return jsonify({"incidents": []})

@traffic_bp.route("/notifications", methods=["GET"])
def list_notifications():
    district_id = request.args.get("districtId")
    _, db_mod, _ = get_firebase_admin()
    if db_mod:
        try:
            notifs = db_mod.reference("Notifications").get()
            if notifs and isinstance(notifs, dict):
                notif_list = list(notifs.values())
                if district_id:
                    notif_list = [n for n in notif_list if n.get("districtId") == district_id.lower() or not n.get("districtId")]
                # Sort newest first
                notif_list.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
                return jsonify({"notifications": notif_list})
        except Exception as e:
            logger.warning(f"Error fetching notifications: {e}")
            
    return jsonify({"notifications": []})

@traffic_bp.route("/notifications/<notif_id>/resolve", methods=["POST"])
@require_auth
def resolve_notification(notif_id: str):
    _, db_mod, _ = get_firebase_admin()
    if db_mod:
        try:
            db_mod.reference(f"Notifications/{notif_id}").update({
                "resolved": True,
                "resolvedAt": int(time.time())
            })
            return jsonify({"status": "success", "message": f"Notification {notif_id} marked as resolved."})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"status": "success"})
