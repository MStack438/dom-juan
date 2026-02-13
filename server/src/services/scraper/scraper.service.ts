import { chromium, type Browser } from 'playwright';
import { db } from '../../db/index.js';
import { listing } from '../../db/schema/listing.js';
import { snapshot } from '../../db/schema/snapshot.js';
import { trackingList } from '../../db/schema/tracking-list.js';
import { listingTrackingList } from '../../db/schema/listing-tracking-list.js';
import { scrapeRun } from '../../db/schema/scrape-run.js';
import { buildSearchUrl, buildFromCustomUrl } from './url-builder.service.js';
import { parseSearchResults, parseDetailPage } from './parser.service.js';
import { pingHealthcheck } from '../notification/healthcheck.service.js';
import { eq, and } from 'drizzle-orm';
import type { TrackingCriteria } from '../../types/criteria.js';
import type { ScrapeError } from '../../types/api.js';

const DELAY_MIN_MS = 2000;
const DELAY_MAX_MS = 4000;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const MAX_REQUESTS_PER_RUN = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  const ms =
    Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS)) + DELAY_MIN_MS;
  return delay(ms);
}

function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)] ?? userAgents[0];
}

/**
 * Creates a scrape run record and returns its id. Use with executeScrapeRun.
 */
export async function startScrapeRun(
  type: 'scheduled' | 'manual' = 'manual'
): Promise<string> {
  const [run] = await db
    .insert(scrapeRun)
    .values({ runType: type })
    .returning();
  return run!.id;
}

/**
 * Runs the scrape logic for an existing run record. Updates the record on completion.
 */
