import type { LogEvent } from "../types/log";

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

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  public connect(): void {
    const wsUrl = `ws://localhost:8000/devices/${this.deviceId}/stream`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          // Convert camelCase parameters
          const formattedLog: LogEvent = {
            id: logData.id,
            level: logData.level.toLowerCase() as any,
            message: logData.message,
            timestamp: logData.timestamp,
            sessionId: logData.sessionId,
            url: logData.url,
            stackTrace: logData.stackTrace
          };
          this.emit(formattedLog);
        } catch {
          const textLog: LogEvent = {
            id: `ws-${Math.random().toString(36).substr(2, 9)}`,
            level: "info",
            message: event.data,
            timestamp: new Date().toISOString(),
            sessionId: this.deviceId
          };
          this.emit(textLog);
        }
      };

      this.socket.onerror = () => {
        console.warn("WebSocket stream error, starting local simulation.");
        this.startSimulation();
      };

      this.socket.onclose = () => {
        console.warn("WebSocket stream closed, starting local simulation.");
        this.startSimulation();
      };
    } catch (e) {
      console.warn("WebSocket connection exception, starting local simulation.", e);
      this.startSimulation();
    }
  }

  public disconnect(): void {
    this.stopSimulation();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
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

  private startSimulation(): void {
    if (this.isSimulationActive) return;
    this.isSimulationActive = true;
    console.log(`Starting real-time simulation fallback for device: ${this.deviceId}`);

    this.mockInterval = setInterval(() => {
      const template = SIMULATION_MESSAGES[Math.floor(Math.random() * SIMULATION_MESSAGES.length)];
      const mockLog: LogEvent = {
        id: `sim-${Math.random().toString(36).substr(2, 9)}`,
        level: template.level as any,
        message: template.message,
        timestamp: new Date().toISOString(),
        sessionId: this.deviceId
      };
      this.emit(mockLog);
    }, 2500);
  }

  private stopSimulation(): void {
    this.isSimulationActive = false;
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  public triggerManualMockLog(level: "info" | "warn" | "error" | "debug", customMessage?: string): void {
    const template = SIMULATION_MESSAGES[Math.floor(Math.random() * SIMULATION_MESSAGES.length)];
    const mockLog: LogEvent = {
      id: `manual-sim-${Math.random().toString(36).substr(2, 9)}`,
      level: level,
      message: customMessage || `[Manual Demo] ${template.message}`,
      timestamp: new Date().toISOString(),
      sessionId: this.deviceId
    };
    this.emit(mockLog);
  }
}
