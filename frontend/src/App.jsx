import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DistrictProvider } from "./context/DistrictContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/layout/Layout";
import { LoginView } from "./views/LoginView";
import { DashboardView } from "./views/DashboardView";
import { DistrictExplorerView } from "./views/DistrictExplorerView";
import { RouteRecommenderView } from "./views/RouteRecommenderView";
import { SignalOptimizationView } from "./views/SignalOptimizationView";
import { WhatIfSimulatorView } from "./views/WhatIfSimulatorView";
import { EmergencyPriorityView } from "./views/EmergencyPriorityView";
import { PredictionLabView } from "./views/PredictionLabView";
import { DecisionCenterView } from "./views/DecisionCenterView";
import { AnalyticsView } from "./views/AnalyticsView";
import { CitizenAlertsView } from "./views/CitizenAlertsView";
import { WeatherImpactView } from "./views/WeatherImpactView";
import { DownloadReportsView } from "./views/DownloadReportsView";
import { SettingsView } from "./views/SettingsView";

// Protected Route Guard
function ProtectedRoute({ children, requireController = false }) {
  const { user, role, loading, isController } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-cyan-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading TrafficTwin Digital Twin Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireController && !isController) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DistrictProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginView />} />
              
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardView />} />
                <Route path="explorer" element={<DistrictExplorerView />} />
                <Route path="weather" element={<WeatherImpactView />} />
                <Route path="routing" element={<RouteRecommenderView />} />
                <Route path="my-alerts" element={<CitizenAlertsView />} />
                <Route path="reports" element={<DownloadReportsView />} />
                <Route path="settings" element={<SettingsView />} />
                
                {/* Controller Only Routes */}
                <Route
                  path="signals"
                  element={
                    <ProtectedRoute requireController>
                      <SignalOptimizationView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="simulator"
                  element={
                    <ProtectedRoute requireController>
                      <WhatIfSimulatorView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="emergency"
                  element={
                    <ProtectedRoute requireController>
                      <EmergencyPriorityView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="predictions"
                  element={
                    <ProtectedRoute requireController>
                      <PredictionLabView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="decision-center"
                  element={
                    <ProtectedRoute requireController>
                      <DecisionCenterView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <ProtectedRoute requireController>
                      <AnalyticsView />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DistrictProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
