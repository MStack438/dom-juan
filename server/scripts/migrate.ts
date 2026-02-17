import dotenv from 'dotenv';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(url);

/**
 * Migrations applied in order. Each uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
 * so they are safe to re-run (idempotent).
 */
const MIGRATIONS = [
  { name: '0000_initial.sql', path: path.join(__dirname, '../src/db/migrations/0000_initial.sql') },
  { name: 'add-centris-support.sql', path: path.join(__dirname, '../migrations/add-centris-support.sql') },
  { name: 'add-listing-date-fields.sql', path: path.join(__dirname, '../migrations/add-listing-date-fields.sql') },
];

async function run() {
  const client = await sql.reserve();
  try {
    // Check if initial schema exists
    const r = await client.unsafe(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'region' LIMIT 1"
    );
    const schemaExists = r.length > 0;

    for (const migration of MIGRATIONS) {
      // Skip initial migration if schema already exists
      if (migration.name === '0000_initial.sql' && schemaExists) {
        console.log(`↻ ${migration.name} — schema already exists, skipping`);
        continue;
      }

      try {
        const content = readFileSync(migration.path, 'utf-8');
        await client.unsafe(content);
        console.log(`✓ Applied ${migration.name}`);
      } catch (err) {
        // IF NOT EXISTS migrations may warn but not fail — log and continue
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('already exists')) {
          console.log(`↻ ${migration.name} — already applied`);
        } else {
          throw err;
        }
      }
    }

    console.log('Migration complete.');
  } finally {
    client.release();
    await sql.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
