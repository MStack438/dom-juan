import dotenv from 'dotenv';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';

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
    // Create migrations tracking table
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Check if 0000_initial.sql is already marked
    const existing = await client.unsafe(
      "SELECT name FROM _migrations WHERE name = '0000_initial.sql'"
    );

    if (existing.length === 0) {
      // Mark initial migration as applied (since schema already exists)
      await client.unsafe(
        "INSERT INTO _migrations (name) VALUES ('0000_initial.sql')"
      );
      console.log('✓ Marked 0000_initial.sql as applied');
    } else {
      console.log('✓ 0000_initial.sql already marked as applied');
    }
  } finally {
    client.release();
    await sql.end();
  }
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
