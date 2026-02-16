#!/usr/bin/env tsx
import './load-env.js';
import { db } from '../src/db/index.js';
import { scrapeRun } from '../src/db/schema/scrape-run.js';
import { listing } from '../src/db/schema/listing.js';
import { desc } from 'drizzle-orm';

async function checkResults() {
  // Get latest scrape run
  const runs = await db
    .select()
    .from(scrapeRun)
    .orderBy(desc(scrapeRun.startedAt))
    .limit(1);

  if (runs.length === 0) {
    console.log('No scrape runs found.');
    return;
  }

  const run = runs[0];
  console.log('\n📊 Latest Scrape Run:');
  console.log('==================');
  console.log(`Status: ${run.status}`);
  console.log(`Started: ${run.startedAt}`);
  console.log(`Completed: ${run.completedAt}`);
  console.log(`Listings found: ${run.listingsFound}`);
  console.log(`Listings new: ${run.listingsNew}`);
  console.log(`Listings updated: ${run.listingsUpdated}`);
  console.log(`Listings delisted: ${run.listingsDelisted}`);

  if (run.errors && Array.isArray(run.errors) && run.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${run.errors.length}`);
    run.errors.forEach((err: any, i: number) => {
      console.log(`  ${i + 1}. ${err.message || err}`);
    });
  }

  // Get total listings in database
  const allListings = await db.select().from(listing);
  console.log(`\n📦 Total listings in database: ${allListings.length}`);

  if (allListings.length > 0) {
    console.log('\n🏠 Sample listings:');
    allListings.slice(0, 3).forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.address} - $${l.currentPrice?.toLocaleString()} (MLS: ${l.mlsNumber})`);
    });
  }

  process.exit(0);
}

checkResults();
