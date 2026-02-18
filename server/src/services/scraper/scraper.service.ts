import { db } from '../../db/index.js';
import { listing } from '../../db/schema/listing.js';
import { snapshot } from '../../db/schema/snapshot.js';
import { trackingList } from '../../db/schema/tracking-list.js';
import { listingTrackingList } from '../../db/schema/listing-tracking-list.js';
import { scrapeRun } from '../../db/schema/scrape-run.js';
import { buildSearchUrl, buildFromCustomUrl } from './url-builder.service.js';
import { parseSearchResults, parseDetailPage } from './parser.service.js';
import {
  buildCentrisSearchUrl,
  buildFromCentrisCustomUrl,
} from './centris-url-builder.service.js';
import {
  parseCentrisSearchResults,
  type CentrisSearchResult,
} from './centris-parser.service.js';
import { pingHealthcheck } from '../notification/healthcheck.service.js';
import { eq, and } from 'drizzle-orm';
import type { TrackingCriteria } from '../../types/criteria.js';
import type { ScrapeError } from '../../types/api.js';
import { SCRAPER_CONFIG } from '../../config/scraper.config.js';
import {
  injectStealthScripts,
  getStealthHeaders,
  getRealisticUserAgent,
  simulateHumanBehavior,
} from './stealth/stealth-injection.service.js';
import {
  getProxyConfiguration,
  trackBandwidthUsage,
  isOverBudget,
  BANDWIDTH_ESTIMATES,
} from './stealth/proxy.service.js';
import { withRetry, retryPageNavigation } from './stealth/retry.service.js';
import {
  getFingerprint,
  markFingerprintUsed,
  applyFingerprintToContext,
  getFingerprintedStealthScript,
} from './stealth/fingerprint.service.js';
import {
  canExecute as circuitBreakerCanExecute,
  recordSuccess as circuitBreakerSuccess,
  recordFailure as circuitBreakerFailure,
} from './stealth/circuit-breaker.service.js';
import {
  simulateHumanPageInteraction,
  scrollLikeHuman,
  simulateReadingTime,
} from './stealth/human-behavior.service.js';
import {
  waitWithIntelligentDelay,
  getDetailPageDelay,
  getSearchPageDelay,
} from './stealth/timing.service.js';
import {
  loadSession,
  saveSession,
} from './stealth/session.service.js';

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
  // Lazy-import Playwright so the server can start even when browser binaries
  // are missing (e.g. Railway). Playwright is only needed when a scrape runs.
  let chromium: any;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch (error) {
    const errorMsg = 'Playwright not installed. Run: npx playwright install chromium';
    console.error(`[Scraper] ${errorMsg}`, error);
    throw new Error(errorMsg);
  }

  let browser: any = null;
  let realtorContext: any = null;
  let centrisContext: any = null;
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
  let currentFingerprint = await getFingerprint(); // Initialize fingerprint for Realtor context

  try {
    // Launch browser with stealth args
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
        ],
      });
    } catch (launchError) {
      const errorMsg =
        'Failed to launch browser. Playwright binaries may not be installed. ' +
        'Run: npx playwright install chromium --with-deps';
      console.error(`[Scraper] ${errorMsg}`, launchError);
      throw new Error(errorMsg);
    }

    // Create separate contexts for Centris and Realtor
    // Centris: Basic context (no proxy, minimal stealth)
    centrisContext = await browser.newContext({
      userAgent: getRealisticUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-CA',
      timezoneId: 'America/Montreal',
    });

    // Realtor: Enhanced stealth context with proxy and fingerprint rotation (if enabled)
    const proxyConfig = await getProxyConfiguration(SCRAPER_CONFIG.realtor.proxy);

    console.log(`[Scraper] Using fingerprint: ${currentFingerprint.id} (${currentFingerprint.platform})`);

    realtorContext = await browser.newContext({
      ...applyFingerprintToContext(currentFingerprint),
      locale: 'en-CA',
      timezoneId: 'America/Montreal',
      extraHTTPHeaders: getStealthHeaders('CA'),
      ...(proxyConfig && { proxy: proxyConfig }),
    });

    // Inject fingerprinted stealth scripts into Realtor context
    if (SCRAPER_CONFIG.realtor.stealth.enabled) {
      await realtorContext.addInitScript(getFingerprintedStealthScript(currentFingerprint));
      console.log('[Scraper] Realtor.ca stealth enabled with fingerprint rotation');
    }

    if (proxyConfig) {
      console.log(`[Scraper] Realtor.ca proxy enabled: ${SCRAPER_CONFIG.realtor.proxy.service}`);
    } else if (SCRAPER_CONFIG.realtor.proxy.enabled) {
      console.warn('[Scraper] Proxy configured but disabled (budget exceeded or unavailable)');
    }

    // Load session cookies (Tier 3)
    if (SCRAPER_CONFIG.realtor.stealth.sessionPersistence) {
      await loadSession(realtorContext, 'realtor');
      await loadSession(centrisContext, 'centris');
    }

    const activeLists = await db
      .select()
      .from(trackingList)
      .where(eq(trackingList.isActive, true));

    for (const list of activeLists) {
      if (totalRequests >= MAX_REQUESTS_PER_RUN) break;

      try {
        // Determine source (realtor or centris)
        const source = list.source || 'realtor';
        console.log(`[Scraper] Processing list: ${list.name} (source: ${source})`);

        // Check circuit breaker for Realtor source
        if (source === 'realtor') {
          const circuitCheck = await circuitBreakerCanExecute('realtor');
          if (!circuitCheck.allowed) {
            console.warn(`[Scraper] ${circuitCheck.reason} - skipping list`);
            errors.push({
              timestamp: new Date().toISOString(),
              severity: 'warning',
              category: 'rate_limit',
              message: circuitCheck.reason || 'Circuit breaker open',
              context: { trackingListId: list.id },
            });
            continue; // Skip this list
          }
        }

        // Build appropriate search URL based on source
        let searchUrl: string;
        if (source === 'centris') {
          searchUrl = list.customUrl
            ? buildFromCentrisCustomUrl(list.customUrl)
            : buildCentrisSearchUrl((list.criteria ?? {}) as TrackingCriteria);
        } else {
          searchUrl = list.customUrl
            ? buildFromCustomUrl(list.customUrl)
            : buildSearchUrl((list.criteria ?? {}) as TrackingCriteria);
        }

        const seenMlsNumbers = new Set<string>();
        const seenCentrisNumbers = new Set<string>();

        // Use appropriate context based on source
        const contextToUse = source === 'centris' ? centrisContext : realtorContext;
        const page = await contextToUse.newPage();
        let currentPage = 1;
        let hasMorePages = true;

        while (hasMorePages && totalRequests < MAX_REQUESTS_PER_RUN) {
          const pageUrl = `${searchUrl}${searchUrl.includes('?') ? '&' : '?'}CurrentPage=${currentPage}`;

          // Use retry logic for navigation (especially for Realtor with Incapsula)
          const retryConfig = source === 'realtor' ? SCRAPER_CONFIG.realtor.retry : {
            maxAttempts: 2,
            baseDelayMs: 1000,
            maxDelayMs: 5000,
            backoffMultiplier: 2,
            enableJitter: false,
          };

          await retryPageNavigation(
            async () => {
              await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            },
            retryConfig,
            pageUrl
          );

          // Track bandwidth usage for Realtor (proxy traffic)
          if (source === 'realtor' && SCRAPER_CONFIG.realtor.proxy.enabled) {
            await trackBandwidthUsage(BANDWIDTH_ESTIMATES.searchPage);
          }

          // Intelligent delay with time-awareness (Tier 3)
          if (source === 'realtor' && SCRAPER_CONFIG.realtor.stealth.intelligentTiming) {
            await waitWithIntelligentDelay({
              minDelayMs: getSearchPageDelay(),
              maxDelayMs: getSearchPageDelay() + 2000,
              burstProtection: true,
              timeOfDayAware: true,
            });
          } else {
            await randomDelay();
          }

          // Extra wait for React/SPA to hydrate and render listings
          await delay(8000);

          // Advanced human behavior simulation (Tier 3)
          if (source === 'realtor' && SCRAPER_CONFIG.realtor.stealth.enabled) {
            if (SCRAPER_CONFIG.realtor.stealth.advancedHumanBehavior) {
              await simulateHumanPageInteraction(page, {
                scroll: true,
                mouseMovement: true,
                readingTime: true,
              });
            } else {
              // Fallback to basic simulation
              await simulateHumanBehavior(page);
            }
          }

          totalRequests++;

          // Parse results based on source
          if (source === 'centris') {
            const centrisResults = await parseCentrisSearchResults(page);

            if (centrisResults.length === 0) {
              hasMorePages = false;
              break;
            }

            for (const result of centrisResults) {
              seenCentrisNumbers.add(result.centrisNumber);
              stats.listingsFound++;

              const existing = await db
                .select()
                .from(listing)
                .where(eq(listing.centrisNumber, result.centrisNumber))
                .limit(1);

              if (existing.length === 0) {
                // New Centris listing - for now, save without detail scrape
                const [newListing] = await db
                  .insert(listing)
                  .values({
                    source: 'centris',
                    mlsNumber: result.centrisNumber, // Use Centris number as MLS for uniqueness
                    centrisNumber: result.centrisNumber,
                    sourceUrl: result.detailUrl,
                    address: result.address,
                    municipality: null, // TODO: Parse from address
                    postalCode: null,
                    originalPrice: result.price,
                    currentPrice: result.price,
                    status: 'active',
                    bedrooms: result.bedrooms ?? null,
                    bathrooms: result.bathrooms ?? null,
                    photoCount: result.photoCount ?? 0,
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
          } else {
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
              // Intelligent delay before detail page (Tier 3)
              if (source === 'realtor' && SCRAPER_CONFIG.realtor.stealth.intelligentTiming) {
                await waitWithIntelligentDelay({
                  minDelayMs: getDetailPageDelay(),
                  maxDelayMs: getDetailPageDelay() + 2000,
                  burstProtection: true,
                  timeOfDayAware: true,
                });
              } else {
                await randomDelay();
              }

              const detailPage = await contextToUse.newPage();

              // Track bandwidth for detail page (Realtor only)
              if (source === 'realtor' && SCRAPER_CONFIG.realtor.proxy.enabled) {
                await trackBandwidthUsage(BANDWIDTH_ESTIMATES.detailPage);
              }
              try {
                await detailPage.goto(result.detailUrl, {
                  waitUntil: 'networkidle',
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
                    originalListDate: details.originalListDate ?? null,
                    listedDaysWhenFound: details.daysOnMarket ?? null,
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
        }

        currentPage++;
        if (currentPage > 20) hasMorePages = false;
      }

        await page.close();

        // Record success to circuit breaker and fingerprint for Realtor
        if (source === 'realtor') {
          await circuitBreakerSuccess('realtor');
          await markFingerprintUsed(currentFingerprint.id, true);
        }

        const linkedListings = await db
          .select({
            mlsNumber: listing.mlsNumber,
            centrisNumber: listing.centrisNumber,
            id: listing.id,
            source: listing.source,
          })
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
          // Check appropriate ID set based on source
          const shouldDelist =
            linked.source === 'centris'
              ? linked.centrisNumber && !seenCentrisNumbers.has(linked.centrisNumber)
              : !seenMlsNumbers.has(linked.mlsNumber);

          if (shouldDelist) {
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

        // Determine source for circuit breaker (default to realtor if not set yet)
        const source = list.source || 'realtor';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        errors.push({
          timestamp: new Date().toISOString(),
          severity: 'error',
          category: 'unknown',
          message: errorMessage,
          context: { trackingListId: list.id },
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Record failure to circuit breaker and fingerprint for Realtor
        if (source === 'realtor') {
          await circuitBreakerFailure('realtor', errorMessage);
          await markFingerprintUsed(currentFingerprint.id, false);
        }

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
    // Save sessions before closing (Tier 3)
    if (SCRAPER_CONFIG.realtor.stealth.sessionPersistence) {
      if (realtorContext) {
        await saveSession(realtorContext, 'realtor');
      }
      if (centrisContext) {
        await saveSession(centrisContext, 'centris');
      }
    }

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
