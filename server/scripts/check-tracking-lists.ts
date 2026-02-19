#!/usr/bin/env tsx
import './load-env.js';
import { db } from '../src/db/index.js';
import { trackingList } from '../src/db/schema/tracking-list.js';

async function checkTrackingLists() {
  const lists = await db.select().from(trackingList);

  console.log(`\n📋 Found ${lists.length} tracking lists:\n`);

  for (const list of lists) {
    console.log(`[${list.id}] ${list.name}`);
    console.log(`     Active: ${list.isActive}`);
    console.log(`     Source: ${list.criteria?.source || 'realtor'}`);
    console.log(`     URL: ${list.customUrl || 'N/A'}`);
    console.log('');
  }

  process.exit(0);
}

checkTrackingLists();
