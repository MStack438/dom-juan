import 'dotenv/config';
import { db } from '../src/db/index.js';
import { region } from '../src/db/schema/region.js';

const QUEBEC_REGIONS = [
  { code: 'monteregie', name: 'Montérégie', level: 0 },
  { code: 'laurentides', name: 'Laurentides', level: 0 },
  { code: 'lanaudiere', name: 'Lanaudière', level: 0 },
  { code: 'centre-du-quebec', name: 'Centre-du-Québec', level: 0 },
  { code: 'chaudiere-appalaches', name: 'Chaudière-Appalaches', level: 0 },
  { code: 'capitale-nationale', name: 'Capitale-Nationale', level: 0 },
  { code: 'estrie', name: 'Estrie', level: 0 },
  { code: 'outaouais', name: 'Outaouais', level: 0 },
  { code: 'mauricie', name: 'Mauricie', level: 0 },
  { code: 'chateauguay', name: 'Châteauguay', level: 1, parentCode: 'monteregie' },
  { code: 'beauharnois', name: 'Beauharnois', level: 1, parentCode: 'monteregie' },
  { code: 'huntingdon', name: 'Huntingdon', level: 1, parentCode: 'monteregie' },
  { code: 'ormstown', name: 'Ormstown', level: 1, parentCode: 'monteregie' },
  { code: 'st-lazare', name: 'Saint-Lazare', level: 1, parentCode: 'monteregie' },
  { code: 'rigaud', name: 'Rigaud', level: 1, parentCode: 'monteregie' },
  { code: 'sorel-tracy', name: 'Sorel-Tracy', level: 1, parentCode: 'monteregie' },
  { code: 'st-constant', name: 'Saint-Constant', level: 1, parentCode: 'monteregie' },
  { code: 'candiac', name: 'Candiac', level: 1, parentCode: 'monteregie' },
  { code: 'brossard', name: 'Brossard', level: 1, parentCode: 'monteregie' },
  { code: 'levis', name: 'Lévis', level: 1, parentCode: 'chaudiere-appalaches' },
] as const;

type Row = (typeof QUEBEC_REGIONS)[number];

async function seed() {
  const existing = await db.select({ code: region.code, id: region.id }).from(region);
  const codeToId = new Map(existing.map((r) => [r.code, r.id]));

  for (const row of QUEBEC_REGIONS) {
    const parentId =
      'parentCode' in row ? codeToId.get(row.parentCode) ?? null : null;
    const [inserted] = await db
      .insert(region)
      .values({
        code: row.code,
        name: row.name,
        level: row.level,
        parentId: parentId ?? undefined,
      })
      .onConflictDoNothing({ target: region.code })
      .returning({ id: region.id });
    if (inserted) {
      codeToId.set(row.code, inserted.id);
    }
  }

  console.log('Region seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
