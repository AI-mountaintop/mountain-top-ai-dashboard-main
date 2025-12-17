import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalyticsData } from '@/types/analytics';
import { format } from 'date-fns';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface ReportConfig {
  title: string;
  dateRange: string;
  companyName: string;
  siteName: string;
  siteUrl: string;
  chartImages?: Record<string, string>; // Captured chart images from UI
  language?: (key: string) => string; // Translation function
}

export class ReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private t: (key: string) => string;

  // Spijkerenco colors
  private colors = {
    primary: [240, 130, 106] as [number, number, number], // Coral
    secondary: [104, 7, 79] as [number, number, number], // Deep Purple
    dark: [21, 23, 30] as [number, number, number], // Dark background
    text: [51, 51, 51] as [number, number, number],
    lightText: [128, 128, 128] as [number, number, number],
    border: [230, 230, 230] as [number, number, number],
  };

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Cover Page
  private async addCoverPage(config: ReportConfig) {
    // Dark background
    this.doc.setFillColor(...this.colors.dark);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Top accent bar
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, 0, this.pageWidth, 3, 'F');

    // Logo area - centered
    await this.addLogo(this.pageWidth / 2 - 25, 50, 50);

    // Decorative line under logo
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(1);
    this.doc.line(this.pageWidth / 2 - 30, 55, this.pageWidth / 2 + 30, 55);

    // Main title - always use translated title
    this.doc.setFontSize(52);
    this.doc.setTextColor(...this.colors.primary);
    this.doc.setFont('helvetica', 'bold');
    const title = this.t('report.analyticsReport');
    const titleParts = title.split(' ');
    if (titleParts.length > 1) {
      this.doc.text(titleParts[0], this.pageWidth / 2, 95, { align: 'center' });
      this.doc.text(titleParts.slice(1).join(' '), this.pageWidth / 2, 118, { align: 'center' });
    } else {
      this.doc.text(title, this.pageWidth / 2, 95, { align: 'center' });
    }

    // Info box
    this.doc.setFillColor(30, 32, 40);
    this.doc.roundedRect(this.margin + 10, 135, this.pageWidth - 2 * this.margin - 20, 50, 3, 3, 'F');

    // Date range
    this.doc.setFontSize(14);
    this.doc.setTextColor(...this.colors.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(config.dateRange, this.pageWidth / 2, 152, { align: 'center' });

    // Site info
    this.doc.setFontSize(10);
    this.doc.setTextColor(180, 180, 180);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${this.t('report.website')}:`, this.pageWidth / 2, 165, { align: 'center' });

    this.doc.setFontSize(12);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(config.siteName, this.pageWidth / 2, 175, { align: 'center' });

    // Company info at bottom
    this.doc.setFontSize(9);
    this.doc.setTextColor(150, 150, 150);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      config.companyName,
      this.pageWidth / 2,
      this.pageHeight - 35,
      { align: 'center' }
    );

    // Generation date
    this.doc.setFontSize(8);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(
      `${this.t('report.generatedOn')} ${format(new Date(), 'MMMM dd, yyyy')}`,
      this.pageWidth / 2,
      this.pageHeight - 25,
      { align: 'center' }
    );

    // Bottom accent bar
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, this.pageHeight - 3, this.pageWidth, 3, 'F');
  }

  // Load and add logo from local public folder
  private async addLogo(x: number, y: number, width: number = 40): Promise<void> {
    try {
      // Load the local SVG and convert to image
      const img = new Image();
      const logoPath = '/LOGO-Spijker-en-Co.svg';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load logo'));
        img.src = logoPath;
      });

      // Calculate height maintaining aspect ratio
      const aspectRatio = img.height / img.width;
      const height = width * aspectRatio;

      // Convert to canvas then to base64
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        // Position logo so it's vertically centered at y coordinate
        this.doc.addImage(imageData, 'PNG', x, y - (height / 2), width, height);
      } else {
        // Fallback to text
        this.addLogoText(x, y);
      }
    } catch (error) {
      console.warn('Failed to load logo, using text fallback:', error);
      this.addLogoText(x, y);
    }
  }

  // Fallback logo as text
  private addLogoText(x: number, y: number, size: number = 9) {
    this.doc.setFontSize(size);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SPIJKER&CO', x, y);
  }

  // Page header for content pages
  private async addPageHeader(pageTitle: string) {
    // Dark background bar
    this.doc.setFillColor(...this.colors.dark);
    this.doc.rect(0, 0, this.pageWidth, 18, 'F');

    // Coral accent line at bottom of header
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, 18, this.pageWidth, 0.5, 'F');

    // Logo (left side) - centered vertically in the 18mm header
    const logoWidth = 25;
    const logoHeight = 6; // Approximate height for the logo
    const logoY = 9 + (logoHeight / 2); // Center vertically (9mm is middle of 18mm header)
    await this.addLogo(this.margin, logoY, logoWidth);

    // Date (right side) - centered vertically
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      format(new Date(), 'MMM dd, yyyy'),
      this.pageWidth - this.margin,
      10,
      { align: 'right' }
    );

    this.currentY = 28;
  }

  // Page footer
  private addPageFooter(pageNumber: number) {
    this.doc.setFontSize(8);
    this.doc.setTextColor(...this.colors.lightText);
    this.doc.text(
      `${this.t('report.page') || 'Page'} ${pageNumber}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    );
  }

  // Section title (no auto page break)
  private addSectionTitle(title: string) {
    this.doc.setFontSize(14);
    this.doc.setTextColor(...this.colors.primary);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  // Create chart as image with retry logic
  private async createChartImage(config: ChartConfiguration, width: number = 800, height: number = 400, retries: number = 3): Promise<string | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await new Promise<string | null>((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.style.backgroundColor = 'white';

          const ctx = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: false
          });

          if (!ctx) {
            resolve(null);
            return;
          }

          // Fill white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);

          const chart = new Chart(ctx, config);

          // Wait longer for chart to fully render
          const waitTime = 1000 + (attempt * 500); // Increase wait time with each retry

          setTimeout(() => {
            try {
              // Force chart update
              chart.update('none');

              // Get image data
              const imageData = canvas.toDataURL('image/png', 1.0);

              // Validate
              if (imageData && imageData.length > 1000 && imageData.startsWith('data:image/png;base64,')) {
                chart.destroy();
                resolve(imageData);
              } else {
                console.warn(`Chart image invalid on attempt ${attempt + 1}`);
                chart.destroy();
                resolve(null);
              }
            } catch (error) {
              console.error(`Error on attempt ${attempt + 1}:`, error);
              chart.destroy();
              resolve(null);
            }
          }, waitTime);
        });

        if (result) {
          return result;
        }
      } catch (error) {
        console.error(`Chart creation attempt ${attempt + 1} failed:`, error);
      }
    }

    return null;
  }

  // Draw simple bar chart directly on PDF (fallback)
  private drawSimpleBarChart(data: { label: string; value: number }[], x: number, y: number, width: number, height: number) {
    const maxValue = Math.max(...data.map(d => d.value));
    const barHeight = (height - 40) / data.length;
    const chartWidth = width - 80;

    // Title
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.colors.text);

    data.forEach((item, index) => {
      const barY = y + (index * barHeight);
      const barWidth = (item.value / maxValue) * chartWidth;

      // Draw bar
      this.doc.setFillColor(...this.colors.primary);
      this.doc.rect(x + 60, barY + 2, barWidth, barHeight - 4, 'F');

      // Label
      this.doc.setFontSize(8);
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(item.label.substring(0, 15), x, barY + barHeight / 2 + 2);

      // Value
      this.doc.text(item.value.toString(), x + 62 + barWidth, barY + barHeight / 2 + 2);
    });
  }

  // Draw simple line chart directly on PDF (fallback)
  private drawSimpleLineChart(data: { label: string; value: number }[], x: number, y: number, width: number, height: number) {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    const chartHeight = height - 30;
    const chartWidth = width - 40;
    const pointSpacing = chartWidth / (data.length - 1 || 1);

    // Draw axes
    this.doc.setDrawColor(...this.colors.border);
    this.doc.line(x + 20, y + chartHeight, x + width - 20, y + chartHeight); // X axis
    this.doc.line(x + 20, y + 10, x + 20, y + chartHeight); // Y axis

    // Draw line
    this.doc.setDrawColor(...this.colors.primary);
    this.doc.setLineWidth(2);

    for (let i = 0; i < data.length - 1; i++) {
      const x1 = x + 20 + (i * pointSpacing);
      const y1 = y + chartHeight - ((data[i].value - minValue) / range) * (chartHeight - 10);
      const x2 = x + 20 + ((i + 1) * pointSpacing);
      const y2 = y + chartHeight - ((data[i + 1].value - minValue) / range) * (chartHeight - 10);

      this.doc.line(x1, y1, x2, y2);

      // Draw point
      this.doc.setFillColor(...this.colors.primary);
      this.doc.circle(x1, y1, 1.5, 'F');
    }

    // Last point
    const lastX = x + 20 + ((data.length - 1) * pointSpacing);
    const lastY = y + chartHeight - ((data[data.length - 1].value - minValue) / range) * (chartHeight - 10);
    this.doc.circle(lastX, lastY, 1.5, 'F');

    // Labels (every few points to avoid crowding)
    this.doc.setFontSize(7);
    this.doc.setTextColor(...this.colors.lightText);
    const labelInterval = Math.ceil(data.length / 7);
    for (let i = 0; i < data.length; i += labelInterval) {
      const labelX = x + 20 + (i * pointSpacing);
      this.doc.text(data[i].label, labelX - 5, y + chartHeight + 8);
    }

    this.doc.setLineWidth(0.5);
  }

  // Overview metrics with chart
  private async addOverviewMetrics(data: AnalyticsData) {
    this.addSectionTitle(this.t('report.overview') || 'Overview');

    const overview = data.overview.data[0];
    const bounceRate = data.bounce_rate.data[0];
    const bounceRatePercent = bounceRate
      ? ((bounceRate.bounced_sessions / bounceRate.total_sessions) * 100).toFixed(1)
      : '0';

    const metrics = [
      [this.t('metric.totalVisitors'), overview.total_visitors.toLocaleString()],
      [this.t('metric.totalViews'), overview.total_views.toLocaleString()],
      [this.t('metric.totalSessions'), overview.total_sessions.toLocaleString()],
      [this.t('metric.viewsPerSession'), overview.avg_views_per_session.toFixed(2)],
      [this.t('metric.newVisitors'), overview.new_visitors.toLocaleString()],
      [this.t('metric.returningVisitors'), overview.returning_visitors.toLocaleString()],
      [this.t('metric.bounceRate'), `${bounceRatePercent}%`],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [[this.t('report.metric') || 'Metric', this.t('report.value') || 'Value']],
      body: metrics,
      theme: 'plain',
      headStyles: {
        fillColor: this.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: this.colors.text,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // Top pages table
  private addTopPages(data: AnalyticsData) {
    this.addSectionTitle(this.t('chart.topPerformingPages'));

    const pages = data.top_pages.data.slice(0, 5).map((page) => [
      page.title,
      page.views.toLocaleString(),
      page.sessions.toLocaleString(),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [[this.t('report.pageTitle') || 'Page Title', this.t('chart.views'), this.t('chart.sessions')]],
      body: pages,
      theme: 'plain',
      headStyles: {
        fillColor: this.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: this.colors.text,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // Traffic sources
  private addTrafficSources(data: AnalyticsData) {
    this.addSectionTitle(this.t('report.trafficSourcesDetail') || 'Traffic Sources Detail');

    const sources = data.referrers.data.slice(0, 10).map((ref) => [
      ref.referrer,
      ref.sessions.toLocaleString(),
      ref.visitors?.toLocaleString() || '-',
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [[this.t('report.source') || 'Source', this.t('chart.sessions'), this.t('metric.totalVisitors')]],
      body: sources,
      theme: 'plain',
      headStyles: {
        fillColor: this.colors.secondary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: this.colors.text,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // Geographic distribution
  private addGeographicData(data: AnalyticsData) {
    this.addSectionTitle(this.t('report.geographicDistribution'));

    const locations = data.geographic.data.slice(0, 15).map((loc) => [
      loc.country,
      loc.city,
      loc.sessions.toLocaleString(),
      loc.visitors.toLocaleString(),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [[this.t('report.country'), this.t('report.city'), this.t('chart.sessions'), this.t('metric.totalVisitors')]],
      body: locations,
      theme: 'plain',
      headStyles: {
        fillColor: this.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: this.colors.text,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 55 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // Traffic trend chart
  private async addTrafficChart(data: AnalyticsData, chartImage?: string) {
    this.addSectionTitle(this.t('report.trafficTrend'));

    // Use captured chart image if available
    if (chartImage) {
      // Create a temporary image to get dimensions
      const img = new Image();
      img.src = chartImage;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const maxWidth = this.pageWidth - 2 * this.margin;
      const aspectRatio = img.height / img.width;

      // Calculate height based on aspect ratio
      let chartWidth = maxWidth;
      let chartHeight = chartWidth * aspectRatio;

      // Constrain height if too tall
      if (chartHeight > 90) {
        chartHeight = 90;
        chartWidth = chartHeight / aspectRatio;
      }

      // Center the chart
      const xPos = this.margin + (maxWidth - chartWidth) / 2;

      this.doc.addImage(chartImage, 'PNG', xPos, this.currentY, chartWidth, chartHeight);
      this.currentY += chartHeight + 10;
      return;
    }

    // Fallback message
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.colors.lightText);
    this.doc.text(this.t('report.chartNotAvailable'), this.margin, this.currentY);
    this.currentY += 10;
  }

  // Device breakdown with pie chart
  private async addDeviceData(data: AnalyticsData, chartImage?: string) {
    this.addSectionTitle(this.t('report.deviceDistribution'));

    // Use captured chart image if available
    if (chartImage) {
      // Create a temporary image to get dimensions
      const img = new Image();
      img.src = chartImage;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const maxWidth = this.pageWidth - 2 * this.margin;
      const aspectRatio = img.height / img.width;

      // Calculate height based on aspect ratio - larger for donut charts
      let chartWidth = maxWidth * 0.85; // Use 85% of available width
      let chartHeight = chartWidth * aspectRatio;

      // If too tall, constrain by height
      if (chartHeight > 120) {
        chartHeight = 120;
        chartWidth = chartHeight / aspectRatio;
      }

      // Center the chart
      const xPos = this.margin + (maxWidth - chartWidth) / 2;

      this.doc.addImage(chartImage, 'PNG', xPos, this.currentY, chartWidth, chartHeight);
      this.currentY += chartHeight + 10;
    }

    // Add detailed table
    const devices = data.devices.data.slice(0, 10).map((dev) => [
      dev.device_type || 'Unknown',
      dev.device_os || 'Unknown',
      dev.device_browser || 'Unknown',
      dev.sessions.toLocaleString(),
    ]);

    if (devices.length > 0) {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [[this.t('report.device'), this.t('report.os'), this.t('report.browser'), this.t('chart.sessions')]],
        body: devices,
        theme: 'plain',
        headStyles: {
          fillColor: this.colors.secondary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: this.colors.text,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30, halign: 'right' },
        },
        margin: { left: this.margin, right: this.margin },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Top referrers chart
  private async addReferrersChart(data: AnalyticsData, chartImage?: string) {
    this.addSectionTitle(this.t('report.topTrafficSources'));

    // Use captured chart image if available
    if (chartImage) {
      // Create a temporary image to get dimensions
      const img = new Image();
      img.src = chartImage;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const maxWidth = this.pageWidth - 2 * this.margin;
      const aspectRatio = img.height / img.width;

      // Calculate height based on aspect ratio - larger for donut charts
      let chartWidth = maxWidth * 0.85; // Use 85% of available width
      let chartHeight = chartWidth * aspectRatio;

      // Constrain height for donut charts
      if (chartHeight > 120) {
        chartHeight = 120;
        chartWidth = chartHeight / aspectRatio;
      }

      // Center the chart
      const xPos = this.margin + (maxWidth - chartWidth) / 2;

      this.doc.addImage(chartImage, 'PNG', xPos, this.currentY, chartWidth, chartHeight);
      this.currentY += chartHeight + 10;
      return;
    }

    // Fallback message
    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.colors.lightText);
    this.doc.text(this.t('report.chartNotAvailable'), this.margin, this.currentY);
    this.currentY += 10;
  }

  // Clicks chart
  private async addClicksChart(data: AnalyticsData, chartImage?: string) {
    this.addSectionTitle(this.t('report.clicksOverTime'));

    if (chartImage) {
      const img = new Image();
      img.src = chartImage;

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const maxWidth = this.pageWidth - 2 * this.margin;
      const aspectRatio = img.height / img.width;

      let chartWidth = maxWidth;
      let chartHeight = chartWidth * aspectRatio;

      if (chartHeight > 90) {
        chartHeight = 90;
        chartWidth = chartHeight / aspectRatio;
      }

      const xPos = this.margin + (maxWidth - chartWidth) / 2;

      this.doc.addImage(chartImage, 'PNG', xPos, this.currentY, chartWidth, chartHeight);
      this.currentY += chartHeight + 10;
      return;
    }

    this.doc.setFontSize(10);
    this.doc.setTextColor(...this.colors.lightText);
    this.doc.text(this.t('report.chartNotAvailable'), this.margin, this.currentY);
    this.currentY += 10;
  }

  // Clicks data table
  private addClicksTable(data: AnalyticsData) {
    this.addSectionTitle(this.t('report.clicksDetail'));

    const clicksData = data.clicks?.data || [];

    if (clicksData.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(...this.colors.lightText);
      this.doc.text(this.t('report.noClicksData'), this.margin, this.currentY);
      this.currentY += 10;
      return;
    }

    const clicks = clicksData.slice(0, 15).map((click: any) => [
      click.date || '-',
      click.clicks?.toLocaleString() || '0',
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [[this.t('report.date'), this.t('chart.clicks')]],
      body: clicks,
      theme: 'plain',
      headStyles: {
        fillColor: this.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: this.colors.text,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, halign: 'right' },
      },
      margin: { left: this.margin, right: this.margin },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // Check if content fits on current page
  private hasSpaceFor(estimatedHeight: number): boolean {
    return this.currentY + estimatedHeight < this.pageHeight - 20;
  }

  // Start new page with header
  private async startNewPage(title: string) {
    this.doc.addPage();
    await this.addPageHeader(title);
  }

  // Generate complete report with intelligent layout
  public async generateReport(
    data: AnalyticsData,
    config: ReportConfig
  ): Promise<Blob> {
    // Set translation function
    this.t = config.language || ((key: string) => key);
    
    let pageNumber = 0;

    // Cover page
    await this.addCoverPage(config);

    // Page 1: Overview, Top Pages & Traffic Chart (all on one page)
    await this.startNewPage(this.t('report.overview') || 'Overview');
    pageNumber++;
    await this.addOverviewMetrics(data);
    this.addTopPages(data);
    await this.addTrafficChart(data, config.chartImages?.['traffic-chart']);
    this.addPageFooter(pageNumber);

    // Traffic Sources: Chart + Table
    if (!this.hasSpaceFor(140)) {
      await this.startNewPage(this.t('chart.trafficSources'));
      pageNumber++;
    }

    await this.addReferrersChart(data, config.chartImages?.['referrers-chart']);

    // Try to fit traffic sources table on same page
    if (this.hasSpaceFor(70)) {
      this.addTrafficSources(data);
    } else {
      this.addPageFooter(pageNumber);
      await this.startNewPage(this.t('chart.trafficSources'));
      pageNumber++;
      this.addTrafficSources(data);
    }

    this.addPageFooter(pageNumber);

    // Geographic & Devices
    if (!this.hasSpaceFor(100)) {
      await this.startNewPage(this.t('report.geographicAndDevices'));
      pageNumber++;
    }

    this.addGeographicData(data);

    // Try to fit device data on same page
    if (this.hasSpaceFor(130)) {
      await this.addDeviceData(data, config.chartImages?.['device-chart']);
    } else {
      this.addPageFooter(pageNumber);
      await this.startNewPage(this.t('report.deviceDistribution'));
      pageNumber++;
      await this.addDeviceData(data, config.chartImages?.['device-chart']);
    }

    this.addPageFooter(pageNumber);

    // Clicks
    if (!this.hasSpaceFor(100)) {
      await this.startNewPage(this.t('report.clicksOverTime'));
      pageNumber++;
    }

    await this.addClicksChart(data, config.chartImages?.['clicks-chart']);

    // Try to fit clicks table on same page
    if (this.hasSpaceFor(70)) {
      this.addClicksTable(data);
    } else {
      this.addPageFooter(pageNumber);
      await this.startNewPage(this.t('report.clicksDetail'));
      pageNumber++;
      this.addClicksTable(data);
    }

    this.addPageFooter(pageNumber);

    // Return as blob
    return this.doc.output('blob');
  }
  // Save report
  public async saveReport(
    data: AnalyticsData,
    config: ReportConfig,
    filename?: string
  ): Promise<void> {
    await this.generateReport(data, config);
    const name = filename || `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    this.doc.save(name);
  }
}
