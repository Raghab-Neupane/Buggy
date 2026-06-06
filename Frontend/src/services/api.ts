import type { Device } from "../types/device";
import type { LogEvent, SessionInfo } from "../types/log";

const API_BASE_URL = "http://localhost:8000";

// High-fidelity Mock Devices
export const MOCK_DEVICES: Device[] = [
  {
    id: "device-macbook",
    name: "MacBook Pro",
    browser: "Chrome",
    os: "macOS",
    online: true,
    logCount: 142,
    errorCount: 4,
    lastSeen: "Just now",
    sessionCount: 3
  },
  {
    id: "device-iphone",
    name: "iPhone 15 Pro",
    browser: "Safari",
    os: "iOS",
    online: true,
    logCount: 84,
    errorCount: 0,
    lastSeen: "5s ago",
    sessionCount: 1
  },
  {
    id: "device-windows",
    name: "Windows Desktop",
    browser: "Edge",
    os: "Windows",
    online: false,
    logCount: 312,
    errorCount: 12,
    lastSeen: "2 hours ago",
    sessionCount: 8
  },
  {
    id: "device-android",
    name: "Google Pixel 8",
    browser: "Chrome",
    os: "Android",
    online: true,
    logCount: 19,
    errorCount: 1,
    lastSeen: "1 min ago",
    sessionCount: 2
  },
  {
    id: "device-safari-mac",
    name: "MacBook Air",
    browser: "Safari",
    os: "macOS",
    online: false,
    logCount: 92,
    errorCount: 0,
    lastSeen: "Yesterday",
    sessionCount: 4
  }
];

// High-fidelity Mock Logs
export const MOCK_LOGS: Record<string, LogEvent[]> = {
  "device-macbook": [
    {
      id: "log-mb-1",
      level: "info",
      message: "Application bootstrapped successfully in 84ms",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      deviceid: "sess-mb-99",
      url: "https://buggy.dev/dashboard",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    },
    {
      id: "log-mb-2",
      level: "debug",
      message: "User session validated. Token expires in 23 hours",
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      deviceid: "sess-mb-99",
      url: "https://buggy.dev/dashboard",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    },
    {
      id: "log-mb-3",
      level: "warn",
      message: "API Request to /v1/metrics took longer than threshold: 820ms",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      deviceid: "sess-mb-99",
      url: "https://buggy.dev/dashboard",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    },
    {
      id: "log-mb-4",
      level: "error",
      message: "TypeError: Cannot read properties of null (reading 'getContext') at HTMLCanvasElement.renderCanvas (dashboard.tsx:124:22)",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      deviceid: "sess-mb-99",
      url: "https://buggy.dev/dashboard",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      stackTrace: "TypeError: Cannot read properties of null (reading 'getContext')\n  at renderCanvas (dashboard.tsx:124:22)\n  at useEffect (dashboard.tsx:44:9)\n  at commitHookEffectListMount (react-dom.development.js:23150:26)\n  at commitPassiveMountOnFiber (react-dom.development.js:24403:30)"
    },
    {
      id: "log-mb-5",
      level: "info",
      message: "Websocket connection established with server ws://localhost:8000/devices/device-macbook/stream",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      deviceid: "sess-mb-99",
      url: "https://buggy.dev/dashboard",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    }
  ],
  "device-iphone": [
    {
      id: "log-ip-1",
      level: "info",
      message: "Safari session started. Device aspect ratio: 19.5:9",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      deviceid: "sess-ip-12",
      url: "https://buggy.dev/mobile/logs",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    },
    {
      id: "log-ip-2",
      level: "debug",
      message: "Preloading assets: [icon_sprite.svg, app_main.css]",
      timestamp: new Date(Date.now() - 90000).toISOString(),
      deviceid: "sess-ip-12",
      url: "https://buggy.dev/mobile/logs",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    },
    {
      id: "log-ip-3",
      level: "info",
      message: "Touch interactions initialized: inertia scroll enabled",
      timestamp: new Date(Date.now() - 30000).toISOString(),
      deviceid: "sess-ip-12",
      url: "https://buggy.dev/mobile/logs",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    }
  ],
  "device-windows": [
    {
      id: "log-win-1",
      level: "info",
      message: "Browser initialized. Edge 122.0.0 on Windows 11 Desktop",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      deviceid: "sess-win-81",
      url: "https://buggy.dev/admin",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"
    },
    {
      id: "log-win-2",
      level: "error",
      message: "Failed to load resource: the server responded with a status of 404 (Not Found) - https://buggy.dev/api/v1/user/settings",
      timestamp: new Date(Date.now() - 7000000).toISOString(),
      deviceid: "sess-win-81",
      url: "https://buggy.dev/admin",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"
    },
    {
      id: "log-win-3",
      level: "warn",
      message: "Localstorage quota warning: current storage usage exceeds 4.5MB",
      timestamp: new Date(Date.now() - 6000000).toISOString(),
      deviceid: "sess-win-81",
      url: "https://buggy.dev/admin",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"
    },
    {
      id: "log-win-4",
      level: "error",
      message: "Uncaught ReferenceError: analyticsProvider is not defined at https://buggy.dev/admin/tracker.js:14:5",
      timestamp: new Date(Date.now() - 5000000).toISOString(),
      deviceid: "sess-win-81",
      url: "https://buggy.dev/admin",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
      stackTrace: "ReferenceError: analyticsProvider is not defined\n  at tracker.js:14:5\n  at dispatchEvent (analytics.js:82:12)\n  at submitEvent (dashboard.tsx:28:4)"
    }
  ],
  "device-android": [
    {
      id: "log-ad-1",
      level: "info",
      message: "Android Chrome session registered successfully",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      deviceid: "sess-ad-04",
      url: "https://buggy.dev/home",
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
    },
    {
      id: "log-ad-2",
      level: "error",
      message: "Network Error: GET /api/v1/notifications network timed out after 10000ms",
      timestamp: new Date(Date.now() - 150000).toISOString(),
      deviceid: "sess-ad-04",
      url: "https://buggy.dev/home",
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
    }
  ],
  "device-safari-mac": [
    {
      id: "log-sm-1",
      level: "info",
      message: "Safari session spawned on MacBook Air 13-inch",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      deviceid: "sess-sm-55",
      url: "https://buggy.dev/",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
    }
  ]
};

