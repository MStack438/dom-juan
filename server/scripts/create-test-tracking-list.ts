#!/usr/bin/env tsx
import './load-env.js';
import { db } from '../src/db/index.js';
import { trackingList } from '../src/db/schema/tracking-list.js';

async function createTestList() {
  const [list] = await db
    .insert(trackingList)
    .values({
      name: 'Test Montreal Houses',
      isActive: true,
      customUrl: 'https://www.realtor.ca/map#ZoomLevel=10&Center=45.508888%2C-73.561668&Sort=6-D&TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD',
      criteria: {
        province: 'QC',
        priceMax: 300000,
        propertyType: ['detached'],
      },
    })
    .returning();

  console.log('✅ Created tracking list:');
  console.log(`   Name: ${list.name}`);
  console.log(`   ID: ${list.id}`);
  console.log(`   Active: ${list.isActive}`);
  console.log('\nNow run: npm run scrape');

  process.exit(0);
}

createTestList();
