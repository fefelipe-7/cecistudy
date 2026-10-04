import { parseLegacySchedule } from '@/lib/schedule';
import { hoursFromClasses, migrateLegacyAttendance } from '@/lib/attendance';
import type { AcademicTerm } from '@/types';

/**
 * Versão do esquema de dados persistido.
 *
 * Ao mudar modelos (tipos/coleções) de forma que dados antigos fiquem incompatíveis,
 * incremente esta versão e registre a migração correspondente em `MIGRATIONS`.
 * O export/import carrega a versão junto; o app recusa/avisa dados de versão desconhecida.
 */
export const SCHEMA_VERSION = 20;

/**
 * Versão de schema da base da usuária (`cecistudy_user`, SQLite nativo).
 *
 * **Débito C2, fechado.** Esta constante e `USER_SCHEMA_VERSION` em
 * `src/lib/db/migrations/user.ts` eram duas declarações independentes com
 * valores diferentes (1 e 3). O valor daqui é o que `exportImport.ts` carimba em
 * `userSchemaVersion` no envelope de backup; o valor de lá é o que o runner de
 * migração realmente aplica. Divergindo, **um backup declara v1 quando a base
 * está em v3**, e na restauração o app não sabe que precisa migrar.
 *
 * A fonte única é esta, em `packages/data`, porque `packages/*` é a biblioteca
 * canônica e `src/*` são stubs de compat que reexportam dela — a dependência
 * nunca pode ser invertida (ver `ADR-007` e o débito C9).
 *
 * Invariante, verificada por gate: este valor tem que ser igual a
 * `LATEST_USER_VERSION` em `src/lib/db/migrations.ts`, que é
 * `MIGRATIONS[MIGRATIONS.length - 1].version`. Ao acrescentar um passo de
 * migração, suba os dois — o gate falha se você esquecer.
 */
export const USER_SCHEMA_VERSION = 3;

/** Chave persistida que guarda a versão do schema em uso. */
export const SCHEMA_VERSION_KEY = 'schemaVersion';

/** Workspace padrão (Fase 3): todo dado antigo sem `workspaceId` pertence a ele. */
export const DEFAULT_WORKSPACE_ID = 'ws-academico';

/**
 * Total de semestres do curso — **10**,Psi no Brasil (SPEC-006 D9).
 *
 * Antes era 8, o que fazia o progresso da graduação estourar 100% dois semestres
 * antes e o CTA de virada disparar para sempre. Editável no Perfil com clamp
 * `1..12`, então o 10 é só o default certo, não um valor fixo.
 */
export const DEFAULT_TOTAL_SEMESTERS = 10;

/**
 * O default **errado** (8), que a migração 18 → 19 corrige. Exportado porque a
 * migração e o teste precisam concordar sobre o valor que estão trocando.
 */
export const DEFAULT_TOTAL_SEMESTERS_LEGACY = 8;

/**
 * Id do período ativo criado pela migração 17 → 18 (SPEC-005).
 *
 * Fixo (e não `makeId`) porque precisa ser **determinístico**: a mesma entrada
 * tem sempre que produzir a mesma saída, senão o golden de migração e o
 * re-import de um backup antigo divergem. O boot (`ensureActiveTerm`) usa este
 * mesmo id, o que faz dele um no-op para quem já veio migrado.
 */
export const BOOTSTRAP_TERM_ID = 'trm-active';

