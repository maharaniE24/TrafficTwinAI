import time
import math
import random
import logging
from typing import Dict, Any, List
from backend.config import get_firebase_admin

logger = logging.getLogger("TrafficTwin.Seed")

# All 38 Tamil Nadu Districts with real geographic centroids
TAMIL_NADU_DISTRICTS = [
    {"id": "ariyalur", "name": "Ariyalur", "lat": 11.1401, "lng": 79.0786, "tier": 3},
    {"id": "chengalpattu", "name": "Chengalpattu", "lat": 12.6841, "lng": 79.9836, "tier": 2},
    {"id": "chennai", "name": "Chennai", "lat": 13.0827, "lng": 80.2707, "tier": 1},
    {"id": "coimbatore", "name": "Coimbatore", "lat": 11.0168, "lng": 76.9558, "tier": 1},
    {"id": "cuddalore", "name": "Cuddalore", "lat": 11.7480, "lng": 79.7714, "tier": 2},
    {"id": "dharmapuri", "name": "Dharmapuri", "lat": 12.1211, "lng": 78.1582, "tier": 3},
    {"id": "dindigul", "name": "Dindigul", "lat": 10.3673, "lng": 77.9803, "tier": 2},
    {"id": "erode", "name": "Erode", "lat": 11.3410, "lng": 77.7172, "tier": 2},
    {"id": "kallakurichi", "name": "Kallakurichi", "lat": 11.7384, "lng": 78.9639, "tier": 3},
    {"id": "kanchipuram", "name": "Kanchipuram", "lat": 12.8342, "lng": 79.7036, "tier": 2},
    {"id": "kanyakumari", "name": "Kanyakumari", "lat": 8.0883, "lng": 77.5385, "tier": 2},
    {"id": "karur", "name": "Karur", "lat": 10.9601, "lng": 78.0766, "tier": 3},
    {"id": "krishnagiri", "name": "Krishnagiri", "lat": 12.5186, "lng": 78.2137, "tier": 2},
    {"id": "madurai", "name": "Madurai", "lat": 9.9252, "lng": 78.1198, "tier": 1},
    {"id": "mayiladuthurai", "name": "Mayiladuthurai", "lat": 11.1075, "lng": 79.6522, "tier": 3},
    {"id": "nagapattinam", "name": "Nagapattinam", "lat": 10.7672, "lng": 79.8449, "tier": 3},
    {"id": "namakkal", "name": "Namakkal", "lat": 11.2189, "lng": 78.1674, "tier": 2},
    {"id": "nilgiris", "name": "Nilgiris (Ooty)", "lat": 11.4102, "lng": 76.6950, "tier": 3},
    {"id": "perambalur", "name": "Perambalur", "lat": 11.2342, "lng": 78.8812, "tier": 3},
    {"id": "pudukkottai", "name": "Pudukkottai", "lat": 10.3797, "lng": 78.8208, "tier": 3},
    {"id": "ramanathapuram", "name": "Ramanathapuram", "lat": 9.3639, "lng": 78.8395, "tier": 3},
    {"id": "ranipet", "name": "Ranipet", "lat": 12.9272, "lng": 79.3330, "tier": 3},
    {"id": "salem", "name": "Salem", "lat": 11.6643, "lng": 78.1460, "tier": 2},
    {"id": "sivaganga", "name": "Sivaganga", "lat": 9.8433, "lng": 78.4809, "tier": 3},
    {"id": "tenkasi", "name": "Tenkasi", "lat": 8.9594, "lng": 77.3152, "tier": 3},
    {"id": "thanjavur", "name": "Thanjavur", "lat": 10.7870, "lng": 79.1378, "tier": 2},
    {"id": "theni", "name": "Theni", "lat": 10.0104, "lng": 77.4768, "tier": 3},
    {"id": "thoothukudi", "name": "Thoothukudi", "lat": 8.7642, "lng": 78.1348, "tier": 2},
    {"id": "tiruchirappalli", "name": "Tiruchirappalli", "lat": 10.7905, "lng": 78.7047, "tier": 1},
    {"id": "tirunelveli", "name": "Tirunelveli", "lat": 8.7139, "lng": 77.7567, "tier": 2},
    {"id": "tirupathur", "name": "Tirupathur", "lat": 12.4939, "lng": 78.5678, "tier": 3},
    {"id": "tiruppur", "name": "Tiruppur", "lat": 11.1085, "lng": 77.3411, "tier": 2},
    {"id": "tiruvallur", "name": "Tiruvallur", "lat": 13.1432, "lng": 79.9074, "tier": 2},
    {"id": "tiruvannamalai", "name": "Tiruvannamalai", "lat": 12.2253, "lng": 79.0747, "tier": 2},
    {"id": "tiruvarur", "name": "Tiruvarur", "lat": 10.7725, "lng": 79.6365, "tier": 3},
    {"id": "vellore", "name": "Vellore", "lat": 12.9165, "lng": 79.1325, "tier": 2},
    {"id": "viluppuram", "name": "Viluppuram", "lat": 11.9401, "lng": 79.4861, "tier": 2},
    {"id": "virudhunagar", "name": "Virudhunagar", "lat": 9.5680, "lng": 77.9624, "tier": 3}
]

