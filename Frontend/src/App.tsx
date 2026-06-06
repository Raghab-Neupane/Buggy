import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/dashboard";
import { DeviceDetails } from "./pages/DeviceDetails";
import { useDevices } from "./hooks/useDevices";
import { Login } from "./pages/login";

function AuthenticatedApp({ role, currentUserId }: { role: string; currentUserId: string }) {
  // Fetch only user-specific devices if regular user
  const { devices } = useDevices(role === "admin" ? undefined : (currentUserId || undefined));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 select-none">
      {/* Sleek macOS/Arc style sidebar */}
      <Sidebar devices={devices} />

      {/* Main route view workspace panel */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-slate-50">
        <Routes>
          {role === "admin" ? (
            <>
              {/* Admin dashboard sees all */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/device/:deviceId" element={<DeviceDetails />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              {/* User dashboard only shows their assigned logs */}
              <Route path="/dashboard/:userId" element={<Dashboard />} />
              <Route path="/device/:deviceId" element={<DeviceDetails />} />
              {/* Fallback to user-specific dashboard */}
              <Route path="*" element={<Navigate to={`/dashboard/${currentUserId}`} replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const currentUserId = localStorage.getItem("userId");

  const isLoginPage = location.pathname === "/login";

  // 1. If not authenticated, force redirect to /login
  if (!currentUserId || !role) {
    if (isLoginPage) {
      return (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }
    return <Navigate to="/login" replace />;
  }

  // 2. If authenticated and attempting to view login page, redirect to correct dashboard
  if (isLoginPage) {
    if (role === "admin") {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to={`/dashboard/${currentUserId}`} replace />;
    }
  }

  return <AuthenticatedApp role={role} currentUserId={currentUserId} />;
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
