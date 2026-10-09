import { parseLegacySchedule } from '@/lib/schedule';
import { hoursFromClasses, migrateLegacyAttendance } from '@/lib/attendance';
import type { AcademicTerm } from '@/types';
import { legacyNotebookToLog, THESIS_ID, emptyThesisReminderPrefs } from '@cecistudy/domain';

/**
 * Versão do esquema de dados persistido.
 *
 * Ao mudar modelos (tipos/coleções) de forma que dados antigos fiquem incompatíveis,
 * incremente esta versão e registre a migração correspondente em `MIGRATIONS`.
 * O export/import carrega a versão junto; o app recusa/avisa dados de versão desconhecida.
 */
export const SCHEMA_VERSION = 22;

/** Versão de schema da base da usuária (antigo scaffold SQLite, hoje mantida por compatibilidade de import). */
export const USER_SCHEMA_VERSION = 1;

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
      // `F15`: este `new Date()` tornava a migração **não determinística** — reimportar
      // o mesmo backup duas vezes produzia payloads diferentes, e o próprio arquivo
      // declara em `MIGRATIONS[18]` que migração tem de ser determinística. O
      // fallback agora sai do **dado**: sem `lastReviewed`, o flashcard entra como
      // `state: 'new'` e o app o trata como "para hoje". Reescrever para uma data
      // fixa exigiria inventar um passado que não está no backup — e um campo
      // `createdAt`, quando existir, é a data honesta.
      const due = lastReviewed ?? ((f.createdAt as string | undefined) ?? undefined);
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
  // 19 → 20: o vínculo sessão ↔ supervisão passa a ter **fonte única**
  // (SPEC-009 §6 · `D3`), e o caderno de supervisão legado é drenado.
  //
  // Três coisas acontecem aqui, e as três corrigem bug real:
  //
  // 1. **`supervisionLogId` → `discussedLogIds`.** O vínculo era gravado nos **dois
  //    lados** e nada limpava nenhum dos dois ao apagar (`F3`). Agora ele vive só
  //    na supervisão e "supervisionada" é derivado — uma classe inteira de bug
  //    some por construção.
  // 2. **Dreno do caderno legado.** `F8`: `applyDatabase` lia `db.supervisionNotebook`,
  //    mas a chave contratual é **`supervision`** (`collections.ts:106`) — declarada
  //    de forma independente em 5 lugares. Como nada escrevia `supervisionNotebook`,
  //    a migração era **no-op em toda execução real**: código morto com teste verde.
  //    Aqui as duas chaves são lidas, por tolerância.
  // 3. **`workspaceId` no log migrado.** `migrateSupervisionNotebook` montava 15
  //    campos e `workspaceId` não era um deles, então o log entrava no estado fora
  //    do escopo de workspace. A conversão agora é `legacyNotebookToLog`, que é a
  //    **mesma função** do drain no boot — uma regra, um lugar.
  //
  // Idempotente: rodar duas vezes dá o mesmo resultado (o `byId.has(nb.id)` impede
  //    duplicar o caderno, e o `uniq` limpa a lista de discutidas). Determinística:
  //    nenhum `Date` aqui.
  20: (data) => {
    const logs = ((data.internshipLogs as Record<string, unknown>[]) ?? []).map((l) => ({ ...l }));
    const byId = new Map<string, Record<string, unknown>>();
    for (const l of logs) byId.set(l.id as string, l);

    // 1. `type` obrigatório (invariante `I7`) — dado antigo sem tipo vira estágio.
    for (const l of logs) if (!l.type) l.type = 'estagio';

    // 2. Dreno do caderno legado. `supervision` é a chave contratual;
    //    `supervisionNotebook` é lida por tolerância, porque foi o nome que o
    //    código leu por engano (`F8`) e algum backup pode ter vindo com ele.
    const legacy = [
      ...(((data.supervision as unknown[]) ?? []) as never[]),
      ...(((data.supervisionNotebook as unknown[]) ?? []) as never[]),
    ];
    for (const nb of legacy) {
      const id = (nb as { id?: string }).id;
      if (!id || byId.has(id)) continue; // idempotência
      const log = legacyNotebookToLog(nb as Parameters<typeof legacyNotebookToLog>[0]);
      byId.set(id, log as unknown as Record<string, unknown>);
      logs.push(log as unknown as Record<string, unknown>);
    }

    // 3. `supervisionLogId` → `discussedLogIds` (fonte única, `D3`).
    for (const l of logs) {
      const pointer = l.supervisionLogId as string | undefined;
      if (pointer === undefined) continue;
      const sup = byId.get(pointer);
      if (
        sup &&
        (sup.type === 'supervisao' || sup.type === 'intervisao') &&
        l.type === 'atendimento_clinico'
      ) {
        const current = (sup.discussedLogIds as string[] | undefined) ?? [];
        if (!current.includes(l.id as string)) sup.discussedLogIds = [...current, l.id as string];
      }
      // Vínculo órfão (apontando para supervisão que não existe) é descartado.
      delete l.supervisionLogId;
    }

    // 4. Higiene de `discussedLogIds` (`I1`–`I3`) e de `selfAssessment` (`I8`).
    for (const l of logs) {
      if (l.type === 'supervisao' || l.type === 'intervisao') {
        const ids = [
          ...new Set(
            ((l.discussedLogIds as string[] | undefined) ?? []).filter(
              (id) => id !== l.id && byId.get(id)?.type === 'atendimento_clinico'
            )
          ),
        ];
        if (ids.length) l.discussedLogIds = ids;
        else delete l.discussedLogIds;
      } else {
        delete l.discussedLogIds;
      }
      const sa = l.selfAssessment as Record<string, unknown> | undefined;
      if (sa && !Object.values(sa).some((v) => typeof v === 'string' && v.trim() !== '')) {
        delete l.selfAssessment;
      }
    }

    // A chave `supervision` continua existindo **vazia**: `backupDataSchema`
    // (`backupSchema.ts:311`) declara o array, e removê-lo reprova a validação.
    return { ...data, internshipLogs: logs, supervision: [] };
  },
  // 20 → 21: leitura unificada com sessões, highlights e bookmarks (SPEC-M-014)
  21: (data) => {
    const readings = (data.readings ?? []) as Record<string, unknown>[];
    const normalized = readings.map((r) => ({
      ...r,
      catalogId: r.catalogId ?? undefined,
      sourceKind: r.sourceKind ?? undefined,
      contentRef: r.contentRef ?? undefined,
      position: r.position ?? undefined,
      furthestPercent: r.furthestPercent ?? undefined,
      lastReadAt: r.lastReadAt ?? undefined,
      coverColor: r.coverColor ?? undefined,
    }));
    return {
      ...data,
      readings: normalized,
      readingSessions: data.readingSessions ?? [],
      readingHighlights: data.readingHighlights ?? [],
      readingBookmarks: data.readingBookmarks ?? [],
    };
  },
  // 21 → 22: TCC vira painel de gestão (SPEC-012). Capítulos e referências saem
  // do singleton e viram coleções com id estável (resolve F2: id por índice; e
  // F13: sync por objeto inteiro). Pela ADR-010, a referência legada (string
  // solta) vira `ReadingItem` com `rawCitation` — o dado bibliográfico é da
  // Biblioteca; o `ThesisReference` guarda só o ato de citar.
  //
  // Determinística e idempotente: **nenhum `Date` dentro** (F15 da SPEC-009) —
  // os timestamps legados recebem a época fixa, nunca "agora"; os ids são
  // `thc-N`/`thr-N` por posição de origem, estáveis entre execuções.
  22: (data) => {
    // Idempotência: já migrado (dreno pode rodar mais de uma vez).
    if (Array.isArray(data.thesisChapters) && Array.isArray(data.thesisReferences)) {
      return data;
    }
    const tcc = (data.tcc ?? {}) as Record<string, unknown>;
    const oldChapters = Array.isArray(tcc.chapters) ? tcc.chapters : [];
    const oldReferences = Array.isArray(tcc.references) ? tcc.references : [];
    const str = (v: unknown): string => (typeof v === 'string' ? v : '');
    const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
    const EPOCH = '1970-01-01T00:00:00.000Z';

    const thesisChapters = oldChapters
      .map((ch, i) => {
        const rec = (ch ?? {}) as Record<string, unknown>;
        const dueDate = str(rec.dueDate);
        return {
          id: `thc-${i + 1}`,
          workspaceId: DEFAULT_WORKSPACE_ID,
          thesisId: THESIS_ID,
          position: i,
          title: str(rec.title),
          kind: 'capitulo',
          requiredness: 'obrigatorio',
          stage: rec.completed === true ? 'pronto' : 'a_fazer',
          ...(DATE_KEY.test(dueDate) ? { dueDate } : {}),
          createdAt: EPOCH,
          updatedAt: EPOCH,
        };
      })
      .filter((ch) => ch.title !== '');

    // Referência legada: um `ReadingItem` (a obra, com o texto original intacto
    // em `rawCitation` — `formatAbnt` respeita) + um `ThesisReference` fino.
    // Nada muda na lista que ela já montou: a prévia ABNT continua mostrando a
    // string dela, byte a byte.
    const readings = (data.readings ?? []) as Record<string, unknown>[];
    const legacyReadings: Record<string, unknown>[] = [];
    const thesisReferences: Record<string, unknown>[] = [];
    oldReferences.forEach((r, i) => {
      if (typeof r !== 'string' || r.trim() === '') return;
      const readingId = `r-legacy-tcc-${i + 1}`;
      legacyReadings.push({
        id: readingId,
        workspaceId: DEFAULT_WORKSPACE_ID,
        title: r.slice(0, 200),
        author: 'autor não informado',
        type: 'artigo',
        status: 'nao_iniciado',
        sourceKind: 'custom',
        rawCitation: r,
      });
      thesisReferences.push({
        id: `thr-${i + 1}`,
        workspaceId: DEFAULT_WORKSPACE_ID,
        thesisId: THESIS_ID,
        readingId,
        status: 'citada',
        createdAt: EPOCH,
        updatedAt: EPOCH,
      });
    });

    // O singleton perde `chapters`/`references` e ganha `id` + preferências de
    // lembrete (§6.4). `tcc` sem `chapters` é o marcador de "dreno completo"
    // para o efeito de boot — a chave removida desarma a guarda.
    const { chapters: _c, references: _r, ...tccRest } = tcc;
    const migratedTcc: Record<string, unknown> = {
      ...tccRest,
      id: THESIS_ID,
      reminderPrefs: emptyThesisReminderPrefs(),
    };

    // Prazo fora de `YYYY-MM-DD` é descartado (nunca adivinhado) e listado.
    const discarded = oldChapters
      .map((ch, i) => ({ rec: (ch ?? {}) as Record<string, unknown>, i }))
      .filter(({ rec }) => str(rec.dueDate) !== '' && !DATE_KEY.test(str(rec.dueDate)))
      .map(
        ({ rec, i }) =>
          `migracao-22: prazo do capítulo ${i + 1} (${str(rec.dueDate)}) fora de YYYY-MM-DD — descartado`
      );

    return {
      ...data,
      tcc: migratedTcc,
      readings: [...readings, ...legacyReadings],
      thesisChapters,
      thesisReferences,
      thesisMeetings: data.thesisMeetings ?? [],
      thesisTasks: data.thesisTasks ?? [],
      thesisWritingLogs: data.thesisWritingLogs ?? [],
      ...(discarded.length
        ? { migrationNotes: [...((data.migrationNotes as string[]) ?? []), ...discarded] }
        : {}),
    };
  },
};

/**
 * Aplica as migrações de `fromVersion` (exclusive) até `SCHEMA_VERSION`.
 * Se a versão de origem for desconhecida/maior, devolve `null` (import deve recusar).
 *
 * `F17`: versão **faltante** é erro, não um `continue` silencioso. Antes um buraco
 * na numeração era engolido e a cadeia seguia — o que transforma um erro de
 * digitação em perda de dado silenciosa. Hoje 2..20 é contíguo; se deixar de ser,
 * o import falha e diz por quê.
 */
export function migrateDatabase(
  fromVersion: number,
  data: Record<string, unknown>
): Record<string, unknown> | null {
  if (fromVersion > SCHEMA_VERSION) return null;
  if (fromVersion < 1) return null;
  const missing: number[] = [];
  let next = data;
  for (let v = fromVersion + 1; v <= SCHEMA_VERSION; v++) {
    const migration = MIGRATIONS[v];
    if (!migration) {
      missing.push(v);
      continue;
    }
    next = migration(next);
  }
  if (missing.length) {
    throw new Error(
      `migrateDatabase: MIGRATIONS está com buraco na versão ${missing.join(', ')}. ` +
        `A cadeia não pode pular versão — import recusado para não gravar dado incompleto.`
    );
  }
  return next;
}
