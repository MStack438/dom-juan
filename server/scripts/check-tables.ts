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
  // Check tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('_migrations', 'circuit_breaker_state', 'fingerprint_usage', 'proxy_usage')
    ORDER BY table_name;
  `;

  console.log('\n✓ New Tables Created:');
  tables.forEach((t: any) => console.log(`  - ${t.table_name}`));

  // Check migrations applied
  const migrations = await sql`
    SELECT name, applied_at 
    FROM _migrations 
    ORDER BY name;
  `;

  console.log('\n✓ Migrations Applied:');
  migrations.forEach((m: any) => console.log(`  - ${m.name} (${m.applied_at.toISOString().split('T')[0]})`));

  // Check proxy_usage initialized
  const proxyUsage = await sql`SELECT * FROM proxy_usage;`;
  console.log('\n✓ Proxy Usage Initialized:');
  console.log(`  - ${proxyUsage.length} record(s)`);

  // Check circuit_breaker initialized
  const circuitBreaker = await sql`SELECT service, state FROM circuit_breaker_state;`;
  console.log('\n✓ Circuit Breaker Initialized:');
  circuitBreaker.forEach((cb: any) => console.log(`  - ${cb.service}: ${cb.state}`));

  await sql.end();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
