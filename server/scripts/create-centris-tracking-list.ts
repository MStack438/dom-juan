#!/usr/bin/env tsx
/**
 * Creates a test Centris tracking list
 */

import { db } from '../src/db/index.js';
import { trackingList } from '../src/db/schema/tracking-list.js';

async function main() {
  console.log('Creating Centris test tracking list...\n');

  const [list] = await db
    .insert(trackingList)
    .values({
      name: 'Montreal Condos - Centris Test',
      description: 'Test tracking list for Centris.ca integration',
      source: 'centris',
      criteria: {
        propertyType: ['condo'],
        municipality: 'Montreal',
        priceMax: 600000,
        bedsMin: 2,
      },
      isActive: true,
    })
    .returning();

  console.log('✅ Created tracking list:');
  console.log(`   ID: ${list!.id}`);
  console.log(`   Name: ${list!.name}`);
  console.log(`   Source: ${list!.source}`);
  console.log(`   Criteria:`, JSON.stringify(list!.criteria, null, 2));
  console.log('\nNow run: npm run scrape');
  console.log('Or via API: POST /api/scrape/start\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
