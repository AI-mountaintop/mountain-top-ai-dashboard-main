import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bell, Palette, Database } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose,
  autoRefresh,
  onToggleAutoRefresh,
}: SettingsDialogProps) => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'GR Pumps Europe',
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your dashboard preferences and profile
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Bell className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                Save Profile
              </Button>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Data Refresh</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-refresh" className="text-base">
                        Auto-Refresh
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically refresh data every 30 seconds
                      </p>
                    </div>
                    <Switch
                      id="auto-refresh"
                      checked={autoRefresh}
                      onCheckedChange={onToggleAutoRefresh}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border opacity-50">
                    <div className="space-y-0.5">
                      <Label className="text-base">Refresh Interval</Label>
                      <p className="text-sm text-muted-foreground">
                        Set custom refresh interval (Coming soon)
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border opacity-50">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly analytics reports via email
                      </p>
                    </div>
                    <Switch disabled />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border opacity-50">
                    <div className="space-y-0.5">
                      <Label className="text-base">Traffic Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when traffic spikes or drops
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Theme</h4>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-4 rounded-lg border-2 border-primary bg-card hover:bg-accent transition-colors">
                    <div className="w-full h-20 rounded bg-gradient-to-br from-background to-muted mb-2" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  <button className="p-4 rounded-lg border hover:border-primary bg-card hover:bg-accent transition-colors">
                    <div className="w-full h-20 rounded bg-gradient-to-br from-slate-900 to-slate-700 mb-2" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                  <button className="p-4 rounded-lg border hover:border-primary bg-card hover:bg-accent transition-colors">
                    <div className="w-full h-20 rounded bg-gradient-to-br from-background via-muted to-slate-700 mb-2" />
                    <p className="text-sm font-medium">Auto</p>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Display</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border opacity-50">
                    <div className="space-y-0.5">
                      <Label className="text-base">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Show more data in less space
                      </p>
                    </div>
                    <Switch disabled />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border opacity-50">
                    <div className="space-y-0.5">
                      <Label className="text-base">Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable smooth transitions and effects
                      </p>
                    </div>
                    <Switch disabled defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Data Management</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border">
                    <h5 className="font-medium mb-2">Export Data</h5>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download your analytics data in various formats
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Export as CSV
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        Export as JSON
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <h5 className="font-medium mb-2">Cache</h5>
                    <p className="text-sm text-muted-foreground mb-4">
                      Clear cached data to free up space
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Clear Cache
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border border-destructive/50">
                    <h5 className="font-medium mb-2 text-destructive">Danger Zone</h5>
                    <p className="text-sm text-muted-foreground mb-4">
                      Reset all settings to default values
                    </p>
                    <Button variant="destructive" size="sm" disabled>
                      Reset Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
