import React, { useEffect, useRef, useState } from "react";
import type { LogEvent } from "../types/log";
import { LogEntry } from "./LogEntry";
import { Search, Trash2, Play, Pause, ArrowDown, Sparkles, Terminal } from "lucide-react";

interface LogViewerProps {
  logs: LogEvent[];
  rawCount: number;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLevels: string[];
  toggleLevel: (level: string) => void;
  clearLogs: () => void;
  triggerDemoLog: (level: "info" | "warn" | "error" | "debug", msg?: string) => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  rawCount,
  isPaused,
  setIsPaused,
  searchQuery,
  setSearchQuery,
  selectedLevels,
  toggleLevel,
  clearLogs,
  triggerDemoLog
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Custom manual message state
  const [manualMsg, setManualMsg] = useState("");
  const [manualLevel, setManualLevel] = useState<"info" | "warn" | "error" | "debug">("info");

  // Auto scroll effect
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Handle manual scroll detection to disable auto scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    setAutoScroll(isAtBottom);
  };

  const handleManualTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMsg.trim()) return;
    triggerDemoLog(manualLevel, manualMsg.trim());
    setManualMsg("");
  };

  return (
    <div 
      style={{ 
        boxShadow: `4px 4px 0px 0px #0f172a`
      }}
      className="flex flex-col flex-1 h-[calc(100vh-220px)] border-2 border-slate-900 rounded-2xl overflow-hidden bg-white relative transition-all duration-200"
    >
      {/* Terminal Title Bar (macOS inspired - Light Theme) */}
      <div className="bg-slate-100 border-b-2 border-slate-900 px-4 py-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-1.5 text-slate-800 font-mono text-[11px] font-bold">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>buggy-console@stream: ~/logs</span>
            <span className="text-[10px] text-slate-450 font-bold font-sans">({rawCount} events)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Pause */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2 py-1 rounded-lg border-2 border-slate-900 text-[10px] font-extrabold flex items-center gap-1.5 transition-all shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:translate-x-0 active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer ${
              isPaused
                ? "bg-amber-100 text-amber-700 border-slate-900"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={clearLogs}
            className="p-1 rounded-lg border-2 border-slate-900 bg-slate-50 text-slate-600 hover:bg-rose-100 hover:text-rose-600 hover:shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] active:translate-y-0 active:translate-x-0 cursor-pointer transition-all"
            title="Clear Console Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Filters Bar (Raycast inspired - Light Theme) */}
      <div className="bg-slate-50 border-b-2 border-slate-900 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
        
        {/* Level Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-extrabold">
          <span className="text-slate-400 uppercase mr-1 tracking-wider">Levels:</span>
          {["info", "warn", "error", "debug"].map((level) => {
            const isSelected = selectedLevels.includes(level);
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-2 py-1 rounded border-2 border-slate-900 uppercase transition-all shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:translate-x-0 active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer ${
                  isSelected
                    ? level === "error"
                      ? "bg-red-500 text-white font-black translate-y-[-1px] translate-x-[-1px] shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)]"
                      : level === "warn"
                      ? "bg-amber-400 text-slate-950 font-black translate-y-[-1px] translate-x-[-1px] shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)]"
                      : level === "debug"
                      ? "bg-slate-700 text-white font-black translate-y-[-1px] translate-x-[-1px] shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)]"
                      : "bg-blue-500 text-white font-black translate-y-[-1px] translate-x-[-1px] shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)]"
                    : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search query logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-slate-900 rounded-lg py-1 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* Terminal Rows Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-[11px] bg-white mac-scrollbar"
      >
        {logs.length > 0 ? (
          <div className="py-2">
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-450 py-16 px-4">
            <Terminal className="w-8 h-8 text-slate-300 mb-2 animate-pulse-slow" />
            <p className="font-bold text-xs text-slate-700">Awaiting stream logs...</p>
            <p className="text-[10px] text-slate-400 mt-1 text-center max-w-xs">
              {searchQuery || selectedLevels.length > 0
                ? "No logs match current search filters."
                : "Initialize connection or push events to stream content."}
            </p>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Auto Scroll Indicator Sticky Overlay */}
      {!autoScroll && logs.length > 0 && (
        <button
          onClick={() => setAutoScroll(true)}
          className="absolute bottom-16 right-6 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white rounded-xl text-[9px] font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1 cursor-pointer transition-all animate-bounce"
        >
          <ArrowDown className="w-3 h-3" />
          <span>SCROLL TO BOTTOM</span>
        </button>
      )}

      {/* Interactive Trigger Panel (Demo Injector Footer - Light) */}
      <div className="bg-slate-50 border-t-2 border-slate-900 p-3 select-none">
        <form onSubmit={handleManualTrigger} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1 px-1.5 py-1 text-[9px] font-extrabold text-brand-700 bg-brand-50 border border-brand-200 rounded-md shrink-0">
            <Sparkles className="w-3 h-3 text-brand-500" />
            <span>DEMO INJECTOR</span>
          </div>

          <div className="flex items-center gap-0.5 border-2 border-slate-900 rounded-lg bg-white overflow-hidden shrink-0">
            {(["info", "warn", "error", "debug"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setManualLevel(level)}
                className={`px-2 py-1 text-[9px] uppercase font-bold transition-all cursor-pointer ${
                  manualLevel === level
                    ? level === "error"
                      ? "bg-red-500 text-white"
                      : manualLevel === "warn"
                      ? "bg-amber-400 text-slate-950"
                      : manualLevel === "debug"
                      ? "bg-slate-700 text-white"
                      : "bg-blue-500 text-white"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Type custom log message and press Enter..."
            value={manualMsg}
            onChange={(e) => setManualMsg(e.target.value)}
            className="flex-1 bg-white border-2 border-slate-900 rounded-lg py-1 px-3 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-all font-mono shadow-inner"
          />

          <button
            type="submit"
            className="w-full sm:w-auto px-3.5 py-1.5 bg-brand-500 text-white rounded-lg text-[10px] font-extrabold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] border-2 border-slate-900 hover:translate-y-[-1px] hover:translate-x-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0 active:translate-x-0 cursor-pointer shrink-0 transition-all"
          >
            INJECT EVENT
          </button>
        </form>
      </div>
    </div>
  );
};