export async function executeScrapeRun(runId: string): Promise<void> {
  let browser: Browser | null = null;
  let consecutiveFailures = 0;
  const errors: ScrapeError[] = [];
  let stats = {
    trackingListsProcessed: 0,
    listingsFound: 0,
    listingsNew: 0,
    listingsUpdated: 0,
    listingsDelisted: 0,
  };
  let totalRequests = 0;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
    });

    const activeLists = await db
      .select()
      .from(trackingList)
      .where(eq(trackingList.isActive, true));

    for (const list of activeLists) {
      if (totalRequests >= MAX_REQUESTS_PER_RUN) break;

      try {
        const searchUrl = list.customUrl
          ? buildFromCustomUrl(list.customUrl)
          : buildSearchUrl((list.criteria ?? {}) as TrackingCriteria);

        const seenMlsNumbers = new Set<string>();
        const page = await context.newPage();
        let currentPage = 1;
        let hasMorePages = true;

        while (hasMorePages && totalRequests < MAX_REQUESTS_PER_RUN) {
          const pageUrl = `${searchUrl}${searchUrl.includes('?') ? '&' : '?'}CurrentPage=${currentPage}`;

          await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await randomDelay();
          totalRequests++;

          const results = await parseSearchResults(page);

          if (results.length === 0) {
            hasMorePages = false;
            break;
          }

          for (const result of results) {
            seenMlsNumbers.add(result.mlsNumber);
            stats.listingsFound++;

            const existing = await db
              .select()
              .from(listing)
              .where(eq(listing.mlsNumber, result.mlsNumber))
              .limit(1);

            if (existing.length === 0) {
              await randomDelay();
              const detailPage = await context.newPage();
              try {
                await detailPage.goto(result.detailUrl, {
                  waitUntil: 'domcontentloaded',
                  timeout: 30000,
                });
                totalRequests++;
                const details = await parseDetailPage(detailPage);

                const [newListing] = await db
                  .insert(listing)
                  .values({
                    mlsNumber: result.mlsNumber,
                    sourceUrl: result.detailUrl,
                    address: result.address,
                    municipality: details.municipality ?? null,
                    postalCode: details.postalCode ?? null,
                    originalPrice: result.price,
                    currentPrice: result.price,
                    status: 'active',
                    propertyType: details.propertyType ?? null,
                    yearBuilt: details.yearBuilt ?? null,
                    lotSizeSqft: details.lotSizeSqft ?? null,
                    livingAreaSqft: details.livingAreaSqft ?? null,
                    bedrooms: details.bedrooms ?? null,
                    bathrooms: details.bathrooms ?? null,
                    bathroomsHalf: details.bathroomsHalf ?? null,
                    stories:
                      details.stories != null
                        ? String(details.stories)
                        : null,
                    hasGarage: details.hasGarage ?? null,
                    garageSpaces: details.garageSpaces ?? null,
                    hasBasement: details.hasBasement ?? null,
                    basementType: details.basementType ?? null,
                    basementFinished: details.basementFinished ?? null,
                    hasPool: details.hasPool ?? null,
                    poolType: details.poolType ?? null,
                    hasAc: details.hasAc ?? null,
                    hasFireplace: details.hasFireplace ?? null,
                    heatingType: details.heatingType ?? null,
                    waterSupply: details.waterSupply ?? null,
                    sewage: details.sewage ?? null,
                    descriptionText: details.descriptionText ?? null,
                    photoUrls: details.photoUrls ?? [],
                    photoCount: details.photoCount ?? 0,
                    brokerName: details.brokerName ?? null,
                    brokerAgency: details.brokerAgency ?? null,
                    lastDetailScrapeAt: new Date(),
                  })
                  .returning();

                await db.insert(listingTrackingList).values({
                  listingId: newListing!.id,
                  trackingListId: list.id,
                });

                await db.insert(snapshot).values({
                  listingId: newListing!.id,
                  price: result.price,
                  status: 'active',
                });

                stats.listingsNew++;
              } finally {
                await detailPage.close();
              }
            } else {
              const existingListing = existing[0]!;
              const priceChanged =
                existingListing.currentPrice !== result.price;

              await db
                .update(listing)
                .set({
                  lastSeenAt: new Date(),
                  currentPrice: result.price,
                  priceChangeCount: priceChanged
                    ? existingListing.priceChangeCount + 1
                    : existingListing.priceChangeCount,
                  status: 'active',
                  delistedAt: null,
                  updatedAt: new Date(),
                })
                .where(eq(listing.id, existingListing.id));

              await db
                .insert(listingTrackingList)
                .values({
                  listingId: existingListing.id,
                  trackingListId: list.id,
                })
                .onConflictDoNothing({
                  target: [
                    listingTrackingList.listingId,
                    listingTrackingList.trackingListId,
                  ],
                });

              await db.insert(snapshot).values({
                listingId: existingListing.id,
                price: result.price,
                status: 'active',
              });

              if (priceChanged) stats.listingsUpdated++;
            }

            consecutiveFailures = 0;
          }

          currentPage++;
          if (currentPage > 20) hasMorePages = false;
        }

        await page.close();

        const linkedListings = await db
          .select({ mlsNumber: listing.mlsNumber, id: listing.id })
          .from(listing)
          .innerJoin(
            listingTrackingList,
            eq(listing.id, listingTrackingList.listingId)
          )
          .where(
            and(
              eq(listingTrackingList.trackingListId, list.id),
              eq(listing.status, 'active')
            )
          );

        for (const linked of linkedListings) {
          if (!seenMlsNumbers.has(linked.mlsNumber)) {
            await db
              .update(listing)
              .set({
                status: 'delisted',
                delistedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(listing.id, linked.id));

            const [currentListing] = await db
              .select()
              .from(listing)
              .where(eq(listing.id, linked.id))
              .limit(1);
            if (currentListing) {
              await db.insert(snapshot).values({
                listingId: linked.id,
                price: currentListing.currentPrice,
                status: 'delisted',
              });
            }
            stats.listingsDelisted++;
          }
        }

        stats.trackingListsProcessed++;
      } catch (error) {
        consecutiveFailures++;
        errors.push({
          timestamp: new Date().toISOString(),
          severity: 'error',
          category: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          context: { trackingListId: list.id },
          stack: error instanceof Error ? error.stack : undefined,
        });

        if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
          errors.push({
            timestamp: new Date().toISOString(),
            severity: 'critical',
            category: 'unknown',
            message: 'Circuit breaker triggered - aborting scrape run',
            context: {},
          });
          break;
        }
      }
    }

    await db
      .update(scrapeRun)
      .set({
        completedAt: new Date(),
        status: errors.some((e) => e.severity === 'critical')
          ? 'partial'
          : 'completed',
        trackingListsProcessed: stats.trackingListsProcessed,
        listingsFound: stats.listingsFound,
        listingsNew: stats.listingsNew,
        listingsUpdated: stats.listingsUpdated,
        listingsDelisted: stats.listingsDelisted,
        errors,
      })
      .where(eq(scrapeRun.id, runId));

    await pingHealthcheck('success');
  } catch (error) {
    await db
      .update(scrapeRun)
      .set({
        completedAt: new Date(),
        status: 'failed',
        trackingListsProcessed: stats.trackingListsProcessed,
        listingsFound: stats.listingsFound,
        listingsNew: stats.listingsNew,
        listingsUpdated: stats.listingsUpdated,
        listingsDelisted: stats.listingsDelisted,
        errors: [
          ...errors,
          {
            timestamp: new Date().toISOString(),
            severity: 'critical',
            category: 'unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            context: {},
            stack: error instanceof Error ? error.stack : undefined,
          },
        ],
      })
      .where(eq(scrapeRun.id, runId));

    await pingHealthcheck('fail');
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Start a scrape run and execute it. Returns run id after creating the record.
 * For manual trigger, prefer: startScrapeRun then executeScrapeRun in background.
 */
export async function runScrape(
  type: 'scheduled' | 'manual' = 'manual'
): Promise<string> {
  const runId = await startScrapeRun(type);
  await executeScrapeRun(runId);
  return runId;
}

export function isScrapeRunning(): Promise<boolean> {
  return db
    .select({ id: scrapeRun.id })
    .from(scrapeRun)
    .where(eq(scrapeRun.status, 'running'))
    .limit(1)
    .then((rows) => rows.length > 0);
}
