import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Languages, FileText, Activity, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface RecentActivityItem {
  id: string;
  title: string;
  type: 'trailmap' | 'presales' | 'meeting';
  created_at: string;
  link?: string;
}

const Home = () => {
  const navigate = useNavigate();

  // State for real analytics counts
  const [trailmapCount, setTrailmapCount] = useState(0);
  const [presalesCount, setPresalesCount] = useState(0);
  const [meetingActionsCount, setMeetingActionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

  // Fetch counts and recent activity from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch digital trailmaps count
        const { count: trailmaps, error: trailmapError } = await supabase
          .from('digital_trailmaps')
          .select('*', { count: 'exact', head: true });

        if (!trailmapError && trailmaps !== null) {
          setTrailmapCount(trailmaps);
        }

        // Fetch presales summaries count
        const { count: presales, error: presalesError } = await supabase
          .from('presales_summaries')
          .select('*', { count: 'exact', head: true });

        if (!presalesError && presales !== null) {
          setPresalesCount(presales);
        }

        // Fetch meeting action items count
        const { count: meetings, error: meetingsError } = await supabase
          .from('meeting_action_items')
          .select('*', { count: 'exact', head: true });

        if (!meetingsError && meetings !== null) {
          setMeetingActionsCount(meetings);
        }

        // Fetch recent activity from all tables
        const [trailmapData, presalesData, meetingData] = await Promise.all([
          supabase
            .from('digital_trailmaps')
            .select('id, meeting_name, created_at, trailmap_link')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('presales_summaries')
            .select('id, company_name, created_at, summary_link')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('meeting_action_items')
            .select('id, meeting_name, created_at, google_drive_link')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        // Combine and sort all activity
        const allActivity: RecentActivityItem[] = [];

        if (trailmapData.data) {
          trailmapData.data.forEach((item: any) => {
            allActivity.push({
              id: item.id,
              title: item.meeting_name || 'Untitled Trailmap',
              type: 'trailmap',
              created_at: item.created_at,
              link: item.trailmap_link,
            });
          });
        }

        if (presalesData.data) {
          presalesData.data.forEach((item: any) => {
            allActivity.push({
              id: item.id,
              title: item.company_name || 'Untitled Company',
              type: 'presales',
              created_at: item.created_at,
              link: item.summary_link,
            });
          });
        }

        if (meetingData.data) {
          meetingData.data.forEach((item: any) => {
            allActivity.push({
              id: item.id,
              title: item.meeting_name || 'Untitled Meeting',
              type: 'meeting',
              created_at: item.created_at,
              link: item.google_drive_link,
            });
          });
        }

        // Sort by date and take top 5
        allActivity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentActivity(allActivity.slice(0, 5));

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalUsage = trailmapCount + presalesCount + meetingActionsCount;

  const getActivityIcon = (type: 'trailmap' | 'presales' | 'meeting') => {
    switch (type) {
      case 'trailmap':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'presales':
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case 'meeting':
        return <Languages className="h-4 w-4 text-purple-500" />;
    }
  };

  const getActivityLabel = (type: 'trailmap' | 'presales' | 'meeting') => {
    switch (type) {
      case 'trailmap':
        return 'Digital Trailmap';
      case 'presales':
        return 'Pre-Sales Summary';
      case 'meeting':
        return 'Meeting Actions';
    }
  };

  const getActivityRoute = (type: 'trailmap' | 'presales' | 'meeting') => {
    switch (type) {
      case 'trailmap':
        return '/digital-trailmap';
      case 'presales':
        return '/presales-summary';
      case 'meeting':
        return '/meeting-actions';
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64">
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-2">
              Welcome to Mountain Top Web Design's AI Dashboard
            </p>
          </div>

          {/* Usage Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/digital-trailmap')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Digital Trailmap</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : trailmapCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalUsage > 0 ? `${Math.round((trailmapCount / totalUsage) * 100)}% of total usage` : 'No usage yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/presales-summary')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pre-Sales Summary</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : presalesCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalUsage > 0 ? `${Math.round((presalesCount / totalUsage) * 100)}% of total usage` : 'No usage yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/meeting-actions')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meeting Actions</CardTitle>
                <Languages className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : meetingActionsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalUsage > 0 ? `${Math.round((meetingActionsCount / totalUsage) * 100)}% of total usage` : 'No usage yet'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Now shows real data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions across all features</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Loading activity...</p>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-muted p-2 rounded-full">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-full bg-muted">
                              {getActivityLabel(activity.type)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(activity.link, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(getActivityRoute(activity.type))}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm mt-2">Start using the features to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Home;
