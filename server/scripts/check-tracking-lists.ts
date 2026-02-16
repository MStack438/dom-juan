#!/usr/bin/env tsx
import './load-env.js';
import { db } from '../src/db/index.js';
import { trackingList } from '../src/db/schema/tracking-list.js';

async function checkLists() {
  const lists = await db.select().from(trackingList);

  console.log(`\n📋 Tracking Lists: ${lists.length} total\n`);

  if (lists.length === 0) {
    console.log('❌ No tracking lists found in database.');
    console.log('\nThe scraper needs at least one active tracking list to scrape.');
    console.log('\nTo add a tracking list:');
    console.log('  1. Start the app: npm run dev');
    console.log('  2. Visit http://localhost:5000');
    console.log('  3. Go to "Tracking Lists" and create one');
  } else {
    lists.forEach((list, i) => {
      console.log(`${i + 1}. ${list.name}`);
      console.log(`   Active: ${list.isActive ? '✅' : '❌'}`);
      console.log(`   Created: ${list.createdAt}`);
      if (list.customUrl) {
        console.log(`   URL: ${list.customUrl}`);
      } else {
        console.log(`   Criteria: ${JSON.stringify(list.criteria)}`);
      }
      console.log('');
    });
  }

  process.exit(0);
}

checkLists();
