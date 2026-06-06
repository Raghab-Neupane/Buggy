import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/dashboard";
import { DeviceDetails } from "./pages/DeviceDetails";
import { useDevices } from "./hooks/useDevices";
import { Login } from "./pages/login";

function AppContent() {
  const { devices } = useDevices();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 select-none">
      {/* Sleek macOS/Arc style sidebar */}
      <Sidebar devices={devices} />

      {/* Main route view workspace panel */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-slate-50">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/device/:deviceId" element={<DeviceDetails />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
