/**
 * Versão do esquema de dados persistido.
 *
 * Ao mudar modelos (tipos/coleções) de forma que dados antigos fiquem incompatíveis,
 * incremente esta versão e registre a migração correspondente em `MIGRATIONS`.
 * O export/import carrega a versão junto; o app recusa/avisa dados de versão desconhecida.
 */
export const SCHEMA_VERSION = 5;

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
  // 1 → 2: adição de novas coleções (moodHistory, questions, techniques, onboarding)
  // e campos novos em entidades existentes. Dados antigos continuam válidos;
  // a migração apenas garante defaults para as chaves novas.
  2: (data) => ({
    moodHistory: [],
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