/**
 * Run a full scrape from the CLI (no auth). Use for testing or cron outside the app.
 * Usage: npm run scrape   (from repo root) or tsx scripts/manual-scrape.ts (from server)
 */
import './load-env.js';
import { runScrape } from '../src/services/scraper/scraper.service.js';

runScrape('manual')
  .then((runId) => {
    console.log('Scrape completed. Run ID:', runId);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Scrape failed:', err);
    process.exit(1);
  });
