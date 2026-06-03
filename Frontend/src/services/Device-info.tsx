import React from "react";

export const Devices: React.FC = () => {
  return (
    <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600">
      <p className="font-semibold text-slate-800">Connected System Registry</p>
      <p className="mt-1">Telemetry interfaces initialized. Open main dashboard directory to view logs stream details.</p>
    </div>
  );
};

export default Devices;
