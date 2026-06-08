import type { LogEvent } from "../types/log";
import ApiClient from "./ApiClient";

export type LogListener = (log: LogEvent) => void;

const SIMULATION_MESSAGES = [
  { level: "info", message: "User clicked navigation element: 'Settings'" },
  { level: "debug", message: "Cache hit for query: select * from users where id = 52" },
  { level: "info", message: "Autosaving form changes... Draft saved locally" },
  { level: "warn", message: "Layout reflow detected: ScrollContainer rendered in 14.2ms (threshold 10ms)" },
  { level: "debug", message: "Active websocket heartbeat ping sent: latency 11ms" },
  { level: "info", message: "API POST /api/v1/telemetry returned status 200" },
  { level: "error", message: "TypeError: Cannot read properties of undefined (reading 'split') at Object.parseToken (auth.ts:182:14)" },
  { level: "debug", message: "State update: { auth: { isAuthenticated: true, user: 'Raghab' } }" },
  { level: "warn", message: "Feature flag 'new-billing-flow' is enabled but Stripe API returned a slow warning" },
  { level: "info", message: "Page changed: /dashboard/settings -> /dashboard/billing" },
  { level: "error", message: "Network Error: GET /api/v1/billing/invoices - net::ERR_CONNECTION_TIMED_OUT" }
];

export class WebSocketStream {
  private socket: WebSocket | null = null;
  private listeners: Set<LogListener> = new Set();
  private deviceId: string;
  private mockInterval: any = null;
  private isSimulationActive = false;
  private reconnectTimeout: any = null;

  private statusListeners: Set<(connected: boolean) => void> = new Set();

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  public subscribeStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    // Trigger immediately with current state
    listener(this.socket !== null && this.socket.readyState === WebSocket.OPEN);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private emitStatus(connected: boolean): void {
    this.statusListeners.forEach((listener) => listener(connected));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      console.log("WebSocket stream reconnecting...");
      this.connect();
    }, 5000);
  }

  public connect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    const wsUrl = ApiClient.getWsUrl(`/sdk/devices/${this.deviceId}/stream?client=dashboard`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.emitStatus(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          // Convert camelCase parameters — map deviceId to deviceid for frontend consistency
          const formattedLog: LogEvent = {
            id: logData.id || `ws-${crypto.randomUUID()}`,
            level: logData.level.toLowerCase() as any,
            message: logData.message,
            timestamp: logData.timestamp,
            deviceid: logData.deviceId || logData.deviceid || this.deviceId,
            url: logData.url,
            stackTrace: logData.stackTrace,
            location: logData.location,
            browser: logData.browser,
            browserVersion: logData.browserVersion,
            deviceName: logData.deviceName,
            os: logData.os,
            latitude: logData.latitude,
            longitude: logData.longitude,
            sessionStartedAt: logData.sessionStartedAt
          };
          this.emit(formattedLog);
        } catch {
          const textLog: LogEvent = {
            id: `ws-${crypto.randomUUID()}`,
            level: "info",
            message: event.data,
            timestamp: new Date().toISOString(),
            deviceid: this.deviceId
          };
          this.emit(textLog);
        }
      };

      this.socket.onerror = () => {
        console.warn("WebSocket stream error.");
        this.emitStatus(false);
        this.scheduleReconnect();
      };

      this.socket.onclose = () => {
        console.warn("WebSocket stream closed.");
        this.emitStatus(false);
        this.scheduleReconnect();
      };
    } catch (e) {
      console.warn("WebSocket connection exception.", e);
      this.emitStatus(false);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.stopSimulation();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }
    this.emitStatus(false);
    this.listeners.clear();
    this.statusListeners.clear();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(log: LogEvent): void {
    this.listeners.forEach((listener) => listener(log));
  }

  public startSimulation(): void {
    if (this.isSimulationActive) return;
    this.isSimulationActive = true;
    console.log(`Starting real-time simulation fallback for device: ${this.deviceId}`);

    this.mockInterval = setInterval(() => {
      const template = SIMULATION_MESSAGES[Math.floor(Math.random() * SIMULATION_MESSAGES.length)];
      const mockLog: LogEvent = {
        id: `sim-${crypto.randomUUID()}`,
        level: template.level as any,
        message: template.message,
        timestamp: new Date().toISOString(),
        deviceid: this.deviceId
      };
      this.emit(mockLog);
    }, 2500);
  }

  public stopSimulation(): void {
    this.isSimulationActive = false;
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  public triggerManualMockLog(level: "info" | "warn" | "error" | "debug", customMessage?: string): void {
    const template = SIMULATION_MESSAGES[Math.floor(Math.random() * SIMULATION_MESSAGES.length)];
    const mockLog: LogEvent = {
      id: `manual-sim-${crypto.randomUUID()}`,
      level: level,
      message: customMessage || `[Manual Demo] ${template.message}`,
      timestamp: new Date().toISOString(),
      deviceid: this.deviceId
    };
    this.emit(mockLog);
  }
}
