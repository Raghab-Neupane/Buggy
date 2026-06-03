import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/dashboard";
import { DeviceDetails } from "./pages/DeviceDetails";
import { useDevices } from "./hooks/useDevices";

function AppContent() {
  // Query active device list to populate the sidebar in real time
  const { devices } = useDevices();

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
