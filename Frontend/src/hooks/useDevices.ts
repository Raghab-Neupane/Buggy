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
    loadDevices(true);

    const wsHost = window.location.hostname === "127.0.0.1" ? "127.0.0.1:8000" : "localhost:8000";
    const wsUrl = userId 
      ? `ws://${wsHost}/ws/dashboard?userId=${userId}` 
      : `ws://${wsHost}/ws/dashboard`;
      
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      if (!isMounted) return;
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
                    lastSeen: new Date(newLog.timestamp).toLocaleTimeString()
                    // NOTE: device.online is ONLY updated via status_change events
                    // (broadcast by backend when /devices/{id}/stream WS connects or disconnects)
                  };
                }
                return d;
              });
            } else {
              // New device seen for first time — online state will be set correctly
              // by the next status_change broadcast from the backend
              return [...prevDevices, {
                id: logDeviceId,
                name: newLog.deviceName || `${newLog.os || 'Unknown'} Device`,
                browser: newLog.browser || "Unknown",
                os: newLog.os || "Unknown",
                online: false, // conservative default; status_change will set the real value
                logCount: 1,
                errorCount: newLog.level.toLowerCase() === "error" ? 1 : 0,
                lastSeen: new Date(newLog.timestamp).toLocaleTimeString()
              }];
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
        }
      } catch (err) {
        console.error("Dashboard WS message parse error:", err);
      }
    };

    socket.onerror = (err) => {
      console.warn("Dashboard WS error", err);
      // Do NOT mark devices offline here — this only means the dashboard's own
      // connection to /ws/dashboard dropped, not the device stream connections.
    };

    socket.onclose = () => {
      console.warn("Dashboard WS connection closed.");
      // Do NOT mark devices offline here — the device stream state is managed
      // exclusively via status_change messages from the backend.
    };

    return () => {
      isMounted = false;
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
