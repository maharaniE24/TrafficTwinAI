import urllib.request
import json
import time
import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "http://127.0.0.1:5000"

def test_endpoint(name, method, path, data=None, token=None):
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            parsed = json.loads(body) if resp.headers.get("Content-Type", "").startswith("application/json") else body
            print(f"  [PASS] {name} -> Status: {status}")
            return status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        parsed = json.loads(body) if "application/json" in e.headers.get("Content-Type", "") else body
        print(f"  [HTTP {e.code}] {name} -> Expected for guards/errors: {parsed}")
        return e.code, parsed
    except Exception as e:
        print(f"  [FAIL] {name} -> Exception: {e}")
        return 0, None

def run_e2e_tests():
    print("=" * 75)
    print("  🧪 Running TrafficTwin AI Complete End-to-End Test Suite  ")
    print("=" * 75)

    # 1. Health check
    st, res = test_endpoint("1. Health Check", "GET", "/api/health")
    assert st == 200 and res.get("status") == "healthy", "Health check failed"

    # 2. Districts List (38 districts)
    st, res = test_endpoint("2. List Districts", "GET", "/api/traffic/districts")
    assert st == 200 and len(res.get("districts", [])) >= 38, f"Expected 38 districts, got {len(res.get('districts', []))}"
    print(f"      -> Verified {len(res['districts'])} Tamil Nadu districts loaded.")

    # 3. Route Recommendation (Dijkstra + A*)
    route_payload = {
        "districtId": "chennai",
        "weights": {"w1_congestion": 0.30, "w2_travelTime": 0.35, "w3_distance": 0.15, "w4_weather": 0.10, "w5_incidents": 0.10}
    }
    st, res = test_endpoint("3. Route Recommender (Dijkstra & A*)", "POST", "/api/routing/recommend", route_payload)
    assert st == 200 and len(res.get("candidates", [])) >= 1, "Route recommendation failed"
    print(f"      -> Received {len(res['candidates'])} candidate routes. Best AI: {res['candidates'][0]['title']}")

    # 4. Security Check: Citizen hitting Controller endpoint must get 403
    st, res = test_endpoint("4. RBAC Security Check (Citizen on Controller Route)", "POST", "/api/optimization/signal/optimize", {"districtId": "chennai"}, token="demo-citizen-token")
    assert st == 403, f"Expected 403 Forbidden, got {st}"
    print("      -> Server-Side RBAC strictly rejected citizen on controller endpoint (403).")

    # 5. Signal Optimization (Webster Model) with Controller token
    st, res = test_endpoint("5. Signal Optimization (Webster Method)", "POST", "/api/optimization/signal/optimize", {"districtId": "chennai"}, token="demo-controller-token")
    assert st == 200 and "scenarioA" in res and "scenarioB" in res, "Signal optimization failed"
    print(f"      -> Scenario B Congestion: {res['scenarioB']['congestionPct']}% (-{res['improvements']['congestionPct']}% improvement).")

    # 6. What-If Digital Twin Sandbox
    whatif_payload = {
        "districtId": "chennai",
        "parameters": {"volumeMultiplier": 1.8, "signalEfficiency": 1.0, "rainfallMm": 15.0, "accidentCount": 1, "emergencyPriorityActive": False}
    }
    st, res = test_endpoint("6. Digital Twin What-If Sandbox", "POST", "/api/optimization/simulator/run", whatif_payload, token="demo-controller-token")
    assert st == 200 and res.get("status") == "success", "What-if simulation failed"
    print(f"      -> Simulated Congestion: {res['simulated']['congestionPct']}%, Queue: {res['simulated']['queueVehicles']} veh.")

    # 7. Emergency Vehicle Priority Dispatch & Stuck Alert Trigger
    emergency_payload = {
        "districtId": "chennai",
        "vehicleType": "Ambulance"
    }
    st, res = test_endpoint("7. Emergency Priority Dispatcher", "POST", "/api/emergency/plan", emergency_payload, token="demo-controller-token")
    assert st == 200 and "workflowSteps" in res, "Emergency dispatch failed"
    event_id = res.get("eventId")
    print(f"      -> 8-Stage Corridor Generated! Event ID: {event_id}. Improvement: +{res['metrics']['improvementPct']}%.")

    # 8. Resolve Stuck Emergency Corridor
    st, res = test_endpoint("8. Resolve Stuck Corridor (1-Click Action)", "POST", "/api/emergency/resolve-stuck", {"eventId": event_id, "action": "Extend Green Wave (+45s)"}, token="demo-controller-token")
    assert st == 200 and res.get("status") == "success", "Resolve stuck failed"
    print("      -> Stuck alert resolved, green wave extension applied.")

    # 9. LSTM ML Prediction Lab
    ml_payload = {
        "districtId": "chennai",
        "includeWeather": True,
        "epochs": 3
    }
    st, res = test_endpoint("9. LSTM Deep Learning Prediction Lab", "POST", "/api/ml/predict", ml_payload, token="demo-controller-token")
    assert st == 200 and "metrics" in res, "ML prediction failed"
    print(f"      -> Model: {res['modelType']}. Avg R2: {res['overallScore']['avgR2']}, Avg MAE: {res['overallScore']['avgMAE']}.")

    # 10. Decision Center & Strategic Planning
    st, res = test_endpoint("10. Decision Recommendation Engine", "GET", "/api/analytics/decision-recommendations?districtId=chennai", token="demo-controller-token")
    assert st == 200 and "recommendedActions" in res, "Decision engine failed"
    print(f"      -> Decision Status: {res['statusBanner']} ({len(res['recommendedActions'])} actions).")

    st, res = test_endpoint("11. Strategic Infrastructure Planning", "GET", "/api/analytics/strategic-planning?districtId=chennai", token="demo-controller-token")
    assert st == 200 and "chronicBottlenecks" in res, "Strategic planning failed"
    print(f"      -> Grade: {res['overallInfrastructureGrade']}, Bottlenecks: {len(res['chronicBottlenecks'])} locations.")

    # 12. Viva Scenario Library
    st, res = test_endpoint("12. 1-Click Scenario Library", "GET", "/api/analytics/scenarios")
    assert st == 200 and len(res.get("scenarios", [])) >= 8, "Scenarios failed"
    print(f"      -> Verified {len(res['scenarios'])} operational scenarios (S1–S8) available.")

    print("\n" + "=" * 75)
    print("  🎉 ALL 12 END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY! 🎉  ")
    print("=" * 75)

if __name__ == "__main__":
    run_e2e_tests()
