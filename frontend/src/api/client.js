// Resolves API URL with graceful fallback
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development/browser, fallback to same origin or port 5000 if needed
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname || "127.0.0.1"}:5000`;
  }
  return "http://127.0.0.1:5000";
};

const API_BASE = getApiBase();

let authTokenGetter = null;

export const setAuthTokenGetter = (fn) => {
  authTokenGetter = fn;
};

export async function apiRequest(endpoint, method = "GET", data = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json"
  };

  if (authTokenGetter) {
    try {
      const token = await authTokenGetter();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Could not retrieve auth token for request:", e);
    }
  }

  const config = {
    method,
    headers
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    console.error(`[API Network Error] ${method} ${url}:`, netErr);
    throw new Error(`Unable to connect to backend server at ${API_BASE}. Please ensure the Python Flask backend is running on port 5000.`);
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}: Server request failed.`);
  }

  return result;
}

export const api = {
  // Health
  getHealth: () => apiRequest("/api/health", "GET"),

  // Auth
  register: (payload) => apiRequest("/api/auth/register", "POST", payload),
  getMe: () => apiRequest("/api/auth/me", "GET"),
  demoLogin: (role) => apiRequest("/api/auth/demo-login", "POST", { role }),

  // Traffic & Districts
  getDistricts: () => apiRequest("/api/traffic/districts", "GET"),
  getDistrict: (id) => apiRequest(`/api/traffic/districts/${id}`, "GET"),
  reportIncident: (payload) => apiRequest("/api/traffic/incidents", "POST", payload),
  getIncidents: (districtId) => apiRequest(`/api/traffic/incidents${districtId ? `?districtId=${districtId}` : ""}`, "GET"),
  getNotifications: (districtId) => apiRequest(`/api/traffic/notifications${districtId ? `?districtId=${districtId}` : ""}`, "GET"),
  resolveNotification: (id) => apiRequest(`/api/traffic/notifications/${id}/resolve`, "POST"),

  // Routing
  recommendRoute: (payload) => apiRequest("/api/routing/recommend", "POST", payload),

  // Optimization & Simulator
  optimizeSignal: (payload) => apiRequest("/api/optimization/signal/optimize", "POST", payload),
  applySignalTiming: (payload) => apiRequest("/api/optimization/signal/apply", "POST", payload),
  runSimulation: (payload) => apiRequest("/api/optimization/simulator/run", "POST", payload),

  // Emergency Priority
  planEmergencyCorridor: (payload) => apiRequest("/api/emergency/plan", "POST", payload),
  resolveStuckEmergency: (payload) => apiRequest("/api/emergency/resolve-stuck", "POST", payload),

  // ML Prediction
  trainAndPredict: (payload) => apiRequest("/api/ml/predict", "POST", payload),

  // Analytics & Decision
  getDecisionRecommendations: (districtId) => apiRequest(`/api/analytics/decision-recommendations?districtId=${districtId}`, "GET"),
  getStrategicPlanning: (districtId) => apiRequest(`/api/analytics/strategic-planning?districtId=${districtId}`, "GET"),
  getHistoricalTrends: (districtId, days = 7) => apiRequest(`/api/analytics/historical-trends?districtId=${districtId}&days=${days}`, "GET"),
  compareDistricts: (d1, d2) => apiRequest(`/api/analytics/compare-districts?district1=${d1}&district2=${d2}`, "GET"),
  getScenarios: () => apiRequest("/api/analytics/scenarios", "GET"),
  getExportUrl: (districtId, format = "csv") => `${API_BASE}/api/analytics/export-report?districtId=${districtId}&format=${format}`
};
