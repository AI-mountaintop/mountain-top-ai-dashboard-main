export interface UsageStats {
  analytics: number;
  translation: number;
  audit: number;
}

export interface SiteStats {
  analyticsSites: number;
  translationsProcessed: number;
  auditsGenerated: number;
}

export interface RecentActivity {
  id: string;
  type: 'analytics' | 'translation' | 'audit';
  action: string;
  timestamp: Date;
  details?: string;
}

export interface DashboardData {
  usageStats: UsageStats;
  siteStats: SiteStats;
  recentActivities: RecentActivity[];
}