JUNCTION_NAMES_TEMPLATES = [
    ["Central Circle", "North Gate Junction", "Anna Statue Roundabout", "East Bypass", "South Arterial Crossing", "West Flyover Junction"],
    ["Railway Station Cross", "Bazaar Road Signal", "Town Hall Point", "Collectorate Roundabout", "Expressway Entry J1", "Temple Square"],
    ["Tech Corridor Gate", "Gandhi Road Junction", "Highway Hub J3", "Industrial Estate Cross", "Old Market Circle", "Medical College Corner"],
    ["Main Bus Stand Signal", "Ring Road Intersection", "River Bridge Approach", "Tower Junction", "Suburban Crossing", "Lakeview Point"]
]

def generate_district_junctions(dist: Dict[str, Any]) -> List[Dict[str, Any]]:
    lat, lng = dist["lat"], dist["lng"]
    names_pool = JUNCTION_NAMES_TEMPLATES[abs(hash(dist["id"])) % len(JUNCTION_NAMES_TEMPLATES)]
    count = 6 if dist["tier"] <= 2 else 5
    
    junctions = []
    # Generate around the centroid with small offsets (~1-3 km)
    angles = [i * (2 * math.pi / count) for i in range(count)]
    for i in range(count):
        r = 0.015 + 0.008 * (i % 2)
        j_lat = round(lat + r * math.cos(angles[i]), 5)
        j_lng = round(lng + r * math.sin(angles[i]), 5)
        name = f"{dist['name']} - {names_pool[i % len(names_pool)]}"
        
        # Base green time allocation (North, South, East, West in seconds)
        n_green = random.randint(25, 45)
        s_green = random.randint(25, 45)
        e_green = random.randint(20, 40)
        w_green = random.randint(20, 40)
        cycle_time = n_green + s_green + e_green + w_green + 12 # 3s amber per phase
        
        junctions.append({
            "id": f"{dist['id']}_j{i+1}",
            "name": name,
            "lat": j_lat,
            "lng": j_lng,
            "congestion": random.randint(30, 85),
            "vehicleCount": random.randint(40, 180),
            "queueLength": random.randint(10, 45),
            "avgSpeed": random.randint(18, 45),
            "signalTiming": {
                "cycleTime": cycle_time,
                "north": n_green,
                "south": s_green,
                "east": e_green,
                "west": w_green,
                "amber": 3
            },
            "status": "active"
        })
    return junctions

def generate_district_graph(dist: Dict[str, Any], junctions: List[Dict[str, Any]]) -> Dict[str, Any]:
    nodes = {j["id"]: {"id": j["id"], "name": j["name"], "lat": j["lat"], "lng": j["lng"]} for j in junctions}
    edges = []
    num_j = len(junctions)
    
    # Connect in ring + cross connections to create rich multi-route topologies
    for i in range(num_j):
        next_i = (i + 1) % num_j
        j1 = junctions[i]
        j2 = junctions[next_i]
        
        # Approximate euclidean distance in km
        d_lat = (j2["lat"] - j1["lat"]) * 111.0
        d_lng = (j2["lng"] - j1["lng"]) * 111.0 * math.cos(math.radians(j1["lat"]))
        dist_km = round(max(0.8, math.sqrt(d_lat**2 + d_lng**2)), 2)
        base_speed = random.randint(35, 55)
        base_time_min = round((dist_km / base_speed) * 60, 1)
        
        edges.append({
            "id": f"edge_{j1['id']}_{j2['id']}",
            "from": j1["id"],
            "to": j2["id"],
            "distanceKm": dist_km,
            "baseSpeedKmh": base_speed,
            "baseTravelTimeMin": base_time_min,
            "capacity": 1800,
            "currentCongestion": random.randint(25, 80),
            "roadType": "Arterial" if i % 2 == 0 else "Collector"
        })
        
        # Add reverse edge
        edges.append({
            "id": f"edge_{j2['id']}_{j1['id']}",
            "from": j2["id"],
            "to": j1["id"],
            "distanceKm": dist_km,
            "baseSpeedKmh": base_speed,
            "baseTravelTimeMin": base_time_min,
            "capacity": 1800,
            "currentCongestion": random.randint(25, 80),
            "roadType": "Arterial" if i % 2 == 0 else "Collector"
        })
    
    # Add diagonal chords (cross connections)
    for i in range(num_j):
        chord_i = (i + 2) % num_j
        if chord_i != i and chord_i != (i - 1) % num_j:
            j1 = junctions[i]
            j2 = junctions[chord_i]
            d_lat = (j2["lat"] - j1["lat"]) * 111.0
            d_lng = (j2["lng"] - j1["lng"]) * 111.0 * math.cos(math.radians(j1["lat"]))
            dist_km = round(max(1.2, math.sqrt(d_lat**2 + d_lng**2)), 2)
            base_speed = 40
            base_time_min = round((dist_km / base_speed) * 60, 1)
            
            edges.append({
                "id": f"edge_{j1['id']}_{j2['id']}",
                "from": j1["id"],
                "to": j2["id"],
                "distanceKm": dist_km,
                "baseSpeedKmh": base_speed,
                "baseTravelTimeMin": base_time_min,
                "capacity": 1500,
                "currentCongestion": random.randint(30, 85),
                "roadType": "Secondary"
            })
            edges.append({
                "id": f"edge_{j2['id']}_{j1['id']}",
                "from": j2["id"],
                "to": j1["id"],
                "distanceKm": dist_km,
                "baseSpeedKmh": base_speed,
                "baseTravelTimeMin": base_time_min,
                "capacity": 1500,
                "currentCongestion": random.randint(30, 85),
                "roadType": "Secondary"
            })
            
    return {"nodes": nodes, "edges": edges}

