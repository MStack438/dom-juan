/**
 * Session persistence service for maintaining browser state.
 * Tier 3: Cookies, local storage, and referrer tracking across scraping runs.
 */

import type { BrowserContext, Cookie } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// Use environment variable or fall back to project root
// Railway-safe: works in both dev and production
const PROJECT_ROOT = process.env.SESSION_DIR || process.cwd();
const SESSION_DIR = path.join(PROJECT_ROOT, '.sessions');
const REALTOR_SESSION_FILE = path.join(SESSION_DIR, 'realtor-session.json');
const CENTRIS_SESSION_FILE = path.join(SESSION_DIR, 'centris-session.json');

interface SessionData {
  cookies: Cookie[];
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  lastUsed: string;
  useCount: number;
}

/**
 * Ensure session directory exists
 */
function ensureSessionDir(): void {
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true });
  }
}

/**
 * Save session state to disk
 */
export async function saveSession(
  context: BrowserContext,
  service: 'realtor' | 'centris'
): Promise<void> {
  try {
    ensureSessionDir();

    const cookies = await context.cookies();
    const sessionFile = service === 'realtor' ? REALTOR_SESSION_FILE : CENTRIS_SESSION_FILE;

    // Load existing session to preserve metadata
    let existingSession: SessionData | null = null;
    if (existsSync(sessionFile)) {
      try {
        const content = readFileSync(sessionFile, 'utf-8');
        existingSession = JSON.parse(content);
      } catch {
        // Ignore parse errors, create new session
      }
    }

    const sessionData: SessionData = {
      cookies,
      localStorage: {}, // Playwright doesn't easily extract this, would need page.evaluate
      sessionStorage: {},
      lastUsed: new Date().toISOString(),
      useCount: (existingSession?.useCount ?? 0) + 1,
    };

    writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2), 'utf-8');
    console.log(`[Session] Saved ${service} session (${cookies.length} cookies, use #${sessionData.useCount})`);
  } catch (error) {
    console.warn(`[Session] Failed to save ${service} session:`, error);
  }
}

/**
 * Load session state from disk and apply to context
 */
export async function loadSession(
  context: BrowserContext,
  service: 'realtor' | 'centris'
): Promise<boolean> {
  try {
    ensureSessionDir();

    const sessionFile = service === 'realtor' ? REALTOR_SESSION_FILE : CENTRIS_SESSION_FILE;

    if (!existsSync(sessionFile)) {
      console.log(`[Session] No existing ${service} session found - starting fresh`);
      return false;
    }

    const content = readFileSync(sessionFile, 'utf-8');
    const sessionData: SessionData = JSON.parse(content);

    // Check if session is too old (>7 days = stale)
    const lastUsed = new Date(sessionData.lastUsed);
    const daysSinceUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUse > 7) {
      console.log(`[Session] ${service} session is stale (${Math.floor(daysSinceUse)} days old) - starting fresh`);
      return false;
    }

    // Apply cookies to context
    if (sessionData.cookies && sessionData.cookies.length > 0) {
      await context.addCookies(sessionData.cookies);
      console.log(
        `[Session] Loaded ${service} session (${sessionData.cookies.length} cookies, ` +
        `use #${sessionData.useCount}, ${Math.floor(daysSinceUse)} days old)`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.warn(`[Session] Failed to load ${service} session:`, error);
    return false;
  }
}

/**
 * Clear session state for a service
 */
export function clearSession(service: 'realtor' | 'centris'): void {
  try {
    const sessionFile = service === 'realtor' ? REALTOR_SESSION_FILE : CENTRIS_SESSION_FILE;

    if (existsSync(sessionFile)) {
      // Don't delete, just mark as cleared
      const emptySession: SessionData = {
        cookies: [],
        lastUsed: new Date().toISOString(),
        useCount: 0,
      };
      writeFileSync(sessionFile, JSON.stringify(emptySession, null, 2), 'utf-8');
      console.log(`[Session] Cleared ${service} session`);
    }
  } catch (error) {
    console.warn(`[Session] Failed to clear ${service} session:`, error);
  }
}

/**
 * Get session age in days
 */
export function getSessionAge(service: 'realtor' | 'centris'): number | null {
  try {
    const sessionFile = service === 'realtor' ? REALTOR_SESSION_FILE : CENTRIS_SESSION_FILE;

    if (!existsSync(sessionFile)) {
      return null;
    }

    const content = readFileSync(sessionFile, 'utf-8');
    const sessionData: SessionData = JSON.parse(content);
    const lastUsed = new Date(sessionData.lastUsed);

    return (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
  } catch {
    return null;
  }
}

/**
 * Inject localStorage and sessionStorage into a page
 * (for future use - requires page context)
 */
export async function injectStorageIntoPage(
  page: any,
  localStorage?: Record<string, string>,
  sessionStorage?: Record<string, string>
): Promise<void> {
  if (localStorage && Object.keys(localStorage).length > 0) {
    await page.evaluate((items: Record<string, string>) => {
      for (const [key, value] of Object.entries(items)) {
        (globalThis as any).localStorage.setItem(key, value);
      }
    }, localStorage);
  }

  if (sessionStorage && Object.keys(sessionStorage).length > 0) {
    await page.evaluate((items: Record<string, string>) => {
      for (const [key, value] of Object.entries(items)) {
        (globalThis as any).sessionStorage.setItem(key, value);
      }
    }, sessionStorage);
  }
}
