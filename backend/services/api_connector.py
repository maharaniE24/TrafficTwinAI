import os
import time
import random
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("TrafficTwin.APIConnector")

class APIConnector:
    """
    Connects to TomTom Traffic API and OpenWeather API with mock-data fallback.
    Matches the exact JSON response structures expected from production APIs.
    """
    def __init__(self):
        self.use_mock = os.getenv("USE_MOCK_APIS", "true").lower() == "true"
        self.tomtom_key = os.getenv("TOMTOM_API_KEY", "")
        self.openweather_key = os.getenv("OPENWEATHER_API_KEY", "")

    def fetch_traffic_flow(self, lat: float, lng: float, district_name: str = "") -> Dict[str, Any]:
        """
        Fetches flow segment data matching TomTom Traffic Flow API schema.
        """
        if not self.use_mock and self.tomtom_key and self.tomtom_key != "mock_tomtom_api_key":
            try:
                url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point={lat},{lng}&key={self.tomtom_key}"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                logger.warning(f"TomTom API live call failed: {e}. Using mock generator.")
        
        # Mock TomTom Traffic Flow Schema
        free_flow_speed = random.randint(45, 65)
        # Add peak hour variation
        hour = time.localtime().tm_hour
        is_peak = (8 <= hour <= 11) or (17 <= hour <= 21)
        speed_factor = random.uniform(0.35, 0.65) if is_peak else random.uniform(0.65, 0.95)
        current_speed = int(free_flow_speed * speed_factor)
        current_travel_time = int(300 / max(1, current_speed) * 60)
        free_flow_travel_time = int(300 / free_flow_speed * 60)
        confidence = round(random.uniform(0.85, 0.99), 2)
        
        return {
            "flowSegmentData": {
                "frc": "FRC1",
                "currentSpeed": current_speed,
                "freeFlowSpeed": free_flow_speed,
                "currentTravelTime": current_travel_time,
                "freeFlowTravelTime": free_flow_travel_time,
                "confidence": confidence,
                "roadClosure": False,
                "coordinates": {
                    "coordinate": [
                        {"latitude": lat, "longitude": lng},
                        {"latitude": lat + 0.005, "longitude": lng + 0.005}
                    ]
                },
                "@version": "4.0",
                "district": district_name
            }
        }

    def fetch_weather(self, lat: float, lng: float, district_name: str = "") -> Dict[str, Any]:
        """
        Fetches weather data matching OpenWeather Current Weather API schema.
        """
        if not self.use_mock and self.openweather_key and self.openweather_key != "mock_openweather_api_key":
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={self.openweather_key}&units=metric"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                logger.warning(f"OpenWeather API live call failed: {e}. Using mock generator.")
        
        # Mock OpenWeather Schema
        conditions = [
            {"main": "Clear", "description": "clear sky", "rain": 0.0, "icon": "01d"},
            {"main": "Clouds", "description": "scattered clouds", "rain": 0.0, "icon": "03d"},
            {"main": "Rain", "description": "moderate rain", "rain": random.uniform(2.5, 12.0), "icon": "10d"},
            {"main": "Haze", "description": "hazy sunshine", "rain": 0.0, "icon": "50d"}
        ]
        # Weighted choice for realistic Tamil Nadu tropical climate
        selected_cond = random.choices(conditions, weights=[0.45, 0.30, 0.15, 0.10])[0]
        temp = round(random.uniform(26.0, 36.5), 1)
        humidity = random.randint(45, 88)
        wind_speed = round(random.uniform(2.0, 7.5), 1)
        visibility = 10000 if selected_cond["main"] != "Rain" else random.randint(4000, 7000)
        
        result = {
            "coord": {"lon": lng, "lat": lat},
            "weather": [
                {
                    "id": 800 if selected_cond["main"] == "Clear" else 500,
                    "main": selected_cond["main"],
                    "description": selected_cond["description"],
                    "icon": selected_cond["icon"]
                }
            ],
            "base": "stations",
            "main": {
                "temp": temp,
                "feels_like": round(temp + (humidity / 50.0), 1),
                "temp_min": round(temp - 2.0, 1),
                "temp_max": round(temp + 2.0, 1),
                "pressure": 1012,
                "humidity": humidity
            },
            "visibility": visibility,
            "wind": {
                "speed": wind_speed,
                "deg": random.randint(0, 360)
            },
            "clouds": {"all": 20 if selected_cond["main"] == "Clear" else 75},
            "dt": int(time.time()),
            "sys": {
                "country": "IN",
                "sunrise": int(time.time()) - 20000,
                "sunset": int(time.time()) + 20000
            },
            "name": district_name or "Tamil Nadu Region",
            "cod": 200
        }
        if selected_cond["rain"] > 0:
            result["rain"] = {"1h": round(selected_cond["rain"], 1)}
        return result

api_connector = APIConnector()