// Mock Session info
export const MOCK_SESSIONS: Record<string, SessionInfo> = {
  "device-macbook": {
    deviceid: "sess-mb-99",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    url: "https://buggy.dev/dashboard",
    duration: 1540,
    logCount: 142,
    errorCount: 4,
    country: "United States",
    city: "San Francisco",
    os: "macOS",
    browser: "Chrome"
  },
  "device-iphone": {
    deviceid: "sess-ip-12",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    url: "https://buggy.dev/mobile/logs",
    duration: 215,
    logCount: 84,
    errorCount: 0,
    country: "Canada",
    city: "Toronto",
    os: "iOS",
    browser: "Safari"
  },
  "device-windows": {
    deviceid: "sess-win-81",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
    url: "https://buggy.dev/admin",
    duration: 4890,
    logCount: 312,
    errorCount: 12,
    country: "Germany",
    city: "Berlin",
    os: "Windows",
    browser: "Edge"
  },
  "device-android": {
    deviceid: "sess-ad-04",
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36",
    url: "https://buggy.dev/home",
    duration: 412,
    logCount: 19,
    errorCount: 1,
    country: "Japan",
    city: "Tokyo",
    os: "Android",
    browser: "Chrome"
  },
  "device-safari-mac": {
    deviceid: "sess-sm-55",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    url: "https://buggy.dev/",
    duration: 7200,
    logCount: 92,
    errorCount: 0,
    country: "United Kingdom",
    city: "London",
    os: "macOS",
    browser: "Safari"
  }
};

// API Functions querying real FastAPI backend
export async function fetchDevices(): Promise<Device[]> {
  const response = await fetch(`${API_BASE_URL}/devices`);
  if (!response.ok) throw new Error("Backend query failed");
  return await response.json();
}

export async function fetchDevice(id: string): Promise<Device | null> {
  const response = await fetch(`${API_BASE_URL}/devices/${id}`);
  if (!response.ok) throw new Error("Backend query failed");
  const data = await response.json();

  const isOnline = (Date.now() - new Date(data.last_seen).getTime()) < 300000;
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
  const response = await fetch(`${API_BASE_URL}/devices/${id}/logs?limit=${limit}&offset=${offset}`);
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
  const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`);
  if (!response.ok) throw new Error("Backend query failed");
  const data = await response.json();

  const logs = await fetchDeviceLogs(deviceId, 20, 0);
  const duration = logs.length > 1
    ? Math.max(0, Math.floor((new Date(logs[0].timestamp).getTime() - new Date(logs[logs.length - 1].timestamp).getTime()) / 1000))
    : 120;

  return {
    deviceid: data.session_id || deviceId,
    userAgent: data.user_agent || "Unknown Agent",
    url: data.url || "https://buggy.dev/",
    duration: duration || 120,
    logCount: logs.length,
    errorCount: logs.filter(l => l.level === "error").length,
    country: (data.latitude !== null && data.longitude !== null && data.latitude !== undefined) ? `Coords: ${data.latitude}, ${data.longitude}` : "Local Network",
    city: data.device_name || "Unknown Device",
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
  const response = await fetch(`${API_BASE_URL}/stats`);
  if (!response.ok) throw new Error("Backend query failed");
  return await response.json();
}
