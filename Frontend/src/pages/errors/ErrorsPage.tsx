import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { ShieldAlert, Users, RefreshCcw, AlertTriangle, Server, User } from "lucide-react";
import { fetchServerErrorSummaries, type ServerErrorSummary } from "../../services/errorService";

export const ErrorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<ServerErrorSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await fetchServerErrorSummaries();
      setSummaries(data);
      setError(null);
    } catch (err: any) {
      console.error("ErrorsPage: Failed to fetch summaries", err);
      setError("Failed to load server rankings. Please try again.");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  // Compute total server errors and sort summaries by total server errors descending
  const rankedSummaries = useMemo(() => {
    return summaries
      .map((summary) => {
        const totalErrors = summary.topErrorUsers.reduce((sum, u) => sum + u.errorCount, 0);
        const topUser = summary.topErrorUsers[0] || null;
        return {
          ...summary,
          totalErrors,
          topUser,
        };
      })
      .sort((a, b) => b.totalErrors - a.totalErrors);
  }, [summaries]);

  // Filter out servers that have zero errors for display purposes
  const errorServers = rankedSummaries.filter((s) => s.totalErrors > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto h-screen mac-scrollbar cartoon-net-bg"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
            Error Analytics
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Server ranking by error activity and affected clients.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => loadData(false)}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-900 text-xs text-slate-800 font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Rankings
        </button>
      </div>

      {loading ? (
        // Skeleton loader
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{ boxShadow: "4px 4px 0px 0px #0f172a" }}
              className="bg-white border-2 border-slate-900 rounded-2xl p-6 h-64 flex flex-col justify-between animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 border-2 border-slate-900" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-slate-100 border border-slate-200 rounded-xl" />
                <div className="h-12 bg-slate-100 border border-slate-200 rounded-xl" />
              </div>
              <div className="h-6 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="flex flex-col items-center justify-center py-16 bg-white border-2 border-slate-900 rounded-2xl p-8 max-w-lg mx-auto shadow-[4px_4px_0px_0px_#0f172a]">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
          <h3 className="font-bold text-slate-800">Connection Failed</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 text-center">{error}</p>
          <button
            onClick={() => loadData(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-extrabold shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] border-2 border-slate-900 hover:translate-y-[-1px] hover:translate-x-[-1px] active:translate-y-0 active:translate-x-0 cursor-pointer transition-all"
          >
            Retry Fetch
          </button>
        </div>
      ) : errorServers.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-24 bg-white border-2 border-slate-900 rounded-2xl p-8 max-w-lg mx-auto shadow-[4px_4px_0px_0px_#0f172a]">
          <Server className="w-12 h-12 text-slate-350 mb-3" />
          <h3 className="font-bold text-slate-800">No errors – all good to continue!</h3>
          <p className="text-xs text-slate-400 mt-1 text-center max-w-sm">
            There are currently no error logs. Everything looks fine.
          </p>
        </div>
      ) : (
        // Server Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {errorServers.map((summary) => (
            <motion.div
              key={summary.deviceId}
              whileTap={{ scale: 0.98 }}
              style={{ boxShadow: `4px 4px 0px 0px #0f172a` }}
              onClick={() => navigate(`/errors/${encodeURIComponent(summary.deviceId)}`)}
              className="bg-white border-2 border-slate-900 rounded-2xl p-6 relative group hover:translate-y-[-3px] hover:translate-x-[-3px] transition-all duration-200 cursor-pointer h-64 flex flex-col justify-between hover:shadow-[7px_7px_0px_0px_#ef4444]"
            >
              {/* Top Section */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-slate-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group-hover:scale-105 group-hover:rotate-2 transition-all duration-200">
                    🌐
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors break-all">
                      {summary.deviceId}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                      Target Host
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle metrics grid */}
              <div className="grid grid-cols-2 gap-4 my-4 select-none">
                <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">Affected Users</p>
                    <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{summary.topErrorUsers.length}</p>
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">Total Errors</p>
                    <p className="text-xs font-bold text-rose-600 font-mono mt-0.5">{summary.totalErrors}</p>
                  </div>
                </div>
              </div>

              {/* Bottom footer area */}
              <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between text-[10px] text-slate-500 font-bold select-none">
                <div className="flex items-center gap-1.5 truncate mr-3">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {summary.topUser ? (
                    <span className="truncate">
                      Top: <strong className="text-slate-800">{summary.topUser.userId}</strong> ({summary.topUser.errorCount} errs)
                    </span>
                  ) : (
                    <span>No active users</span>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 text-[9px] text-slate-700 font-extrabold px-2.5 py-1 rounded-md border border-slate-300 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] group-hover:bg-rose-500 group-hover:text-white group-hover:border-slate-900 transition-all duration-200 shrink-0">
                  <span>Investigate</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
