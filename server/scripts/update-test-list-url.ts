#!/usr/bin/env tsx
import './load-env.js';
import { db } from '../src/db/index.js';
import { trackingList } from '../src/db/schema/tracking-list.js';
import { eq } from 'drizzle-orm';

async function updateTestListURL() {
  const newUrl = 'https://www.realtor.ca/qc/greater-montreal/real-estate?TransactionTypeId=2&PropertyTypeGroupID=1&PriceMax=300000&Currency=CAD';

  const [updated] = await db
    .update(trackingList)
    .set({ customUrl: newUrl })
    .where(eq(trackingList.name, 'Test Montreal Houses'))
    .returning();

  if (updated) {
    console.log('✅ Updated tracking list URL:');
    console.log(`   Name: ${updated.name}`);
    console.log(`   New URL: ${updated.customUrl}`);
  } else {
    console.log('⚠️  No tracking list found with name "Test Montreal Houses"');
    console.log('   Run: npm run create-test-list');
  }

  process.exit(0);
}

updateTestListURL();
