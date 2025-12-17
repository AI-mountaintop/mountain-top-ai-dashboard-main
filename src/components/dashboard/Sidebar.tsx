import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Languages, FileText, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsDialog } from './SettingsDialog';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('auto-refresh');
    return saved ? JSON.parse(saved) : true;
  });

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/digital-trailmap', label: 'Digital Trailmap', icon: FileText },
    { path: '/presales-summary', label: 'Pre-Sales Summary', icon: BarChart3 },
    { path: '/meeting-actions', label: 'Meeting Actions', icon: Languages },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-80 bg-card border-r border-border z-40">
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-col items-center gap-2">
              <img
                src="/mountaintop-logo.png"
                alt="Mountain Top Web Design"
                className="h-12 w-auto"
              />
              <span className="text-xs font-semibold text-muted-foreground text-center">AI Dashboard</span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-6">
            <div className="space-y-1">
              {/* Dashboard */}
              <button
                onClick={() => navigate('/')}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                  'hover:bg-accent',
                  location.pathname === '/' && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Dashboard</span>
              </button>

              {/* Other Navigation Items */}
              {navItems.slice(1).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                      'hover:bg-accent',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer - Settings (only on Dashboard) */}
          {location.pathname === '/' && (
            <div className="p-4 px-6 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          )}
        </div>
      </aside>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => {
          const newValue = !autoRefresh;
          setAutoRefresh(newValue);
          localStorage.setItem('auto-refresh', JSON.stringify(newValue));
        }}
      />
    </>
  );
};
