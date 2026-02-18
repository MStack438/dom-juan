/**
 * Enhanced stealth injection for bypassing bot detection.
 * Manually injects scripts to hide automation markers.
 */

import type { BrowserContext } from 'playwright';

/**
 * Injects comprehensive stealth scripts into browser context.
 * This runs before any page loads.
 * Using string injection to avoid TypeScript type errors with browser globals.
 */
export async function injectStealthScripts(context: BrowserContext): Promise<void> {
  await context.addInitScript(`
    // 1. Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // 2. Add chrome object
    window.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };

    // 3. Fix permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({ state: 'prompt', onchange: null });
      }
      return originalQuery(parameters);
    };

    // 4. Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          name: 'Chrome PDF Plugin',
        },
        {
          0: { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: 'Portable Document Format',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          name: 'Chrome PDF Viewer',
        },
      ],
    });

    // 5. Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-CA', 'en-US', 'en', 'fr'],
    });

    // 6. Mock platform and vendor
    Object.defineProperty(navigator, 'platform', {
      get: () => 'MacIntel',
    });

    Object.defineProperty(navigator, 'vendor', {
      get: () => 'Google Inc.',
    });

    // 7. Add canvas noise
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type) {
      if (type === 'image/png' && this.width > 0 && this.height > 0) {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, 1, 1);
          imageData.data[0] = imageData.data[0] ^ Math.floor(Math.random() * 2);
          context.putImageData(imageData, 0, 0);
        }
      }
      return originalToDataURL.apply(this, arguments);
    };

    // 8. Mock WebGL vendor/renderer
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel Iris OpenGL Engine';
      return getParameter.apply(this, arguments);
    };

    // 9. Mock battery API
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }),
    });

    // 10. Remove automation properties
    delete window.__playwright;
    delete window.__pw_manual;
    delete window.__PW_inspect;

    // 11. Mock connection
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 50,
        downlink: 10,
        saveData: false,
      }),
    });

    // 12. Mock device memory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });

    // 13. Mock hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });
  `);
}

/**
 * Get realistic HTTP headers for requests
 */
export function getStealthHeaders(country: 'CA' | 'US' = 'CA'): Record<string, string> {
  const language = country === 'CA' ? 'en-CA,en-US;q=0.9,en;q=0.8,fr;q=0.7' : 'en-US,en;q=0.9';

  return {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': language,
    'Accept-Encoding': 'gzip, deflate, br',
    DNT: '1',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
  };
}

/**
 * Get a realistic user agent
 */
export function getRealisticUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)]!;
}

/**
 * Simulate basic human-like behavior on a page
 */
export async function simulateHumanBehavior(page: any): Promise<void> {
  try {
    // Random mouse movement
    const x = 200 + Math.random() * 300;
    const y = 300 + Math.random() * 300;
    await page.mouse.move(x, y);
    await delay(800 + Math.random() * 400);

    // Random scroll
    const scrollAmount = 300 + Math.random() * 200;
    await page.evaluate((amount: number) => {
      // This code runs in browser context
      (globalThis as any).scrollBy(0, amount);
    }, scrollAmount);
    await delay(1200 + Math.random() * 800);
  } catch (error) {
    // Silently fail if simulation fails
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
