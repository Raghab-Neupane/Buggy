import { useState, useEffect, useMemo, useRef } from "react";
import type { LogEvent, SessionInfo } from "../types/log";
import { fetchDeviceLogs, fetchSessionInfo } from "../services/api";
import { WebSocketStream } from "../services/websocket";

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

  const streamRef = useRef<WebSocketStream | null>(null);
  const logsBufferRef = useRef<LogEvent[]>([]);

  // Toggle log level filters
  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
    );
  };

  const clearLogs = () => {
    setLogs([]);
    logsBufferRef.current = [];
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
      
      // If we are at offset 0 (head), reset lists, otherwise set paginated page
      if (offset === 0) {
        setLogs(histLogs);
        logsBufferRef.current = [...histLogs];
      } else {
        setLogs(histLogs);
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
  useEffect(() => {
    if (!deviceId || offset !== 0) return;

    const stream = new WebSocketStream(deviceId);
    streamRef.current = stream;
    stream.connect();

    // Subscribe to incoming stream events
    const unsubscribe = stream.subscribe((newLog) => {
      // Add to buffer
      logsBufferRef.current = [...logsBufferRef.current, newLog];

      // Append to visible logs if not paused
      if (!isPaused) {
        setLogs((prev) => {
          // Prepend or append depending on sorting order (we sort by desc timestamp in UI memo)
          // Since our UI maps them, we'll append to list
          return [newLog, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
      stream.disconnect();
      streamRef.current = null;
    };
  }, [deviceId, isPaused, offset]);

  // Filter and search logs memoized
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = searchQuery
        ? log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (log.url && log.url.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      const matchesLevel = selectedLevels.length > 0
        ? selectedLevels.includes(log.level.toLowerCase())
        : true;

      return matchesSearch && matchesLevel;
    });
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
    // Pagination attributes
    limit,
    setLimit,
    offset,
    hasMore,
    nextPage,
    prevPage
  };
}
