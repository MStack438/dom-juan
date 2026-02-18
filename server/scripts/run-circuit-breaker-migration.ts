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

async function run() {
  const client = await sql.reserve();
  try {
    // Check if table already exists
    const r = await client.unsafe(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'circuit_breaker_state' LIMIT 1"
    );
    if (r.length > 0) {
      console.log('circuit_breaker_state table already exists - migration skipped');
      return;
    }

    // Run the migration
    const migrationPath = path.join(__dirname, '../drizzle/0001_circuit_breaker.sql');
    const content = readFileSync(migrationPath, 'utf-8');
    await client.unsafe(content);
    console.log('✓ Applied 0001_circuit_breaker.sql migration');
    console.log('✓ Circuit breaker state table created');
    console.log('✓ Initialized states for realtor and centris services');
  } finally {
    client.release();
    await sql.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
