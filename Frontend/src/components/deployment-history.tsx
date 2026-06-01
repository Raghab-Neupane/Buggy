import { 
  GitCommit, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  TrendingUp 
} from 'lucide-react';
import { Card } from './card';

export interface DeploymentEntry {
  id: string;
  commitHash: string;
  commitMsg: string;
  branch: string;
  env: 'Production' | 'Staging' | 'Development';
  duration: string;
  status: 'Success' | 'Failed' | 'Running' | 'Cancelled';
  user: {
    name: string;
    avatarInitials: string;
  };
  relativeTime: string;
}

interface DeploymentHistoryProps {
  deployments: DeploymentEntry[];
  successRate: number;
}

export const DeploymentHistory: React.FC<DeploymentHistoryProps> = ({
  deployments,
  successRate,
}) => {
  const getStatusBadge = (status: DeploymentEntry['status']) => {
    switch (status) {
      case 'Success':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-brand-success/10 border border-brand-success/20 text-brand-success text-[10px] font-bold rounded-lg tracking-wider uppercase">
            <CheckCircle2 className="h-3 w-3" />
            <span>Success</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-[10px] font-bold rounded-lg tracking-wider uppercase animate-pulse">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      case 'Running':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold rounded-lg tracking-wider uppercase">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Running</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-brand-border border border-brand-border/60 text-brand-muted text-[10px] font-bold rounded-lg tracking-wider uppercase">
            <AlertCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  return (
    <Card className="flex flex-col h-fit" glowColor="none" hoverEffect={false}>
      {/* Title Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-base text-white tracking-wide">Deployment History</h3>
          <p className="text-xs text-brand-muted mt-0.5">Continuous delivery triggers</p>
        </div>

        {/* Success Rate Stats */}
        <div className="flex items-center space-x-2.5 bg-brand-success/5 border border-brand-success/20 px-3 py-1.5 rounded-2xl text-brand-success">
          <TrendingUp className="h-4 w-4" />
          <div className="text-right">
            <span className="text-xs font-bold leading-none block">{successRate}%</span>
            <span className="text-[9px] font-semibold text-brand-success/70 uppercase tracking-widest block mt-0.5">Success Rate</span>
          </div>
        </div>
      </div>

      {/* Deployment List */}
      <div className="space-y-4">
        {deployments.slice(0, 5).map((dep) => (
          <div 
            key={dep.id} 
            className="flex items-start justify-between p-3.5 bg-brand-bg/40 border border-brand-border/60 rounded-2xl hover:border-brand-border hover:bg-brand-bg/75 transition-all duration-300 group"
          >
            {/* Left side: Branch info and user */}
            <div className="flex space-x-3.5 min-w-0">
              {/* Trigger Avatar */}
              <div 
                className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-border to-brand-card border border-brand-border/80 flex items-center justify-center font-bold text-xs text-brand-muted group-hover:text-white transition-colors flex-shrink-0"
                title={`Triggered by ${dep.user.name}`}
              >
                {dep.user.avatarInitials}
              </div>

              {/* Commit Details */}
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-white truncate max-w-24 group-hover:text-brand-primary transition-colors">
                    {dep.branch}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-brand-border/80" />
                  <span className="text-[10px] font-bold text-brand-muted bg-brand-card border border-brand-border/60 px-1.5 py-0.5 rounded-md flex items-center space-x-1 flex-shrink-0">
                    <GitCommit className="h-3 w-3 text-brand-primary" />
                    <span>#{dep.commitHash}</span>
                  </span>
                </div>

                <p className="text-xs text-brand-muted truncate max-w-[180px] mt-1 font-medium">
                  {dep.commitMsg}
                </p>

                {/* Env & Time */}
                <div className="flex items-center space-x-2 mt-2 text-[10px] text-brand-muted font-semibold">
                  <span className="px-1.5 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded text-brand-primary text-[9px] uppercase tracking-wider">
                    {dep.env}
                  </span>
                  <span>•</span>
                  <span>{dep.relativeTime}</span>
                </div>
              </div>
            </div>

            {/* Right side: Duration and Badge */}
            <div className="flex flex-col items-end justify-between self-stretch text-right pl-3 flex-shrink-0">
              {getStatusBadge(dep.status)}
              <div className="flex items-center space-x-1 text-[10px] text-brand-muted font-mono font-medium mt-2">
                <Clock className="h-3 w-3 text-brand-muted/70" />
                <span>{dep.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer "View all" Button */}
      <button className="w-full flex items-center justify-center space-x-2 mt-5 py-2.5 rounded-2xl bg-brand-card hover:bg-brand-border/40 border border-brand-border/80 hover:border-brand-border text-xs font-semibold text-brand-text hover:text-white transition-all duration-200 group">
        <span>View all deployments</span>
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </Card>
  );
};
