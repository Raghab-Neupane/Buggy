import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Terminal, ShieldAlert, Clock } from "lucide-react";
import type { Device } from "../types/device";
import { StatusBadge } from "./StatusBadge";

interface DeviceCardProps {
  device: Device;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  // Mapping device types to cartoonish/emoji icons
  const getDeviceIcon = (os?: string) => {
    const platform = (os || "").toLowerCase();
    if (platform === "macos") return "💻";
    if (platform === "ios" || platform === "iphone") return "📱";
    if (platform === "windows") return "🪟";
    if (platform === "android") return "🤖";
    return "🌐";
  };

  const deviceIcon = getDeviceIcon(device.os);

  // Offset shadow color based on whether errors are present
  const getShadowColor = () => {
    if (device.errorCount > 0) return "hover:shadow-[7px_7px_0px_0px_#ef4444]"; // Red shadow
    return "hover:shadow-[7px_7px_0px_0px_#7c3aed]"; // Violet shadow
  };

  return (
    <Link to={`/device/${device.id}`} className="block">
      <motion.div
        whileTap={{ scale: 0.98 }}
        style={{
          boxShadow: `4px 4px 0px 0px #0f172a`
        }}
        className={`bg-white border-2 border-slate-900 rounded-2xl p-6 relative group hover:translate-y-[-3px] hover:translate-x-[-3px] transition-all duration-200 cursor-pointer h-64 flex flex-col justify-between ${getShadowColor()}`}
      >
        {/* Status Badge */}
        <StatusBadge online={device.online} className="absolute top-3 right-3 z-10" />

        {/* Top Header Section */}
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Cartoonish App Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-slate-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] group-hover:scale-105 group-hover:rotate-2 transition-all duration-200">
                {deviceIcon}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 tracking-tight group-hover:text-brand-600 transition-colors">
                  {device.url}
                </h4>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                  {device.browser} • {device.os}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Stats Section (Cartoon sub-cards) */}
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">Logs</p>
                <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">{device.logCount}</p>
              </div>
            </div>

            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className={`p-1.5 rounded-lg border ${device.errorCount > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">Errors</p>
                <p className={`text-xs font-bold font-mono mt-0.5 ${device.errorCount > 0 ? "text-red-600" : "text-slate-500"}`}>
                  {device.errorCount}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Section */}
          <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Seen: {device.lastSeen}</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 text-[9px] text-slate-700 font-extrabold px-2 py-1 rounded-md border border-slate-300 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] group-hover:bg-brand-500 group-hover:text-white group-hover:border-slate-900 transition-all duration-200">
              <span>View Logs</span>
            </div>
          </div>
        </motion.div>
    </Link>
  );
};
