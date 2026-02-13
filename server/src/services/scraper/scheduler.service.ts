import cron from 'node-cron';
import { executeScrapeRun, startScrapeRun } from './scraper.service.js';

const SCRAPE_HOUR = parseInt(process.env.SCRAPE_HOUR ?? '6', 10);
const SCRAPE_TIMEZONE = 'America/Toronto';

export function initializeScheduler(): void {
  cron.schedule(
    `0 ${SCRAPE_HOUR} * * *`,
    async () => {
      console.log(
        `[Scheduler] Starting scheduled scrape at ${new Date().toISOString()}`
      );
      try {
        const runId = await startScrapeRun('scheduled');
        executeScrapeRun(runId).catch((err) =>
          console.error('[Scheduler] Scrape failed:', err)
        );
        console.log(`[Scheduler] Scrape run started. Run ID: ${runId}`);
      } catch (error) {
        console.error('[Scheduler] Failed to start scrape:', error);
      }
    },
    { timezone: SCRAPE_TIMEZONE }
  );

  cron.schedule(
    '0 3 * * 0',
    async () => {
      console.log(
        `[Scheduler] Weekly detail refresh placeholder at ${new Date().toISOString()}`
      );
      // TODO: Implement weekly detail refresh
    },
    { timezone: SCRAPE_TIMEZONE }
  );

  console.log(
    `[Scheduler] Initialized. Daily scrape at ${SCRAPE_HOUR}:00 ${SCRAPE_TIMEZONE}`
  );
}
