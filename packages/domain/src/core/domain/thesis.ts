/**
 * Domínio do TCC (SPEC-012).
 *
 * Regra de fonte única: **toda** regra de negócio do TCC vive aqui. `src/types/thesis.ts`
 * é stub de compat com re-export relativo; `src/context/dataActions.ts` e
 * `AppContext.tsx` ficam **finos** (AGENTS: não adicionar regra de negócio no
 * contexto). Views consomem via `useMobileApp()`/sub-contextos.
 *
 * Invariantes que este módulo impõe:
 * - `INV-T1`: `stage === 'pronto'` é a única definição de capítulo pronto;
 *   `completed` (boolean antigo) é **derivado**.
 * - `INV-T2`: reordenar reindexa `position` só entre irmãos do mesmo `parentId`.
 * - `INV-T4`: uma citação sem `readingId` não existe; "é do TCC?" é derivado.
 * - `INV-T6`: nenhum checklist nasce semeado.
 * - `INV-T7`: nenhum valor de meta é pré-preenchido.
 * - `INV-T8`: o dado bibliográfico tem um dono só (`ReadingItem`, ADR-010);
 *   `formatAbnt` não recebe `ThesisReference`.
 * - `INV-T9`: nenhum relógio dentro do domínio. `today` chega por parâmetro.
 *
 * Datas civis: `DateKey` (`YYYY-MM-DD`, fuso local). Proibido instanciar `Date`
 * a partir da data civil (o parse é UTC) e proibido derivar data de
 * `toISOString()` — em fuso negativo os dois jogam o dia para trás. A fonte
 * dos helpers é `common.ts` (SPEC-C-002).
 */

import type { DateKey, EntityId } from './common';
import { addDays, dateKeyOrdinal } from './common';
import { makeId } from './ids';
import type { Requiredness } from './projects';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** O TCC é único no mobile (D1). Este id mapeia 1:1 para `Project.id`. */
export const THESIS_ID = 'tcc-main' as const;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ThesisStatus = 'em_andamento' | 'revisao' | 'concluido';

export type ChapterStage = 'a_fazer' | 'escrevendo' | 'em_revisao' | 'pronto';

export type ChapterKind = 'preatextual' | 'capitulo' | 'secao' | 'postextual' | 'opcional';

export type RefType = 'artigo' | 'livro' | 'capitulo' | 'site' | 'tese' | 'outro';

export type RefStatus = 'candidata' | 'lida' | 'citada' | 'descartada';

export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada';

export type MeetingMode = 'presencial' | 'online' | 'mensagem';

export type TaskStatus = 'aberta' | 'em_andamento' | 'resolvida' | 'arquivada';

export type TaskOrigin = 'orientadora' | 'minha';

export interface ThesisProject {
  workspaceId?: string;
  id: typeof THESIS_ID;
  title: string;
  advisor: string;
  field: string;
  problemStatement: string;
  objectives: string[];
  status: ThesisStatus;
  deliveryDate?: DateKey;
  defenseDate?: DateKey;
  wordGoalTotal?: number;
  weeklyWordGoal?: number;
  reminderPrefs: ThesisReminderPrefs;
}

export interface ThesisReminderPrefs {
  enabled: boolean;
  chapterDaysBefore: number[];
  milestoneDaysBefore: number[];
  time: string;
  meetingEve: boolean;
  meetingMinutesBefore: number[];
}