/** Payload de backup/importação (export/import completo do banco local). */
export interface AppDatabase {
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** `startedAt` do período criado na migração 18 quando o payload não tem data alguma. */
const FALLBACK_TERM_START = '2026-01-01';

/**
 * Clamp de `ordinal` (1..max) espelhando `packages/domain`. É replicado (e não
 * importado) de propósito: `schema.ts` é o primeiro elo da cadeia de migração e
 * não pode depender de o código do app já estar carregado — uma migração tem que
 * rodar mesmo quando a entity nova nem existe mais.
 */
function clampTermOrdinal(ordinal: number, max: number): number {
  if (!Number.isFinite(ordinal)) return 1;
  return Math.max(1, Math.min(max, Math.trunc(ordinal)));
}

/** Campos de data ISO varridos para descobrir a data de início do curso. */
const TERM_DATE_SOURCES: readonly (readonly [string, string])[] = [
  ['courses', 'startDate'],
  ['classes', 'date'],
  ['attendance', 'date'],
  ['exams', 'date'],
  ['sessions', 'date'],
  ['internshipLogs', 'date'],
  ['tasks', 'dueDate'],
];

/** `YYYY-MM-DD` (ou ISO completo) → só a data; `undefined` se não for data. */
function toIsoDay(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : undefined;
}

/**
 * Menor data ISO presente no payload, ou `undefined`.
 * String-comparação é suficiente: `YYYY-MM-DD` ordena lexicograficamente igual
 * ao cronológico, e evita `Date` (e o fuso) no meio de uma migração.
 */
function earliestIsoDate(data: Record<string, unknown>): string | undefined {
  let earliest: string | undefined;
  for (const [collection, field] of TERM_DATE_SOURCES) {
    const rows = data[collection];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const day = toIsoDay((row as Record<string, unknown> | null)?.[field]);
      if (!day) continue;
      if (earliest === undefined || day < earliest) earliest = day;
    }
  }
  return earliest;
}

/** `profile.semester` → ordinal, tolerando o formato string dos backups antigos. */
function semesterOrdinal(raw: unknown): number {
  const parsed =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number.parseInt(raw.replace(/[^\d-]/g, ''), 10)
        : Number.NaN;
  return clampTermOrdinal(Number.isFinite(parsed) ? parsed : 1, 12);
}

/**
 * Período ativo de bootstrap (SPEC-005) — a **fonte única** do termo inicial.
 *
 * Usado em dois lugares que precisam concordar byte a byte:
 * - `MIGRATIONS[18]`, ao importar um backup antigo;
 * - `ensureActiveTerm` no boot, para quem já tinha o app sem período.
 *
 * Se os dois divergissem, o mesmo banco nasceria com `termId` diferente
 * dependendo do caminho de entrada — e o LWW por registro do sync passaria a
 * conviver com dois períodos ativos.
 */
export function createBootstrapTerm(
  profile: Record<string, unknown> | undefined,
  data: Record<string, unknown>,
): AcademicTerm {
  const ordinal = semesterOrdinal(profile?.semester);
  const startedAt = earliestIsoDate(data) ?? FALLBACK_TERM_START;
  return {
    id: BOOTSTRAP_TERM_ID,
    label: `${ordinal}º semestre`,
    ordinal,
    status: 'ativo',
    startedAt,
    statusTransitionAt: `${startedAt}T00:00:00.000Z`,
    createdAt: `${startedAt}T00:00:00.000Z`,
    updatedAt: `${startedAt}T00:00:00.000Z`,
  };
}

/**
 * Garante que o estado tenha um período ativo (idempotente).
 *
 * Usado no boot do app: devolve `null` quando já existe um período ativo — o
 * caso comum depois da migração — e o termo novo só quando não há nenhum. Chamar
 * isso de novo depois de `closeTerm` **não** recria o período: quem fecha quer
 * ficar sem período ativo até decidir o próximo.
 */
