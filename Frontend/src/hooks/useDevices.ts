import { useState, useEffect, useRef } from "react";
import type { Device } from "../types/device";
import { fetchMainDetails } from "../services/api";
import type { DashboardStats } from "./useStats";

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
    loadDevices(true);

    const wsHost = window.location.hostname === "127.0.0.1" ? "127.0.0.1:8000" : "localhost:8000";
    const wsUrl = userId 
      ? `ws://${wsHost}/ws/dashboard?userId=${userId}` 
      : `ws://${wsHost}/ws/dashboard`;
      
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "log_event") {
          const newLog = data.payload;
          // Backend sends deviceId (camelCase), normalize to match frontend's id field
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
                    lastSeen: new Date(newLog.timestamp).toLocaleTimeString(),
                    online: newLog.isOnline !== undefined ? newLog.isOnline : d.online
                  };
                }
                return d;
              });
            } else {
              return [...prevDevices, {
                id: logDeviceId,
                name: newLog.deviceName || `${newLog.os || 'Unknown'} Device`,
                browser: newLog.browser || "Unknown",
                os: newLog.os || "Unknown",
                online: newLog.isOnline !== undefined ? newLog.isOnline : true,
                logCount: 1,
                errorCount: newLog.level.toLowerCase() === "error" ? 1 : 0,
                lastSeen: new Date(newLog.timestamp).toLocaleTimeString()
              }];
            }
          });

          setStats((prevStats) => {
            const alreadyExists = devicesRef.current.some(d => d.id === logDeviceId);
            return {
              totalDevices: alreadyExists ? prevStats.totalDevices : prevStats.totalDevices + 1,
              onlineDevices: prevStats.onlineDevices, // Simplification
              totalLogs: prevStats.totalLogs + 1,
              errorsToday: newLog.level.toLowerCase() === "error" ? prevStats.errorsToday + 1 : prevStats.errorsToday
            };
          });
        }
      } catch (err) {
        console.error("Dashboard WS message parse error:", err);
      }
    };

    socket.onerror = (err) => {
      console.warn("Dashboard WS error, fallback to REST logic", err);
    };

    return () => {
      socket.close();
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
