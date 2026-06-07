import type { Device } from "../types/device";
import type { LogEvent, SessionInfo } from "../types/log";

const API_BASE_URL = "http://localhost:8000";


// API Functions querying real FastAPI backend
export async function fetchDevices(): Promise<Device[]> {
  const response = await fetch(`${API_BASE_URL}/devices`, { credentials: "include" });
  if (!response.ok) throw new Error("Backend query failed");
  return await response.json();
}

// Logout helper – clears server-side cookie and client storage
export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/logout`, { method: "POST", credentials: "include" });
  // Ignore response body; just clear local auth state on success
  if (!response.ok) {
    console.warn("Logout request failed");
  }
  // Remove auth tokens from local storage
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
}

export async function fetchDevice(id: string): Promise<Device | null> {
  const response = await fetch(`${API_BASE_URL}/devices/${id}`, { credentials: "include" });
  if (!response.ok) throw new Error("Backend query failed");
  const data = await response.json();

  const isOnline = data.online !== undefined ? data.online : (Date.now() - new Date(data.last_seen).getTime()) < 300000;
  return {
    id: data.id,
    name: data.device_name || `${data.os} Device`,
    browser: data.browser || "Unknown",
    os: data.os || "Unknown",
    online: isOnline,
    logCount: 0,
    errorCount: 0,
    lastSeen: new Date(data.last_seen).toLocaleTimeString()
  };
}

export const fetchDeviceById = fetchDevice;

export async function fetchDeviceLogs(id: string, limit = 100, offset = 0): Promise<LogEvent[]> {
  const response = await fetch(`${API_BASE_URL}/devices/${id}/logs?limit=${limit}&offset=${offset}`, { credentials: "include" });
  if (!response.ok) throw new Error("Backend query failed");
  const rawLogs = await response.json();

  return rawLogs.map((l: any) => ({
    id: l.id,
    level: l.level.toLowerCase(),
    message: l.message,
    timestamp: l.timestamp,
    deviceid: l.deviceid,
    url: l.url,
    stackTrace: l.stackTrace,
    location: l.location,
    browser: l.browser,
    browserVersion: l.browserVersion,
    deviceName: l.deviceName,
    os: l.os,
    latitude: l.latitude,
    longitude: l.longitude,
    sessionStartedAt: l.sessionStartedAt
  }));
}

export async function fetchSessionInfo(deviceId: string): Promise<SessionInfo | null> {
  const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, { credentials: "include" });
  if (!response.ok) throw new Error("Backend query failed");
  const data = await response.json();

  const logs = await fetchDeviceLogs(deviceId, 20, 0);
  const duration = logs.length > 1
    ? Math.max(0, Math.floor((new Date(logs[0].timestamp).getTime() - new Date(logs[logs.length - 1].timestamp).getTime()) / 1000))
    : 120;

  return {
    deviceid: data.id || deviceId,
    userAgent: data.user_agent || "Unknown Agent",
    url: data.url || "https://buggy.dev/",
    duration: duration || 120,
    logCount: logs.length,
    errorCount: logs.filter(l => l.level === "error").length,
    country: data.location || "Local Connection",
    city: "",
    os: data.os,
    browser: data.browser,
    browserVersion: data.browser_version,
    deviceName: data.device_name,
    latitude: data.latitude,
    longitude: data.longitude,
    sessionStartedAt: data.session_started_at
  };
}

export async function fetchStats(): Promise<{
  totalDevices: number;
  onlineDevices: number;
  totalLogs: number;
  errorsToday: number;
}> {
  const response = await fetch(`${API_BASE_URL}/stats`, { credentials: "include" });
  if (!response.ok) throw new Error("Backend query failed");
  return await response.json();
}

export async function fetchMainDetails(userId?: string): Promise<{
  logs: LogEvent[];
  devices: Device[];
  stats: {
    totalDevices: number;
    onlineDevices: number;
    totalLogs: number;
    errorsToday: number;
  };
}> {
  const url = userId ? `${API_BASE_URL}/main_details?userId=${userId}` : `${API_BASE_URL}/main_details`;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Backend query failed");
  return await response.json();
}
