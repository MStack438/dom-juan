import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

try {
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM region WHERE level = 2`);
  console.log('Municipalities (level 2):', result.rows[0].count);
  
  const sample = await db.execute(sql`SELECT id, name, level FROM region WHERE level = 2 LIMIT 5`);
  console.log('\nSample municipalities:');
  sample.rows.forEach(r => console.log(`  - ${r.name} (level ${r.level})`));
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
