import type { Device } from "../types/device";
import type { LogEvent, SessionInfo } from "../types/log";
import ApiClient from "./ApiClient";

// API Functions querying real FastAPI backend
export async function fetchDevices(): Promise<Device[]> {
  return await ApiClient.get<Device[]>("/devices");
}

// Logout helper – clears server-side cookie and client storage
export async function logout(): Promise<void> {
  try {
    await ApiClient.post<void>("/logout");
  } catch (error) {
    console.warn("Logout request failed", error);
  }
  // Remove auth tokens from local storage
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
}

export async function fetchDevice(id: string): Promise<Device | null> {
  const data = await ApiClient.get<any>(`/devices/${id}`);

  return {
    id: data.id,
    name: data.device_name || `${data.os} Device`,
    browser: data.browser || "Unknown",
    os: data.os || "Unknown",
    online: !!data.online,
    logCount: 0,
    errorCount: 0,
    lastSeen: data.last_seen || "",
    connectedAt: data.connected_at || null
  };
}

export const fetchDeviceById = fetchDevice;

export async function fetchDeviceLogs(id: string, limit = 100, offset = 0): Promise<LogEvent[]> {
  const rawLogs = await ApiClient.get<any[]>(`/devices/${id}/logs?limit=${limit}&offset=${offset}`);

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
  const data = await ApiClient.get<any>(`/devices/${deviceId}`);
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
  return await ApiClient.get<{
    totalDevices: number;
    onlineDevices: number;
    totalLogs: number;
    errorsToday: number;
  }>("/stats");
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
  const path = userId ? `/main_details?userId=${userId}` : "/main_details";
  return await ApiClient.get<{
    logs: LogEvent[];
    devices: Device[];
    stats: {
      totalDevices: number;
      onlineDevices: number;
      totalLogs: number;
      errorsToday: number;
    };
  }>(path);
}
