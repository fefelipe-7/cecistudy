import { parseLegacySchedule } from '../lib/schedule';

/**
 * Versão do esquema de dados persistido.
 *
 * Ao mudar modelos (tipos/coleções) de forma que dados antigos fiquem incompatíveis,
 * incremente esta versão e registre a migração correspondente em `MIGRATIONS`.
 * O export/import carrega a versão junto; o app recusa/avisa dados de versão desconhecida.
 */
export const SCHEMA_VERSION = 9;

/** Versão de schema da base da usuária (antigo scaffold SQLite, hoje mantida por compatibilidade de import). */
export const USER_SCHEMA_VERSION = 1;

/** Chave persistida que guarda a versão do schema em uso. */
export const SCHEMA_VERSION_KEY = 'schemaVersion';

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