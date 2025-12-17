import { useState } from 'react';
import { useSite } from '@/contexts/SiteContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Plus, Globe, Check, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddSiteDialog } from './AddSiteDialog';
import { SettingsDialog } from './SettingsDialog';
import { toast } from 'sonner';

interface AnalyticsSidebarProps {
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export const AnalyticsSidebar = ({ autoRefresh, onToggleAutoRefresh }: AnalyticsSidebarProps) => {
  const { sites, activeSite, setActiveSite, removeSite } = useSite();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleDeleteSite = (siteId: string, siteName: string) => {
    if (sites.length === 1) {
      toast.error('Cannot delete the last site');
      return;
    }
    removeSite(siteId);
    toast.success(`Removed ${siteName}`);
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-80 bg-card border-r border-border z-40">
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex flex-col items-center gap-2">
              <img 
                src="https://www.spijkerenco.nl/spijker-content/uploads/2024/05/LOGO-Spijker-en-Co_zonder_toevoeging.svg" 
                alt="Spijker & Co" 
                className="h-8 w-auto"
              />
              <span className="text-xs font-semibold text-muted-foreground text-center">AI Dashboard</span>
            </div>
          </div>

          {/* Sites Section Header */}
          <div className="px-6 py-3 border-b border-border">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Sites</h2>
          </div>

          {/* Sites List */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {sites.map((site) => (
                <ContextMenu key={site.id}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => setActiveSite(site)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        'hover:bg-accent',
                        activeSite?.id === site.id && 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      <Globe className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="font-medium truncate">{site.name}</p>
                        <p className="text-xs opacity-70 truncate">{site.url}</p>
                      </div>
                      {activeSite?.id === site.id && (
                        <Check className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => handleDeleteSite(site.id, site.name)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Site
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-border space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </aside>

      <AddSiteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={onToggleAutoRefresh}
      />
    </>
  );
};

