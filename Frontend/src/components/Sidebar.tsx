import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, ShieldAlert, Cpu, Settings, Terminal, Activity, HelpCircle } from "lucide-react";
import type { Device } from "../types/device";

interface SidebarProps {
  devices: Device[];
}

export const Sidebar: React.FC<SidebarProps> = ({ devices }) => {
  const location = useLocation();
  const onlineDevices = devices.filter(d => d.online);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/errors", label: "Errors", icon: ShieldAlert, count: devices.reduce((sum, d) => sum + d.errorCount, 0) },
    { path: "/console", label: "System Console", icon: Terminal },
  ];

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
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname.startsWith("/device/"));
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path === "/dashboard" ? "/dashboard" : "#"}>
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold relative transition-all duration-150 ${
                  isActive
                    ? "text-black bg-slate-50 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] font-black"
                    : "text-slate-600 hover:text-black hover:bg-slate-100 border border-transparent"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-4 bg-brand-500 rounded-r-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-600 font-black" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="bg-rose-100 text-rose-700 border border-rose-300 text-[9px] font-black px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Active Streams Panel */}
      <div className="flex-1 min-h-0 flex flex-col mb-5">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Active Channels</span>
          <span className="flex items-center gap-1 text-[9px] text-emerald-700 font-black bg-emerald-50 border border-emerald-350 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {onlineDevices.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto mac-scrollbar pr-1 space-y-1.5">
          {devices.map((device) => {
            const isSelected = location.pathname === `/device/${device.id}`;
            return (
              <Link key={device.id} to={`/device/${device.id}`}>
                <div
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] group transition-all duration-150 border-2 ${
                    isSelected
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
                  
                  <div className="flex items-center gap-1.5">
                    {device.errorCount > 0 && (
                      <span className="text-[8px] bg-red-100 text-red-700 border border-red-300 rounded font-black px-1 scale-90">
                        {device.errorCount}
                      </span>
                    )}
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        device.online
                          ? "bg-emerald-500 glow-dot-active"
                          : "bg-slate-300"
                      }`}
                    />
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
        </div>
      </div>
    </aside>
  );
};
