import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  Layers, 
  Activity, 
  Settings, 
  LogOut, 
  User, 
  Shield, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  currentProject: string;
  setCurrentProject: (proj: string) => void;
  currentEnv: string;
  setCurrentEnv: (env: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  setCurrentProject,
  currentEnv,
  setCurrentEnv,
  searchQuery,
  setSearchQuery,
}) => {
  const [projectOpen, setProjectOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Dummy notifications list
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', message: 'payment-service Stripe response delayed', time: '2m ago', read: false },
    { id: 2, type: 'danger', message: 'database-service Connection timeout (resolved)', time: '5m ago', read: false },
    { id: 3, type: 'success', message: 'deployment-service Build main#8f3a2bc completed', time: '12m ago', read: true },
    { id: 4, type: 'info', message: 'auth-service Scaled up to 4 replicas', time: '1h ago', read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const projects = [
    { id: 'all', name: 'All Microservices' },
    { id: 'auth-service', name: 'auth-service' },
    { id: 'payment-service', name: 'payment-service' },
    { id: 'database-service', name: 'database-service' },
    { id: 'deployment-service', name: 'deployment-service' },
    { id: 'api-gateway', name: 'api-gateway' }
  ];

  const environments = ['Production', 'Staging', 'Development'];

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 glassmorphism-header px-6 flex items-center justify-between">
      {/* Left section: Logo and Project Selector */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-primary/10 border border-brand-primary/30 p-2 rounded-xl text-brand-primary">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-brand-muted bg-clip-text text-transparent">
            ANTIGRAVITY <span className="text-brand-primary font-normal text-xs px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full ml-1.5 uppercase tracking-widest">OBSERVER</span>
          </span>
        </div>
        
        <div className="h-6 w-px bg-brand-border/60" />

        {/* Project Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProjectOpen(!projectOpen)}
            className="flex items-center space-x-2 text-sm bg-brand-card hover:bg-brand-border/40 border border-brand-border/60 hover:border-brand-border rounded-xl px-4 py-2 text-brand-text transition-all duration-200"
          >
            <Layers className="h-4 w-4 text-brand-primary" />
            <span className="font-medium">{projects.find(p => p.id === currentProject)?.name || currentProject}</span>
            <ChevronDown className="h-4 w-4 text-brand-muted transition-transform duration-200" style={{ transform: projectOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          <AnimatePresence>
            {projectOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProjectOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-56 bg-brand-card border border-brand-border rounded-2xl shadow-xl z-50 p-1.5 overflow-hidden"
                >
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setCurrentProject(proj.id);
                        setProjectOpen(false);
                      }}
                      className={`w-full flex items-center justify-between text-left text-sm px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                        currentProject === proj.id 
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold' 
                          : 'text-brand-text hover:bg-brand-border/30 hover:text-white'
                      }`}
                    >
                      <span>{proj.name}</span>
                      {currentProject === proj.id && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Middle section: Environment Selector and Global Search */}
      <div className="flex items-center space-x-6 flex-1 max-w-2xl mx-12">
        {/* Environment Toggles */}
        <div className="flex bg-brand-bg border border-brand-border/60 p-1 rounded-2xl relative">
          {environments.map((env) => {
            const isActive = currentEnv === env;
            return (
              <button
                key={env}
                onClick={() => setCurrentEnv(env)}
                className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 z-10 ${
                  isActive ? 'text-white' : 'text-brand-muted hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeEnv"
                    className="absolute inset-0 bg-brand-card border border-brand-border/60 shadow-lg rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {env}
              </button>
            );
          })}
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand-muted" />
          <input
            type="text"
            placeholder="Search live logs, deployments, or health metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card hover:bg-brand-card/90 focus:bg-brand-bg border border-brand-border/60 focus:border-brand-primary focus:outline-none rounded-2xl pl-10 pr-4 py-2 text-sm text-white placeholder-brand-muted/70 transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right section: Notifications and Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 bg-brand-card hover:bg-brand-border/40 border border-brand-border/60 hover:border-brand-border rounded-xl text-brand-muted hover:text-white transition-all duration-200 relative"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-brand-danger border-2 border-brand-bg rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-brand-card border border-brand-border rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-brand-border/60 flex items-center justify-between bg-brand-bg/50">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead} 
                        className="text-xs text-brand-primary hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-brand-border/40">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-brand-muted">
                        No recent alerts.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3.5 flex items-start space-x-3 transition-colors ${
                            notif.read ? 'opacity-70 bg-transparent' : 'bg-brand-primary/5 hover:bg-brand-primary/10'
                          }`}
                        >
                          <div className={`mt-0.5 p-1 rounded-lg ${
                            notif.type === 'danger' ? 'bg-brand-danger/10 text-brand-danger' :
                            notif.type === 'warning' ? 'bg-brand-warning/10 text-brand-warning' :
                            notif.type === 'success' ? 'bg-brand-success/10 text-brand-success' :
                            'bg-brand-primary/10 text-brand-primary'
                          }`}>
                            <AlertCircle className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white leading-relaxed font-medium break-words">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-brand-muted mt-1 block">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-brand-border/60 text-center bg-brand-bg/20">
                    <button className="text-xs text-brand-muted hover:text-white transition-colors py-1 w-full font-medium">
                      View all system alerts
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-brand-border/60" />

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1.5 bg-brand-card hover:bg-brand-border/40 border border-brand-border/60 hover:border-brand-border rounded-xl transition-all duration-200"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center font-bold text-xs text-white border border-white/10 shadow-sm">
              RN
            </div>
            <span className="text-xs font-semibold text-white max-w-24 truncate hidden md:inline-block">Raghab Neupane</span>
            <ChevronDown className="h-3 w-3 text-brand-muted" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-brand-card border border-brand-border rounded-2xl shadow-xl z-50 p-1.5 overflow-hidden"
                >
                  <div className="p-3 border-b border-brand-border/60">
                    <p className="text-xs font-semibold text-white">Raghab Neupane</p>
                    <p className="text-[10px] text-brand-muted truncate">raghab.neupane@devops.io</p>
                    <div className="flex items-center space-x-1 mt-1.5 bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-md w-fit">
                      <Shield className="h-3 w-3 text-brand-primary" />
                      <span className="text-[9px] font-bold text-brand-primary tracking-wider uppercase">System Admin</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-brand-text hover:bg-brand-border/30 hover:text-white transition-all duration-150">
                      <User className="h-3.5 w-3.5 text-brand-muted" />
                      <span>Account Profile</span>
                    </button>
                    <button className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-brand-text hover:bg-brand-border/30 hover:text-white transition-all duration-150">
                      <Settings className="h-3.5 w-3.5 text-brand-muted" />
                      <span>Workspace Settings</span>
                    </button>
                  </div>

                  <div className="border-t border-brand-border/60 pt-1 mt-1">
                    <button className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-brand-danger hover:bg-brand-danger/10 transition-all duration-150">
                      <LogOut className="h-3.5 w-3.5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