export interface ThesisChapter {
  id: EntityId;
  workspaceId?: string;
  thesisId: typeof THESIS_ID;
  parentId?: EntityId;
  position: number;
  title: string;
  kind: ChapterKind;
  requiredness: Requiredness;
  stage: ChapterStage;
  dueDate?: DateKey;
  wordGoal?: number;
  wordCount?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisReference {
  id: EntityId;
  workspaceId?: string;
  thesisId: typeof THESIS_ID;
  readingId: EntityId;
  status: RefStatus;
  chapterIds?: EntityId[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisMeeting {
  id: EntityId;
  workspaceId?: string;
  thesisId: typeof THESIS_ID;
  date: DateKey;
  time?: string;
  mode: MeetingMode;
  status: MeetingStatus;
  summary?: string;
  decisions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThesisTask {
  id: EntityId;
  workspaceId?: string;
  thesisId: typeof THESIS_ID;
  title: string;
  origin: TaskOrigin;
  meetingId?: EntityId;
  chapterId?: EntityId;
  dueDate?: DateKey;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisWritingLog {
  id: EntityId;
  workspaceId?: string;
  thesisId: typeof THESIS_ID;
  date: DateKey;
  chapterId?: EntityId;
  words: number;
  minutes?: number;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Seeds
// ---------------------------------------------------------------------------

export const emptyThesisReminderPrefs = (): ThesisReminderPrefs => ({
  enabled: false,
  chapterDaysBefore: [7, 1, 0],
  milestoneDaysBefore: [30, 14, 7, 1],
  time: '09:00',
  meetingEve: true,
  meetingMinutesBefore: [60],
});

export const emptyThesis = (): ThesisProject => ({
  id: THESIS_ID,
  title: '',
  advisor: '',
  field: '',
  problemStatement: '',
  objectives: [],
  status: 'em_andamento',
  reminderPrefs: emptyThesisReminderPrefs(),
});

// ---------------------------------------------------------------------------
// Seletores puros
// ---------------------------------------------------------------------------
// A porta de escrita (`planSave`/`planDelete` por entidade) nasce na camada de
// aplicação (`packages/application/src/thesis/`, §9.5 da spec), no padrão do
// Estágio (`handleSaveInternshipLog` → `planSave` de `internship.ts`). O domínio
// aqui é leitura: tipos, seletores e formatadores puros.

/** `completed` é **derivado** de `stage` (INV-T1). */
export const isChapterDone = (chapter: ThesisChapter): boolean => chapter.stage === 'pronto';

export const thesisProgress = (chapters: ThesisChapter[]): number => {
  if (chapters.length === 0) return 0;
  const done = chapters.filter(isChapterDone).length;
  return Math.round((done / chapters.length) * 100);
};

export interface ThesisDeadline {
  kind: 'chapter' | 'task' | 'meeting' | 'milestone';
  entityId: EntityId;
  title: string;
  date: DateKey;
  overdue: boolean;
}

export const nextThesisDeadline = (
  thesis: ThesisProject,
  chapters: ThesisChapter[],
  tasks: ThesisTask[],
  meetings: ThesisMeeting[],
  today: DateKey,
): ThesisDeadline | null => {
  const candidates: ThesisDeadline[] = [];

  for (const ch of chapters) {
    if (ch.dueDate && !isChapterDone(ch)) {
      candidates.push({
        kind: 'chapter',
        entityId: ch.id,
        title: ch.title,
        date: ch.dueDate,
        overdue: dateKeyOrdinal(ch.dueDate) < dateKeyOrdinal(today),
      });
    }
  }

  for (const task of tasks) {
    if (task.dueDate && task.status !== 'resolvida' && task.status !== 'arquivada') {
      candidates.push({
        kind: 'task',
        entityId: task.id,
        title: task.title,
        date: task.dueDate,
        overdue: dateKeyOrdinal(task.dueDate) < dateKeyOrdinal(today),
      });
    }
  }

  for (const meeting of meetings) {
    if (meeting.status === 'agendada') {
      candidates.push({
        kind: 'meeting',
        entityId: meeting.id,
        title: 'reunião com orientação',
        date: meeting.date,
        overdue: dateKeyOrdinal(meeting.date) < dateKeyOrdinal(today),
      });
    }
  }

  if (thesis.deliveryDate) {
    candidates.push({
      kind: 'milestone',
      entityId: 'delivery',
      title: 'entrega final',
      date: thesis.deliveryDate,
      overdue: dateKeyOrdinal(thesis.deliveryDate) < dateKeyOrdinal(today),
    });
  }

  if (thesis.defenseDate) {
    candidates.push({
      kind: 'milestone',
      entityId: 'defense',
      title: 'banca',
      date: thesis.defenseDate,
      overdue: dateKeyOrdinal(thesis.defenseDate) < dateKeyOrdinal(today),
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => dateKeyOrdinal(a.date) - dateKeyOrdinal(b.date));
  return candidates[0];
};

export const weekWords = (logs: ThesisWritingLog[], weekStart: DateKey): number =>
  logs
    .filter((log) => {
      const o = dateKeyOrdinal(log.date);
      return o >= dateKeyOrdinal(weekStart) && o < dateKeyOrdinal(addDays(weekStart, 7));
    })
    .reduce((sum, log) => sum + log.words, 0);

export interface ThesisLinkIndex {
  byReadingId: Map<EntityId, ThesisReference>;
  citedCount: number;
  candidateCount: number;
}

/** "É do TCC?" é **derivado** (INV-T4), nunca escrito no `ReadingItem`. */
export const buildThesisLinkIndex = (refs: ThesisReference[]): ThesisLinkIndex => {
  const byReadingId = new Map<EntityId, ThesisReference>();
  let citedCount = 0;
  let candidateCount = 0;

  for (const ref of refs) {
    // INV-T4: citação sem `readingId` não existe — a v1 exige o vínculo com a
    // estante (ADR-010). A guarda é defensiva: dado inválido não entra no índice.
    if (!ref.readingId) continue;
    byReadingId.set(ref.readingId, ref);
    if (ref.status === 'citada') citedCount++;
    if (ref.status === 'candidata') candidateCount++;
  }

  return { byReadingId, citedCount, candidateCount };
};

// ---------------------------------------------------------------------------
// Reordenação (INV-T2)
// ---------------------------------------------------------------------------

/**
 * Reordena capítulos **só entre irmãos do mesmo `parentId`**. Soltar na mesma
 * posição não escreve. Reindexa `position` de 0…n-1.
 */
export const reorderSiblings = (
  chapters: ThesisChapter[],
  parentId: EntityId | undefined,
  fromIndex: number,
  toIndex: number,
): ThesisChapter[] => {
  const siblings = chapters
    .filter((ch) => (ch.parentId ?? undefined) === parentId)
    .sort((a, b) => a.position - b.position);

  if (fromIndex < 0 || fromIndex >= siblings.length) return chapters;
  if (toIndex < 0 || toIndex >= siblings.length) return chapters;
  if (fromIndex === toIndex) return chapters;

  const moved = siblings[fromIndex];
  const remaining = siblings.filter((_, i) => i !== fromIndex);
  remaining.splice(toIndex, 0, moved);

  const reindexed = remaining.map((ch, i) => ({ ...ch, position: i }));
  const reindexedIds = new Set(reindexed.map((ch) => ch.id));

  return chapters.map((ch) => {
    if (!reindexedIds.has(ch.id)) return ch;
    return reindexed.find((r) => r.id === ch.id)!;
  });
};

/**
 * Ordem de renderização (SPEC-012 F4.1): capítulos de topo por `position`,
 * cada um seguido das suas seções. Órfãs (parentId apagado) ficam no fim,
 * tolerância — nunca somem da tela.
 */
export const orderChaptersForRender = (chapters: ThesisChapter[]): ThesisChapter[] => {
  const topLevel = chapters.filter((ch) => !ch.parentId).sort((a, b) => a.position - b.position);
  const out: ThesisChapter[] = [];
  for (const ch of topLevel) {
    out.push(ch);
    const kids = chapters.filter((k) => k.parentId === ch.id).sort((a, b) => a.position - b.position);
    out.push(...kids);
  }
  const known = new Set(out.map((ch) => ch.id));
  out.push(...chapters.filter((ch) => ch.parentId && !known.has(ch.parentId)));
  return out;
};

/**
 * Converte a ordem visual (arrastar) em posições canônicas (INV-T2): a posição
 * de cada capítulo é o índice dele **entre os irmãos**, na ordem em que
 * aparecem na lista renderizada. Nada mudou → devolve a referência original
 * (soltar na mesma posição não escreve).
 */
export const commitFlatOrder = (
  chapters: ThesisChapter[],
  rendered: ThesisChapter[],
): ThesisChapter[] => {
  const counters = new Map<string | undefined, number>();
  const positionById = new Map<string, number>();
  for (const ch of rendered) {
    const key = ch.parentId ?? undefined;
    const idx = counters.get(key) ?? 0;
    counters.set(key, idx + 1);
    positionById.set(ch.id, idx);
  }
  let changed = false;
  const updated = chapters.map((ch) => {
    const pos = positionById.get(ch.id);
    if (pos === undefined || pos === ch.position) return ch;
    changed = true;
    return { ...ch, position: pos };
  });
  if (!changed) return chapters;
  return orderChaptersForRender(updated);
};

/** "Mover para cima/baixo" de um capítulo entre os irmãos (o caminho acessível do arrastar). */
export const moveChapter = (chapters: ThesisChapter[], id: EntityId, delta: -1 | 1): ThesisChapter[] => {
  const ch = chapters.find((c) => c.id === id);
  if (!ch) return chapters;
  const siblings = chapters
    .filter((c) => (c.parentId ?? undefined) === (ch.parentId ?? undefined))
    .sort((a, b) => a.position - b.position);
  const i = siblings.findIndex((c) => c.id === id);
  return reorderSiblings(chapters, ch.parentId ?? undefined, i, i + delta);
};

// ---------------------------------------------------------------------------
// Lembretes (SPEC-012 §6.3)
// ---------------------------------------------------------------------------

/** Faixa própria de ids: a de aulas ocupa 2000-2199 (`notifications.ts:78-79`). */
export const THESIS_REMINDER_BASE = 3000;
export const THESIS_REMINDER_RANGE = 200;
/**
 * Teto do plano: o iOS mantém no máximo **64** notificações locais pendentes
 * `[V]` (verificado por teste na F10.4). O plano ordena por data (mais próximos
 * primeiro) e corta no teto — reagenda a cada abertura e a cada escrita.
 */
export const THESIS_REMINDER_CEILING = 64;

/** Destino do toque (a aba em `NavScreen`; o adapter mapeia para `ThesisTab`). */
export type ThesisReminderTarget = 'visao' | 'capitulos' | 'orientacao';

export interface PlannedThesisReminder {
  /** `THESIS_REMINDER_BASE + índice` — estável por ordem de data no plano. */
  id: number;
  title: string;
  body: string;
  /** Instante **local** agendado — construído das entradas, nenhum relógio lido. */
  at: Date;
  target: { tab: ThesisReminderTarget; entityId?: EntityId };
}

export interface ThesisReminderState {
  thesis: ThesisProject;
  chapters: ThesisChapter[];
  tasks: ThesisTask[];
  meetings: ThesisMeeting[];
}

const parseHHMM = (time: string): { hour: number; minute: number } => {
  const [h, m] = time.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 };
};

/** `DateKey` + `HH:mm` → `Date` local. Determinístico das entradas. */
const at = (key: DateKey, time: string): Date => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return new Date(NaN);
  const { hour, minute } = parseHHMM(time);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, minute);
};

const relativeDay = (days: number): string =>
  days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `em ${days} dias`;

/**
 * O plano de lembretes do TCC (§6.3) — **puro**: `today` e `now` chegam por
 * parâmetro (`now` tem default explícito, o único relógio do arquivo).
 *
 * Gatilhos: capítulo 7/1/0 dias antes (às `prefs.time`), pendência 1/0 dias,
 * reunião agendada (véspera às 18:00; com hora, `meetingMinutesBefore` antes;
 * sem hora, também 09:00 no dia), entrega/banca 30/14/7/1 dias antes.
 * Só agenda **futuro**; pronto/resolvida/cancelada/passado não gera nada.
 */
export const planThesisReminders = (
  state: ThesisReminderState,
  today: DateKey,
  prefs: ThesisReminderPrefs,
  now: Date = new Date(),
): PlannedThesisReminder[] => {
  if (!prefs.enabled) return [];
  const { thesis, chapters, tasks, meetings } = state;
  const out: PlannedThesisReminder[] = [];
  const push = (
    when: Date,
    body: string,
    tab: ThesisReminderTarget,
    entityId?: EntityId,
  ) => {
    if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) return;
    out.push({ id: 0, title: 'cecistudy ♡ tcc', body, at: when, target: { tab, entityId } });
  };

  for (const ch of chapters) {
    if (!ch.dueDate || ch.stage === 'pronto') continue;
    for (const d of prefs.chapterDaysBefore) {
      push(
        at(addDays(ch.dueDate, -d), prefs.time),
        `o capítulo ${ch.title} vence ${relativeDay(d)}`,
        'capitulos',
        ch.id,
      );
    }
  }

  for (const task of tasks) {
    if (!task.dueDate || task.status === 'resolvida' || task.status === 'arquivada') continue;
    for (const d of [1, 0]) {
      push(
        at(addDays(task.dueDate, -d), prefs.time),
        `pendência da orientação: ${task.title} — ${relativeDay(d)}`,
        'orientacao',
        task.id,
      );
    }
  }

  for (const meeting of meetings) {
    if (meeting.status !== 'agendada') continue;
    if (prefs.meetingEve) {
      push(
        at(addDays(meeting.date, -1), '18:00'),
        `reunião com ${thesis.advisor || 'a orientação'} amanhã${meeting.time ? ` às ${meeting.time}` : ''}`,
        'orientacao',
        meeting.id,
      );
    }
    if (meeting.time) {
      for (const mins of prefs.meetingMinutesBefore) {
        const { hour, minute } = parseHHMM(meeting.time);
        push(
          new Date(
            at(meeting.date, '00:00').getTime() + (hour * 60 + minute - mins) * 60_000,
          ),
          `reunião com ${thesis.advisor || 'a orientação'} hoje às ${meeting.time}`,
          'orientacao',
          meeting.id,
        );
      }
    } else {
      push(
        at(meeting.date, '09:00'),
        `reunião com ${thesis.advisor || 'a orientação'} hoje`,
        'orientacao',
        meeting.id,
      );
    }
  }

  for (const [date, label] of [
    [thesis.deliveryDate, 'a entrega'],
    [thesis.defenseDate, 'a banca'],
  ] as const) {
    if (!date) continue;
    for (const d of prefs.milestoneDaysBefore) {
      push(at(addDays(date, -d), prefs.time), `faltam ${d} dias para ${label} do tcc ♡`, 'visao');
    }
  }

  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out.slice(0, THESIS_REMINDER_CEILING).map((r, i) => ({ ...r, id: THESIS_REMINDER_BASE + i }));
};

/**
 * Roteamento do toque na notificação (Q10) — **puro e defensivo**: `extra`
 * inválido/ausente devolve `null` (o chamador simplesmente não navega), aba
 * desconhecida idem, `focusId` de item removido cai na aba sem erro (o
 * `NavScreen` já tolera).
 */
export const routeFromNotificationExtra = (extra: unknown): { tab: ThesisReminderTarget; focusId?: string } | null => {
  if (typeof extra !== 'object' || extra === null) return null;
  const thesis = (extra as Record<string, unknown>).thesis;
  if (typeof thesis !== 'object' || thesis === null) return null;
  const { tab, entityId } = thesis as Record<string, unknown>;
  if (tab !== 'visao' && tab !== 'capitulos' && tab !== 'orientacao') return null;
  return {
    tab,
    ...(typeof entityId === 'string' && entityId !== '' ? { focusId: entityId } : {}),
  };
};

// ---------------------------------------------------------------------------
// ABNT (NBR 6023, resumo)
// ---------------------------------------------------------------------------

export interface RefAuthor {
  family: string;
  given?: string;
}

export interface ThesisReferenceData {
  type: RefType;
  authors: RefAuthor[];
  title: string;
  subtitle?: string;
  /** Periódico (artigo), site, ou título do **livro** no caso de capítulo. */
  container?: string;
  publisher?: string;
  place?: string;
  edition?: string;
  year?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  accessedOn?: DateKey;
  /** Instituição de defesa (tese/dissertação). */
  institution?: string;
  /** Grau da tese (ex.: 'doutorado', 'mestrado'). */
  degree?: string;
  rawCitation?: string;
}

/**
 * Fonte ABNT possível de um `ReadingItem` (dono Biblioteca — ADR-010). A forma
 * é estrutural: o domínio não importa o tipo do app; o `ReadingItem` satisfaz
 * de longe. `title` e `type` são obrigatórios; todo o resto é opcional.
 */
export interface ReadingAbntSource {
  type: 'livro' | 'artigo' | 'capitulo' | 'pdf';
  refType?: RefType;
  title: string;
  author?: string;
  authors?: RefAuthor[];
  subtitle?: string;
  container?: string;
  publisher?: string;
  place?: string;
  edition?: string;
  year?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  accessedOn?: DateKey;
  rawCitation?: string;
  institution?: string;
  degree?: string;
}

const READING_TYPE_TO_REF: Record<ReadingAbntSource['type'], RefType> = {
  livro: 'livro',
  artigo: 'artigo',
  capitulo: 'capitulo',
  pdf: 'outro',
};

/** Separa um autor escrito como "Sobrenome, Nome". **Sem vírgula, não adivinha**
 * o sobrenome (F7.5): devolve `null` e o diagnóstico avisa "conferir autores". */
export const parseAuthorString = (raw: string): RefAuthor | null => {
  const trimmed = raw.trim();
  if (!trimmed.includes(',')) return null;
  const parts = trimmed.split(',', 2).map((s) => s.trim());
  const [family, given] = parts;
  if (!family) return null;
  return given ? { family, given } : { family };
};

/** Traduz um `ReadingItem` para a forma que `formatAbnt`/`validateRef` esperam.
 * `rawCitation` passa direto e vence; `refType` sobrepõe o mapeamento de `type`
 * (`pdf` → `outro`). Autores vêm de `authors` ou de um `author` **com vírgula** —
 * nunca por adivinhação. */
export const abntDataFromReading = (r: ReadingAbntSource): ThesisReferenceData => {
  const fromText = r.author ? parseAuthorString(r.author) : null;
  const authors =
    r.authors && r.authors.length > 0
      ? r.authors
      : fromText
        ? [fromText]
        : [];
  return {
    type: r.refType ?? READING_TYPE_TO_REF[r.type],
    authors,
    title: r.title,
    subtitle: r.subtitle,
    container: r.container,
    publisher: r.publisher,
    place: r.place,
    edition: r.edition,
    year: r.year,
    volume: r.volume,
    issue: r.issue,
    pages: r.pages,
    doi: r.doi,
    url: r.url,
    accessedOn: r.accessedOn,
    institution: r.institution,
    degree: r.degree,
    rawCitation: r.rawCitation,
  };
};

export interface AbntSegment {
  text: string;
  bold?: boolean;
}

const MONTHS_SHORT = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

const formatAccessedOn = (key: DateKey): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const [, y, mo, d] = m;
  return `${Number(d)} ${MONTHS_SHORT[Number(mo) - 1]} ${y}`;
};

const formatAuthors = (authors: RefAuthor[], listAll: boolean): string => {
  if (authors.length === 0) return '';
  const formatOne = (a: RefAuthor) => {
    const family = a.family.toUpperCase();
    return a.given ? `${family}, ${a.given}` : family;
  };
  if (listAll || authors.length <= 3) {
    return authors.map(formatOne).join('; ');
  }
  return `${formatOne(authors[0])}; et al.`;
};

/**
 * Formata uma referência no padrão ABNT (NBR 6023). Função **pura** do
 * `ReadingItem` (INV-T8) — não recebe `ThesisReference`.
 *
 * - `rawCitation` sempre vence: é o texto que a usuária montou à mão.
 * - Ano ausente **não é inventado**: `s.d.` só aparece se a usuária digitar
 *   (§7.1); o diagnóstico de campo faltante é papel do `validateRef`.
 * - Sobrenome em caixa alta vem do campo `family` já separado — o formatador
 *   **não adivinha** preposição nem heurística de nome.
 */
export const formatAbnt = (ref: ThesisReferenceData, opts: { listAllAuthors?: boolean } = {}): AbntSegment[] => {
  if (ref.rawCitation) return [{ text: ref.rawCitation }];

  const authors = formatAuthors(ref.authors, opts.listAllAuthors ?? false);
  const title = ref.title;
  const subtitle = ref.subtitle;
  const year = ref.year;
  const container = ref.container;
  const publisher = ref.publisher;
  const place = ref.place;
  const edition = ref.edition;
  const volume = ref.volume;
  const issue = ref.issue;
  const pages = ref.pages;
  const url = ref.url;
  const accessedOn = ref.accessedOn;

  const segments: AbntSegment[] = [];

  const push = (text: string, bold = false) => {
    if (text) segments.push({ text, bold });
  };

  switch (ref.type) {
    case 'artigo': {
      // `SOBRENOME, Nome. Título: subtítulo. **Periódico**, local, v. X, n. Y,
      // p. A-B, ano. DOI/Disponível em: URL. Acesso em: D mês. AAAA.`
      // O negrito é do periódico (§7.1), nunca do título do artigo.
      if (authors) push(`${authors}. `);
      push(`${title}${subtitle ? `: ${subtitle}` : ''}. `);
      const rest: string[] = [];
      if (place) rest.push(place);
      if (volume) rest.push(`v. ${volume}`);
      if (issue) rest.push(`n. ${issue}`);
      if (pages) rest.push(`p. ${pages}`);
      if (year) rest.push(year);
      if (container) {
        push(container, true);
        push(rest.length > 0 ? `, ${rest.join(', ')}.` : '.');
      } else if (rest.length > 0) {
        push(`${rest.join(', ')}.`);
      }
      if (ref.doi) push(` DOI: ${ref.doi}.`);
      if (url) push(` Disponível em: ${url}.`);
      if (accessedOn) push(` Acesso em: ${formatAccessedOn(accessedOn)}.`);
      break;
    }
    case 'livro': {
      // `SOBRENOME, Nome. **Título**: subtítulo. ed. Local: Editora, ano.`
      if (authors) push(`${authors}. `);
      push(title, true);
      if (subtitle) push(`: ${subtitle}`);
      push('. ');
      const bits: string[] = [];
      if (edition) bits.push(`${edition} ed.`);
      const local = [place, publisher].filter(Boolean).join(': ');
      if (local) bits.push(local);
      const head = bits.join(' ');
      if (head && year) push(`${head}, ${year}.`);
      else if (head) push(`${head}.`);
      else if (year) push(`${year}.`);
      break;
    }
    case 'capitulo': {
      // `SOBRENOME, Nome. Título do capítulo. In: **Título do livro**.
      // Local: Editora, ano. p. A-B.` — o org. do livro não é fabricado: só
      // entra se a usuária preencher (o modelo da ADR-010 não tem autor do
      // livro separado do autor do capítulo).
      if (authors) push(`${authors}. `);
      if (container) {
        push(`${title}. In: `);
        push(container, true);
        push('. ');
      } else {
        push(`${title}. `);
      }
      const local = [place, publisher].filter(Boolean).join(': ');
      const bits: string[] = [];
      if (local) bits.push(local);
      if (year) bits.push(year);
      if (bits.length > 0) push(`${bits.join(', ')}.`);
      if (pages) push(` p. ${pages}.`);
      break;
    }
    case 'site': {
      // `SOBRENOME, Nome. Título. **Site**, ano. Disponível em: URL.
      // Acesso em: D mês. AAAA.`
      if (authors) push(`${authors}. `);
      push(`${title}. `);
      if (container) {
        push(container, true);
        push(year ? `, ${year}. ` : '. ');
      } else if (year) {
        push(`${year}. `);
      }
      if (url) push(`Disponível em: ${url}. `);
      if (accessedOn) push(`Acesso em: ${formatAccessedOn(accessedOn)}.`);
      break;
    }
    case 'tese': {
      // `SOBRENOME, Nome. **Título**. Ano. Tipo (grau) — Instituição, ano.`
      if (authors) push(`${authors}. `);
      push(title, true);
      push('. ');
      if (year) push(`${year}. `);
      const inst = ref.institution ?? place ?? 'instituição não informada';
      const tipo = ref.degree ? `Tese (${ref.degree})` : 'Tese';
      push(`${tipo} — ${inst}${year ? `, ${year}` : ''}.`);
      break;
    }
    default: {
      if (authors) push(`${authors}. `);
      if (title) push(title, true);
      if (year) push(`, ${year}.`);
      break;
    }
  }

  return segments;
};

export const toPlainText = (segments: AbntSegment[]): string =>
  segments.map((s) => s.text).join('');

export interface MissingField {
  field: string;
  label: string;
}

/** Diagnóstico não bloqueante: mostra "faltam: …" e nunca impede salvar. */
export const validateRef = (ref: ThesisReferenceData): MissingField[] => {
  const missing: MissingField[] = [];

  if (ref.authors.length === 0) missing.push({ field: 'authors', label: 'autor' });
  if (!ref.title) missing.push({ field: 'title', label: 'título' });

  if (ref.type === 'artigo') {
    if (!ref.container) missing.push({ field: 'container', label: 'periódico' });
    if (!ref.year) missing.push({ field: 'year', label: 'ano' });
  }

  if (ref.type === 'livro') {
    if (!ref.publisher) missing.push({ field: 'publisher', label: 'editora' });
    if (!ref.year) missing.push({ field: 'year', label: 'ano' });
  }

  if ((ref.type === 'artigo' || ref.type === 'site') && ref.url && !ref.accessedOn) {
    missing.push({ field: 'accessedOn', label: 'acesso' });
  }

  return missing;
};

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/** Normaliza URL: minúsculas no host, remove `#fragmento`, `utm_*`/`fbclid`/`gclid`, barra final. */
export const normalizeUrl = (raw: string): string => {
  try {
    const u = new URL(raw);
    u.hash = '';
    // Coleta antes, apaga depois: deletar durante a iteração de `searchParams`
    // pula entradas (o iterator é vivo) — testado: `fbclid` escapava.
    const junk = Array.from(u.searchParams.keys()).filter(
      (key) => key.startsWith('utm_') || key === 'fbclid' || key === 'gclid',
    );
    for (const key of junk) u.searchParams.delete(key);
    let s = u.toString();
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return raw;
  }
};

/** Extrai a primeira URL `http(s)` de um texto livre. */
export const extractFirstUrl = (text: string): string | null => {
  const m = /https?:\/\/[^\s]+/.exec(text);
  return m ? m[0] : null;
};

/** Valida URL: só `http`/`https`, recusa `javascript:`, `file:`, `data:`. */
export const isValidUrl = (raw: string): boolean => {
  if (raw.length > 2048) return false;
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Captura de link (SPEC-012 §8.5, F8)
// ---------------------------------------------------------------------------

/** O que a captura cria: artigo ou "leitura" (livro pra ler) — Q1. */
export type CaptureKind = 'artigo' | 'leitura';

export interface CaptureLinkInput {
  /** Texto ou URL; quando vem do Android pode vir com título junto. */
  url: string;
  /** Título da página, quando a fonte entrega (Safari/atalho). */
  title?: string;
  kind: CaptureKind;
  /** "é pro TCC?" — quando `true`, cria `ThesisReference` na mesma escrita. */
  thesis: boolean;
}

/** Forma estrutural do `ReadingItem` criado (o real é composto no `src`). */
export interface CapturedReading {
  id: string;
  title: string;
  author: string;
  type: 'livro' | 'artigo';
  status: 'nao_iniciado';
  sourceKind: 'custom';
  url: string;
  refType: RefType;
  enrichStatus: 'pendente';
}

export type CaptureOutcome =
  | { outcome: 'invalida' }
  | { outcome: 'duplicada'; readingId: string }
  | { outcome: 'criada'; reading: CapturedReading; reference: ThesisReference | null };

/** Host de uma URL já normalizada; `exemplo.org` quando o parse falha. */
const hostOf = (url: string): string => {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
};

/**
 * `captureLink` (SPEC-012 §8.5): **uma escrita por ação**. Dado o input e a
 * estante atual, devolve a leitura a criar — e a referência, quando é pro TCC.
 *
 * - URL inválida (não `http(s)`, `javascript:`/`file:`/`data:`, >2048) → `invalida`.
 * - URL já guardada (dedupe por `normalizeUrl`) → `duplicada`, nada é criado.
 * - Sem título, usa o host. Autor: `'autor não informado'` (`ReadingWizard`).
 * - `now` é parâmetro (INV-T9: nenhum relógio no domínio).
 */
export const captureLink = (
  input: CaptureLinkInput,
  existingReadings: { id: string; url?: string }[],
  now: string,
): CaptureOutcome => {
  const url = extractFirstUrl(input.url) ?? input.url.trim();
  if (!isValidUrl(url)) return { outcome: 'invalida' };
  const normalized = normalizeUrl(url);

  const dup = existingReadings.find((r) => r.url && normalizeUrl(r.url) === normalized);
  if (dup) return { outcome: 'duplicada', readingId: dup.id };

  const type: 'livro' | 'artigo' = input.kind === 'artigo' ? 'artigo' : 'livro';
  const reading: CapturedReading = {
    id: makeId('rdr'),
    title: input.title?.trim() || hostOf(normalized),
    author: 'autor não informado',
    type,
    status: 'nao_iniciado',
    sourceKind: 'custom',
    url: normalized,
    refType: READING_TYPE_TO_REF[type],
    enrichStatus: 'pendente',
  };

  const reference: ThesisReference | null = input.thesis
    ? {
        id: makeId('thr'),
        thesisId: THESIS_ID,
        readingId: reading.id,
        status: 'candidata',
        createdAt: now,
        updatedAt: now,
      }
    : null;

  return { outcome: 'criada', reading, reference };
};

export interface CaptureDeepLink {
  url: string;
  kind: CaptureKind;
  thesis: boolean;
  /** Id de idempotência do atalho (`x`), quando houver. */
  id?: string;
}

/**
 * Lê `cecistudy://captura?u=<url>&k=artigo|leitura&t=1|0&x=<id>` (§8.4).
 * Todos os parâmetros são URL-encoded. Devolve `null` se não for o esquema
 * `cecistudy`/host `captura`, ou se a URL (`u`) for inválida.
 */
export const parseCaptureDeepLink = (raw: string): CaptureDeepLink | null => {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'cecistudy:' || parsed.host !== 'captura') return null;
  const url = parsed.searchParams.get('u') ?? '';
  if (!isValidUrl(url)) return null;
  const kind: CaptureKind = parsed.searchParams.get('k') === 'leitura' ? 'leitura' : 'artigo';
  const thesis = parsed.searchParams.get('t') !== '0';
  const id = parsed.searchParams.get('x') || undefined;
  return { url, kind, thesis, id };
};

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

export const newChapterId = (): EntityId => makeId('thc');
export const newReferenceId = (): EntityId => makeId('thr');
export const newReadingId = (): EntityId => makeId('rdr');
export const newMeetingId = (): EntityId => makeId('thm');
export const newTaskId = (): EntityId => makeId('tts');
export const newWritingLogId = (): EntityId => makeId('twl');
