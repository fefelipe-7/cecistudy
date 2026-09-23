import { parseLegacySchedule } from '@/lib/schedule';
import { migrateLegacyAttendance } from '@/lib/attendance';

/**
 * Versão do esquema de dados persistido.
 *
 * Ao mudar modelos (tipos/coleções) de forma que dados antigos fiquem incompatíveis,
 * incremente esta versão e registre a migração correspondente em `MIGRATIONS`.
 * O export/import carrega a versão junto; o app recusa/avisa dados de versão desconhecida.
 */
export const SCHEMA_VERSION = 16;

/** Versão de schema da base da usuária (antigo scaffold SQLite, hoje mantida por compatibilidade de import). */
export const USER_SCHEMA_VERSION = 1;

/** Chave persistida que guarda a versão do schema em uso. */
export const SCHEMA_VERSION_KEY = 'schemaVersion';

/** Workspace padrão (Fase 3): todo dado antigo sem `workspaceId` pertence a ele. */
export const DEFAULT_WORKSPACE_ID = 'ws-academico';

/** Payload de backup/importação (export/import completo do banco local). */
export interface AppDatabase {
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

/**
 * Função de migração entre versões consecutivas.
 * Recebe o payload de dados da versão antiga e devolve o da nova.
 */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<number, Migration> = {
  // 1 → 2: adição de novas coleções (questions, techniques, onboarding)
  // e campos novos em entidades existentes. Dados antigos continuam válidos;
  // a migração apenas garante defaults para as chaves novas.
  2: (data) => ({
    questions: [],
    techniques: [],
    onboarding: { completed: false },
    savedBookIds: [],
    ...data,
  }),
  // 2 → 3: foto de perfil (data URL) no perfil do usuário.
  3: (data) => {
    const profile = (data.profile ?? {}) as Record<string, unknown>;
    return {
      profile: { photoUrl: '', ...profile },
      ...data,
    };
  },
  // 3 → 4: registros de estágio ganham `type` (default `estagio` para dados antigos);
  // demais campos novos do InternshipLog são opcionais e não precisam de backfill.
  4: (data) => {
    const logs = (data.internshipLogs ?? []) as Record<string, unknown>[];
    return {
      internshipLogs: logs.map((l) => ({ type: 'estagio', ...l })),
      ...data,
    };
  },
  // 4 → 5: progresso de leitura por obra (id → páginas lidas) na biblioteca.
  5: (data) => ({
    readingProgress: {},
    ...data,
  }),
  // 5 → 6: remoção do recurso de humor. Descarta os estados de mood (e o campo
  // `avatarMood` do perfil) de backups antigos — o app não lê mais essas chaves.
  6: (data) => {
    const next = { ...data };
    delete next.currentMood;
    delete next.moodHistory;
    const profile = (data.profile ?? {}) as Record<string, unknown>;
    if ('avatarMood' in profile) {
      next.profile = { ...profile };
      delete (next.profile as Record<string, unknown>).avatarMood;
    }
    return next;
  },
  // 6 → 7: sessões de quiz entram no contrato do banco (export/import/reset).
  // Backups antigos sem a coleção recebem `[]` (default).
  7: (data) => ({
    quizSessions: [],
    ...data,
  }),
  // 7 → 8: caderno de supervisão (nova coleção persistida). Backups antigos
  // sem a coleção recebem `[]` (default). Campos novos de InternshipLog
  // (phase/prepChecklist) são opcionais e não precisam de backfill.
  8: (data) => ({
    supervision: [],
    ...data,
  }),
  // 8 → 9: `Course.schedule` deixa de ser texto livre e vira `CourseScheduleSlot[]`.
  // Backups antigos têm `schedule: string`; convertemos via parser de horários.
  9: (data) => {
    const courses = (data.courses ?? []) as Record<string, unknown>[];
    const normalized = courses.map((c) => {
      const schedule = c.schedule;
      if (typeof schedule === 'string') {
        return { ...c, schedule: parseLegacySchedule(schedule) };
      }
      return c;
    });
    return { ...data, courses: normalized };
  },
  // 9 → 10: índice de sincronização entre dispositivos (pareamento P2P).
  // Bancos antigos não têm carimbos — tudo é tratado como "nunca alterado"
  // (ts 0) até a primeira edição pós-upgrade, que passa a vencer no merge LWW.
  10: (data) => ({
    syncIndex: { stamps: {}, records: {}, tombstones: {} },
    ...data,
  }),
  // 10 → 11: remoção do "progresso da disciplina" (`progress`/`progressOverride`).
  // O app não exibe mais progresso; descartamos os campos dos courses salvos.
  11: (data) => {
    const courses = (data.courses ?? []) as Record<string, unknown>[];
    const normalized = courses.map((c) => {
      if (!('progress' in c) && !('progressOverride' in c)) return c;
      const nextCourse = { ...c };
      delete nextCourse.progress;
      delete nextCourse.progressOverride;
      return nextCourse;
    });
    return { ...data, courses: normalized };
  },
  // 11 → 12: escopo de workspace (Fase 3). Entidades sincronizáveis recebem
  // `workspaceId` (default = ws-academico) para isolar contextos entre o Workspace
  // Acadêmico e futuros workspaces profissionais. Idempotente: não sobrescreve
  // um `workspaceId` já presente.
  12: (data) => {
    const collections = [
      'courses', 'classes', 'tasks', 'exams', 'authors', 'concepts',
      'readings', 'flashcards', 'materials', 'internshipLogs', 'supervision',
      'stickers', 'sessions', 'techniques', 'quizSessions', 'looseNotes',
    ];
    const next: Record<string, unknown> = { ...data };
    for (const key of collections) {
      const arr = (data[key] ?? []) as Record<string, unknown>[];
      next[key] = arr.map((item) =>
        'workspaceId' in item && item.workspaceId ? item : { ...item, workspaceId: DEFAULT_WORKSPACE_ID }
      );
    }
    for (const key of ['profile', 'tcc']) {
      const obj = (data[key] ?? {}) as Record<string, unknown>;
      if (!('workspaceId' in obj) || !obj.workspaceId) {
        next[key] = { ...obj, workspaceId: DEFAULT_WORKSPACE_ID };
      }
    }
    return next;
  },
  // 12 → 13: renomeia a chave persistida de registros de estágio
  // `internshipLogsLegacy` → `internshipLogs` (alinhando com backupSchema/
  // migrações que já usavam `internshipLogs`). Backups antigos que ainda
  // guardavam a coleção sob a chave legada são movidos.
  13: (data) => {
    const next = { ...data };
    if ('internshipLogsLegacy' in next && !('internshipLogs' in next)) {
      next.internshipLogs = next.internshipLogsLegacy;
    }
    delete next.internshipLogsLegacy;
    return next;
  },
  // 13 → 14: vínculos explícitos de repertório da disciplina (SPEC-001).
  // `Course` ganha `conceptIds`/`authorIds`/`bibliographyIds` (opcionais).
  // Backups antigos sem os campos recebem `[]` (default vazio).
  14: (data) => {
    const courses = (data.courses ?? []) as Record<string, unknown>[];
    const normalized = courses.map((c) => ({
      ...c,
      conceptIds: (c.conceptIds as string[] | undefined) ?? [],
      authorIds: (c.authorIds as string[] | undefined) ?? [],
      bibliographyIds: (c.bibliographyIds as string[] | undefined) ?? [],
    }));
    return { ...data, courses: normalized };
  },
  // 14 → 15: frequência detalhada (spec-frequencia.md). `Course.attendance`
  // deixa de ser o par `{attended,total}` e vira `CourseAttendance`
  // (`{ total, minPct, baseAttended, records[] }`). O contador legado
  // `attended` vira `baseAttended`; a coleção `records` começa vazia.
  15: (data) => {
    const courses = (data.courses ?? []) as Record<string, unknown>[];
    const normalized = courses.map((c) => {
      const att = c.attendance;
      if (
        att &&
        typeof att === 'object' &&
        ('attended' in att || !('records' in att))
      ) {
        const next = { ...c };
        next.attendance = migrateLegacyAttendance(att as { attended?: number; total?: number });
        return next;
      }
      return c;
    });
    return { ...data, courses: normalized };
  },
  // 15 → 16: FSRS para flashcards + decks. Adiciona coleção `decks` e campos FSRS
  // em `flashcards`. Backups antigos recebem defaults e migração de campos legados.
  16: (data) => {
    const decks = (data.decks as any[]) ?? [];
    const flashcards = (data.flashcards ?? []) as Record<string, unknown>[];
    const migrated = flashcards.map((f) => {
      const timesReviewed = (f.timesReviewed as number) ?? 0;
      const easeFactor = (f.easeFactor as number) ?? 2.5;
      const lastReviewed = f.lastReviewed as string | undefined;
      const stability = Math.max(0.1, (easeFactor - 1) * 1.5);
      const difficulty = Math.max(0.01, Math.min(10, (2.5 - easeFactor) * -2 + 5));
      const state = timesReviewed > 0 ? 'review' : 'new';
      const due = lastReviewed
        ? lastReviewed
        : new Date().toISOString().slice(0,10);
      return {
        ...f,
        deckId: undefined,
        stability,
        difficulty,
        retrievability: 1,
        lapses: 0,
        reviews: timesReviewed,
        state,
        due,
      };
    });
    return {
      ...data,
      decks,
      flashcards: migrated,
    };
  },
};

/**
 * Aplica as migrações de `fromVersion` (exclusive) até `SCHEMA_VERSION`.
 * Se a versão de origem for desconhecida/maior, devolve `null` (import deve recusar).
 */
export function migrateDatabase(
  fromVersion: number,
  data: Record<string, unknown>
): Record<string, unknown> | null {
  if (fromVersion > SCHEMA_VERSION) return null;
  if (fromVersion < 1) return null;
  let next = data;
  for (let v = fromVersion + 1; v <= SCHEMA_VERSION; v++) {
    const migration = MIGRATIONS[v];
    if (!migration) continue;
    next = migration(next);
  }
  return next;
}
