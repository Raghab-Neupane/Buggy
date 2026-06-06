import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Info, Bug, ShieldAlert, Globe } from "lucide-react";
import type { LogEvent } from "../types/log";

interface LogEntryProps {
  log: LogEvent;
}

export const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Formatting timestamp (e.g., 14:02:45.312)
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const hrs = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      const secs = String(d.getSeconds()).padStart(2, "0");
      const ms = String(d.getMilliseconds()).padStart(3, "0");
      return `${hrs}:${mins}:${secs}.${ms}`;
    } catch {
      return "00:00:00.000";
    }
  };

  // Styles for log levels - Light Theme
  const getLevelMeta = (level: "info" | "warn" | "error" | "debug") => {
    switch (level.toLowerCase()) {
      case "error":
        return {
          icon: AlertCircle,
          badgeClass: "bg-red-100 text-red-700 border-red-300",
          textClass: "text-red-650 font-bold",
          bgClass: "hover:bg-red-50/50 bg-red-50/30 border-red-100",
          label: "ERROR"
        };
      case "warn":
        return {
          icon: AlertTriangle,
          badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
          textClass: "text-amber-900 font-semibold",
          bgClass: "hover:bg-amber-50/50 bg-amber-50/20 border-amber-100",
          label: "WARN"
        };
      case "debug":
        return {
          icon: Bug,
          badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
          textClass: "text-slate-500 font-mono",
          bgClass: "hover:bg-slate-100/30",
          label: "DEBUG"
        };
      default: // info
        return {
          icon: Info,
          badgeClass: "bg-blue-100 text-blue-750 border-blue-300",
          textClass: "text-slate-800",
          bgClass: "hover:bg-blue-50/30",
          label: "INFO"
        };
    }
  };

  const levelMeta = getLevelMeta(log.level);
  const LevelIcon = levelMeta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`border-b border-slate-100 select-text ${levelMeta.bgClass} transition-colors duration-150`}
    >
      {/* Row Header */}
      <div
        className="flex items-center gap-3 px-4 py-2 cursor-pointer font-mono text-[11px] select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1.5 text-slate-450 min-w-[95px]">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          <span>{formatTime(log.timestamp)}</span>
        </div>

        {/* Badge */}
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-black border ${levelMeta.badgeClass} min-w-[62px] justify-center tracking-wide`}>
          <LevelIcon className="w-2.5 h-2.5 shrink-0" />
          <span>{levelMeta.label}</span>
        </span>

        {/* Message */}
        <span className={`truncate flex-1 pr-4 ${levelMeta.textClass}`}>
          {log.message}
        </span>

        {/* URL Indicator */}
        {log.url && (
          <span className="hidden md:inline text-[9.5px] text-slate-500 truncate max-w-[140px] border border-slate-200 bg-slate-50 rounded px-1.5 py-0.25 font-sans font-bold">
            {log.url.replace(/^https?:\/\/[^/]+/, "") || "/"}
          </span>
        )}
      </div>

      {/* Row Metadata Collapse */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden bg-slate-50/60 border-t border-slate-200 font-mono text-[11px]"
          >
            <div className="p-4 space-y-4 text-slate-700">

              {/* Stack Trace if available */}
              {log.stackTrace && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-red-650 font-black flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    Stack Exception Backtrace
                  </span>
                  <pre className="bg-red-50 border-2 border-slate-900 p-3 rounded-lg overflow-x-auto text-[10px] text-red-800 leading-relaxed font-mono select-text max-h-60 mac-scrollbar shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    {log.stackTrace}
                  </pre>
                </div>
              )}

              {/* Grid properties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[10px] bg-white border-2 border-slate-900 p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-extrabold">Log ID</span>
                  <span className="text-slate-800 select-all font-semibold">{log.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-extrabold">Device ID</span>
                  <span className="text-slate-800 select-all font-semibold">{log.deviceid}</span>
                </div>
                {log.url && (
                  <div className="flex justify-between py-1 border-b border-slate-100 col-span-2">
                    <span className="text-slate-400 font-extrabold pr-4">Resolved Page URL</span>
                    <span className="text-brand-600 select-all truncate font-semibold">{log.url}</span>
                  </div>
                )}
                {log.deviceName && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-extrabold">Device Name</span>
                    <span className="text-slate-800 font-semibold">{log.deviceName}</span>
                  </div>
                )}
                {log.os && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 font-extrabold">Operating System</span>
                    <span className="text-slate-800 font-semibold">{log.os}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-extrabold">Browser</span>
                  <span className="text-slate-800 font-semibold">{log.browser || "Unknown"} {log.browserVersion ? `v${log.browserVersion}` : ""}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-extrabold">Geolocation</span>
                  <span className="text-slate-800 flex items-center gap-1 font-semibold">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {log.latitude !== undefined && log.longitude !== undefined && log.latitude !== null && log.longitude !== null 
                      ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`
                      : "Local Network"}
                  </span>
                </div>
                {/* Address */}
                {log.location?.href && (
                  <div className="flex justify-between py-1 border-b border-slate-100 col-span-2">
                    <span className="text-slate-400 font-extrabold">Address</span>
                    <span className="text-slate-650 font-semibold break-all">{log.location.href}</span>
                  </div>
                )}
                {/* Session Started At */}
                {log.sessionStartedAt && (
                  <div className="flex justify-between py-1 border-b border-slate-100 col-span-2">
                    <span className="text-slate-400 font-extrabold">Session Started At</span>
                    <span className="text-slate-650 font-semibold">{new Date(log.sessionStartedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
