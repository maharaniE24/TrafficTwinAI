import io
import csv
import time
import logging
from flask import Blueprint, request, jsonify, send_file, Response
from backend.config import get_firebase_admin
from backend.services.decision_engine import generate_decision_recommendations
from backend.services.strategic_planner import analyze_strategic_bottlenecks
from backend.services.seed_data import generate_historical_series
from backend.ml.lstm_model import lstm_engine
from backend.middleware.auth import require_role

logger = logging.getLogger("TrafficTwin.Routes.Analytics")
analytics_bp = Blueprint("analytics_bp", __name__)

SCENARIO_LIBRARY = [
    {
        "id": "S1",
        "name": "S1 — Normal Free Flow",
        "description": "Baseline weekday off-peak operations with standard Webster cycle split.",
        "params": {"volumeMultiplier": 0.8, "signalEfficiency": 1.0, "rainfallMm": 0, "accidentCount": 0, "roadClosureCount": 0, "emergencyPriorityActive": False}
    },
    {
        "id": "S2",
        "name": "S2 — Morning Peak Surge",
        "description": "2.2x volume surge across inbound commuter corridors.",
        "params": {"volumeMultiplier": 2.2, "signalEfficiency": 0.9, "rainfallMm": 0, "accidentCount": 0, "roadClosureCount": 0, "emergencyPriorityActive": False}
    },
    {
        "id": "S3",
        "name": "S3 — Monsoon Heavy Rain",
        "description": "28mm torrential downpour causing 35% speed drop and reduced road friction.",
        "params": {"volumeMultiplier": 1.4, "signalEfficiency": 0.8, "rainfallMm": 28.0, "accidentCount": 0, "roadClosureCount": 0, "emergencyPriorityActive": False}
    },
    {
        "id": "S4",
        "name": "S4 — Major Arterial Accident",
        "description": "2 multi-vehicle collisions blocking 2 critical lanes.",
        "params": {"volumeMultiplier": 1.5, "signalEfficiency": 0.7, "rainfallMm": 0, "accidentCount": 2, "roadClosureCount": 0, "emergencyPriorityActive": False}
    },
    {
        "id": "S5",
        "name": "S5 — Road Closure & Maintenance",
        "description": "1 key bridge/flyover closed for emergency pipeline repairs.",
        "params": {"volumeMultiplier": 1.3, "signalEfficiency": 0.6, "rainfallMm": 0, "accidentCount": 0, "roadClosureCount": 1, "emergencyPriorityActive": False}
    },
    {
        "id": "S6",
        "name": "S6 — Emergency Green Wave Passage",
        "description": "Critical ambulance priority active with automated cross-signal preemption.",
        "params": {"volumeMultiplier": 1.2, "signalEfficiency": 1.3, "rainfallMm": 0, "accidentCount": 0, "roadClosureCount": 0, "emergencyPriorityActive": True}
    },
    {
        "id": "S7",
        "name": "S7 — Signal & Dynamic Route Offload",
        "description": "Combined Webster adaptive timing + VMS ring road diversion.",
        "params": {"volumeMultiplier": 1.6, "signalEfficiency": 1.4, "rainfallMm": 0, "accidentCount": 0, "roadClosureCount": 0, "emergencyPriorityActive": False}
    },
    {
        "id": "S8",
        "name": "S8 — Full AI Digital Twin Optimization",
        "description": "All AI subsystems active: LSTM prediction, adaptive green corridor, and dynamic load balancing.",
        "params": {"volumeMultiplier": 1.8, "signalEfficiency": 1.6, "rainfallMm": 5.0, "accidentCount": 1, "roadClosureCount": 0, "emergencyPriorityActive": True}
    }
]

@analytics_bp.route("/scenarios", methods=["GET"])
def get_scenarios():
    return jsonify({"scenarios": SCENARIO_LIBRARY})

