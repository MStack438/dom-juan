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
    const r = await client.unsafe(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'region' LIMIT 1"
    );
    if (r.length > 0) {
      console.log('Schema already applied (region table exists).');
      return;
    }
    const migrationPath = path.join(
      __dirname,
      '../src/db/migrations/0000_initial.sql'
    );
    const content = readFileSync(migrationPath, 'utf-8');
    await client.unsafe(content);
    console.log('Applied 0000_initial.sql');
  } finally {
    client.release();
    await sql.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
