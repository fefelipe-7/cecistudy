import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalize } from '../canonicalJson';
import { MIGRATIONS, SCHEMA_VERSION, migrateDatabase } from '../../../packages/data/src/schema';

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
        // Par legado `{attended,total}`: exercita as migrações 15 (novo shape
        // de frequência) e 17 (frequência em horas derivada dos slots).
        attendance: { attended: 6, total: 8 },
      },
      { id: 'c2', name: 'neuropsicologia', schedule: 'seg 9h', progressOverride: 50 },
      {
        id: 'c3',
        name: 'psicanálise',
        schedule: 'terça e quinta 10h',
        // Attendance já no shape novo (v15) e já com horas (v17): os dois
        // passos devem ser idempotentes e não sobrescrever o que existe.
        attendance: { total: 4, minPct: 80, baseAttended: 1, records: [], totalHours: 9.5, baseHoursDone: 2 },
      },
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
    flashcards: [
      // `lastReviewed` é intencional: a migração 16 (FSRS) deriva `due` dele.
      // Sem ele o `due` cairia em `new Date()` (não-determinístico) e o golden
      // mudaria todo dia — o ramo "sem lastReviewed" é coberto por teste unitário.
      { id: 'f1', conceptId: 'con-1', question: 'q?', answer: 'a!', lastReviewed: '2026-01-10' },
    ],
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
  // (o Rust repete esse mesmo replay arquivo-a-arquivo). O limite vem de
  // `SCHEMA_VERSION` para não divergir de novo quando o schema subir.
  let state = legacyPayloadV1();
  writeFileSync(join(OUT, 'legacy_payload.v1.json'), canonicalize(state) + '\n');
  for (let step = 2; step <= SCHEMA_VERSION; step++) {
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

  it('cada passo 2→SCHEMA_VERSION bate com o arquivo (cadeia cumulativa)', () => {
    let state = structuredClone(legacyPayloadV1());
    for (let step = 2; step <= SCHEMA_VERSION; step++) {
      const migrateOne = MIGRATIONS[step];
      if (!migrateOne) continue;
      state = migrateOne(structuredClone(state));
      expect(canonicalize(state), `v${step}`).toBe(
        readFixture(`legacy_payload.v${step}.json`)
      );
    }
  });

  it('ramo da migração 16 sem lastReviewed é DETERMINÍSTICO (F15)', () => {
    // Antes este ramo caía em `new Date().toISOString()`, então **reimportar o mesmo
    // backup duas vezes produzia payloads diferentes** — contra o invariante que o
    // próprio `MIGRATIONS[18]` declara. Agora o `due` vem do dado: sem
    // `lastReviewed` nem `createdAt`, o campo fica indefinido e o flashcard entra
    // como `new`, que o app trata como "para hoje".
    const step = MIGRATIONS[16];
    const semNada = step({
      flashcards: [{ id: 'f-nr', timesReviewed: 0, easeFactor: 2.5 }],
    }) as Record<string, Record<string, unknown>[]>;
    const f = semNada.flashcards[0];
    expect(f.due).toBeUndefined();
    expect(f.state).toBe('new');
    expect(f.deckId).toBeUndefined();
    expect(f.decks).toBeUndefined();

    // Duas execuções seguidas dão exatamente o mesmo payload.
    const entrada = { flashcards: [{ id: 'f-nr', timesReviewed: 0, easeFactor: 2.5 }] };
    const a = step(JSON.parse(JSON.stringify(entrada)));
    const b = step(JSON.parse(JSON.stringify(entrada)));
    expect(b).toEqual(a);

    // Com `createdAt` no dado, o `due` usa o dado — não o relógio.
    const comCreated = step({
      flashcards: [{ id: 'f-cr', timesReviewed: 0, easeFactor: 2.5, createdAt: '2026-03-04' }],
    }) as Record<string, Record<string, unknown>[]>;
    expect(comCreated.flashcards[0].due).toBe('2026-03-04');
  });

  it('versões desconhecidas são recusadas', () => {
    expect(migrateDatabase(0, {})).toBeNull();
    expect(migrateDatabase(99, {})).toBeNull();
  });
});