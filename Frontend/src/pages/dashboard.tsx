import React from "react";
import Live from "../components/live-logs";

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Overview of all deployments</p>

      <div className="dashboard-content">
        <div className="logs-showcase">
          <Live />
        </div>
      </div>

      <style>{`
        .dashboard {
          padding: 24px;
          min-height: 100vh;
          background: #0f172a;
          color: #f8fafc;
        }

        .dashboard h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .dashboard p {
          margin-top: 8px;
          color: #94a3b8;
        }

        .dashboard-content {
          margin-top: 24px;
        }

        .logs-showcase {
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 20px;
          min-height: 500px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};