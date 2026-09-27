import os
import sys
import unittest
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.data_validator import validate_incident_report, validate_traffic_record, validate_weather_record
from backend.services.seed_data import TAMIL_NADU_DISTRICTS, generate_district_junctions, generate_district_graph, generate_historical_series
from backend.services.routing_service import compute_route_recommendations
from backend.services.signal_optimizer import optimize_junction_signal
from backend.services.simulation_engine import run_digital_twin_simulation
from backend.services.emergency_corridor import emergency_service
from backend.ml.lstm_model import lstm_engine

class TestTrafficTwinBackend(unittest.TestCase):

    def test_districts_data(self):
        self.assertEqual(len(TAMIL_NADU_DISTRICTS), 38, "Should contain all 38 Tamil Nadu districts")
        chennai = next((d for d in TAMIL_NADU_DISTRICTS if d["id"] == "chennai"), None)
        self.assertIsNotNone(chennai)
        self.assertAlmostEqual(chennai["lat"], 13.0827, places=2)

    def test_data_validator(self):
        # Valid incident
        valid_inc = {
            "districtId": "chennai",
            "incidentType": "accident",
            "severity": "high",
            "title": "Two-wheeler collision",
            "description": "Lane 2 blocked near Anna Statue"
        }
        ok, err, cleaned = validate_incident_report(valid_inc)
        self.assertTrue(ok)
        self.assertEqual(cleaned["severity"], "high")
        self.assertGreater(cleaned["impactCongestionMultiplier"], 1.5)

        # Invalid district incident
        invalid_inc = {"incidentType": "pothole"}
        ok, err, cleaned = validate_incident_report(invalid_inc)
        self.assertFalse(ok)

    def test_routing_algorithms(self):
        dist = TAMIL_NADU_DISTRICTS[2] # Chennai
        junctions = generate_district_junctions(dist)
        graph = generate_district_graph(dist, junctions)
        
        j1 = junctions[0]
        j2 = junctions[2]
        
        routes = compute_route_recommendations(
            graph_data=graph,
            start_lat=j1["lat"],
            start_lng=j1["lng"],
            end_lat=j2["lat"],
            end_lng=j2["lng"]
        )
        self.assertIn("candidates", routes)
        self.assertGreater(len(routes["candidates"]), 0)
        self.assertIn("coordinates", routes["candidates"][0])

    def test_signal_optimizer_webster(self):
        sample_junction = {
            "id": "chennai_j1",
            "name": "Chennai - Central Circle",
            "congestion": 75.0,
            "queueLength": 120,
            "vehicleCount": 180,
            "signalTiming": {"cycleTime": 120, "north": 30, "south": 30, "east": 30, "west": 30, "amber": 3}
        }
        res = optimize_junction_signal(sample_junction)
        self.assertIn("scenarioA", res)
        self.assertIn("scenarioB", res)
        self.assertIn("improvements", res)
        self.assertGreater(res["improvements"]["congestionPct"], 0)
        self.assertGreater(res["improvements"]["queueVehicles"], 0)

    def test_digital_twin_sandbox(self):
        base_traffic = {"congestionPct": 55.0, "avgSpeed": 32.0, "queueLength": 40, "travelTimeMinutes": 22.0}
        params = {"volumeMultiplier": 1.8, "signalEfficiency": 1.0, "rainfallMm": 15.0, "accidentCount": 1, "roadClosureCount": 0, "emergencyPriorityActive": False}
        sim = run_digital_twin_simulation(base_traffic, params)
        self.assertEqual(sim["status"], "success")
        self.assertGreater(sim["simulated"]["congestionPct"], base_traffic["congestionPct"])

    def test_emergency_corridor_and_stuck_detection(self):
        dist = TAMIL_NADU_DISTRICTS[2] # Chennai
        junctions = generate_district_junctions(dist)
        graph = generate_district_graph(dist, junctions)
        # Artificially set high congestion on a junction to test stuck trigger
        junctions[1]["congestion"] = 85.0
        junctions[1]["queueLength"] = 120
        
        district_data = {
            "info": dist,
            "junctions": {j["id"]: j for j in junctions},
            "graph": graph
        }
        
        res = emergency_service.plan_corridor(
            district_data=district_data,
            vehicle_type="Ambulance",
            start_lat=junctions[0]["lat"],
            start_lng=junctions[0]["lng"],
            end_lat=junctions[-1]["lat"],
            end_lng=junctions[-1]["lng"]
        )
        self.assertIn("workflowSteps", res)
        self.assertEqual(len(res["workflowSteps"]), 8)
        self.assertIn("metrics", res)
        self.assertGreater(res["metrics"]["improvementPct"], 0)

    def test_ml_lstm_or_numpy_predictor(self):
        series = generate_historical_series("chennai", days=5)
        res = lstm_engine.train_and_evaluate(series, include_weather=True, epochs=2)
        self.assertIn("metrics", res)
        self.assertIn("futureForecasts", res)
        self.assertEqual(len(res["futureForecasts"]), 4) # 15, 30, 45, 60 mins

if __name__ == "__main__":
    unittest.main()
