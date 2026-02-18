import dotenv from 'dotenv';
import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
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

interface Migration {
  name: string;
  path: string;
}

/**
 * Get all migration files from both directories, sorted by name
 */
function getMigrationFiles(): Migration[] {
  const migrations: Migration[] = [];

  // Check src/db/migrations directory
  const srcMigrationsDir = path.join(__dirname, '../src/db/migrations');
  try {
    const srcFiles = readdirSync(srcMigrationsDir).filter((f) => f.endsWith('.sql'));
    for (const file of srcFiles) {
      migrations.push({
        name: file,
        path: path.join(srcMigrationsDir, file),
      });
    }
  } catch (err) {
    // Directory doesn't exist or no files - skip
  }

  // Check drizzle directory
  const drizzleDir = path.join(__dirname, '../drizzle');
  try {
    const drizzleFiles = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql'));
    for (const file of drizzleFiles) {
      migrations.push({
        name: file,
        path: path.join(drizzleDir, file),
      });
    }
  } catch (err) {
    // Directory doesn't exist or no files - skip
  }

  // Sort by filename (0000_initial.sql, 0001_circuit_breaker.sql, etc.)
  return migrations.sort((a, b) => a.name.localeCompare(b.name));
}

async function run() {
  const client = await sql.reserve();
  try {
    // Create migrations tracking table if it doesn't exist
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Get all migration files
    const migrations = getMigrationFiles();

    if (migrations.length === 0) {
      console.log('No migration files found');
      return;
    }

    console.log(`Found ${migrations.length} migration file(s)`);

    // Get already applied migrations
    const applied = await client.unsafe(
      'SELECT name FROM _migrations ORDER BY name'
    );
    const appliedNames = new Set(applied.map((row: any) => row.name));

    let appliedCount = 0;

    // Apply migrations in order
    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) {
        console.log(`✓ ${migration.name} (already applied)`);
        continue;
      }

      console.log(`⟳ Applying ${migration.name}...`);

      try {
        const content = readFileSync(migration.path, 'utf-8');
        await client.unsafe(content);

        // Mark as applied
        await client.unsafe(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [migration.name]
        );

        console.log(`✓ ${migration.name} applied successfully`);
        appliedCount++;
      } catch (err) {
        console.error(`✗ Failed to apply ${migration.name}:`, err);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('\n✓ All migrations already applied - database is up to date');
    } else {
      console.log(`\n✓ Applied ${appliedCount} new migration(s)`);
    }
  } finally {
    client.release();
    await sql.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
