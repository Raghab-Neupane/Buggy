import ApiClient from "./ApiClient";
import type { LogEvent } from "../types/log";

export interface TopErrorUser {
  userId: string;
  errorCount: number;
}

export interface ServerErrorSummary {
  deviceId: string; // Used as the server host (e.g. "localhost:5173")
  topErrorUsers: TopErrorUser[];
}

// Simple in-memory cache for server logs to optimize sub-page navigation
const logsCache: { [serverHost: string]: { data: LogEvent[]; timestamp: number } } = {};
const CACHE_TTL = 30000; // 30 seconds

export async function fetchServerErrorSummaries(): Promise<ServerErrorSummary[]> {
  return await ApiClient.get<ServerErrorSummary[]>("/tags");
}

export async function fetchServerLogs(serverHost: string, forceRefresh = false, limit = 1000): Promise<LogEvent[]> {
  const now = Date.now();
  if (!forceRefresh && logsCache[serverHost] && (now - logsCache[serverHost].timestamp) < CACHE_TTL) {
    return logsCache[serverHost].data;
  }

  const rawLogs = await ApiClient.get<any[]>(`/servers/${serverHost}/logs?limit=${limit}`);
  const logs: LogEvent[] = rawLogs.map((l: any) => ({
    id: l.id || Math.random().toString(36).substr(2, 9),
    level: (l.level || "info").toLowerCase() as "info" | "warn" | "error" | "debug",
    message: l.message || "",
    timestamp: l.timestamp || new Date().toISOString(),
    deviceid: l.deviceid || "",
    url: l.url || "",
    stackTrace: l.stackTrace || "",
    location: l.location || "Unknown Location",
    browser: l.browser || "Unknown",
    browserVersion: l.browserVersion || "",
    deviceName: l.deviceName || "",
    os: l.os || "Unknown",
    latitude: l.latitude,
    longitude: l.longitude,
    sessionStartedAt: l.sessionStartedAt
  }));

  logsCache[serverHost] = {
    data: logs,
    timestamp: now
  };

  return logs;
}

export function clearServerLogsCache(serverHost?: string) {
  if (serverHost) {
    delete logsCache[serverHost];
  } else {
    for (const key in logsCache) {
      delete logsCache[key];
    }
  }
}
