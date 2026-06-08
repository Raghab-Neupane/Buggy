export interface Device {
  id: string;
  name: string;
  browser: string;
  os: string;
  online: boolean;
  logCount: number;
  errorCount: number;
  lastSeen: string; // ISO String or human readable (e.g., "2 mins ago")
  sessionCount?: number;
  url?: string;
  connectedAt?: string | null;
}
