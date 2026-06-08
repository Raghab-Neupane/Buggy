import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ShieldAlert, FileText, ChevronRight, Terminal, Globe, UserCheck } from "lucide-react";
import { useLogs } from "../hooks/useLogs";
import { fetchDeviceById } from "../services/api";
import type { Device } from "../types/device";
import { DeviceMetadata } from "../components/DeviceMetadata";
import { LogViewer } from "../components/LogViewer";

export const DeviceDetails: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [durationCounter, setDurationCounter] = useState(0);

  // Hook up logs, pagination, filters, search and simulator trigger functions
  const {
    logs,
    rawLogCount,
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
    // Pagination variables
    offset,
    hasMore,
    nextPage,
    prevPage
  } = useLogs(deviceId);

  // Fetch device details
  const loadDev = async () => {
    if (!deviceId) return;
    try {
      const dev = await fetchDeviceById(deviceId);
      setDevice(dev);
    } catch (err) {
      console.error("Failed to load device details", err);
    }
  };

  useEffect(() => {
    loadDev();
  }, [deviceId]);

  // Re-fetch device details when connection restores
  const prevConnectedRef = React.useRef<boolean>(isConnected);
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      console.log("DeviceDetails: WS connection restored, re-fetching device...");
      loadDev();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  const displayDevice = device ? {
    ...device,
    online: device.online && isConnected
  } : null;

  // Session duration timer counter
  useEffect(() => {
    if (loading || !session) return;
    setDurationCounter(session.duration);

    const interval = setInterval(() => {
      if (displayDevice?.online && !isPaused) {
        setDurationCounter((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, session, displayDevice?.online, isPaused]);

  // Formatting seconds into HH:MM:SS
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, "0") : null,
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0")
    ].filter(Boolean).join(":");
  };

  if (loading && !device) {
    return (
      <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center items-center h-screen select-none bg-white">
        <Terminal className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <h4 className="font-bold text-slate-800">Resolving telemetry context...</h4>
        <p className="text-xs text-slate-500 mt-1">Connecting to WS stream endpoint</p>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center items-center h-screen select-none bg-white">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h4 className="font-extrabold text-slate-900">Telemetry Session Unresolved</h4>
        <p className="text-xs text-slate-500 mt-2 max-w-xs text-center">
          The requested device session ID could not be found or has expired.
        </p>
        <Link 
          to="/dashboard" 
          className="mt-6 px-4 py-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] rounded-lg text-xs font-bold hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:translate-x-0 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 min-w-0 p-6 lg:p-8 flex flex-col h-screen overflow-hidden"
    >
      {/* Navigation Header */}
      <div className="flex items-center gap-3 mb-6 select-none">
        <Link
          to="/dashboard"
          className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-800 hover:text-black shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:translate-x-0 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
          <Link to="/dashboard" className="hover:text-slate-855 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-855 truncate max-w-[150px]">{displayDevice?.name}</span>
        </div>
      </div>

      {/* Main content body (Layout scrollable container) */}
      <div className="flex-1 min-h-0 overflow-y-auto mac-scrollbar pr-1 space-y-6">
        
        {/* Device metadata report cards */}
        <DeviceMetadata device={displayDevice} session={session} />

        {/* Live Stream Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Terminal View - 3 Columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3.5 select-none">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                Live Logging Console Feed
              </h3>
              
              <div className="flex items-center gap-2.5">
                {displayDevice?.online && !isPaused && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-55 border border-emerald-250 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    STREAMING LIVE
                  </span>
                )}
                {isPaused && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-250">
                    PAUSED
                  </span>
                )}
              </div>
            </div>

            <LogViewer
              logs={logs}
              rawCount={rawLogCount}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedLevels={selectedLevels}
              toggleLevel={toggleLevel}
              clearLogs={clearLogs}
              triggerDemoLog={triggerDemoLog}
            />

            {/* Pagination Controls Footer */}
            <div className="flex items-center justify-between mt-4 bg-white border-2 border-slate-900 rounded-xl p-3 shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] select-none">
              <button
                type="button"
                onClick={prevPage}
                disabled={offset === 0}
                className="px-3.5 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-bold shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:translate-x-0 disabled:opacity-50 disabled:translate-y-0 disabled:translate-x-0 disabled:shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] cursor-pointer transition-all"
              >
                Previous Page
              </button>
              
              <span className="text-xs font-mono font-bold text-slate-700">
                Log Entries: {offset} – {offset + logs.length}
              </span>

              <button
                type="button"
                onClick={nextPage}
                disabled={!hasMore}
                className="px-3.5 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-bold shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:translate-x-0 disabled:opacity-50 disabled:translate-y-0 disabled:translate-x-0 disabled:shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] cursor-pointer transition-all"
              >
                Next Page
              </button>
            </div>
          </div>

          {/* Right Sidebar Session Diagnostics - 1 Column */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
              Session Diagnostics
            </h3>

            {/* Diagnostics Panel */}
            <div 
              style={{ 
                boxShadow: `4px 4px 0px 0px #0f172a`
              }}
              className="bg-white border-2 border-slate-900 rounded-2xl p-5 space-y-5 text-slate-800"
            >
              {/* Metric 1 */}
              <div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4 text-indigo-650 animate-pulse-slow" />
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Duration</span>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">
                  {formatDuration(durationCounter)}
                </p>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">Elapsed telemetry runtime</p>
              </div>

              {/* Metric 2 */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[8px] uppercase font-extrabold tracking-wider text-slate-400">Total Logs</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800 mt-1 font-mono">{rawLogCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[8px] uppercase font-extrabold tracking-wider text-slate-400">Errors</span>
                  </div>
                  <p className={`text-lg font-bold mt-1 font-mono ${displayDevice?.errorCount && displayDevice.errorCount > 0 ? "text-rose-650 font-black" : "text-slate-500"}`}>
                    {displayDevice?.errorCount || 0}
                  </p>
                </div>
              </div>

              {/* Metric 3 */}
              {session?.url && (
                <div className="border-t border-slate-200 pt-4 space-y-1.5 select-text">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-[8px] uppercase font-extrabold tracking-wider text-slate-400">Root Host URL</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-700 break-all leading-normal bg-slate-50 border-2 border-slate-900 p-2.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    {session.url}
                  </p>
                </div>
              )}

              {/* Metric 4 */}
              {session?.userAgent && (
                <div className="border-t border-slate-200 pt-4 space-y-1.5 select-text">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[8px] uppercase font-extrabold tracking-wider text-slate-400">User Agent</span>
                  </div>
                  <p className="text-[9.5px] font-mono text-slate-600 break-all leading-normal bg-slate-50 border-2 border-slate-900 p-2.5 rounded-lg max-h-28 overflow-y-auto mac-scrollbar shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    {session.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
