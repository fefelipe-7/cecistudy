import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalize } from '../canonicalJson';
import { MIGRATIONS, migrateDatabase } from '../../../packages/data/src/schema';

/**
 * Fixtures de migração (F1.13) — paridade TS ↔ Rust.
 *
 * Um payload "legado v1" representativo percorre migrações 1→13 com o próprio
 * `migrateDatabase` do TS; o resultado de cada versão vira um arquivo enumerado
 * em `cecistudy-rust/contracts/golden/migrations/`. O Rust reaplica a cadeia e
 * compara arquivo a arquivo (bloqueia divergência inclusive de *quirks* do TS).
 *
 * GERAÇÃO: `MIGRATION_WRITE=1 npm run test -- src/lib/__tests__/migrationFixtures.test.ts`
 * Nunca editar os arquivos manualmente: regenerar + revisar o diff.
 */
const OUT = join(
  import.meta.dirname,
  '../../../cecistudy-rust/contracts/golden/migrations'
);
const WRITE = process.env.MIGRATION_WRITE === '1';

/**
 * Payload v1 cobrindo TODOS os ramos das 13 migrações:
 * - profile com avatarMood (m6 remove) e sem workspaceId (m12 adiciona);
 * - courses com `schedule` string (m9 converte) e `progress` (m11 remove);
 * - chaves de humor (m6), internshipLogsLegacy (m13) e collections sem/ccom workspaceId.
 */
function legacyPayloadV1(): Record<string, unknown> {
  return {
    profile: { name: 'ceci', university: 'ufrj', avatarMood: 'focado' },
    currentMood: { day: '2026-01-01', mood: 'ansiosa', note: '' },
    moodHistory: [
      { day: '2026-01-01', mood: 'ansiosa', note: '' },
      { day: '2026-01-02', mood: 'calma', note: 'final relaxado' },
    ],
    courses: [
      {
        id: 'c1',
        name: 'psicodiagnóstico',
        semester: '3',
        schedule: 'Segundas e quartas, 08:00 - 09:30',
        progress: 66,
      },
      { id: 'c2', name: 'neuropsicologia', schedule: 'seg 9h', progressOverride: 50 },
      { id: 'c3', name: 'psicanálise', schedule: 'terça e quinta 10h' },
      { id: 'c4', name: 'sem horário', schedule: 'quando der' },
      {
        id: 'c5',
        name: 'diversos',
        schedule: 'Segundas, 08:00 - 11:30; sextas, 14:00 - 15:30',
        workspaceId: 'ws-pessoal',
      },
    ],
    classes: [
      {
        id: 'cl-1',
        courseId: 'c1',
        title: 'entrevista clínica',
        date: '2026-02-01T10:00:00.000Z',
        rating: 5,
        workspaceId: 'ws-academico',
      },
    ],
    tasks: [
      { id: 't1', title: 'ler cap 3', disciplineId: 'c1', completed: false },
      { id: 't2', title: 'resumo', disciplineId: 'c2', completed: true, workspaceId: 'ws-x' },
    ],
    exams: [{ id: 'e1', courseId: 'c1', title: 'prova 1', date: '2026-03-01', topics: ['histeria'] }],
    authors: [],
    concepts: [{ id: 'con-1', name: 'transferência', definition: '...' }],
    approaches: [],
    readings: [],
    flashcards: [{ id: 'f1', conceptId: 'con-1', question: 'q?', answer: 'a!' }],
    materials: [],
    internshipLogsLegacy: [{ id: 'ilog-1', date: '2026-02-10', hours: 4, activity: 'triagem' }],
    tcc: { title: 'psicanálise e clínica', status: 'rascunho' },
    stickers: [],
    sessions: [],
    reminder: { enabled: true, time: '18:00' },
    savedBookIds: ['bk-1'],
    looseNotes: [{ id: 'ln-1', title: 'nota solta', body: 'texto', date: '2026-01-05T00:00:00.000Z' }],
  };
}

beforeAll(() => {
  if (!WRITE) return;
  mkdirSync(OUT, { recursive: true });
  // Cadeia CUMULATIVA: v{n} é o estado após aplicar as migrações 2..n
  // (o Rust repete esse mesmo replay arquivo-a-arquivo).
  let state = legacyPayloadV1();
  writeFileSync(join(OUT, 'legacy_payload.v1.json'), canonicalize(state) + '\n');
  for (let step = 2; step <= 13; step++) {
    const migrateOne = MIGRATIONS[step];
    if (!migrateOne) continue;
    state = migrateOne(structuredClone(state));
    writeFileSync(
      join(OUT, `legacy_payload.v${step}.json`),
      canonicalize(state) + '\n'
    );
  }
});

function readFixture(rel: string): string {
  const p = join(OUT, rel);
  if (!existsSync(p)) throw new Error(`fixture ausente — rode com MIGRATION_WRITE=1: ${rel}`);
  return readFileSync(p, 'utf8').trim();
}

describe('fixtures de migração (F1.13)', () => {
  it('gera o v1 legado', () => {
    expect(canonicalize(legacyPayloadV1())).toBe(readFixture('legacy_payload.v1.json'));
  });

  it('cada passo 2→13 bate com o arquivo (cadeia cumulativa)', () => {
    let state = structuredClone(legacyPayloadV1());
    for (let step = 2; step <= 13; step++) {
      const migrateOne = MIGRATIONS[step];
      if (!migrateOne) continue;
      state = migrateOne(structuredClone(state));
      expect(canonicalize(state), `v${step}`).toBe(
        readFixture(`legacy_payload.v${step}.json`)
      );
    }
  });

  it('versões desconhecidas são recusadas', () => {
    expect(migrateDatabase(0, {})).toBeNull();
    expect(migrateDatabase(99, {})).toBeNull();
  });
});