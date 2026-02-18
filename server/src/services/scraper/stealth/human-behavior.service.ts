/**
 * Advanced human behavior simulation for bot evasion.
 * Tier 3: Realistic mouse movements, scrolling patterns, and interaction timing.
 */

import type { Page } from 'playwright';

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Generate a realistic Bezier curve path between two points
 * Mimics human mouse movement with acceleration and deceleration
 */
function generateMousePath(
  start: MousePosition,
  end: MousePosition,
  steps: number = 20
): MousePosition[] {
  const path: MousePosition[] = [];

  // Control points for Bezier curve (adds natural curve to movement)
  const cp1x = start.x + (end.x - start.x) * 0.25 + (Math.random() - 0.5) * 100;
  const cp1y = start.y + (end.y - start.y) * 0.25 + (Math.random() - 0.5) * 100;
  const cp2x = start.x + (end.x - start.x) * 0.75 + (Math.random() - 0.5) * 100;
  const cp2y = start.y + (end.y - start.y) * 0.75 + (Math.random() - 0.5) * 100;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;

    // Cubic Bezier curve formula
    const x =
      mt * mt * mt * start.x +
      3 * mt * mt * t * cp1x +
      3 * mt * t * t * cp2x +
      t * t * t * end.x;

    const y =
      mt * mt * mt * start.y +
      3 * mt * mt * t * cp1y +
      3 * mt * t * t * cp2y +
      t * t * t * end.y;

    path.push({ x: Math.round(x), y: Math.round(y) });
  }

  return path;
}

/**
 * Simulate realistic mouse movement from current position to target
 */
export async function moveMouseNaturally(
  page: Page,
  targetX: number,
  targetY: number
): Promise<void> {
  // Get current mouse position (or use default)
  const currentPos = { x: 100, y: 100 }; // Playwright doesn't track this, so we estimate

  const path = generateMousePath(currentPos, { x: targetX, y: targetY });

  for (let i = 0; i < path.length; i++) {
    const point = path[i]!;
    await page.mouse.move(point.x, point.y);

    // Variable speed - faster in middle, slower at start/end (human-like)
    const progress = i / path.length;
    const speed = Math.sin(progress * Math.PI) * 3 + 2; // 2-5ms delay
    await delay(speed);
  }
}

/**
 * Simulate realistic scrolling behavior
 * Humans don't scroll smoothly - they scroll in chunks with pauses
 */
export async function scrollLikeHuman(page: Page): Promise<void> {
  const viewportHeight = await page.evaluate(() => (globalThis as any).window.innerHeight);
  const documentHeight = await page.evaluate(() => (globalThis as any).document.documentElement.scrollHeight);

  // Don't scroll if content fits in viewport
  if (documentHeight <= viewportHeight) {
    return;
  }

  let currentScroll = 0;
  const totalScroll = documentHeight - viewportHeight;

  // Scroll in 3-7 chunks (random, like a human skimming)
  const scrollChunks = Math.floor(Math.random() * 5) + 3;

  for (let i = 0; i < scrollChunks; i++) {
    // Random scroll distance (150-400px per chunk)
    const scrollAmount = Math.floor(Math.random() * 250) + 150;
    currentScroll = Math.min(currentScroll + scrollAmount, totalScroll);

    await page.evaluate((y) => {
      (globalThis as any).scrollTo({
        top: y,
        behavior: 'smooth',
      });
    }, currentScroll);

    // Random pause between scrolls (300-800ms - reading time)
    await delay(Math.random() * 500 + 300);

    // Stop if we've reached the bottom
    if (currentScroll >= totalScroll) {
      break;
    }
  }

  // Sometimes scroll back up a bit (like reconsidering)
  if (Math.random() > 0.7) {
    const scrollBack = Math.floor(Math.random() * 200) + 50;
    currentScroll = Math.max(0, currentScroll - scrollBack);
    await page.evaluate((y) => {
      (globalThis as any).scrollTo({
        top: y,
        behavior: 'smooth',
      });
    }, currentScroll);
    await delay(Math.random() * 300 + 200);
  }
}

/**
 * Simulate reading time based on visible text content
 * Average reading speed: 200-250 words per minute
 */
export async function simulateReadingTime(page: Page): Promise<void> {
  const wordCount = await page.evaluate(() => {
    const text = (globalThis as any).document.body.innerText;
    return text.split(/\s+/).length;
  });

  // Reading speed: 200-250 wpm = 3.3-4.2 words/second
  // We only "read" 20-40% of the page (skimming)
  const wordsToRead = wordCount * (Math.random() * 0.2 + 0.2);
  const readingSpeed = Math.random() * 0.9 + 3.3; // 3.3-4.2 words/sec
  const readingTimeMs = (wordsToRead / readingSpeed) * 1000;

  // Cap at 5 seconds (humans don't read full listing pages)
  const cappedTime = Math.min(readingTimeMs, 5000);

  await delay(cappedTime);
}

/**
 * Simulate random mouse movements (idle behavior)
 */
export async function simulateIdleMouseMovement(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) return;

  // 2-4 small mouse movements
  const movements = Math.floor(Math.random() * 3) + 2;

  for (let i = 0; i < movements; i++) {
    const x = Math.random() * viewport.width;
    const y = Math.random() * viewport.height;

    await moveMouseNaturally(page, x, y);
    await delay(Math.random() * 500 + 200);
  }
}

/**
 * Comprehensive human behavior simulation for a page
 * Combines multiple realistic interactions
 */
export async function simulateHumanPageInteraction(
  page: Page,
  options: {
    scroll?: boolean;
    mouseMovement?: boolean;
    readingTime?: boolean;
  } = {}
): Promise<void> {
  const {
    scroll = true,
    mouseMovement = true,
    readingTime = true,
  } = options;

  // Initial pause (page load perception time)
  await delay(Math.random() * 300 + 200);

  // Random mouse movement (like moving cursor to start reading)
  if (mouseMovement && Math.random() > 0.3) {
    const viewport = page.viewportSize();
    if (viewport) {
      const x = Math.random() * viewport.width * 0.8 + viewport.width * 0.1;
      const y = Math.random() * viewport.height * 0.3 + 100;
      await moveMouseNaturally(page, x, y);
    }
  }

  // Scroll behavior
  if (scroll && Math.random() > 0.2) {
    await scrollLikeHuman(page);
  }

  // Reading/scanning time
  if (readingTime) {
    await simulateReadingTime(page);
  }

  // Occasional idle movement (like thinking)
  if (mouseMovement && Math.random() > 0.6) {
    await simulateIdleMouseMovement(page);
  }
}

/**
 * Random delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
