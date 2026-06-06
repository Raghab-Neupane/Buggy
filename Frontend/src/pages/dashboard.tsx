import React from "react";
import { motion } from "framer-motion";
import { useDevices } from "../hooks/useDevices";
import { StatsCards } from "../components/StatsCards";
import { DeviceGrid } from "../components/DeviceGrid";
import { LayoutGrid, RefreshCcw, User } from "lucide-react";

import { useParams } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const currentUserId = userId || localStorage.getItem("userId") || "";
  const { devices, loading, refetch, stats } = useDevices(currentUserId || undefined);

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
            <LayoutGrid className="w-6 h-6 text-brand-500" />
            Device Directory
            {currentUserId && (
              <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-xs font-black text-brand-700">
                <User className="w-3.5 h-3.5" />
                {currentUserId}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Registered devices, application clients, and browser host telemetry.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-900 text-xs text-slate-800 font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Registry
        </button>
      </div>

      {/* Statistics aggregates cards */}
      <StatsCards stats={stats} />

      {/* Devices grid section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 select-none">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Connected System Logs ({devices.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-bold bg-white border-2 border-slate-900 rounded px-2 py-0.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
            Auto-refresh: 10s
          </span>
        </div>
        
        <DeviceGrid devices={devices} loading={loading} />
      </div>
    </motion.div>
  );
};