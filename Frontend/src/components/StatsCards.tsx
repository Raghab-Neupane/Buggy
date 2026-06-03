import React from "react";
import { motion } from "framer-motion";
import { Laptop, Terminal, AlertTriangle, Radio } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import type { DashboardStats } from "../hooks/useStats";

interface StatsCardsProps {
  stats: DashboardStats;
}

// Sparkline data
const generateSparklineData = (multiplier: number, noise: number) => {
  return Array.from({ length: 12 }, (_, i) => ({
    time: i,
    value: Math.floor(Math.sin(i / 1.5) * noise + multiplier + Math.random() * 5)
  }));
};

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cardData = [
    {
      title: "Total Devices",
      value: stats.totalDevices,
      description: "Registered host connections",
      icon: Laptop,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50 border-blue-200",
      shadowColor: "shadow-blue-500",
      offsetColor: "#3b82f6",
      sparkline: generateSparklineData(8, 2),
      sparklineColor: "#3b82f6"
    },
    {
      title: "Log Events",
      value: stats.totalLogs.toLocaleString(),
      description: "Aggregated events sent to SDK",
      icon: Terminal,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50 border-purple-200",
      shadowColor: "shadow-purple-500",
      offsetColor: "#8b5cf6",
      sparkline: generateSparklineData(40, 15),
      sparklineColor: "#8b5cf6"
    },
    {
      title: "Errors Today",
      value: stats.errorsToday,
      description: "Critical uncaught exceptions",
      icon: AlertTriangle,
      iconColor: stats.errorsToday > 0 ? "text-rose-600 animate-pulse-slow" : "text-slate-500",
      iconBg: stats.errorsToday > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200",
      shadowColor: stats.errorsToday > 0 ? "shadow-rose-500" : "shadow-slate-400",
      offsetColor: stats.errorsToday > 0 ? "#ef4444" : "#64748b",
      sparkline: generateSparklineData(stats.errorsToday > 0 ? 5 : 0, stats.errorsToday > 0 ? 2 : 0),
      sparklineColor: stats.errorsToday > 0 ? "#ef4444" : "#94a3b8"
    },
    {
      title: "Active Connections",
      value: `${stats.onlineDevices}/${stats.totalDevices}`,
      description: "Currently streaming metrics",
      icon: Radio,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-250",
      shadowColor: "shadow-emerald-500",
      offsetColor: "#10b981",
      sparkline: generateSparklineData(2, 0.5),
      sparklineColor: "#10b981"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            style={{ 
              boxShadow: `4px 4px 0px 0px #0f172a`
            }}
            className="bg-white border-2 border-slate-900 rounded-2xl p-5 relative overflow-hidden group hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_#0f172a] transition-all duration-200"
          >
            {/* Ambient Background Light Gradient Overlay */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl group-hover:bg-slate-100 transition-all duration-300" />
            
            <div className="flex items-start justify-between relative z-10 mb-3">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{card.value}</h3>
              </div>
              <div className={`p-2 rounded-xl border-2 border-slate-900 flex items-center justify-center ${card.iconBg}`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="flex items-end justify-between relative z-10 mt-2">
              <span className="text-[10px] text-slate-500 font-bold tracking-tight">{card.description}</span>
              {/* Mini Sparkline Chart */}
              <div className="w-16 h-8 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                <ResponsiveContainer width="100%" height={50}>
                  <AreaChart data={card.sparkline}>
                    <defs>
                      <linearGradient id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.sparklineColor} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={card.sparklineColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={card.sparklineColor}
                      strokeWidth={2}
                      fill={`url(#gradient-${idx})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
