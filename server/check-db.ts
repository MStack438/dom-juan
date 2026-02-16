import { db } from './src/db/index.js';
import { region } from './src/db/schema/region.js';
import { sql, eq } from 'drizzle-orm';

try {
  const count = await db.execute(sql`SELECT COUNT(*) as count FROM region WHERE level = 2`);
  console.log('Level 2 (Municipalities):', count.rows[0].count);
  
  const sample = await db.select().from(region).where(eq(region.level, 2)).limit(5);
  console.log('\nSample municipalities:');
  sample.forEach(r => console.log(`  - ${r.name}`));
  
  process.exit(0);
} catch (err) {
  console.error('Database error:', err instanceof Error ? err.message : err);
  process.exit(1);
}
