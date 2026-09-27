import React, { createContext, useContext, useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import { api } from "../api/client";

const DistrictContext = createContext(null);

export function DistrictProvider({ children }) {
  const [selectedDistrictId, setSelectedDistrictId] = useState("chennai");
  const [districtsList, setDistrictsList] = useState([]);
  const [activeDistrictData, setActiveDistrictData] = useState(null);
  const [allDistrictsData, setAllDistrictsData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unitSystem, setUnitSystem] = useState("metric"); // 'metric' (km, °C) | 'imperial' (mi, °F)
  const [loading, setLoading] = useState(true);
  const [liveStreamConnected, setLiveStreamConnected] = useState(false);

  // 1. Initial Load of Districts via REST API / Seed
  useEffect(() => {
    async function loadDistricts() {
      try {
        const res = await api.getDistricts();
        if (res.districts && Array.isArray(res.districts)) {
          setDistrictsList(res.districts);
        }
      } catch (err) {
        console.warn("REST districts load warning:", err);
      }
    }
    loadDistricts();
  }, []);

  // 2. Real-time Firebase RTDB Listener for All Districts
  useEffect(() => {
    try {
      const districtsRef = ref(database, "districts");
      const unsubscribe = onValue(
        districtsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setAllDistrictsData(data);
            setLiveStreamConnected(true);

            // Update districtsList with live data
            const formatted = Object.entries(data).map(([id, d]) => ({
              id,
              name: d.info?.name || id.toUpperCase(),
              lat: d.info?.lat || 13.0827,
              lng: d.info?.lng || 80.2707,
              tier: d.info?.tier || 2,
              congestionPct: d.trafficLive?.congestionPct ?? 50,
              avgSpeed: d.trafficLive?.avgSpeed ?? 35,
              vehicleCount: d.trafficLive?.vehicleCount ?? 150,
              healthScore: d.trafficLive?.healthScore ?? 75,
              incidentCount: d.trafficLive?.incidentCount ?? 0,
              temperature: d.weatherLive?.temperature ?? 30,
              weatherCondition: d.weatherLive?.condition ?? "Clear"
            }));
            setDistrictsList(formatted);

            // Update active district data
            if (data[selectedDistrictId]) {
              setActiveDistrictData(data[selectedDistrictId]);
            }
            setLoading(false);
          }
        },
        (error) => {
          console.warn("RTDB districts listener note:", error);
          setLiveStreamConnected(false);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("RTDB subscribe error:", e);
      setLoading(false);
    }
  }, [selectedDistrictId]);

  // 3. Real-time Firebase RTDB Listener for Notifications
  useEffect(() => {
    try {
      const notifsRef = ref(database, "Notifications");
      const unsubscribe = onValue(
        notifsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setNotifications(list);
            const unread = list.filter((n) => !n.read && !n.resolved).length;
            setUnreadNotifCount(unread);
          } else {
            setNotifications([]);
            setUnreadNotifCount(0);
          }
        },
        (err) => console.warn("Notifications listener note:", err)
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Notifications subscribe error:", e);
    }
  }, []);

  // Fetch single district fallback if RTDB is not connected
  useEffect(() => {
    if (!allDistrictsData[selectedDistrictId]) {
      api.getDistrict(selectedDistrictId)
        .then((res) => {
          if (res.district) {
            setActiveDistrictData(res.district);
          }
        })
        .catch(() => {});
    } else {
      setActiveDistrictData(allDistrictsData[selectedDistrictId]);
    }
  }, [selectedDistrictId, allDistrictsData]);

  const selectDistrict = (districtId) => {
    const cleanId = districtId.toLowerCase();
    setSelectedDistrictId(cleanId);
    if (allDistrictsData[cleanId]) {
      setActiveDistrictData(allDistrictsData[cleanId]);
    }
  };

  const toggleUnitSystem = () => {
    setUnitSystem((prev) => (prev === "metric" ? "imperial" : "metric"));
  };

  // Unit conversion helpers
  const formatSpeed = (speedKmh) => {
    if (unitSystem === "imperial") {
      return `${Math.round((speedKmh || 0) * 0.621371)} mph`;
    }
    return `${Math.round(speedKmh || 0)} km/h`;
  };

  const formatDistance = (distKm) => {
    if (unitSystem === "imperial") {
      return `${((distKm || 0) * 0.621371).toFixed(1)} mi`;
    }
    return `${(distKm || 0).toFixed(1)} km`;
  };

  const formatTemp = (tempC) => {
    if (unitSystem === "imperial") {
      return `${Math.round(((tempC || 0) * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(tempC || 0)}°C`;
  };

  return (
    <DistrictContext.Provider
      value={{
        selectedDistrictId,
        selectDistrict,
        districtsList,
        activeDistrictData,
        allDistrictsData,
        notifications,
        unreadNotifCount,
        unitSystem,
        toggleUnitSystem,
        formatSpeed,
        formatDistance,
        formatTemp,
        liveStreamConnected,
        loading
      }}
    >
      {children}
    </DistrictContext.Provider>
  );
}

export const useDistrict = () => useContext(DistrictContext);
