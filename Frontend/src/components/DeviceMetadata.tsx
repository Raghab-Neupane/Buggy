import React from "react";
import type { Device } from "../types/device";
import type { SessionInfo } from "../types/log";
import { Cpu, Globe, Compass, Key } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface DeviceMetadataProps {
  device: Device | null;
  session: SessionInfo | null;
}

export const DeviceMetadata: React.FC<DeviceMetadataProps> = ({ device, session }) => {
  if (!device) return null;

  return (
    <div
      style={{
        boxShadow: `4px 4px 0px 0px #0f172a`
      }}
      className="bg-white border-2 border-slate-900 rounded-2xl p-6 mb-6 relative overflow-hidden transition-all duration-200"
    >
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 select-none">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-slate-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            {device.os?.toLowerCase() === "macos" ? "💻" : device.os?.toLowerCase() === "ios" ? "📱" : device.os?.toLowerCase() === "android" ? "🤖" : device.os?.toLowerCase() === "windows" ? "🪟" : "🌐"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{device.name}</h2>
              <StatusBadge online={device.online} />
            </div>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
              Host Platform Diagnostics Report
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">Last Active Connection</span>
            <span className="text-slate-700 mt-0.5">{device.lastSeen === "Just now" ? "Active Now" : device.lastSeen}</span>
          </div>
        </div>
      </div>

      {/* Spec Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-5 select-none">
        {/* Specification 1 */}
        <div className="flex items-start gap-3 bg-slate-50 border-2 border-slate-900 rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[8px] text-slate-450 font-extrabold uppercase tracking-wider block">Environment Details</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
              {device.browser} {session?.browserVersion ? `v${session.browserVersion}` : ""}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold truncate">{device.os} System Platform</p>
          </div>
        </div>

        {/* Specification 2 */}
        <div className="flex items-start gap-3 bg-slate-50 border-2 border-slate-900 rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-250 mt-0.5">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[8px] text-slate-450 font-extrabold uppercase tracking-wider block">Client Geolocation</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
              {session?.city && session?.city !== "Unknown" ? `${session.city}, ` : ""}
              {session?.country || "Local Connection"}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold truncate">Resolving Client IP Address</p>
          </div>
        </div>

        {/* Specification 3 */}
        <div className="flex items-start gap-3 bg-slate-50 border-2 border-slate-900 rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 mt-0.5">
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[8px] text-slate-450 font-extrabold uppercase tracking-wider block">Device Key Id</span>
            <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate select-text">
              {device.id}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold truncate">Unique Session Token</p>
          </div>
        </div>

        {/* Specification 4 */}
        <div className="flex items-start gap-3 bg-slate-50 border-2 border-slate-900 rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 mt-0.5">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[8px] text-slate-450 font-extrabold uppercase tracking-wider block">Telemetry Stream</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
              {device.online ? "WS Tunnel Active" : "Stream Suspended"}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold truncate">
              {device.online ? "Receiving live events" : "Historical logging context"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
