import heapq
import math
import logging
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger("TrafficTwin.Routing")

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class RoadNetworkGraph:
    def __init__(self, graph_data: Dict[str, Any], weather_data: Optional[Dict[str, Any]] = None, incidents: Optional[List[Dict[str, Any]]] = None):
        self.nodes = graph_data.get("nodes", {})
        self.adj: Dict[str, List[Dict[str, Any]]] = {nid: [] for nid in self.nodes}
        self.weather = weather_data or {}
        self.incidents = incidents or []
        
        # Build adjacency list
        for edge in graph_data.get("edges", []):
            u = edge.get("from")
            v = edge.get("to")
            if u in self.adj:
                self.adj[u].append(edge)

    def find_nearest_node(self, lat: float, lng: float) -> Optional[str]:
        best_node = None
        min_dist = float("inf")
        for nid, node in self.nodes.items():
            d = haversine_km(lat, lng, node["lat"], node["lng"])
            if d < min_dist:
                min_dist = d
                best_node = nid
        return best_node

    def calculate_edge_cost(self, edge: Dict[str, Any], weights: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        w1 = weights.get("w1_congestion", 0.30)
        w2 = weights.get("w2_travelTime", 0.35)
        w3 = weights.get("w3_distance", 0.15)
        w4 = weights.get("w4_weather", 0.10)
        w5 = weights.get("w5_incidents", 0.10)
        
        dist_km = edge.get("distanceKm", 1.0)
        base_time = edge.get("baseTravelTimeMin", 2.0)
        cong_pct = edge.get("currentCongestion", 40.0)
        
        # Weather multiplier (rain increases friction)
        rain = float(self.weather.get("rainfall", 0.0))
        weather_factor = 1.0 + (min(20.0, rain) / 25.0)
        
        # Incident penalty on target node or edge
        incident_penalty = 0.0
        v = edge.get("to")
        for inc in self.incidents:
            if inc.get("junctionId") == v:
                incident_penalty += 35.0
        
        actual_travel_time = base_time * (1.0 + (cong_pct / 100.0) * 1.5) * weather_factor
        
        # Normalized multi-factor score
        score = (
            w1 * cong_pct +
            w2 * (actual_travel_time * 5.0) +
            w3 * (dist_km * 10.0) +
            w4 * (rain * 8.0) +
            w5 * incident_penalty
        )
        
        metrics = {
            "distanceKm": dist_km,
            "travelTimeMin": actual_travel_time,
            "congestion": cong_pct,
            "incidentPenalty": incident_penalty,
            "rainImpact": rain
        }
        return score, metrics

    def dijkstra(self, start_id: str, target_id: str, weights: Dict[str, float], cost_mode: str = "multi_factor") -> Optional[Dict[str, Any]]:
        if start_id not in self.nodes or target_id not in self.nodes:
            return None
        
        distances = {nid: float("inf") for nid in self.nodes}
        distances[start_id] = 0.0
        previous_nodes: Dict[str, Optional[str]] = {nid: None for nid in self.nodes}
        edge_used: Dict[str, Optional[Dict[str, Any]]] = {nid: None for nid in self.nodes}
        
        pq = [(0.0, start_id)]
        
        while pq:
            current_dist, u = heapq.heappop(pq)
            if current_dist > distances[u]:
                continue
            if u == target_id:
                break
            
            for edge in self.adj.get(u, []):
                v = edge["to"]
                if cost_mode == "distance":
                    weight = edge.get("distanceKm", 1.0)
                elif cost_mode == "travel_time":
                    weight = edge.get("baseTravelTimeMin", 2.0) * (1.0 + (edge.get("currentCongestion", 40.0) / 100.0))
                else: # Multi-factor score
                    weight, _ = self.calculate_edge_cost(edge, weights)
                
                new_dist = current_dist + weight
                if new_dist < distances[v]:
                    distances[v] = new_dist
                    previous_nodes[v] = u
                    edge_used[v] = edge
                    heapq.heappush(pq, (new_dist, v))
                    
        return self._reconstruct_path(start_id, target_id, previous_nodes, edge_used, weights, "Dijkstra (" + cost_mode + ")")

    def a_star(self, start_id: str, target_id: str, weights: Dict[str, float]) -> Optional[Dict[str, Any]]:
        if start_id not in self.nodes or target_id not in self.nodes:
            return None
        
        target_node = self.nodes[target_id]
        
        def heuristic(nid: str) -> float:
            node = self.nodes[nid]
            d_km = haversine_km(node["lat"], node["lng"], target_node["lat"], target_node["lng"])
            return d_km * 5.0 # admissible lower bound heuristic
        
        g_score = {nid: float("inf") for nid in self.nodes}
        g_score[start_id] = 0.0
        f_score = {nid: float("inf") for nid in self.nodes}
        f_score[start_id] = heuristic(start_id)
        
        previous_nodes: Dict[str, Optional[str]] = {nid: None for nid in self.nodes}
        edge_used: Dict[str, Optional[Dict[str, Any]]] = {nid: None for nid in self.nodes}
        
        pq = [(f_score[start_id], start_id)]
        
        while pq:
            _, u = heapq.heappop(pq)
            if u == target_id:
                break
            
            for edge in self.adj.get(u, []):
                v = edge["to"]
                cost, _ = self.calculate_edge_cost(edge, weights)
                tentative_g = g_score[u] + cost
                
                if tentative_g < g_score[v]:
                    previous_nodes[v] = u
                    edge_used[v] = edge
                    g_score[v] = tentative_g
                    f_score[v] = tentative_g + heuristic(v)
                    heapq.heappush(pq, (f_score[v], v))
                    
        return self._reconstruct_path(start_id, target_id, previous_nodes, edge_used, weights, "A* Algorithm (AI Heuristic)")

    def _reconstruct_path(self, start_id: str, target_id: str, prev: Dict, edge_used: Dict, weights: Dict, algo_name: str) -> Optional[Dict[str, Any]]:
        if target_id != start_id and prev[target_id] is None:
            return None
        
        path_nodes = []
        curr = target_id
        while curr is not None:
            path_nodes.append(curr)
            curr = prev[curr]
        path_nodes.reverse()
        
        total_dist = 0.0
        total_time = 0.0
        total_cong = 0.0
        incidents_found = 0
        coordinates = []
        instructions = []
        
        for i, nid in enumerate(path_nodes):
            node = self.nodes[nid]
            coordinates.append([node["lat"], node["lng"]])
            if i == 0:
                instructions.append(f"Depart from {node['name']}")
            else:
                edge = edge_used[nid]
                if edge:
                    _, m = self.calculate_edge_cost(edge, weights)
                    total_dist += m["distanceKm"]
                    total_time += m["travelTimeMin"]
                    total_cong += m["congestion"]
                    if m["incidentPenalty"] > 0:
                        incidents_found += 1
                instructions.append(f"Proceed towards {node['name']} ({round(edge.get('distanceKm', 1.0), 1)} km)")
                
        num_edges = max(1, len(path_nodes) - 1)
        avg_cong = round(total_cong / num_edges, 1) if num_edges > 0 else 30.0
        rain = float(self.weather.get("rainfall", 0.0))
        
        # Overall Cost Score calculation
        w1 = weights.get("w1_congestion", 0.30)
        w2 = weights.get("w2_travelTime", 0.35)
        w3 = weights.get("w3_distance", 0.15)
        w4 = weights.get("w4_weather", 0.10)
        w5 = weights.get("w5_incidents", 0.10)
        
        overall_score = round(
            w1 * avg_cong +
            w2 * (total_time * 2.0) +
            w3 * (total_dist * 5.0) +
            w4 * (rain * 4.0) +
            w5 * (incidents_found * 25.0),
            1
        )
        
        return {
            "algorithm": algo_name,
            "pathNodeIds": path_nodes,
            "pathNodeNames": [self.nodes[nid]["name"] for nid in path_nodes],
            "coordinates": coordinates,
            "summary": {
                "distanceKm": round(total_dist, 2),
                "travelTimeMinutes": round(total_time, 1),
                "avgCongestionPct": avg_cong,
                "incidentCount": incidents_found,
                "weatherImpact": "Moderate Rain" if rain > 2 else "Clear / Good",
                "overallScore": overall_score
            },
            "instructions": instructions
        }

def compute_route_recommendations(graph_data: Dict[str, Any], start_lat: float, start_lng: float, end_lat: float, end_lng: float, weights: Optional[Dict[str, float]] = None, weather_data: Optional[Dict[str, Any]] = None, incidents: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    weights = weights or {"w1_congestion": 0.30, "w2_travelTime": 0.35, "w3_distance": 0.15, "w4_weather": 0.10, "w5_incidents": 0.10}
    net = RoadNetworkGraph(graph_data, weather_data, incidents)
    
    start_id = net.find_nearest_node(start_lat, start_lng)
    target_id = net.find_nearest_node(end_lat, end_lng)
    
    if not start_id or not target_id:
        return {"error": "Could not snap origin/destination to graph junctions."}
    
    # Generate 3 candidates:
    # 1. Multi-factor A* AI optimized route
    route_astar = net.a_star(start_id, target_id, weights)
    # 2. Fastest Travel-Time route (Dijkstra travel_time mode)
    route_fastest = net.dijkstra(start_id, target_id, weights, cost_mode="travel_time")
    # 3. Shortest Distance route (Dijkstra distance mode)
    route_shortest = net.dijkstra(start_id, target_id, weights, cost_mode="distance")
    
    candidates = []
    if route_astar:
        route_astar["title"] = "Recommended AI Route (Multi-Factor A*)"
        route_astar["isRecommended"] = True
        candidates.append(route_astar)
    
    if route_fastest:
        route_fastest["title"] = "Fastest Route"
        route_fastest["isRecommended"] = False
        candidates.append(route_fastest)
        
    if route_shortest:
        route_shortest["title"] = "Shortest Distance Route"
        route_shortest["isRecommended"] = False
        candidates.append(route_shortest)
        
    return {
        "startJunction": net.nodes.get(start_id),
        "endJunction": net.nodes.get(target_id),
        "weights": weights,
        "candidates": candidates
    }
