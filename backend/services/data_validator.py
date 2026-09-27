import re
import html
import logging
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("TrafficTwin.Validator")

VALID_INCIDENT_TYPES = {"accident", "pothole", "flooding", "breakdown", "roadwork", "hazard", "congestion"}
VALID_SEVERITIES = {"low", "medium", "high", "critical"}

def sanitize_text(text: str, max_length: int = 500) -> str:
    """Sanitize strings against XSS, control characters, and truncation."""
    if not text:
        return ""
    # Strip HTML tags
    clean = re.sub(r'<[^>]*?>', '', str(text))
    # Escape special characters
    clean = html.escape(clean)
    # Strip non-printable chars
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', clean)
    return clean.strip()[:max_length]

def validate_traffic_record(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """
    Validates and cleans traffic telemetry records.
    """
    if not isinstance(data, dict):
        return False, "Data must be a dictionary", {}
    
    try:
        district_id = sanitize_text(str(data.get("districtId", "")))
        if not district_id:
            return False, "districtId is required", {}
        
        vehicle_count = max(0, int(data.get("vehicleCount", 0)))
        avg_speed = max(0.0, min(160.0, float(data.get("avgSpeed", 30.0))))
        congestion_pct = max(0.0, min(100.0, float(data.get("congestionPct", 0.0))))
        travel_time_min = max(1.0, float(data.get("travelTimeMinutes", 10.0)))
        queue_length = max(0, int(data.get("queueLength", 0)))
        
        cleaned = {
            "districtId": district_id,
            "vehicleCount": vehicle_count,
            "avgSpeed": round(avg_speed, 1),
            "congestionPct": round(congestion_pct, 1),
            "travelTimeMinutes": round(travel_time_min, 1),
            "queueLength": queue_length,
            "incidentCount": max(0, int(data.get("incidentCount", 0))),
            "timestamp": data.get("timestamp") or data.get("updatedAt") or "now",
            "source": sanitize_text(data.get("source", "sensor_feed"))
        }
        return True, None, cleaned
    except (ValueError, TypeError) as e:
        return False, f"Traffic record format error: {str(e)}", {}

def validate_weather_record(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """
    Validates and cleans weather records.
    """
    if not isinstance(data, dict):
        return False, "Data must be a dictionary", {}
    
    try:
        district_id = sanitize_text(str(data.get("districtId", "")))
        if not district_id:
            return False, "districtId is required", {}
        
        temp_c = max(-10.0, min(60.0, float(data.get("temperature", 30.0))))
        humidity = max(0.0, min(100.0, float(data.get("humidity", 65.0))))
        rainfall_mm = max(0.0, float(data.get("rainfall", 0.0)))
        wind_speed_kmh = max(0.0, min(250.0, float(data.get("windSpeed", 10.0))))
        visibility_km = max(0.1, min(50.0, float(data.get("visibility", 10.0))))
        condition = sanitize_text(str(data.get("condition", "Clear")))
        
        cleaned = {
            "districtId": district_id,
            "temperature": round(temp_c, 1),
            "humidity": round(humidity, 1),
            "rainfall": round(rainfall_mm, 1),
            "windSpeed": round(wind_speed_kmh, 1),
            "visibility": round(visibility_km, 1),
            "condition": condition,
            "weatherAlert": sanitize_text(str(data.get("weatherAlert", ""))),
            "timestamp": data.get("timestamp") or "now"
        }
        return True, None, cleaned
    except (ValueError, TypeError) as e:
        return False, f"Weather record format error: {str(e)}", {}

def validate_incident_report(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """
    Validates and cleans citizen and controller incident submissions.
    """
    if not isinstance(data, dict):
        return False, "Data must be a dictionary", {}
    
    district_id = sanitize_text(str(data.get("districtId", "")))
    if not district_id:
        return False, "districtId is required", {}
    
    incident_type = str(data.get("incidentType", "hazard")).lower().strip()
    if incident_type not in VALID_INCIDENT_TYPES:
        incident_type = "hazard"
    
    severity = str(data.get("severity", "medium")).lower().strip()
    if severity not in VALID_SEVERITIES:
        severity = "medium"
    
    title = sanitize_text(data.get("title", f"{incident_type.title()} reported"), max_length=120)
    description = sanitize_text(data.get("description", ""), max_length=1000)
    junction_id = sanitize_text(str(data.get("junctionId", "")), max_length=80)
    
    lat = data.get("lat")
    lng = data.get("lng")
    if lat is not None and lng is not None:
        try:
            lat = float(lat)
            lng = float(lng)
            if not (8.0 <= lat <= 14.0 and 76.0 <= lng <= 81.0):
                # Coordinate outside Tamil Nadu bounding box fallback
                lat = round(lat, 6)
                lng = round(lng, 6)
        except (ValueError, TypeError):
            lat, lng = None, None
            
    cleaned = {
        "districtId": district_id,
        "incidentType": incident_type,
        "severity": severity,
        "title": title,
        "description": description,
        "junctionId": junction_id,
        "lat": lat,
        "lng": lng,
        "status": "active",
        "reportedBy": sanitize_text(data.get("reportedBy", "anonymous")),
        "reporterRole": sanitize_text(data.get("reporterRole", "citizen")),
        "impactCongestionMultiplier": 1.15 if severity == "low" else 1.35 if severity == "medium" else 1.65 if severity == "high" else 2.0
    }
    return True, None, cleaned
