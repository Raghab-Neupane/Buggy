import { useState, useEffect, useRef } from "react";
import type { Device } from "../types/device";
import { fetchMainDetails } from "../services/api";
import type { DashboardStats } from "./useStats";
import ApiClient from "../services/ApiClient";

export function useDevices(userId?: string) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    totalLogs: 0,
    errorsToday: 0,
    onlineDevices: 0,
  });

  const devicesRef = useRef<Device[]>([]);
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    setStats((prevStats) => ({
      ...prevStats,
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.online).length,
    }));
  }, [devices]);

  const loadDevices = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await fetchMainDetails(userId);
      setDevices(data.devices);
      setStats(data.stats);
      setError(null);
    } catch (e: any) {
      console.error("useDevices Hook: Failed to load devices data", e);
      setError(e.message || "Failed to load devices");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    loadDevices(true);

    const connect = () => {
      if (!isMounted) return;

      const wsUrl = userId 
        ? ApiClient.getWsUrl(`/ws/dashboard?userId=${userId}`)
        : ApiClient.getWsUrl("/ws/dashboard");
        
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (!isMounted) return;
        console.log("Dashboard WS connection opened.");
        // Re-fetch data after reconnect to ensure any status transitions that occurred offline are synced
        loadDevices(false);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "log_event") {
            const newLog = data.payload;
            const logDeviceId = newLog.deviceId || newLog.deviceid;
            
            setDevices((prevDevices) => {
              const exists = prevDevices.find(d => d.id === logDeviceId);
              if (exists) {
                return prevDevices.map(d => {
                  if (d.id === logDeviceId) {
                    return {
                      ...d,
                      logCount: d.logCount + 1,
                      errorCount: newLog.level.toLowerCase() === "error" ? d.errorCount + 1 : d.errorCount,
                      online: newLog.isOnline !== undefined ? !!newLog.isOnline : d.online
                    };
                  }
                  return d;
                });
              } else {
                // Background fetch the device details for the new device
                loadDevices(false);
                return prevDevices;
              }
            });

            setStats((prevStats) => {
              return {
                ...prevStats,
                totalLogs: prevStats.totalLogs + 1,
                errorsToday: newLog.level.toLowerCase() === "error" ? prevStats.errorsToday + 1 : prevStats.errorsToday
              };
            });
          } else if (data.type === "status_change") {
            const { deviceId, online } = data.payload;
            setDevices((prevDevices) => {
              return prevDevices.map(d => {
                if (d.id === deviceId) {
                  return {
                    ...d,
                    online: online
                  };
                }
                return d;
              });
            });
            // Background fetch to sync connectedAt and lastSeen timestamps from the backend
            loadDevices(false);
          }
        } catch (err) {
          console.error("Dashboard WS message parse error:", err);
        }
      };

      socket.onerror = (err) => {
        console.warn("Dashboard WS error", err);
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.warn("Dashboard WS connection closed. Reconnecting in 5s...");
        socket = null;
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 5000);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [userId]);

  return {
    devices,
    loading,
    error,
    stats,
    refetch: () => loadDevices(false),
  };
}