def generate_historical_series(district_id: str, days: int = 30) -> List[Dict[str, Any]]:
    """
    Generates 30+ days of realistic hourly traffic & weather data
    with diurnial morning/evening peak curves, weekend dips, and weather correlation.
    """
    series = []
    now = int(time.time())
    start_time = now - (days * 24 * 3600)
    
    for step in range(days * 24):
        timestamp = start_time + (step * 3600)
        hour = (timestamp // 3600) % 24
        day_of_week = ((timestamp // (3600 * 24)) + 4) % 7 # 0=Sun..6=Sat approx
        is_weekend = day_of_week in [0, 6]
        
        # Dual-peak traffic pattern (8-10 AM, 5-8 PM)
        morning_peak = math.exp(-((hour - 9) ** 2) / 4.0)
        evening_peak = math.exp(-((hour - 18) ** 2) / 6.0)
        base_demand = 0.25 + 0.55 * morning_peak + 0.65 * evening_peak
        if is_weekend:
            base_demand *= 0.75
            
        noise = random.uniform(-0.08, 0.08)
        demand = max(0.1, min(1.0, base_demand + noise))
        
        # Weather fluctuation
        temp = round(25.0 + 8.0 * math.sin((hour - 6) * math.pi / 12) + random.uniform(-1.5, 1.5), 1)
        rain = 0.0
        if random.random() < 0.12:
            rain = round(random.uniform(2.0, 18.0), 1)
            demand = min(1.0, demand * 1.25) # Rain worsens congestion & reduces speed
            
        vehicle_count = int(demand * 350 + random.randint(20, 60))
        congestion_pct = round(min(100.0, demand * 95.0 + (rain * 1.5)), 1)
        avg_speed = round(max(12.0, 55.0 - (congestion_pct * 0.42) - (rain * 0.8)), 1)
        travel_time = round(max(8.0, (15.0 / max(10.0, avg_speed)) * 60.0), 1)
        queue_len = int((congestion_pct / 100.0) * 85 + random.randint(0, 10))
        
        series.append({
            "timestamp": timestamp,
            "hour": hour,
            "dayOfWeek": day_of_week,
            "vehicleCount": vehicle_count,
            "congestionPct": congestion_pct,
            "avgSpeed": avg_speed,
            "travelTimeMinutes": travel_time,
            "queueLength": queue_len,
            "temperature": temp,
            "rainfall": rain,
            "humidity": random.randint(50, 90)
        })
    return series

def seed_database():
    """
    Populates Firebase Realtime Database with all 38 districts, initial feeds,
    demo users, and system nodes.
    """
    _, db_mod, auth_mod = get_firebase_admin()
    if not db_mod:
        logger.warning("Firebase Realtime Database not available. Skipping remote seed.")
        return False
    
    logger.info("Starting automated database seeding for TrafficTwin AI...")
    
    # 1. Seed Demo Users in Firebase Auth & Database
    demo_users = [
        {"uid": "demo-citizen-id", "email": "citizen@demo.com", "password": "demo1234", "name": "Demo Citizen", "role": "citizen"},
        {"uid": "demo-controller-id", "email": "controller@demo.com", "password": "demo1234", "name": "Demo Controller", "role": "controller"}
    ]
    
    for u in demo_users:
        if auth_mod:
            try:
                try:
                    auth_mod.get_user_by_email(u["email"])
                    logger.info(f"Auth user {u['email']} already exists.")
                except Exception:
                    auth_mod.create_user(
                        uid=u["uid"],
                        email=u["email"],
                        password=u["password"],
                        display_name=u["name"]
                    )
                    logger.info(f"Created Firebase Auth demo user: {u['email']}")
            except Exception as e:
                logger.warning(f"Auth user creation notice ({u['email']}): {e}")
        
        try:
            db_mod.reference(f"Users/{u['uid']}").set({
                "uid": u["uid"],
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "createdAt": int(time.time())
            })
        except Exception as e:
            logger.warning(f"Failed setting User node: {e}")

    # 2. Seed All 38 Districts & Sub-nodes
    districts_dict = {}
    for dist in TAMIL_NADU_DISTRICTS:
        d_id = dist["id"]
        junctions = generate_district_junctions(dist)
        graph = generate_district_graph(dist, junctions)
        
        # Calculate initial live traffic & weather values
        avg_cong = round(sum(j["congestion"] for j in junctions) / len(junctions), 1)
        avg_spd = round(sum(j["avgSpeed"] for j in junctions) / len(junctions), 1)
        tot_veh = sum(j["vehicleCount"] for j in junctions)
        tot_queue = sum(j["queueLength"] for j in junctions)
        
        # Traffic Health Score (0-100): High score = healthy traffic (100 - congestion penalty - queue penalty)
        health_score = max(5, min(100, int(100 - (avg_cong * 0.7) - (tot_queue * 0.15))))
        
        traffic_live = {
            "districtId": d_id,
            "districtName": dist["name"],
            "vehicleCount": tot_veh,
            "avgSpeed": avg_spd,
            "congestionPct": avg_cong,
            "travelTimeMinutes": round(18.0 + (avg_cong * 0.35), 1),
            "queueLength": tot_queue,
            "incidentCount": random.choice([0, 0, 1, 2]),
            "healthScore": health_score,
            "timestamp": int(time.time()),
            "lastUpdated": "Just now"
        }
        
        weather_live = {
            "districtId": d_id,
            "districtName": dist["name"],
            "temperature": round(random.uniform(28.0, 35.0), 1),
            "humidity": random.randint(55, 85),
            "rainfall": 0.0 if random.random() > 0.15 else round(random.uniform(3.0, 14.0), 1),
            "windSpeed": round(random.uniform(3.0, 8.5), 1),
            "visibility": 10.0,
            "condition": "Clear" if random.random() > 0.2 else "Scattered Showers",
            "weatherAlert": "High humidity & heat advisory" if dist["tier"] == 1 else "",
            "timestamp": int(time.time())
        }
        
        districts_dict[d_id] = {
            "info": dist,
            "junctions": {j["id"]: j for j in junctions},
            "graph": graph,
            "trafficLive": traffic_live,
            "weatherLive": weather_live
        }
        
    try:
        db_mod.reference("districts").set(districts_dict)
        logger.info("Seeded all 38 Tamil Nadu districts, junction networks, and graphs.")
    except Exception as e:
        logger.error(f"Error seeding districts: {e}")

    # 3. Seed Sample Historical Data for Key Districts (Chennai, Coimbatore, Madurai, Salem, Erode)
    for sample_id in ["chennai", "coimbatore", "madurai", "erode", "tiruchirappalli"]:
        try:
            series = generate_historical_series(sample_id, days=30)
            db_mod.reference(f"HistoricalData/{sample_id}").set(series)
            logger.info(f"Seeded 30-day historical time-series for {sample_id} ({len(series)} records).")
        except Exception as e:
            logger.warning(f"Error seeding historical for {sample_id}: {e}")

    # 4. Seed Initial Notifications
    initial_notifications = [
        {
            "id": "notif_1",
            "title": "Welcome to TrafficTwin AI Mission Control",
            "message": "Real-time Digital Twin synchronizer is active across 38 Tamil Nadu districts.",
            "type": "info",
            "timestamp": int(time.time()) - 3600,
            "districtId": "chennai",
            "read": False,
            "resolved": False
        },
        {
            "id": "notif_2",
            "title": "High Congestion Warning - Anna Salai / Central",
            "message": "Vehicle queue length exceeding 120 units at Central Circle junction.",
            "type": "warning",
            "timestamp": int(time.time()) - 1800,
            "districtId": "chennai",
            "read": False,
            "resolved": False
        }
    ]
    try:
        db_mod.reference("Notifications").set({n["id"]: n for n in initial_notifications})
    except Exception as e:
        logger.warning(f"Error seeding notifications: {e}")
        
    logger.info("Database seeding successfully completed.")
    return True
