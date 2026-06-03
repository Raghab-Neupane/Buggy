export interface LogEvent {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string;
  sessionId: string;
  ip?: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  sdkVersion?: string;
  appVersion?: string;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
}

export interface SessionInfo {
  sessionId: string;
  userAgent: string;
  url: string;
  duration: number; // In seconds
  logCount: number;
  errorCount: number;
  country?: string;
  city?: string;
  os?: string;
  browser?: string;
}
