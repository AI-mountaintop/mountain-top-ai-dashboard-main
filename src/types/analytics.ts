export interface MetricCardData {
  label: string;
  value: number | string | undefined;
  trend?: number;
  trendDirection?: "up" | "down" | "neutral";
  format?: "number" | "percentage" | "duration" | "decimal";
}

export interface TrafficDataPoint {
  date: string;
  views: number;
  sessions: number;
}

export interface TopPage {
  title: string;
  url: string;
  type: string;
  views: number;
  sessions: number;
  visitors?: number;
}

export interface Referrer {
  domain: string;
  referrer: string;
  sessions: number;
  views?: number;
  visitors?: number;
}

export interface GeographicData {
  country: string;
  city: string;
  sessions: number;
  visitors: number;
}

export interface DeviceData {
  device_type: string;
  device_os: string;
  device_browser: string;
  sessions: number;
  visitors: number;
}

export interface ClickData {
  date: string;
  clicks: number;
}

export interface FormData {
  date: string;
  views: number;
  conversions: number;
}

export interface FormSubmissionData {
  date: string;
  submissions: number;
}

export interface OverviewData {
  total_views: number;
  total_sessions: number;
  total_visitors: number;
  avg_views_per_session: number;
  new_visitors: number;
  returning_visitors: number;
}

export interface BounceRateData {
  bounced_sessions: number;
  total_sessions: number;
}

export interface AnalyticsData {
  overview: {
    success: boolean;
    rows: number;
    data: OverviewData[];
  };
  bounce_rate: {
    success: boolean;
    data: BounceRateData[];
  };
  traffic_chart: {
    success: boolean;
    data: TrafficDataPoint[];
  };
  top_pages: {
    success: boolean;
    data: TopPage[];
  };
  referrers: {
    success: boolean;
    data: Referrer[];
  };
  geographic: {
    success: boolean;
    data: GeographicData[];
  };
  devices: {
    success: boolean;
    data: DeviceData[];
  };
  clicks: {
    success: boolean;
    data: ClickData[];
  };
  forms: {
    success: boolean;
    data: FormData[];
  };
  form_submissions: {
    success: boolean;
    data: FormSubmissionData[];
  };
}

export interface ReportConfig {
  title: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  sections: {
    overview: boolean;
    traffic: boolean;
    pages: boolean;
    referrers: boolean;
    geographic: boolean;
    devices: boolean;
  };
  returnFile?: boolean;
}

export interface Report {
  filename: string;
  created_at: string;
  size: number;
}
