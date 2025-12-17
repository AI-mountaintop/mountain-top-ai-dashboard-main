import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useUsage } from "@/contexts/UsageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Languages, FileText, TrendingUp, Clock, Activity } from "lucide-react";
import { format } from "date-fns";

const Home = () => {
  const navigate = useNavigate();
  const { usageStats } = useUsage();

  // Calculate site statistics
  const translationsProcessed = 0;
  const auditsGenerated = 0; // Placeholder for now

  const totalUsage = usageStats.analytics + usageStats.translation + usageStats.audit;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-80">
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
                <div className="text-2xl font-bold">{usageStats.analytics}</div>
                <p className="text-xs text-muted-foreground">
                  {totalUsage > 0 ? `${Math.round((usageStats.analytics / totalUsage) * 100)}% of total usage` : 'No usage yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/presales-summary')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pre-Sales Summary</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.translation}</div>
                <p className="text-xs text-muted-foreground">
                  {totalUsage > 0 ? `${Math.round((usageStats.translation / totalUsage) * 100)}% of total usage` : 'No usage yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/meeting-actions')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meeting Actions</CardTitle>
                <Languages className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.audit}</div>
                <p className="text-xs text-muted-foreground">
                  {totalUsage > 0 ? `${Math.round((usageStats.audit / totalUsage) * 100)}% of total usage` : 'No usage yet'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions across all features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm mt-2">Start using the features to see activity here</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/digital-trailmap')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Digital Trailmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate comprehensive digital trailmaps from meeting transcripts
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{usageStats.analytics}</span>
                  <span className="text-sm text-muted-foreground">trailmaps created</span>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/presales-summary')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pre-Sales Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create pre-sales call summaries from website analysis
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{translationsProcessed}</span>
                  <span className="text-sm text-muted-foreground">reports generated</span>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/meeting-actions')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Meeting Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Convert meeting minutes into actionable items
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{auditsGenerated}</span>
                  <span className="text-sm text-muted-foreground">meetings processed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;

