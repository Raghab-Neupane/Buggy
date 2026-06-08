import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, ShieldAlert, Cpu, Settings, Activity, HelpCircle, LogOut, Copy, Check, Zap } from "lucide-react";
import type { Device } from "../types/device";
import { logout } from "../services/api";

interface SidebarProps {
  devices: Device[];
}

export const Sidebar: React.FC<SidebarProps> = ({ devices }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const userId = localStorage.getItem("userId") || "your_id";
  const initSnippet = `import { init } from 'npmpackagebuggy'

init({
  endpoint: "https://buggybackend.onrender.com/logs/${userId}"
});`;

  const handleCopy = () => {
    navigator.clipboard.writeText(initSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-68 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200 text-slate-800 p-4 select-none z-10">
      {/* macOS Window Controls */}
      <div className="flex items-center gap-1.5 px-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer" />
      </div>

      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 px-2 py-1 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-500 flex items-center justify-center shadow-md shadow-brand-500/10 border border-slate-900/10">
          <Cpu className="w-5 h-5 text-white animate-pulse-slow" />
        </div>
        <div>
          <span className="font-black text-base text-black tracking-tight flex items-center gap-1.5">
            Buggy <span className="text-[8px] bg-brand-500/10 text-brand-700 px-1.5 py-0.5 rounded-full font-black border border-brand-500/20">SDK</span>
          </span>
          <p className="text-[9px] text-slate-500 font-extrabold tracking-wide">Real-time Diagnostics</p>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="mb-5">
        <div className="p-2 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
            <span className="text-xs font-black text-slate-900">Workspace: Main Dev</span>
          </div>
          <span className="text-[9px] text-slate-500 font-black bg-slate-100 border border-slate-300 px-1.5 py-0.25 rounded">⌘1</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="space-y-1.5 mb-6">
        <p className="px-2 text-[9px] uppercase font-black text-slate-400 tracking-wider mb-2">Overview</p>
        
        {/* Dashboard Link */}
        <Link to="/dashboard">
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold relative transition-all duration-150 ${
              location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/")
                ? "text-black bg-slate-50 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] font-black"
                : "text-slate-600 hover:text-black hover:bg-slate-100 border border-transparent"
            }`}
          >
            {(location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/")) && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute left-0 w-1 h-4 bg-brand-500 rounded-r-md"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/") ? "text-brand-600 font-black" : "text-slate-400"}`} />
              <span>Dashboard</span>
            </div>
          </div>
        </Link>

        {/* Errors Subsection with only erroring devices */}
        <div className="pt-3">
          <p className="px-2 text-[9px] uppercase font-black text-slate-400 tracking-wider mb-2">Errors</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 mac-scrollbar">
            {devices.filter((d) => d.errorCount > 0).map((device) => {
              const isSelected = location.pathname === `/device/${device.id}`;
              return (
                <Link key={device.id} to={`/device/${device.id}`}>
                  <div
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold relative transition-all duration-150 ${
                      isSelected
                        ? "text-black bg-slate-50 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] font-black"
                        : "text-slate-600 hover:text-black hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute left-0 w-1 h-4 bg-brand-500 rounded-r-md"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2 truncate">
                      <ShieldAlert className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-rose-600" : "text-slate-400"}`} />
                      <span className="truncate font-semibold">{device.name}</span>
                    </div>
                    <span className="text-[8.5px] bg-rose-100 text-rose-700 border border-rose-350 rounded font-black px-1.5 flex-shrink-0">
                      {device.errorCount}
                    </span>
                  </div>
                </Link>
              );
            })}
            {devices.filter((d) => d.errorCount > 0).length === 0 && (
              <div className="text-[10px] text-slate-400 text-center py-2 italic font-semibold">
                No active errors
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Active Streams Panel */}
      <div className="flex-1 min-h-0 flex flex-col mb-5">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Active Channels</span>
        </div>

        <div className="flex-1 overflow-y-auto mac-scrollbar pr-1 space-y-1.5">
          {devices.map((device) => {
            const isSelected = location.pathname === `/device/${device.id}`;
            return (
              <Link key={device.id} to={`/device/${device.id}`}>
                <div
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] group transition-all duration-150 border-2 ${isSelected
                    ? "bg-brand-50 text-brand-700 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] font-black"
                    : "hover:bg-slate-50 text-slate-600 hover:text-black border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs group-hover:scale-105 transition-transform">
                      {device.os?.toLowerCase() === "macos" ? "💻" : device.os?.toLowerCase() === "ios" ? "📱" : device.os?.toLowerCase() === "android" ? "🤖" : device.os?.toLowerCase() === "windows" ? "🪟" : "🌐"}
                    </span>
                    <span className="truncate font-semibold">{device.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {devices.length === 0 && (
            <div className="text-[10px] text-slate-400 text-center py-4">
              No active hosts
            </div>
          )}
        </div>
      </div>

      {/* 🟡 YOUR API — Compact Yellow Game Box */}
      <div className="mb-4 px-1">
        <div
          className="relative rounded-xl border-[3px] border-slate-900 px-3 py-2.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] group cursor-pointer"
          style={{ background: "linear-gradient(135deg, #fef08a 0%, #fde047 50%, #facc15 100%)" }}
          onClick={handleCopy}
          title="Click to copy"
        >
          {/* Label */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-800" />
              <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Your API</span>
            </div>
            <div className="p-0.5 rounded bg-amber-800/20 text-amber-800 group-hover:bg-amber-800 group-hover:text-white transition-all">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </div>
          </div>

          {/* Link highlight */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
            <span className="text-[10px] font-mono font-black text-slate-900 break-all select-all">
              https://buggybackend.onrender.com/sdk/logs/{userId}
            </span>
          </div>

          {/* Decorative dots */}
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900" />
          <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 rounded-full bg-yellow-300 border-2 border-slate-900" />
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="pt-3 border-t border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-[9px] text-slate-500 px-1 font-bold">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Operational
          </span>
          <span>v1.0.0</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button onClick={async () => {
            await logout();
            navigate('/login');
          }} className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
