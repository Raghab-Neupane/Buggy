import { useState, useEffect } from "react";
import { fetchStats } from "../services/api";

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  totalLogs: number;
  errorsToday: number;
}

export function useStats(refreshIntervalMs = 10000) {
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    onlineDevices: 0,
    totalLogs: 0,
    errorsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchStats();
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(true);
    const interval = setInterval(() => loadStats(false), refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  return { stats, loading, error, refetch: () => loadStats(false) };
}
