import React from "react";
import { motion } from "framer-motion";
import type { Device } from "../types/device";
import { DeviceCard } from "./DeviceCard";
import { Cpu } from "lucide-react";

interface DeviceGridProps {
  devices: Device[];
  loading: boolean;
}

export const DeviceGrid: React.FC<DeviceGridProps> = ({ devices, loading }) => {
  // Framer motion grid animation settings
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] rounded-2xl p-6 h-64 flex flex-col justify-between animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-100 rounded-xl border border-slate-200" />
              <div className="h-10 bg-slate-100 rounded-xl border border-slate-200" />
            </div>
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {devices.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {devices.map((device) => (
            <motion.div key={device.id} variants={itemVariants}>
              <DeviceCard device={device} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] rounded-2xl py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-900 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <Cpu className="w-6 h-6 text-slate-800" />
          </div>
          <h4 className="font-bold text-slate-900">No Connected Devices</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Install the Buggy SDK in your application to start streaming real-time diagnostics and logging events.
          </p>
        </div>
      )}
    </div>
  );
};
