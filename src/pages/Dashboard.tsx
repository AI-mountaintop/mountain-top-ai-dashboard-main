import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Stats {
    digitalTrailmaps: number;
    preSalesSummaries: number;
    meetingActions: number;
}

interface Activity {
    id: string;
    type: 'trailmap' | 'presales' | 'meeting';
    title: string;
    timestamp: string;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        digitalTrailmaps: 0,
        preSalesSummaries: 0,
        meetingActions: 0
    });
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchRecentActivity();
    }, []);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const [trailmapsResult, actionsResult, presalesResult] = await Promise.all([
                supabase.from('digital_trailmaps').select('*', { count: 'exact', head: true }),
                supabase.from('meeting_action_items').select('*', { count: 'exact', head: true }),
                supabase.from('presales_summaries').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                digitalTrailmaps: trailmapsResult.count || 0,
                preSalesSummaries: presalesResult.count || 0,
                meetingActions: actionsResult.count || 0
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            const [trailmaps, actions, presales] = await Promise.all([
                supabase.from('digital_trailmaps').select('id, meeting_name, created_at').order('created_at', { ascending: false }).limit(1),
                supabase.from('meeting_action_items').select('id, meeting_name, created_at').order('created_at', { ascending: false }).limit(1),
                supabase.from('presales_summaries').select('id, company_name, created_at').order('created_at', { ascending: false }).limit(1)
            ]);

            const activities: Activity[] = [
                ...(trailmaps.data || []).map(item => ({
                    id: item.id,
                    type: 'trailmap' as const,
                    title: item.meeting_name || 'Untitled Trailmap',
                    timestamp: item.created_at
                })),
                ...(actions.data || []).map(item => ({
                    id: item.id,
                    type: 'meeting' as const,
                    title: item.meeting_name || 'Untitled Meeting',
                    timestamp: item.created_at
                })),
                ...(presales.data || []).map(item => ({
                    id: item.id,
                    type: 'presales' as const,
                    title: item.company_name || 'Untitled Company',
                    timestamp: item.created_at
                }))
            ];

            // Sort by timestamp and take top 3
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRecentActivity(activities.slice(0, 3));
        } catch (error) {
            console.error("Error fetching recent activity:", error);
        }
    };

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'trailmap':
                return <FileText className="h-4 w-4 text-muted-foreground" />;
            case 'presales':
                return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
            case 'meeting':
                return <Sparkles className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getActivityLabel = (type: Activity['type']) => {
        switch (type) {
            case 'trailmap':
                return 'Digital Trailmap';
            case 'presales':
                return 'Pre-Sales Summary';
            case 'meeting':
                return 'Meeting Actions';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="ml-64">
                <main className="container mx-auto px-12 py-12 max-w-6xl">
                    <PageHeader 
                        title="Dashboard" 
                        description="Overview of your AI-powered tools"
                    />

                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-3 mb-12">
                        <Card className="border-border hover:border-primary/20 transition-all duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Digital Trailmap
                                    </CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold mb-1">
                                    {isLoading ? "—" : stats.digitalTrailmaps}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total created
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border hover:border-primary/20 transition-all duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Pre-Sales Summary
                                    </CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold mb-1">
                                    {isLoading ? "—" : stats.preSalesSummaries}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total generated
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border hover:border-primary/20 transition-all duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Meeting Actions
                                    </CardTitle>
                                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-semibold mb-1">
                                    {isLoading ? "—" : stats.meetingActions}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total processed
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid gap-6 md:grid-cols-3 mb-12">
                        <Card 
                            className="border-border hover:border-primary/20 transition-all duration-200 group cursor-pointer"
                            onClick={() => navigate('/digital-trailmap')}
                        >
                            <CardHeader className="pb-4">
                                <FileText className="h-5 w-5 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                                <CardTitle className="text-lg font-semibold mb-2">Digital Trailmap</CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                    Generate comprehensive digital trailmaps from meeting transcripts
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card 
                            className="border-border hover:border-primary/20 transition-all duration-200 group cursor-pointer"
                            onClick={() => navigate('/presales-summary')}
                        >
                            <CardHeader className="pb-4">
                                <BarChart3 className="h-5 w-5 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                                <CardTitle className="text-lg font-semibold mb-2">Pre-Sales Summary</CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                    Create pre-sales call summaries from website analysis
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card 
                            className="border-border hover:border-primary/20 transition-all duration-200 group cursor-pointer"
                            onClick={() => navigate('/meeting-actions')}
                        >
                            <CardHeader className="pb-4">
                                <Sparkles className="h-5 w-5 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                                <CardTitle className="text-lg font-semibold mb-2">Meeting Actions</CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                    Convert meeting minutes into actionable items
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                            <CardDescription>Latest actions across all features</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-center gap-4 py-3 border-b last:border-0 border-border">
                                            <div className="flex-shrink-0">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{activity.title}</p>
                                                <p className="text-xs text-muted-foreground">{getActivityLabel(activity.type)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">No recent activity</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
