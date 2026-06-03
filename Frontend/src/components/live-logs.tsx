import React from "react";
import Devices from "../services/Device-info";

export const LegacyLiveLogs: React.FC = () => {
  return (
    <section className="LiveDevices">
      <div className="lists">
        <Devices />
      </div>
    </section>
  );
};