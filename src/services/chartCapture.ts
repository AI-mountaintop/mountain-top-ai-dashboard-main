import html2canvas from 'html2canvas';

export class ChartCaptureService {
  /**
   * Capture a DOM element as an image
   */
  static async captureElement(element: HTMLElement): Promise<string | null> {
    try {
      // Get the actual background color from the element
      const computedStyle = window.getComputedStyle(element);
      const bgColor = computedStyle.backgroundColor || '#FFFFFF';
      
      // Get the full scrollable height
      const fullHeight = Math.max(
        element.offsetHeight,
        element.scrollHeight,
        element.clientHeight
      );
      
      const canvas = await html2canvas(element, {
        backgroundColor: bgColor,
        scale: 3, // Higher quality for PDF
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        width: element.offsetWidth,
        height: fullHeight,
        windowHeight: fullHeight,
      });

      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('Error capturing element:', error);
      return null;
    }
  }

  /**
   * Capture multiple chart elements by their IDs
   */
  static async captureCharts(chartIds: string[]): Promise<Record<string, string>> {
    const captures: Record<string, string> = {};

    for (const id of chartIds) {
      const element = document.getElementById(id);
      if (element) {
        const image = await this.captureElement(element);
        if (image) {
          captures[id] = image;
        }
      }
    }

    return captures;
  }

  /**
   * Capture all charts on the page
   */
  static async captureAllCharts(): Promise<Record<string, string>> {
    const chartElements = document.querySelectorAll('[data-chart-capture]');
    const captures: Record<string, string> = {};

    for (const element of Array.from(chartElements)) {
      const htmlElement = element as HTMLElement;
      const chartId = htmlElement.getAttribute('data-chart-capture');
      
      if (chartId) {
        const image = await this.captureElement(htmlElement);
        if (image) {
          captures[chartId] = image;
        }
      }
    }

    return captures;
  }
}