@analytics_bp.route("/decision-recommendations", methods=["GET"])
@require_role("controller")
def get_decision_recommendations():
    district_id = request.args.get("districtId", "chennai").lower()
    _, db_mod, _ = get_firebase_admin()
    if not db_mod:
        return jsonify({"error": "Database service unavailable"}), 500
        
    district_data = db_mod.reference(f"districts/{district_id}").get()
    if not district_data:
        return jsonify({"error": f"District '{district_id}' not found"}), 404
        
    # Get or generate predictions
    predictions = {
        "futureForecasts": [
            {"horizonMinutes": 15, "congestionPct": district_data.get("trafficLive", {}).get("congestionPct", 50) + 2},
            {"horizonMinutes": 30, "congestionPct": district_data.get("trafficLive", {}).get("congestionPct", 50) + 6},
            {"horizonMinutes": 45, "congestionPct": district_data.get("trafficLive", {}).get("congestionPct", 50) + 8},
            {"horizonMinutes": 60, "congestionPct": district_data.get("trafficLive", {}).get("congestionPct", 50) + 5}
        ]
    }
    
    result = generate_decision_recommendations(district_data, predictions)
    return jsonify(result)

@analytics_bp.route("/strategic-planning", methods=["GET"])
@require_role("controller")
def get_strategic_planning():
    district_id = request.args.get("districtId", "chennai").lower()
    _, db_mod, _ = get_firebase_admin()
    if not db_mod:
        return jsonify({"error": "Database service unavailable"}), 500
        
    district_data = db_mod.reference(f"districts/{district_id}").get()
    if not district_data:
        return jsonify({"error": f"District '{district_id}' not found"}), 404
        
    hist_series = db_mod.reference(f"HistoricalData/{district_id}").get() or []
    if not hist_series:
        hist_series = generate_historical_series(district_id, days=30)
        
    result = analyze_strategic_bottlenecks(district_id, district_data, hist_series)
    return jsonify(result)

@analytics_bp.route("/historical-trends", methods=["GET"])
def get_historical_trends():
    district_id = request.args.get("districtId", "chennai").lower()
    days = int(request.args.get("days", 7))
    
    _, db_mod, _ = get_firebase_admin()
    hist_series = []
    if db_mod:
        try:
            hist_series = db_mod.reference(f"HistoricalData/{district_id}").get() or []
        except Exception as e:
            logger.warning(f"Error fetching historical trends: {e}")
            
    if not hist_series:
        hist_series = generate_historical_series(district_id, days=days)
        
    # Return last N days of hourly points
    points_to_return = min(len(hist_series), days * 24)
    sliced_series = hist_series[-points_to_return:]
    
    return jsonify({
        "districtId": district_id,
        "sampleCount": len(sliced_series),
        "data": sliced_series
    })

@analytics_bp.route("/compare-districts", methods=["GET"])
def compare_districts():
    d1 = request.args.get("district1", "chennai").lower()
    d2 = request.args.get("district2", "coimbatore").lower()
    
    _, db_mod, _ = get_firebase_admin()
    if not db_mod:
        return jsonify({"error": "Database unavailable"}), 500
        
    data1 = db_mod.reference(f"districts/{d1}").get()
    data2 = db_mod.reference(f"districts/{d2}").get()
    
    if not data1 or not data2:
        return jsonify({"error": "One or both districts not found"}), 404
        
    return jsonify({
        "district1": {
            "id": d1,
            "name": data1.get("info", {}).get("name", d1.title()),
            "traffic": data1.get("trafficLive", {}),
            "weather": data1.get("weatherLive", {}),
            "junctionCount": len(data1.get("junctions", {}))
        },
        "district2": {
            "id": d2,
            "name": data2.get("info", {}).get("name", d2.title()),
            "traffic": data2.get("trafficLive", {}),
            "weather": data2.get("weatherLive", {}),
            "junctionCount": len(data2.get("junctions", {}))
        }
    })

