import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Scroll, 
  Terminal,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Card } from './card';
import { motion, AnimatePresence } from 'framer-motion';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  service: string;
  environment: string;
  message: string;
}

interface LiveLogsProps {
  globalSearchQuery: string;
  currentProject: string;
  currentEnv: string;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

export const LiveLogs: React.FC<LiveLogsProps> = ({
  globalSearchQuery,
  currentProject,
  currentEnv,
  logs,
  setLogs,
  isPaused,
  setIsPaused,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [timeRange, setTimeRange] = useState('realtime');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Sync scroll to bottom if auto-scroll is enabled
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Combine global search with local log search
  const activeSearchQuery = globalSearchQuery || localSearch;

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Project filter (from header)
    if (currentProject !== 'all' && log.service !== currentProject) return false;
    
    // Environment filter (from header)
    if (currentEnv.toLowerCase() !== log.environment.toLowerCase()) return false;
    
    // Service filter (local)
    if (selectedService !== 'all' && log.service !== selectedService) return false;
    
    // Log level filter (local)
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    
    // Search filter
    if (activeSearchQuery) {
      const q = activeSearchQuery.toLowerCase();
      const matchText = `${log.timestamp} ${log.level} ${log.service} ${log.message}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    
    return true;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const text = filteredLogs.map(log => 
      `${log.timestamp} [${log.level}] [${log.service.toUpperCase()}] [${log.environment.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `antigravity_logs_${currentEnv.toLowerCase()}_${new Date().toISOString().split('T')[0]}.log`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO':
        return {
          text: 'text-brand-primary',
          bg: 'bg-brand-primary/10 border-brand-primary/20',
          dot: 'bg-brand-primary',
          badgeText: 'text-blue-400'
        };
      case 'SUCCESS':
        return {
          text: 'text-brand-success',
          bg: 'bg-brand-success/10 border-brand-success/20',
          dot: 'bg-brand-success',
          badgeText: 'text-emerald-400'
        };
      case 'WARNING':
        return {
          text: 'text-brand-warning',
          bg: 'bg-brand-warning/10 border-brand-warning/20',
          dot: 'bg-brand-warning',
          badgeText: 'text-amber-400'
        };
      case 'ERROR':
        return {
          text: 'text-brand-danger',
          bg: 'bg-brand-danger/10 border-brand-danger/20',
          dot: 'bg-brand-danger',
          badgeText: 'text-rose-400'
        };
      case 'CRITICAL':
        return {
          text: 'text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/20',
          dot: 'bg-purple-500',
          badgeText: 'text-purple-400'
        };
    }
  };

  const microservices = [
    { id: 'all', name: 'All Services' },
    { id: 'auth-service', name: 'auth-service' },
    { id: 'payment-service', name: 'payment-service' },
    { id: 'database-service', name: 'database-service' },
    { id: 'deployment-service', name: 'deployment-service' },
    { id: 'api-gateway', name: 'api-gateway' }
  ];

  const levels = [
    { id: 'all', name: 'All Levels' },
    { id: 'INFO', name: 'INFO' },
    { id: 'SUCCESS', name: 'SUCCESS' },
    { id: 'WARNING', name: 'WARNING' },
    { id: 'ERROR', name: 'ERROR' },
    { id: 'CRITICAL', name: 'CRITICAL' }
  ];

  return (
    <Card className="h-[calc(100vh-140px)] flex flex-col p-0 overflow-hidden" hoverEffect={false}>
      {/* Console Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-brand-border/60 bg-brand-card/50 space-y-3 md:space-y-0">
        
        {/* Left side: Terminal title & streaming pulse */}
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5 px-2">
            <span className="h-3.5 w-3.5 rounded-full bg-rose-500/80 border border-rose-600/40" />
            <span className="h-3.5 w-3.5 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
          </div>
          <div className="h-4 w-px bg-brand-border/60" />
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-brand-primary" />
            <span className="font-semibold text-sm tracking-wide">Live Application Logs</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-brand-success/10 border border-brand-success/20 text-[10px] font-bold text-brand-success tracking-widest uppercase">
            {!isPaused ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-success animate-ping" />
                <span>LIVE</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-warning" />
                <span className="text-brand-warning">PAUSED</span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Control buttons */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2 md:gap-y-0">
          {/* Pause / Play stream */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              isPaused 
                ? 'bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border-brand-primary/30' 
                : 'bg-brand-border/40 hover:bg-brand-border/60 text-brand-muted hover:text-white border-brand-border/80'
            }`}
            title={isPaused ? "Resume Live Stream" : "Pause Live Stream"}
          >
            {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          {/* Auto Scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              autoScroll 
                ? 'bg-brand-success/10 hover:bg-brand-success/20 text-brand-success border-brand-success/30' 
                : 'bg-brand-border/40 hover:bg-brand-border/60 text-brand-muted hover:text-white border-brand-border/80'
            }`}
            title="Auto scroll to bottom"
          >
            <Scroll className="h-3.5 w-3.5" />
            <span>Scroll</span>
            {autoScroll && <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />}
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              showFilters 
                ? 'bg-brand-primary/15 border-brand-primary/40 text-brand-primary' 
                : 'bg-brand-card hover:bg-brand-border/40 text-brand-muted hover:text-white border-brand-border/80'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
          </button>

          <div className="h-6 w-px bg-brand-border/60" />

          {/* Export logs */}
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-card hover:bg-brand-border/40 border border-brand-border/80 hover:border-brand-border text-brand-muted hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            title="Export current logs as file"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          {/* Clear console logs */}
          <button
            onClick={clearLogs}
            className="p-1.5 bg-brand-card hover:bg-brand-danger/10 hover:border-brand-danger/30 hover:text-brand-danger border border-brand-border/80 rounded-xl text-brand-muted transition-all duration-200"
            title="Clear live console"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-brand-card/30 border-b border-brand-border/50 px-5 py-3.5 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Local Search inside console */}
              <div>
                <label className="block text-[10px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Filter Text</label>
                <input
                  type="text"
                  placeholder="e.g. timeout, authenticated..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border/60 focus:border-brand-primary rounded-xl px-3 py-1.5 text-xs text-white placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                />
              </div>

              {/* Service local filter */}
              <div>
                <label className="block text-[10px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Service</label>
                <div className="relative">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border/60 hover:border-brand-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
                  >
                    {microservices.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted pointer-events-none" />
                </div>
              </div>

              {/* Log Level select */}
              <div>
                <label className="block text-[10px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Log Level</label>
                <div className="relative">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border/60 hover:border-brand-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
                  >
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted pointer-events-none" />
                </div>
              </div>

              {/* Time Range Selector */}
              <div>
                <label className="block text-[10px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Time Window</label>
                <div className="relative">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border/60 hover:border-brand-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
                  >
                    <option value="realtime">Real-time Stream</option>
                    <option value="15m">Last 15 minutes</option>
                    <option value="1h">Last 1 hour</option>
                    <option value="24h">Last 24 hours</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal logs viewport */}
      <div 
        ref={terminalBodyRef}
        className="flex-1 overflow-y-auto p-5 font-mono-logs text-xs bg-[#050814]/95 text-brand-text leading-relaxed select-text space-y-2 border-t border-brand-border/40"
      >
        {filteredLogs.length === 0 ? (
          /* Empty / Skeleton Loading State */
          <div className="h-full flex flex-col items-center justify-center space-y-4 py-12 text-center">
            <div className="h-10 w-10 rounded-xl bg-brand-border/40 flex items-center justify-center text-brand-muted">
              <Scroll className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-text">No Matching Logs Found</p>
              <p className="text-xs text-brand-muted max-w-xs mx-auto mt-1">
                {activeSearchQuery 
                  ? `No entries match "${activeSearchQuery}". Clear search or adjust log filter parameters.` 
                  : "Streaming logs will appear here as services dispatch activities."}
              </p>
            </div>
            
            {/* Skeleton lines to look premium */}
            <div className="w-full max-w-lg space-y-2.5 pt-4 opacity-30 select-none">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-16 bg-brand-border rounded" />
                <span className="h-3.5 w-12 bg-brand-border rounded-md" />
                <span className="h-3 w-24 bg-brand-border rounded" />
                <span className="h-3 w-40 bg-brand-border rounded flex-1" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-3 w-16 bg-brand-border rounded" />
                <span className="h-3.5 w-12 bg-brand-border rounded-md" />
                <span className="h-3 w-20 bg-brand-border rounded" />
                <span className="h-3 w-56 bg-brand-border rounded flex-1" />
              </div>
            </div>
          </div>
        ) : (
          /* Log entries list with micro-animations */
          <div className="space-y-1.5">
            {filteredLogs.map((log) => {
              const levelStyle = getLevelColor(log.level);
              return (
                <div 
                  key={log.id} 
                  className="flex items-start space-x-2.5 py-0.5 hover:bg-white/[0.03] px-2 -mx-2 rounded transition-colors group cursor-text"
                >
                  {/* Timestamp */}
                  <span className="text-brand-muted/70 group-hover:text-brand-muted select-none flex-shrink-0">
                    {log.timestamp}
                  </span>

                  {/* Level Badge */}
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold border rounded-md uppercase tracking-wider flex-shrink-0 flex items-center space-x-1 ${levelStyle.bg} ${levelStyle.text}`}>
                    <span className={`h-1 w-1 rounded-full ${levelStyle.dot}`} />
                    <span>{log.level}</span>
                  </span>

                  {/* Service Badge */}
                  <span className="px-1.5 py-0.5 bg-brand-card/90 border border-brand-border/60 rounded-md text-[9px] font-bold text-brand-muted group-hover:text-white transition-colors uppercase tracking-wider flex-shrink-0 select-none">
                    {log.service}
                  </span>

                  {/* Env Badge */}
                  <span className="px-1.5 py-0.5 bg-brand-bg/95 border border-brand-border/40 rounded-md text-[9px] font-bold text-brand-muted/50 select-none">
                    {log.environment}
                  </span>

                  {/* Message content */}
                  <span className="text-white/90 break-all select-text font-normal flex-1">
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

      {/* Terminal Stats Footer */}
      <div className="px-5 py-2.5 bg-[#050814] border-t border-brand-border/40 flex items-center justify-between text-[10px] text-brand-muted font-mono select-none">
        <div className="flex items-center space-x-4">
          <span>CONSOLE LEVEL: <strong className="text-white">v1.4.2</strong></span>
          <span className="hidden sm:inline-block h-3 w-px bg-brand-border/40" />
          <span className="hidden sm:inline-block">BUFFER: <strong className="text-white">{filteredLogs.length} / {logs.length}</strong> lines matched</span>
        </div>
        <div>
          <span>ENV: <strong className="text-brand-primary uppercase">{currentEnv}</strong></span>
        </div>
      </div>
    </Card>
  );
};
