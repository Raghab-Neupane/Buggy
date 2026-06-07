import React from "react";

interface StatusBadgeProps {
  online: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ online, className = "" }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none border transition-all duration-300 ${
        online
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/5"
          : "bg-red-500/10 text-red-400 border-red-500/25 shadow-sm shadow-red-500/5"
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full relative flex`}
      >
        {online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            online ? "bg-emerald-400 glow-dot-active" : "bg-red-400"
          }`}
        ></span>
      </span>
      {online ? "Active" : "Offline"}
    </span>
  );
};