@analytics_bp.route("/export-report", methods=["GET"])
def export_report():
    format_type = request.args.get("format", "csv").lower()
    district_id = request.args.get("districtId", "chennai").lower()
    
    _, db_mod, _ = get_firebase_admin()
    district_data = {}
    if db_mod:
        district_data = db_mod.reference(f"districts/{district_id}").get() or {}
        
    traffic = district_data.get("trafficLive", {})
    weather = district_data.get("weatherLive", {})
    dist_name = district_data.get("info", {}).get("name", district_id.title())
    
    if format_type == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Report", "TrafficTwin AI - Tamil Nadu Smart Cities Digital Twin Report"])
        writer.writerow(["District", dist_name])
        writer.writerow(["Generated At", time.strftime("%Y-%m-%d %H:%M:%S")])
        writer.writerow([])
        writer.writerow(["Metric", "Value", "Unit / Notes"])
        writer.writerow(["Congestion Percentage", f"{traffic.get('congestionPct', 50)}%", "Real-time load"])
        writer.writerow(["Average Vehicle Speed", f"{traffic.get('avgSpeed', 35)}", "km/h"])
        writer.writerow(["Vehicle Volume", traffic.get("vehicleCount", 180), "vehicles / sensor window"])
        writer.writerow(["Average Queue Length", traffic.get("queueLength", 25), "vehicles"])
        writer.writerow(["Estimated Commute Time", f"{traffic.get('travelTimeMinutes', 20)}", "minutes"])
        writer.writerow(["Traffic Health Score", f"{traffic.get('healthScore', 78)} / 100", "Composite index"])
        writer.writerow(["Temperature", f"{weather.get('temperature', 31)}", "°C"])
        writer.writerow(["Precipitation", f"{weather.get('rainfall', 0)}", "mm"])
        writer.writerow(["Weather Condition", weather.get("condition", "Clear"), ""])
        writer.writerow(["Active Incidents", traffic.get("incidentCount", 0), "reports in database"])
        
        mem = io.BytesIO()
        mem.write(output.getvalue().encode('utf-8'))
        mem.seek(0)
        return send_file(
            mem,
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"traffictwin_report_{district_id}.csv"
        )
    else:
        # Generate simple PDF report using ReportLab or Text
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            
            buf = io.BytesIO()
            p = canvas.Canvas(buf, pagesize=letter)
            p.setTitle(f"TrafficTwin AI - {dist_name} Report")
            
            p.setFont("Helvetica-Bold", 18)
            p.drawString(50, 750, "TrafficTwin AI — Digital Twin Intelligence Report")
            p.setFont("Helvetica", 11)
            p.drawString(50, 730, f"District: {dist_name} | Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
            p.line(50, 720, 560, 720)
            
            p.setFont("Helvetica-Bold", 14)
            p.drawString(50, 690, "1. Real-Time Telemetry & Health Assessment")
            p.setFont("Helvetica", 11)
            p.drawString(70, 665, f"• Congestion Rate: {traffic.get('congestionPct', 50)}%")
            p.drawString(70, 645, f"• Average Flow Speed: {traffic.get('avgSpeed', 35)} km/h")
            p.drawString(70, 625, f"• Monitored Vehicle Volume: {traffic.get('vehicleCount', 180)} units")
            p.drawString(70, 605, f"• Junction Queue Length: {traffic.get('queueLength', 25)} vehicles")
            p.drawString(70, 585, f"• Traffic Health Score: {traffic.get('healthScore', 78)} / 100")
            
            p.setFont("Helvetica-Bold", 14)
            p.drawString(50, 545, "2. Environmental & Incident Parameters")
            p.setFont("Helvetica", 11)
            p.drawString(70, 520, f"• Temperature: {weather.get('temperature', 31)}°C | Humidity: {weather.get('humidity', 65)}%")
            p.drawString(70, 500, f"• Rainfall: {weather.get('rainfall', 0)} mm | Condition: {weather.get('condition', 'Clear')}")
            p.drawString(70, 480, f"• Active Incident Alerts: {traffic.get('incidentCount', 0)}")
            
            p.setFont("Helvetica-Bold", 14)
            p.drawString(50, 440, "3. Decision Engine & AI Recommendations")
            p.setFont("Helvetica", 11)
            p.drawString(70, 415, "• Signal Optimization: Webster cycle time reallocation active.")
            p.drawString(70, 395, "• Dynamic Routing: Bypass offloading recommended during peak hours.")
            p.drawString(70, 375, "• Emergency Corridor: Virtual green wave standby available.")
            
            p.line(50, 340, 560, 340)
            p.setFont("Helvetica-Oblique", 9)
            p.drawString(50, 320, "TrafficTwin AI Digital Twin — Final Year Engineering Project System Report")
            
            p.showPage()
            p.save()
            buf.seek(0)
            return send_file(
                buf,
                mimetype="application/pdf",
                as_attachment=True,
                download_name=f"traffictwin_report_{district_id}.pdf"
            )
        except Exception as e:
            logger.warning(f"PDF generation note ({e}), falling back to text file.")
            text_content = f"TrafficTwin AI Report - {dist_name}\nCongestion: {traffic.get('congestionPct')}%\nSpeed: {traffic.get('avgSpeed')} km/h\nHealth Score: {traffic.get('healthScore')}/100\n"
            return Response(
                text_content,
                mimetype="text/plain",
                headers={"Content-Disposition": f"attachment;filename=traffictwin_report_{district_id}.txt"}
            )
