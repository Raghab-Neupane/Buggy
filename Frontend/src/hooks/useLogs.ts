import { useState, useEffect, useMemo, useRef } from "react";
import type { LogEvent, SessionInfo } from "../types/log";
import { fetchDeviceLogs, fetchSessionInfo } from "../services/api";
import { WebSocketStream } from "../services/websocket";

const safeCompare = (a: LogEvent, b: LogEvent) => {
  const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
  const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
  const valA = isNaN(tA) ? 0 : tA;
  const valB = isNaN(tB) ? 0 : tB;
  return valB - valA; // descending (newest first)
};


export function useLogs(deviceId: string | undefined) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Streaming configurations
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]); // Empty means all

  // Pagination states
  const [limit, setLimit] = useState<number>(100);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const streamRef = useRef<WebSocketStream | null>(null);
  const logsBufferRef = useRef<LogEvent[]>([]);
  // Use a ref for isPaused so the WebSocket callback always reads the latest value
  const isPausedRef = useRef<boolean>(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Set to track seen log IDs for deduplication
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Toggle log level filters (exclusive selection)
  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) && prev.length === 1 ? [] : [level]
    );
  };

  const clearLogs = () => {
    setLogs([]);
    logsBufferRef.current = [];
    seenIdsRef.current.clear();
  };

  // Next page / Prev page pagination handlers
  const nextPage = () => {
    if (hasMore) {
      setOffset((prev) => prev + limit);
      // Auto-pause live stream when paginating back in history
      setIsPaused(true);
    }
  };

  const prevPage = () => {
    setOffset((prev) => Math.max(0, prev - limit));
    if (offset - limit === 0) {
      // Resume live stream if returning to head page
      setIsPaused(false);
    }
  };

  // Fetch logs whenever deviceId, limit, or offset changes
  const loadHistoricalLogs = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const histLogs = await fetchDeviceLogs(deviceId, limit, offset);
      
      // Register all historical log IDs in the seen set
      const sortedLogs = [...histLogs].sort(safeCompare);
      for (const log of sortedLogs) {
        if (log.id) seenIdsRef.current.add(log.id);
      }

      if (offset === 0) {
        setLogs(sortedLogs);
        logsBufferRef.current = sortedLogs;
      } else {
        setLogs(sortedLogs);
      }
      
      setHasMore(histLogs.length === limit);

      const sessInfo = await fetchSessionInfo(deviceId);
      setSession(sessInfo);
      setError(null);
    } catch (e: any) {
      console.error("useLogs Hook: Failed to load logs page", e);
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  // Load history on initialization and pagination changes
  useEffect(() => {
    loadHistoricalLogs();
  }, [deviceId, limit, offset]);

  // Connect to WebSocket stream (only active when on the first page / offset 0)
  // Establish a single WebSocket connection for the active device.
  // The connection should persist across pause/resume toggles and only reset when the deviceId changes.
  useEffect(() => {
    if (!deviceId || offset !== 0) return;

    const stream = new WebSocketStream(deviceId);
    streamRef.current = stream;
    stream.connect();

    const unsubscribeStatus = stream.subscribeStatus((connected) => {
      setIsConnected(connected);
    });

    // Subscribe to incoming stream events
    const unsubscribe = stream.subscribe((newLog) => {
      // Deduplicate: skip if we've already seen this log ID
      if (newLog.id && seenIdsRef.current.has(newLog.id)) {
        return;
      }
      // Mark as seen
      if (newLog.id) {
        seenIdsRef.current.add(newLog.id);
      }

      // Add to buffer (capped to recent 1000 entries to avoid memory leak)
      logsBufferRef.current = [newLog, ...logsBufferRef.current]
        .sort(safeCompare)
        .slice(0, 1000);

      // Prepend to visible logs if not paused (use ref to avoid stale closure)
      if (!isPausedRef.current) {
        setLogs((prev) => {
          // Double-check dedup within current state
          if (newLog.id && prev.some(l => l.id === newLog.id)) {
            return prev;
          }
          const combined = [newLog, ...prev];
          return combined
            .sort(safeCompare)
            .slice(0, 1000);
        });
      }
    });

    // Cleanup on unmount or when deviceId changes
    return () => {
      unsubscribe();
      unsubscribeStatus();
      stream.disconnect();
      streamRef.current = null;
    };
  }, [deviceId, offset]);

  // Filter and search logs memoized
  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      if (!log) return false;
      const logMsg = log.message || "";
      const logLvl = log.level || "";
      const logUrl = log.url || "";

      const matchesSearch = searchQuery
        ? logMsg.toLowerCase().includes(searchQuery.toLowerCase()) ||
          logLvl.toLowerCase().includes(searchQuery.toLowerCase()) ||
          logUrl.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesLevel = selectedLevels.length > 0
        ? selectedLevels.includes(logLvl.toLowerCase())
        : true;

      return matchesSearch && matchesLevel;
    });

    return [...filtered].sort(safeCompare);
  }, [logs, searchQuery, selectedLevels]);

  const triggerDemoLog = (level: "info" | "warn" | "error" | "debug", msg?: string) => {
    if (streamRef.current) {
      streamRef.current.triggerManualMockLog(level, msg);
    }
  };

  return {
    logs: filteredLogs,
    rawLogCount: logs.length,
    session,
    loading,
    error,
    isPaused,
    setIsPaused,
    searchQuery,
    setSearchQuery,
    selectedLevels,
    toggleLevel,
    clearLogs,
    triggerDemoLog,
    isConnected,
    // Pagination attributes
    limit,
    setLimit,
    offset,
    hasMore,
    nextPage,
    prevPage
  };
}
