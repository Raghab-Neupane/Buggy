export interface LogEvent {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: string;
  deviceid: string;
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
  location?: {
    href?: string;
    origin?: string;
    protocol?: string;
    host?: string;
    hostname?: string;
    port?: string;
    pathname?: string;
    search?: string;
    hash?: string;
  };
  
  // New SDK fields
  browser?: string;
  browserVersion?: string;
  deviceName?: string;
  os?: string;
  sessionStartedAt?: string;
}

export interface SessionInfo {
  deviceid: string;
  userAgent: string;
  url: string;
  duration: number; // In seconds
  logCount: number;
  errorCount: number;
  country?: string;
  city?: string;
  os?: string;
  browser?: string;
  
  // New SDK fields
  browserVersion?: string;
  deviceName?: string;
  latitude?: number;
  longitude?: number;
  sessionStartedAt?: string;
}
