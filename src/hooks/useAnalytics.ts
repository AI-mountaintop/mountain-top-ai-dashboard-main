import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSite } from '@/contexts/SiteContext';
import { AnalyticsData } from '@/types/analytics';
import { toast } from 'sonner';

interface UseAnalyticsOptions {
  days?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { days = 30, limit = 100, autoRefresh = true, refreshInterval = 30000 } = options;
  const { activeSite } = useSite();

  const fetchAnalytics = async (): Promise<AnalyticsData> => {
    if (!activeSite) {
      throw new Error('No active site selected');
    }

    const baseUrl = activeSite.apiEndpoint;
    const params = `days=${days}&limit=${limit}`;

    try {
      // Fetch all endpoints in parallel
      const [
        overviewRes,
        pagesRes,
        referrersRes,
        geographicRes,
        devicesRes,
        metricsRes,
        clicksRes,
        formsRes,
        formSubmissionsRes,
      ] = await Promise.all([
        fetch(`${baseUrl}/overview?${params}`),
        fetch(`${baseUrl}/pages?${params}`),
        fetch(`${baseUrl}/referrers?${params}`),
        fetch(`${baseUrl}/geographic?${params}`),
        fetch(`${baseUrl}/devices?${params}`),
        fetch(`${baseUrl}/metrics?${params}`),
        fetch(`${baseUrl}/clicks?${params}`),
        fetch(`${baseUrl}/forms?${params}`),
        fetch(`${baseUrl}/form-submissions?${params}`),
      ]);

      // Parse all responses
      const [overview, pages, referrers, geographic, devices, metrics, clicks, forms, formSubmissions] = await Promise.all([
        overviewRes.json(),
        pagesRes.json(),
        referrersRes.json(),
        geographicRes.json(),
        devicesRes.json(),
        metricsRes.json(),
        clicksRes.json(),
        formsRes.json(),
        formSubmissionsRes.json(),
      ]);

      console.log('=== RAW API RESPONSES ===');
      console.log('Overview:', JSON.stringify(overview, null, 2));
      console.log('Pages:', JSON.stringify(pages, null, 2));
      console.log('Referrers:', JSON.stringify(referrers, null, 2));
      console.log('Geographic:', JSON.stringify(geographic, null, 2));
      console.log('Devices:', JSON.stringify(devices, null, 2));
      console.log('Metrics:', JSON.stringify(metrics, null, 2));
      console.log('Clicks:', JSON.stringify(clicks, null, 2));
      console.log('Forms:', JSON.stringify(forms, null, 2));
      console.log('Form Submissions:', JSON.stringify(formSubmissions, null, 2));

      // Extract data from the actual API response structure
      // Overview: direct object with views, sessions, visitors, etc.
      const overviewData = {
        total_views: overview.views || 0,
        total_sessions: overview.sessions || 0,
        total_visitors: overview.visitors || 0,
        avg_views_per_session: overview.avg_views_per_session || 0,
        new_visitors: overview.new_visitors || 0,
        returning_visitors: overview.returning_visitors || 0,
      };

      // Pages: nested in pages.pages array
      const pagesData = pages.pages || [];

      // Referrers: nested in referrers.referrers array
      const referrersData = referrers.referrers || [];

      // Geographic: nested in geographic.locations array
      const geographicData = geographic.locations || [];

      // Devices: nested in devices.devices array
      const devicesData = devices.devices || [];

      // Clicks: nested in clicks.clicks array (assumed)
      const clicksData = clicks.clicks || [];

      // Forms: nested in forms.forms array (assumed)
      const formsData = forms.forms || [];

      // Form Submissions: nested in formSubmissions.submissions array (assumed)
      const formSubmissionsData = formSubmissions.submissions || [];

      // Traffic chart: nested in metrics.daily_trends
      const trafficChartData = (metrics.daily_trends || []).map((item: any) => ({
        date: item.date,
        views: parseInt(item.views) || 0,
        sessions: parseInt(item.sessions) || 0,
      }));

      // Bounce rate: from overview
      const bounceRateData = {
        bounced_sessions: Math.round((overview.bounce_rate / 100) * overview.sessions) || 0,
        total_sessions: overview.sessions || 0,
      };

      console.log('=== EXTRACTED DATA ===');
      console.log('Overview Data:', overviewData);
      console.log('Pages Data:', pagesData);
      console.log('Referrers Data:', referrersData);
      console.log('Geographic Data:', geographicData);
      console.log('Devices Data:', devicesData);
      console.log('Traffic Chart Data:', trafficChartData);
      console.log('Bounce Rate Data:', bounceRateData);
      console.log('Clicks Data:', clicksData);
      console.log('Forms Data:', formsData);
      console.log('Form Submissions Data:', formSubmissionsData);

      // Aggregate clicks by date
      const clicksByDate = new Map<string, number>();
      clicksData.forEach((click: any) => {
        if (click.created_at) {
          const date = click.created_at.split(' ')[0]; // Extract YYYY-MM-DD
          clicksByDate.set(date, (clicksByDate.get(date) || 0) + 1);
        }
      });

      const aggregatedClicks = Array.from(clicksByDate.entries())
        .map(([date, count]) => ({ date, clicks: count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log('Aggregated Clicks:', aggregatedClicks);

      // Combine all data into the expected format
      const analyticsData: AnalyticsData = {
        overview: {
          success: true,
          rows: 1,
          data: [overviewData],
        },
        traffic_chart: {
          success: true,
          data: trafficChartData,
        },
        top_pages: {
          success: true,
          data: pagesData.map((page: any) => ({
            title: page.title,
            url: page.url,
            type: page.type,
            views: parseInt(page.views) || 0,
            sessions: parseInt(page.sessions) || 0,
            visitors: parseInt(page.visitors) || 0,
          })),
        },
        referrers: {
          success: true,
          data: referrersData.map((ref: any) => ({
            domain: ref.domain,
            referrer: ref.referrer,
            sessions: parseInt(ref.sessions) || 0,
            visitors: parseInt(ref.visitors) || 0,
          })),
        },
        geographic: {
          success: true,
          data: geographicData.map((loc: any) => ({
            country: loc.country,
            city: loc.city,
            sessions: parseInt(loc.sessions) || 0,
            visitors: parseInt(loc.visitors) || 0,
          })),
        },
        devices: {
          success: true,
          data: devicesData.map((dev: any) => ({
            device_type: dev.device_type || 'Unknown',
            device_os: dev.device_os || 'Unknown',
            device_browser: dev.device_browser || 'Unknown',
            sessions: parseInt(dev.sessions) || 0,
            visitors: parseInt(dev.visitors) || 0,
          })),
        },
        bounce_rate: {
          success: true,
          data: [bounceRateData],
        },
        clicks: {
          success: true,
          data: aggregatedClicks,
        },
        forms: {
          success: true,
          data: formsData.map((item: any) => ({
            date: item.date,
            views: parseInt(item.views) || 0,
            conversions: parseInt(item.conversions) || 0,
          })),
        },
        form_submissions: {
          success: true,
          data: formSubmissionsData.map((item: any) => ({
            date: item.date,
            submissions: parseInt(item.submissions) || 0,
          })),
        },
      };

      console.log('=== FINAL TRANSFORMED DATA ===', analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  };

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['analytics', activeSite?.id, days, limit],
    queryFn: fetchAnalytics,
    enabled: !!activeSite,
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 1,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Failed to fetch analytics data', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
    }
  }, [error]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
};
