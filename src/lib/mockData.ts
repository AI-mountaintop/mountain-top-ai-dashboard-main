import { AnalyticsData } from "@/types/analytics";

export const mockAnalyticsData: AnalyticsData = {
  overview: {
    success: true,
    rows: 1,
    data: [
      {
        total_views: 3393,
        total_sessions: 1780,
        total_visitors: 1321,
        avg_views_per_session: 9.31,
        new_visitors: 2277,
        returning_visitors: 1116,
      },
    ],
  },
  bounce_rate: {
    success: true,
    data: [
      {
        bounced_sessions: 1252,
        total_sessions: 1780,
      },
    ],
  },
  traffic_chart: {
    success: true,
    data: [
      { date: "2025-10-14", views: 131, sessions: 66 },
      { date: "2025-10-15", views: 144, sessions: 63 },
      { date: "2025-10-16", views: 156, sessions: 78 },
      { date: "2025-10-17", views: 189, sessions: 92 },
      { date: "2025-10-18", views: 203, sessions: 105 },
      { date: "2025-10-19", views: 167, sessions: 88 },
      { date: "2025-10-20", views: 198, sessions: 98 },
      { date: "2025-10-21", views: 221, sessions: 112 },
      { date: "2025-10-22", views: 245, sessions: 128 },
      { date: "2025-10-23", views: 234, sessions: 118 },
      { date: "2025-10-24", views: 212, sessions: 109 },
      { date: "2025-10-25", views: 198, sessions: 102 },
      { date: "2025-10-26", views: 187, sessions: 95 },
      { date: "2025-10-27", views: 176, sessions: 89 },
    ],
  },
  top_pages: {
    success: true,
    data: [
      {
        title: "Home",
        url: "https://example.com/",
        type: "page",
        views: 499,
        sessions: 382,
        visitors: 298,
      },
      {
        title: "About Us",
        url: "https://example.com/about",
        type: "page",
        views: 387,
        sessions: 312,
        visitors: 245,
      },
      {
        title: "Products",
        url: "https://example.com/products",
        type: "page",
        views: 356,
        sessions: 289,
        visitors: 223,
      },
      {
        title: "Contact",
        url: "https://example.com/contact",
        type: "page",
        views: 298,
        sessions: 245,
        visitors: 198,
      },
      {
        title: "Blog",
        url: "https://example.com/blog",
        type: "page",
        views: 267,
        sessions: 221,
        visitors: 187,
      },
    ],
  },
  referrers: {
    success: true,
    data: [
      { domain: "google.com", referrer: "Google", sessions: 454, views: 892, visitors: 387 },
      { domain: "facebook.com", referrer: "Facebook", sessions: 287, views: 543, visitors: 234 },
      { domain: "twitter.com", referrer: "Twitter", sessions: 198, views: 389, visitors: 167 },
      { domain: "linkedin.com", referrer: "LinkedIn", sessions: 156, views: 298, visitors: 134 },
      { domain: "direct", referrer: "Direct", sessions: 412, views: 823, visitors: 356 },
    ],
  },
  geographic: {
    success: true,
    data: [
      { country: "United States", city: "New York", sessions: 260, visitors: 202 },
      { country: "United Kingdom", city: "London", sessions: 198, visitors: 156 },
      { country: "Germany", city: "Berlin", sessions: 145, visitors: 112 },
      { country: "Canada", city: "Toronto", sessions: 123, visitors: 98 },
      { country: "France", city: "Paris", sessions: 109, visitors: 87 },
      { country: "Netherlands", city: "Amsterdam", sessions: 98, visitors: 76 },
      { country: "Australia", city: "Sydney", sessions: 87, visitors: 67 },
    ],
  },
  devices: {
    success: true,
    data: [
      { device_type: "Desktop", device_os: "Windows", device_browser: "Chrome", sessions: 875, visitors: 609 },
      { device_type: "Mobile", device_os: "iOS", device_browser: "Safari", sessions: 423, visitors: 312 },
      { device_type: "Mobile", device_os: "Android", device_browser: "Chrome", sessions: 298, visitors: 223 },
      { device_type: "Desktop", device_os: "macOS", device_browser: "Safari", sessions: 156, visitors: 123 },
      { device_type: "Tablet", device_os: "iOS", device_browser: "Safari", sessions: 98, visitors: 76 },
    ],
  },
};