export function ensureActiveTerm(
  terms: readonly AcademicTerm[],
  profile: Record<string, unknown> | undefined,
  data: Record<string, unknown> = {},
): AcademicTerm[] | null {
  if (terms.some((t) => t.status === 'ativo')) return null;
  if (terms.some((t) => t.id === BOOTSTRAP_TERM_ID)) return null;
  return [...terms, createBootstrapTerm(profile, data)];
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
  // 16 → 17: frequência em horas (SPEC-004). `CourseAttendance` ganha
  // `totalHours`/`baseHoursDone` (opcionais). Backfill para disciplinas com
  // `attendance` que já têm `total`: converte aulas em horas pela duração média
  // dos slots (idempotente — não sobrescreve horas já presentes).
  17: (data) => {
    const courses = (data.courses ?? []) as Record<string, unknown>[];
    const normalized = courses.map((c) => {
      const att = c.attendance;
      if (!att || typeof att !== 'object' || typeof (att as { total?: unknown }).total !== 'number') {
        return c;
      }
      const a = att as { total: number; baseAttended?: number; totalHours?: number; baseHoursDone?: number };
      const schedule = Array.isArray(c.schedule)
        ? (c.schedule as { day: number; start: string; end?: string }[])
        : undefined;
      const next = {
        ...a,
        totalHours: a.totalHours ?? hoursFromClasses(a.total, schedule),
        baseHoursDone: a.baseHoursDone ?? hoursFromClasses(a.baseAttended ?? 0, schedule),
      };
      return { ...c, attendance: next };
    });
    return { ...data, courses: normalized };
  },
  // 17 → 18: período letivo (SPEC-005). Cria a coleção `academicTerms` e liga
  // cada disciplina a um período. `profile.semester` vira o `ordinal` do período
  // ativo, e `Course.semester` (que era um rótulo livre tipo "6º Semestre", sem
  // poder de filtro) é substituído por `termId` + `status`.
  //
  // Duas garantias, ambas testadas em `src/data/__tests__/schema.test.ts`:
  // - **determinística**: `startedAt` é a menor data ISO do payload, senão a
  //   constante `FALLBACK_TERM_START`. Nunca `Date.now()` — uma migração não
  //   pode depender do relógio, senão re-importar o mesmo backup duas vezes dá
  //   payloads diferentes e o diff de sync enche de ruído.
  // - **idempotente**: re-aplicar não duplica o período nem sobrescreve
  //   `termId`/`status` que já existem.
  18: (data) => {
    const profile = { ...(data.profile as Record<string, unknown> ?? {}) };

    // `profile.semester` vira o `ordinal` do período ativo (tolera o formato
    // string dos backups antigos — ver `createBootstrapTerm`).
    profile.semester = semesterOrdinal(profile.semester);
    if (typeof profile.totalSemesters !== 'number' || !Number.isFinite(profile.totalSemesters)) {
      profile.totalSemesters = 8;
    }

    const existing = Array.isArray(data.academicTerms)
      ? (data.academicTerms as AcademicTerm[])
      : [];
    // Só cria quando ainda não há período ativo **e** o id bootstrap está livre
    // (duas condições distintas: respeitar um período vindo de outro dispositivo
    // e nunca duplicar o id, que quebraria o LWW por registro do sync).
    const academicTerms =
      existing.some((t) => t.status === 'ativo') || existing.some((t) => t.id === BOOTSTRAP_TERM_ID)
        ? existing
        : [...existing, createBootstrapTerm(profile, data)];

    const courses = (data.courses ?? []) as Record<string, unknown>[];
    const normalized = courses.map((c) => ({
      ...c,
      termId: c.termId ?? BOOTSTRAP_TERM_ID,
      status: c.status ?? 'ativo',
    }));

    return { ...data, profile, academicTerms, courses: normalized };
  },
  // 18 → 19: total de semestres do curso (SPEC-006).
  //
  // O default anterior era `8`, e **Psi no Brasil tem 10**. O efeito era silencioso
  // e aparecia em todo lugar: o `% do curso` batia 100% no 8º, `semestersLeft`
  // devolvia 0, o adesivo de "formada" destravava no penúltimo semestre e o CTA
  // "virar semestre" passava a responder `true` permanentemente do 8º em diante
  // (porque a elegibilidade da virada compara `ordinal >= total`).
  //
  // Só corrige o valor que era **default errado** (`8`); qualquer total já
  // configurado — 10, 12, o que for — fica como está. E é incondicionais em
  // relação ao `semester`: uma regra "só corrige quem já passou do 8º" não
  // corrigiria o caso real, que é estar no 6º com o total errado. O Perfil deixa
  // reassinar o total depois (clamp `1..12`), então o custo de errar aqui é
  // baixo e o custo de não corrigir era um progresso de;formatura sempre furado.
19: (data) => {
    const profile = { ...(data.profile as Record<string, unknown> ?? {}) };
    if (profile.totalSemesters === DEFAULT_TOTAL_SEMESTERS_LEGACY) {
      profile.totalSemesters = DEFAULT_TOTAL_SEMESTERS;
    }
    return { ...data, profile };
  },
  // 19 → 20: a camada clínica do Estágio sai do mobile (SPEC-M-013 `D4`).
  //
  // ## O que esta migração faz, e por que ela é irreversível
  //
  // Converte cada `internshipLogs` com `type === 'atendimento_clinico'` numa
  // **projeção** de cinco campos, e **descarta o resto**. Os campos
  // descartados são `patient`, `patientAge`, `sessionNumber`, `theme`,
  // `approach`, `interventionNotes`, `observations`, `supervisionLogId` e
  // `discussedLogIds` — nove campos de dado de paciente real.
  //
  // ## Por que descartar em vez de migrar
  //
  // Não há como cumprir `SPEC-M-013` `D1` e manter o dado: se o conteúdo clínico
  // continuar na base, ele continua no aparelho, e a próxima exportação o leva.
  // A escolha real era entre apagar do aparelho agora ou apagar quando alguém
  // descobrir. A lista de campos que **sobrevive** é a de §4.8 linha 472 da spec
  // referencial: iniciais, data, duração e "Para levar" — o único texto que a
  // usuária escolhe levar, e que ela pode ter deixado vazio.
  //
  // ## Por que isto precisa de confirmação da dona antes de produção
  //
  // A consequência é visível: a usuária que registrou atendimento no celular
  // **perde o texto**. A decisão não está aberta — §4.8 linha 471 é `[D]` e diz
  // "Só desktop" — mas a consequência é dela, e ninguém deve descobrir por conta
  // própria. Ver `SPEC-M-013` `## 10`.
  //
  // ## Idempotência
  //
  // Rodar duas vezes não faz nada: a segunda passagem não encontra
  // `atendimento_clinico` em `internshipLogs`, porque a primeira já removeu. E a
  // coleção `internshipClinical` é criada só se ainda não existir, para uma
  // projeção antiga não ser duplicada.
  20: (data) => {
    const logs = Array.isArray(data.internshipLogs)
      ? (data.internshipLogs as Record<string, unknown>[])
      : [];

    const academicos: Record<string, unknown>[] = [];
    const projecoes: Record<string, unknown>[] = [];

    for (const log of logs) {
      if (log.type !== 'atendimento_clinico') {
        academicos.push(log);
        continue;
      }

      // Só os cinco campos de §4.8 linha 472. `paraLevar` ausente vira string
      // vazia porque **ausente é escolha válida**: "não levei nada" é informação,
      // e `undefined` no payload seria ambíguo entre "não escolheu" e "não tinha".
      projecoes.push({
        id: typeof log.id === 'string' ? log.id : '',
        iniciais: typeof log.patient === 'string' && log.patient.trim() ? log.patient.trim() : '—',
        data: typeof log.date === 'string' ? log.date : '',
        duracaoMin: typeof log.hours === 'number' && Number.isFinite(log.hours)
          ? Math.round(log.hours * 60)
          : 0,
        paraLevar: typeof log.paraLevar === 'string' ? log.paraLevar : '',
      });
    }

    const jaExistentes = Array.isArray(data.internshipClinical)
      ? (data.internshipClinical as Record<string, unknown>[])
      : [];
    const idsConhecidos = new Set(jaExistentes.map((p) => p.id));

    return {
      ...data,
      internshipLogs: academicos,
      internshipClinical: [
        ...jaExistentes,
        ...projecoes.filter((p) => p.id && !idsConhecidos.has(p.id)),
      ],
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
