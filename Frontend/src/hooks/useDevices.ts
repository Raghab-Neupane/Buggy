import { useState, useEffect } from "react";
import type { Device } from "../types/device";
import { fetchMainDetails } from "../services/api";
import type { DashboardStats } from "./useStats";

export function useDevices(userId?: string, refreshIntervalMs = 10000) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    totalLogs: 0,
    errorsToday: 0,
    onlineDevices: 0,
  });

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

    const interval = setInterval(() => {
      loadDevices(false);
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [userId, refreshIntervalMs]);

  return {
    devices,
    loading,
    error,
    stats,
    refetch: () => loadDevices(false),
  };
}
