import React from 'react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ShieldCheck, 
  Cpu, 
  Clock, 
  Activity 
} from 'lucide-react';
import { Card } from './card';

export interface ServiceHealth {
  id: string;
  name: string;
  status: 'Healthy' | 'Degraded' | 'Down';
  uptime: string;
  sparklineData: { val: number }[];
  details: string;
}

interface InfraHealthProps {
  services: ServiceHealth[];
  metrics: {
    uptime: string;
    incidents: number;
    responseTime: string;
    errorRate: string;
  };
}

export const InfraHealth: React.FC<InfraHealthProps> = ({
  services,
  metrics,
}) => {
  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'Healthy':
        return {
          text: 'text-brand-success',
          dot: 'bg-brand-success text-brand-success',
          bg: 'bg-brand-success/10 border-brand-success/20',
          lineStroke: '#22C55E'
        };
      case 'Degraded':
        return {
          text: 'text-brand-warning',
          dot: 'bg-brand-warning text-brand-warning',
          bg: 'bg-brand-warning/10 border-brand-warning/20',
          lineStroke: '#F59E0B'
        };
      case 'Down':
        return {
          text: 'text-brand-danger',
          dot: 'bg-brand-danger text-brand-danger animate-bounce',
          bg: 'bg-brand-danger/10 border-brand-danger/20',
          lineStroke: '#EF4444'
        };
    }
  };

  return (
    <Card className="flex flex-col h-fit" glowColor="none" hoverEffect={false}>
      {/* Title Header */}
      <div className="flex flex-col mb-5">
        <h3 className="font-semibold text-base text-white tracking-wide">Infrastructure Health</h3>
        <p className="text-xs text-brand-muted mt-0.5">Real-time telemetry and cluster load</p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* KPI 1: Uptime */}
        <div className="p-3 bg-brand-bg/40 border border-brand-border/60 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-brand-muted mb-1 select-none">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-success" />
            <span className="text-[10px] font-bold tracking-wider uppercase">System Uptime</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{metrics.uptime}</span>
        </div>

        {/* KPI 2: Error Rate */}
        <div className="p-3 bg-brand-bg/40 border border-brand-border/60 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-brand-muted mb-1 select-none">
            <Cpu className="h-3.5 w-3.5 text-brand-danger" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Error Rate</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{metrics.errorRate}</span>
        </div>

        {/* KPI 3: Avg Response */}
        <div className="p-3 bg-brand-bg/40 border border-brand-border/60 rounded-2xl">
          <div className="flex items-center space-x-1.5 text-brand-muted mb-1 select-none">
            <Clock className="h-3.5 w-3.5 text-brand-primary" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Avg Latency</span>
          </div>
          <span className="text-sm font-bold text-white font-mono">{metrics.responseTime}</span>
        </div>

        {/* KPI 4: Active Incidents */}
        <div className={`p-3 border rounded-2xl transition-colors ${
          metrics.incidents > 0 
            ? 'bg-brand-danger/5 border-brand-danger/20 text-brand-danger' 
            : 'bg-brand-bg/40 border-brand-border/60 text-brand-muted'
        }`}>
          <div className="flex items-center space-x-1.5 mb-1 select-none">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Incidents</span>
          </div>
          <span className={`text-sm font-bold font-mono ${metrics.incidents > 0 ? 'text-brand-danger' : 'text-white'}`}>
            {metrics.incidents} Active
          </span>
        </div>
      </div>

      <div className="h-px bg-brand-border/40 mb-4" />

      {/* Services List */}
      <div className="space-y-3.5">
        {services.map((service) => {
          const colorStyles = getStatusColor(service.status);
          return (
            <div 
              key={service.id} 
              className="flex items-center justify-between p-3 bg-brand-bg/35 border border-brand-border/50 hover:border-brand-border/80 hover:bg-brand-bg/60 rounded-2xl transition-all duration-300 group"
            >
              {/* Left Side: Status Pulser & Service Details */}
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                {/* Custom Pulsing Status Dot */}
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 relative ${colorStyles.dot}`}>
                  <span className={`absolute inset-0 rounded-full animate-status-pulse ${colorStyles.dot}`} />
                </div>
                
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white group-hover:text-brand-primary transition-colors block leading-tight">
                    {service.name}
                  </span>
                  <span className="text-[10px] text-brand-muted/80 block mt-0.5 leading-none">
                    {service.details}
                  </span>
                </div>
              </div>

              {/* Sparkline Visualisation */}
              <div className="w-20 h-7 mx-2 flex-shrink-0 select-none opacity-80 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={service.sparklineData}>
                    <Line 
                      type="monotone" 
                      dataKey="val" 
                      stroke={colorStyles.lineStroke} 
                      strokeWidth={1.8} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Right Side: Status Badge */}
              <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md uppercase tracking-wider flex-shrink-0 flex items-center space-x-1 ${colorStyles.bg} ${colorStyles.text}`}>
                <span>{service.status}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
