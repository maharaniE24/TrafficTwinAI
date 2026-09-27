import time
import random
import threading
import logging
from backend.config import get_firebase_admin

logger = logging.getLogger("TrafficTwin.Streamer")

class BackgroundTrafficStreamer:
    """
    Simulates live telemetry fluctuations and writes to Firebase Realtime Database
    every few seconds so all connected clients experience true real-time reactive sync.
    """
    def __init__(self, interval_sec: int = 4):
        self.interval_sec = interval_sec
        self.running = False
        self.thread = None

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info(f"Background traffic streamer started (interval: {self.interval_sec}s).")

    def stop(self):
        self.running = False

    def _run_loop(self):
        time.sleep(2) # Initial grace period
        while self.running:
            try:
                _, db_mod, _ = get_firebase_admin()
                if db_mod:
                    self._update_live_feeds(db_mod)
            except Exception as e:
                logger.debug(f"Streamer update cycle error: {e}")
            time.sleep(self.interval_sec)

    def _update_live_feeds(self, db_mod):
        # Pick 3-6 random districts per tick to update (keeps network payload light and updates continuous)
        districts_ref = db_mod.reference("districts")
        districts_data = districts_ref.get()
        if not districts_data or not isinstance(districts_data, dict):
            return
        
        district_keys = list(districts_data.keys())
        sampled_keys = random.sample(district_keys, min(6, len(district_keys)))
        
        now = int(time.time())
        for d_id in sampled_keys:
            d_data = districts_data[d_id]
            traffic = d_data.get("trafficLive", {})
            junctions = d_data.get("junctions", {})
            
            # Apply slight drift
            cong_delta = random.choice([-2, -1, 0, 1, 2, 3])
            new_cong = max(15.0, min(95.0, float(traffic.get("congestionPct", 50.0)) + cong_delta))
            new_spd = max(15.0, min(65.0, 58.0 - (new_cong * 0.45) + random.uniform(-1.5, 1.5)))
            new_veh = max(40, int(traffic.get("vehicleCount", 200) + random.randint(-8, 12)))
            new_queue = max(5, int((new_cong / 100.0) * 110 + random.randint(-4, 6)))
            new_travel = round(16.0 + (new_cong * 0.32), 1)
            new_health = max(10, min(100, int(100 - (new_cong * 0.7) - (new_queue * 0.12))))
            
            # Update district trafficLive node
            districts_ref.child(f"{d_id}/trafficLive").update({
                "congestionPct": round(new_cong, 1),
                "avgSpeed": round(new_spd, 1),
                "vehicleCount": new_veh,
                "queueLength": new_queue,
                "travelTimeMinutes": new_travel,
                "healthScore": new_health,
                "timestamp": now,
                "lastUpdated": "Just now"
            })
            
            # Update 1-2 junctions within this district
            if junctions and isinstance(junctions, dict):
                j_key = random.choice(list(junctions.keys()))
                j_cong = max(15, min(95, int(new_cong + random.randint(-10, 10))))
                districts_ref.child(f"{d_id}/junctions/{j_key}").update({
                    "congestion": j_cong,
                    "avgSpeed": max(12, int(60 - (j_cong * 0.5))),
                    "queueLength": max(2, int((j_cong / 100.0) * 50)),
                    "vehicleCount": max(20, int(j_cong * 2.2))
                })

streamer = BackgroundTrafficStreamer(interval_sec=5)
