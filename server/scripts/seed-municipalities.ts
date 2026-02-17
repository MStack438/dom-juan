#!/usr/bin/env tsx
/**
 * Seed Quebec municipalities from official government data
 * Source: https://donneesouvertes.affmunqc.net/repertoire/MUN.csv
 */

import { parse } from 'csv-parse/sync';
import { db } from '../src/db/index.js';
import { region } from '../src/db/schema/region.js';
import { eq } from 'drizzle-orm';

interface MunicipalityRow {
  mcode: string;
  munnom: string;
  regadm: string; // e.g., "Estrie (05)"
  mrc: string; // e.g., "MRC Brome-Missisquoi (460)"
}

function extractCodeAndName(text: string): { code: string; name: string } | null {
  if (!text || text.trim() === '') return null;

  // Pattern: "Name (Code)"
  const match = text.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (!match) return null;

  return {
    name: match[1].trim(),
    code: match[2].trim(),
  };
}

function generateUrlFragment(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  // Quick-check: if municipalities already exist, skip the entire fetch+seed
  const existingMunicipalities = await db
    .select()
    .from(region)
    .where(eq(region.level, 2))
    .limit(1);

  if (existingMunicipalities.length > 0) {
    console.log('✅ Municipalities already seeded — skipping fetch.\n');
    return;
  }

  console.log('📥 Fetching Quebec municipalities data...\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

  const response = await fetch('https://donneesouvertes.affmunqc.net/repertoire/MUN.csv', {
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as MunicipalityRow[];

  console.log(`✅ Loaded ${records.length} municipality records\n`);

  // Extract unique administrative regions (level 0)
  const adminRegionSet = new Map<string, { code: string; name: string }>();
  for (const row of records) {
    const parsed = extractCodeAndName(row.regadm);
    if (parsed) {
      adminRegionSet.set(parsed.code, parsed);
    }
  }

  console.log(`📍 Found ${adminRegionSet.size} administrative regions`);

  // Insert administrative regions
  const adminRegionMap = new Map<string, string>(); // code -> id
  for (const [code, { name }] of adminRegionSet) {
    const [existing] = await db
      .select()
      .from(region)
      .where(eq(region.code, code))
      .limit(1);

    if (existing) {
      adminRegionMap.set(code, existing.id);
      console.log(`   ↻ ${name} (${code}) - already exists`);
    } else {
      const [inserted] = await db
        .insert(region)
        .values({
          code,
          name,
          level: 0,
          urlFragment: generateUrlFragment(name),
        })
        .returning();

      adminRegionMap.set(code, inserted!.id);
      console.log(`   ✓ ${name} (${code})`);
    }
  }

  console.log('\n📍 Processing MRCs...');

  // Extract unique MRCs (level 1)
  const mrcSet = new Map<string, { code: string; name: string; adminRegionCode: string }>();
  for (const row of records) {
    const mrcParsed = extractCodeAndName(row.mrc);
    const adminParsed = extractCodeAndName(row.regadm);

    if (mrcParsed && adminParsed) {
      // Only add if not already in map
      if (!mrcSet.has(mrcParsed.code)) {
        mrcSet.set(mrcParsed.code, {
          code: mrcParsed.code,
          name: mrcParsed.name,
          adminRegionCode: adminParsed.code,
        });
      }
    }
  }

  console.log(`   Found ${mrcSet.size} MRCs`);

  // Insert MRCs
  const mrcMap = new Map<string, string>(); // code -> id
  for (const [code, { name, adminRegionCode }] of mrcSet) {
    const parentId = adminRegionMap.get(adminRegionCode);
    if (!parentId) {
      console.log(`   ⚠ MRC ${name} (${code}) - parent region ${adminRegionCode} not found, skipping`);
      continue;
    }

    const [existing] = await db
      .select()
      .from(region)
      .where(eq(region.code, code))
      .limit(1);

    if (existing) {
      mrcMap.set(code, existing.id);
      console.log(`   ↻ ${name} (${code}) - already exists`);
    } else {
      const [inserted] = await db
        .insert(region)
        .values({
          code,
          name,
          level: 1,
          parentId,
          urlFragment: generateUrlFragment(name),
        })
        .returning();

      mrcMap.set(code, inserted!.id);
      console.log(`   ✓ ${name} (${code})`);
    }
  }

  console.log('\n🏘️  Processing municipalities...');

  let inserted = 0;
  let skipped = 0;

  for (const row of records) {
    const mrcParsed = extractCodeAndName(row.mrc);

    if (!mrcParsed) {
      // Some municipalities may not have MRC (territories, reserves, etc.)
      skipped++;
      continue;
    }

    const parentId = mrcMap.get(mrcParsed.code);
    if (!parentId) {
      console.log(`   ⚠ Municipality ${row.munnom} - parent MRC ${mrcParsed.code} not found, skipping`);
      skipped++;
      continue;
    }

    const [existing] = await db
      .select()
      .from(region)
      .where(eq(region.code, row.mcode))
      .limit(1);

    if (existing) {
      skipped++;
    } else {
      await db
        .insert(region)
        .values({
          code: row.mcode,
          name: row.munnom,
          level: 2,
          parentId,
          urlFragment: generateUrlFragment(row.munnom),
        })
        .returning();

      inserted++;

      if (inserted % 100 === 0) {
        console.log(`   ... ${inserted} municipalities inserted so far`);
      }
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Municipalities inserted: ${inserted}`);
  console.log(`   Already existed: ${skipped}`);
  console.log(`\n📊 Summary:`);

  // Verify counts
  const level0Count = await db
    .select()
    .from(region)
    .where(eq(region.level, 0));

  const level1Count = await db
    .select()
    .from(region)
    .where(eq(region.level, 1));

  const level2Count = await db
    .select()
    .from(region)
    .where(eq(region.level, 2));

  console.log(`   Level 0 (Admin Regions): ${level0Count.length}`);
  console.log(`   Level 1 (MRCs): ${level1Count.length}`);
  console.log(`   Level 2 (Municipalities): ${level2Count.length}`);
  console.log(`   Total: ${level0Count.length + level1Count.length + level2Count.length}\n`);
}

// Only exit if running as a standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
main()
      .then(() => process.exit(0))
      .catch((error) => {
              console.error('❌ Seed error:', error);
              console.error('Stack:', error.stack);
              process.exit(1);
      });
}
