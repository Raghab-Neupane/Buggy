import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Eye, 
  Activity, 
  Plus, 
  Server, 
  Cpu, 
  HardDrive, 
  Layers, 
  Clock, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Card } from '../components/card';

interface ProjectItem {
  id: string;
  name: string;
  status: 'Live' | 'Degraded' | 'Offline';
  uptime: string;
  cpu: string;
  memory: string;
  replicas: number;
  description: string;
  port: number;
  logs: string[];
}

export const Dashboard = () => {
  // Initial projects list state
  const [projects, setProjects] = useState<ProjectItem[]>(() => [
    {
      id: 'proj-1',
      name: 'auth-service',
      status: 'Live',
      uptime: '99.99%',
      cpu: '14%',
      memory: '240MB',
      replicas: 3,
      description: 'Handles JWT authorization, session verification, and OAuth providers.',
      port: 8081,
      logs: [
        'INFO - User authenticated successfully from IP 192.168.1.102',
        'INFO - JWT Token successfully issued for UID-9924',
        'SUCCESS - Session synced to redis clusters'
      ]
    },
    {
      id: 'proj-2',
      name: 'payment-service',
      status: 'Live',
      uptime: '99.98%',
      cpu: '8%',
      memory: '410MB',
      replicas: 2,
      description: 'Processes credit card checkout intents and syncs with Stripe webhooks.',
      port: 8082,
      logs: [
        'INFO - stripe checkout intent ch_3M8f3a initiated',
        'SUCCESS - Payment captured for invoice INV-1042',
        'INFO - Webhook response processed successfully'
      ]
    },
    {
      id: 'proj-3',
      name: 'database-service',
      status: 'Live',
      uptime: '99.99%',
      cpu: '24%',
      memory: '1.2GB',
      replicas: 4,
      description: 'Manages Postgres primary clusters, read-replica pooling, and cache structures.',
      port: 5432,
      logs: [
        'SUCCESS - Active connection pool established: 32/100 connections',
        'INFO - Vacuum script executed on "users" table',
        'SUCCESS - Read replica synchronized with primary server'
      ]
    },
    {
      id: 'proj-4',
      name: 'deployment-service',
      status: 'Live',
      uptime: '99.95%',
      cpu: '11%',
      memory: '310MB',
      replicas: 1,
      description: 'Continuous integration agent triggers Docker image builds and K8s rolling updates.',
      port: 8085,
      logs: [
        'INFO - Pulling git commit main#8f3a2bc',
        'SUCCESS - Build artifacts compiled successfully. Size: 43MB',
        'SUCCESS - Kubernetes pod rollout completed successfully'
      ]
    },
    {
      id: 'proj-5',
      name: 'api-gateway',
      status: 'Live',
      uptime: '100%',
      cpu: '6%',
      memory: '180MB',
      replicas: 3,
      description: 'Central load-balancer routes public HTTP traffic to backend microservices.',
      port: 8080,
      logs: [
        'INFO - GET /api/v1/auth/session - 200 OK (8ms)',
        'INFO - POST /api/v1/payments/checkout - 201 Created (142ms)',
        'INFO - GET /api/v1/users/profile - 200 OK (36ms)'
      ]
    }
  ]);

  // Selected project ID for "Explore More" details panel
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Form states for adding new projects
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Delete project handler
  const handleDelete = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  }, [selectedProjectId]);

  // Add new project handler
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProjName.toLowerCase().replace(/\s+/g, '-'),
      status: 'Live',
      uptime: '100%',
      cpu: `${Math.floor(Math.random() * 20) + 5}%`,
      memory: `${Math.floor(Math.random() * 300) + 100}MB`,
      replicas: Math.floor(Math.random() * 3) + 1,
      description: newProjDesc || 'Active custom microservice running on the server.',
      port: Math.floor(Math.random() * 5000) + 8000,
      logs: [
        'SUCCESS - Service registered on master nodes',
        'INFO - Node discovery completed successfully',
        'INFO - Health probe returns 200 OK'
      ]
    };

    setProjects(prev => [...prev, newProject]);
    setNewProjName('');
    setNewProjDesc('');
    setShowAddForm(false);
  };

  const getStatusColor = (status: ProjectItem['status']) => {
    switch (status) {
      case 'Live':
        return 'text-brand-success bg-brand-success/10 border-brand-success/20';
      case 'Degraded':
        return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
      case 'Offline':
        return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-6 md:p-12 font-sans selection:bg-brand-primary/30">
      <div className="max-w-[1200px] mx-auto flex flex-col space-y-8">
        
        {/* Sleek Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-brand-border/60">
          <div className="flex items-center space-x-3.5">
            <div className="bg-brand-primary/10 border border-brand-primary/30 p-3 rounded-2xl text-brand-primary">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Active Services Registry</h1>
              <p className="text-xs text-brand-muted mt-1 font-medium">
                Live monitoring nodes currently active in <span className="text-brand-primary font-bold">PRODUCTION</span> cluster
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* Stats */}
            <div className="flex bg-brand-card/60 border border-brand-border/60 p-2.5 rounded-2xl text-xs font-semibold text-brand-muted space-x-4">
              <span>Total Nodes: <strong className="text-white font-mono">{projects.length}</strong></span>
              <span className="h-4 w-px bg-brand-border" />
              <span>Avg Uptime: <strong className="text-brand-success font-mono">99.98%</strong></span>
            </div>

            {/* Register button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-200 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Register Node</span>
            </button>
          </div>
        </header>

        {/* Add Project Form (Expandable) */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="p-6 bg-brand-card border-brand-border/80 glow-primary">
                <h3 className="font-bold text-white text-sm mb-4">Register New Microservice</h3>
                <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Service Name</label>
                    <input
                      type="text"
                      placeholder="e.g. notification-service"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border/60 focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-muted/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-muted tracking-wider uppercase mb-1.5">Service Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Dispatches emails and SMS alerts to clients"
                      value={newProjDesc}
                      onChange={(e) => setNewProjDesc(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border/60 focus:border-brand-primary rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-muted/50 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-xs font-semibold text-brand-muted hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl text-xs"
                    >
                      Deploy Service
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Layout */}
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* Left Panel (List of Live Projects) */}
          <section className={`${selectedProjectId ? 'col-span-12 lg:col-span-7' : 'col-span-12'} space-y-4 transition-all duration-300`}>
            <AnimatePresence initial={false}>
              {projects.length === 0 ? (
                /* Empty state */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 text-center"
                >
                  <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <Server className="h-12 w-12 text-brand-muted/50 mb-4 animate-bounce" />
                    <h3 className="font-bold text-white text-base">No Services Active</h3>
                    <p className="text-xs text-brand-muted mt-2 max-w-sm">
                      All cluster nodes have been deleted. Click "Register Node" above to spin up a new microservice instantly.
                    </p>
                  </Card>
                </motion.div>
              ) : (
                /* Live projects list */
                projects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div 
                      className={`
                        p-5 bg-brand-card/90 backdrop-blur-md rounded-[24px] border
                        flex flex-col sm:flex-row sm:items-center justify-between gap-4
                        transition-all duration-300 hover:y-[-2px]
                        ${selectedProjectId === project.id 
                          ? 'border-brand-primary/70 shadow-[0_0_20px_rgba(59,130,246,0.1)] bg-brand-card' 
                          : 'border-brand-border/60 hover:border-brand-border hover:shadow-[0_0_20px_rgba(31,41,55,0.2)]'}
                      `}
                    >
                      {/* Left: Project title & details */}
                      <div className="flex items-center space-x-4 min-w-0">
                        {/* Status Icon */}
                        <div className="p-3 bg-brand-bg/80 border border-brand-border/60 rounded-2xl flex-shrink-0 text-brand-primary group-hover:text-white transition-colors">
                          <Layers className="h-5 w-5" />
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                            <span className="text-base font-bold text-white tracking-wide truncate">
                              {project.name}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold border rounded-md uppercase tracking-wider ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                            <span className="text-[10px] font-mono text-brand-muted bg-brand-bg px-2 py-0.5 rounded-lg border border-brand-border/40">
                              PORT {project.port}
                            </span>
                          </div>
                          
                          <p className="text-xs text-brand-muted/80 truncate max-w-[280px] sm:max-w-[340px] mt-1.5 font-medium">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Telemetry metrics & Buttons */}
                      <div className="flex items-center justify-between sm:justify-end space-x-6">
                        
                        {/* Quick Metrics */}
                        <div className="hidden sm:flex items-center space-x-4 text-right pr-2">
                          <div>
                            <span className="block text-[8px] font-bold text-brand-muted tracking-widest uppercase">CPU</span>
                            <span className="block text-xs font-bold text-white font-mono">{project.cpu}</span>
                          </div>
                          <div className="h-6 w-px bg-brand-border" />
                          <div>
                            <span className="block text-[8px] font-bold text-brand-muted tracking-widest uppercase">Uptime</span>
                            <span className="block text-xs font-bold text-brand-success font-mono">{project.uptime}</span>
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                          
                          {/* Explore More Button */}
                          <button
                            onClick={() => setSelectedProjectId(selectedProjectId === project.id ? null : project.id)}
                            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                              selectedProjectId === project.id
                                ? 'bg-brand-primary text-white border-brand-primary shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                : 'bg-brand-bg/40 border-brand-border/80 text-brand-muted hover:text-white hover:border-brand-border'
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Explore</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 bg-brand-bg/40 hover:bg-brand-danger/10 border border-brand-border/80 hover:border-brand-danger/30 text-brand-muted hover:text-brand-danger rounded-xl transition-all duration-200"
                            title="Delete Service Node"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </section>

          {/* Right Panel (Service Details / Explore Panel) */}
          <AnimatePresence>
            {selectedProjectId && activeProject && (
              <motion.section
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="col-span-12 lg:col-span-5"
              >
                <Card className="p-6 bg-brand-card/90 border-brand-border/80 shadow-2xl relative overflow-hidden" hoverEffect={false}>
                  {/* Glowing absolute background accent */}
                  <div className="absolute top-[-50px] right-[-50px] h-32 w-32 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Details Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[9px] font-bold text-brand-primary tracking-widest uppercase block mb-1">Telemetry Dashboard</span>
                      <h2 className="text-xl font-bold text-white tracking-wide">{activeProject.name}</h2>
                    </div>
                    <button 
                      onClick={() => setSelectedProjectId(null)}
                      className="text-xs text-brand-muted hover:text-white font-medium"
                    >
                      Close Details
                    </button>
                  </div>

                  {/* Deeper Metrics Tiles */}
                  <div className="grid grid-cols-2 gap-3.5 mb-6">
                    <div className="p-3 bg-brand-bg/50 border border-brand-border/50 rounded-2xl">
                      <div className="flex items-center space-x-1 text-brand-muted mb-1">
                        <Cpu className="h-3.5 w-3.5 text-brand-primary" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">CPU Load</span>
                      </div>
                      <span className="text-sm font-bold text-white font-mono">{activeProject.cpu}</span>
                    </div>

                    <div className="p-3 bg-brand-bg/50 border border-brand-border/50 rounded-2xl">
                      <div className="flex items-center space-x-1 text-brand-muted mb-1">
                        <HardDrive className="h-3.5 w-3.5 text-brand-success" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">Memory Allocation</span>
                      </div>
                      <span className="text-sm font-bold text-white font-mono">{activeProject.memory}</span>
                    </div>

                    <div className="p-3 bg-brand-bg/50 border border-brand-border/50 rounded-2xl">
                      <div className="flex items-center space-x-1 text-brand-muted mb-1">
                        <Clock className="h-3.5 w-3.5 text-brand-warning" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">Node Uptime</span>
                      </div>
                      <span className="text-sm font-bold text-white font-mono">{activeProject.uptime}</span>
                    </div>

                    <div className="p-3 bg-brand-bg/50 border border-brand-border/50 rounded-2xl">
                      <div className="flex items-center space-x-1 text-brand-muted mb-1">
                        <Server className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">Active Replicas</span>
                      </div>
                      <span className="text-sm font-bold text-white font-mono">{activeProject.replicas} Pods</span>
                    </div>
                  </div>

                  {/* Project Details Description */}
                  <div className="mb-6 p-4 bg-brand-bg/30 border border-brand-border/40 rounded-2xl">
                    <span className="text-[9px] font-bold text-brand-muted tracking-wider uppercase block mb-1">Node Purpose</span>
                    <p className="text-xs text-brand-muted font-medium leading-relaxed">
                      {activeProject.description}
                    </p>
                  </div>

                  {/* Mock live terminal logs */}
                  <div>
                    <span className="text-[9px] font-bold text-brand-muted tracking-wider uppercase block mb-2.5">Live Diagnostic Logs</span>
                    <div className="p-4 bg-black/40 rounded-2xl border border-brand-border/50 font-mono text-[10px] text-white/95 leading-relaxed space-y-2 max-h-40 overflow-y-auto">
                      {activeProject.logs.map((log, index) => {
                        const isSuccess = log.includes('SUCCESS');
                        const colorClass = isSuccess ? 'text-brand-success' : 'text-brand-primary';
                        return (
                          <div key={index} className="flex items-start space-x-2">
                            <ChevronRight className={`h-3 w-3 mt-0.5 flex-shrink-0 ${colorClass}`} />
                            <span className="break-all">{log}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sparkline widget */}
                  <div className="mt-6 pt-5 border-t border-brand-border flex items-center justify-between text-[10px] text-brand-muted">
                    <div className="flex items-center space-x-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-brand-success" />
                      <span>Node diagnostics: <strong className="text-white uppercase font-bold">100% stable</strong></span>
                    </div>
                    <span>NODE ID: <strong className="text-white font-mono">{activeProject.id}</strong></span>
                  </div>

                </Card>
              </motion.section>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
};
