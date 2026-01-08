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
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40">
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="px-8 py-8 border-b border-border">
            <div className="flex flex-col items-start gap-1">
              <img
                src="/mountaintop-logo.png"
                alt="Mountain Top"
                className="h-10 w-auto mb-2"
              />
              <span className="text-xs font-medium text-muted-foreground tracking-wide">AI Dashboard</span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-8">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-sm',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer - Settings */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>
          </div>
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
