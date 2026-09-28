/**
 * Período letivo (`AcademicTerm`) — SPEC-005.
 *
 * O período letivo é a **dimensão que faltava** no app: antes disso o semestre
 * era um número decorativo em `UserProfile` que não filtrava, não arquivava e
 * ainda fazia ping-pong de sync (o perfil é singleton com LWW do objeto inteiro).
 *
 * Decisões estruturais (ver §D1–§D7 da spec):
 * - `status` é o **único driver de visibilidade**; não existe soft-delete nem
 *   `archivedAt`.
 * - Só `Course` carrega `termId` direto; `ClassNote`/`Task`/`Exam`/`ReadingItem`/
 *   `StudySession`/`Flashcard` **herdam** por `courseId` (zero coluna nova).
 * - `profile.semester` é **derivado** do `ordinal` do termo ativo. Nenhum
 *   ponteiro "qual período estou vendo" é persistido — o ativo é derivado da
 *   lista, e é isso que mata o ping-pong entre dispositivos.
 *
 * Funções puras: sem `Date.now()` dentro, sem React, sem storage, sem Capacitor.
 * `now`/`closedAt` sempre chegam por argumento.
 *
 * ---
 *
 * **As 3 portas de escrita** (SPEC-006 D5). Toda mutação de `AcademicTerm` no app
 * tem que passar por exatamente uma delas — é o que mantém `statusTransitionAt`
 * (o relógio que decide qual é o período ativo) com significado:
 *
 * 1. **Boot / import / primeiro uso** — `createAcademicTerm` cria o período de
 *    bootstrap; `MIGRATIONS[18]` faz o backfill do `profile.semester` legado.
 *    `Date.now()` é **proibido** aqui: a migração tem que ser determinística
 *    (rodar duas vezes precisa dar o mesmo resultado).
 * 2. **Virada de semestre** — `closeTerm` + `createAcademicTerm`, orquestrados
 *    por `planTermRollover` (que já devolve o diff, antes de gravar). Sempre
 *    acompanhada de `enforceSingleActiveTerm`.
 * 3. **Correção pela usuária** — `retitleTerm` (arrumar o número do semestre
 *    ativo, a "porta fácil" do Perfil) e `reopenTerm` (devolver um encerrado ao
 *    ativo). É a única porta que muda o passado, então é a única que zera o
 *    transcript: reabrir limpa `endedAt`/`summary` (§D7), senão o `ativo`
 *    carregaria o resumo de um período que não terminou.
 *
 * Consequência prática: `statusTransitionAt` é o único campo que faz a "promoção"
 * de um período para o ativo da tela, e por isso `resolveActiveTerm` **nunca**
 * pode ser substituído por `terms.find(t => t.status === 'ativo')` — o `find`
 * depende da ordem do array (que o sync embaralha). Era esse o bug B2.
 */
import type { EntityId } from './common';
import { makeId } from './ids';

/**
 * Ciclo de vida do período letivo. Só **avança** — `encerrado` não volta a
 * `ativo` sem uma transição explícita (`reopenTerm`). Enquanto está encerrado,
 * o resumo é imutável (é o "transcript" do semestre); `reopenTerm` é a única
 * exceção, e ela **apaga** o transcript em vez de preservá-lo num termo que
 * voltou a ser `ativo` (SPEC-006 D7).
 */
export type TermStatus = 'planejado' | 'ativo' | 'encerrado';

/**
 * Situação de uma disciplina dentro do app. `arquivado` = saiu da grade ativa mas
 * continua pesquisável. **Nunca é delete.**
 */
export type CourseStatus = 'ativo' | 'arquivado';

/** Teto do `ordinal` — cursos de 4/5/6 anos, com folga. */
export const MAX_TERM_ORDINAL = 12;

/** Ordem de avanço do ciclo de vida (índice = ordem; `-1` = inválido). */
const STATUS_ORDER: Record<TermStatus, number> = {
  planejado: 0,
  ativo: 1,
  encerrado: 2,
};

/** Nota de uma avaliação, congelada no resumo do período. */
export interface TermGrade {
  courseId: string;
  label: string;
  grade?: number;
}

/**
 * Resultado imutável do fechamento — o "transcript" do período. É **derivado**
 * por `buildTermSummary` (ver `packages/application`), nunca digitado pela usuária.
 */
export interface TermSummary {
  /** ISO — quando o resumo foi congelado. */
  closedAt: string;
  /** Disciplinas que pertenciam ao período no fechamento. */
  courses: number;
  /** Quantas saíram da grade (`Course.status = 'arquivado'`). */
  archivedCourses: number;
  /** Quantas continuaram no período seguinte (mesmo `id`, histórico preservado). */
  carriedCourses: number;
  classNotes: number;
  tasksCompleted: number;
  tasksCarriedOver: number;
  readingsCompleted: number;
  pagesRead: number;
  focusMinutes: number;
  /** Soma de horas registradas (frequência/`hoursDone`) — carga horária real. */
  loggedHours: number;
  bestStreak: number;
  grades: TermGrade[];
  /** Frases prontas no tom do app, geradas das métricas. */
  highlights: string[];
}

export interface AcademicTerm {
  id: EntityId;
  /** Paridade com o resto do domínio (escopo por workspace). */
  workspaceId?: EntityId;
  /** Rótulo exibido: "6º semestre". */
  label: string;
  /** 1..MAX_TERM_ORDINAL — usado pela timeline e pelo % da graduação. */
  ordinal: number;
  status: TermStatus;
  /** ISO date (YYYY-MM-DD). O fim é derivado quando `status === 'encerrado'`. */
  startedAt: string;
  endedAt?: string;
  /**
   * Quando o `status` mudou pela última vez. Desempata a invariante
   * "no máximo um período ativo" depois de um merge (ver §D6).
   */
  statusTransitionAt: string;
  createdAt: string;
  updatedAt: string;
  /** Congelado no fechamento. Presente só quando `status === 'encerrado'`. */
  summary?: TermSummary;
}

/** Disciplina do ponto de vista do domínio (forma estrutural mínima). */
export interface TermScopedCourse {
  id: string;
  /** `null`/ausente = fora de período (disciplina avulsa, template, import sem período). */
  termId?: string | null;
  status?: CourseStatus;
}

/* -------------------------------------------------------------------------- */
/* Criação                                                                     */
/* -------------------------------------------------------------------------- */

/** Clampa um `ordinal` para `1..cap`. Valores não numéricos viram `1`. */
export function clampTermOrdinal(ordinal: unknown, cap: number = MAX_TERM_ORDINAL): number {
  const n = Math.trunc(Number(ordinal));
  const ceiling = Math.max(1, Math.min(MAX_TERM_ORDINAL, Math.trunc(cap) || MAX_TERM_ORDINAL));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, ceiling);
}

/** Rótulo canônico de exibição: `1` → "1º semestre". */
export function termLabel(ordinal: number): string {
  return `${ordinal}º semestre`;
}

export function createAcademicTerm(input: {
  workspaceId?: EntityId;
  ordinal: number;
  startedAt: string;
  /** ISO completo. Quando ausente, deriva de `startedAt` (mantém a função pura). */
  now?: string;
  status?: TermStatus;
  label?: string;
  id?: EntityId;
}): AcademicTerm {
  const ordinal = clampTermOrdinal(input.ordinal);
  const now = input.now ?? `${input.startedAt}T00:00:00.000Z`;
  return {
    id: input.id ?? makeId('trm'),
    workspaceId: input.workspaceId,
    label: input.label ?? termLabel(ordinal),
    ordinal,
    status: input.status ?? 'ativo',
    startedAt: input.startedAt,
    statusTransitionAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

/* -------------------------------------------------------------------------- */
/* Transições                                                                  */
/* -------------------------------------------------------------------------- */

/** Aplica `patch` a um termo e devolve um **novo** objeto (imutabilidade). */
function patchTerm(term: AcademicTerm, patch: Partial<AcademicTerm>, now: string): AcademicTerm {
  return { ...term, ...patch, updatedAt: now };
}

/**
 * `status` só avança. Uma transição para trás (exceto via `reopenTerm`) ou para
 * o mesmo status devolve o array **inalterado** — a mesma referência de array,
 * para que o caller possa detectar o no-op cheaply.
 */
function canTransition(from: TermStatus, to: TermStatus): boolean {
  if (from === to) return false;
  return STATUS_ORDER[to] > STATUS_ORDER[from];
}

/**
 * Aplica `fn` ao termo `termId`. `fn` devolve `null` para significar
 * "sem mudança neste registro" — nesse caso devolvemos o array **inalterado**
 * (mesma referência), para que o caller detecte o no-op cheaply.
 */
function mapTerm(
  terms: AcademicTerm[],
  termId: EntityId,
  fn: (term: AcademicTerm) => AcademicTerm | null,
): AcademicTerm[] {
  let changed = false;
  const next = terms.map((term) => {
    if (term.id !== termId) return term;
    const updated = fn(term);
    if (updated === null) return term;
    changed = true;
    return updated;
  });
  return changed ? next : terms;
}

/**
 * Encerra o período, congelando o `summary`.
 *
 * Idempotente: encerrar um período já encerrado é no-op (devolve o array
 * inalterado). Não aceita reverter `encerrado` → `ativo` — isso é
 * `reopenTerm`.
 */
export function closeTerm(
  terms: AcademicTerm[],
  termId: EntityId,
  closedAt: string,
  summary?: TermSummary,
): AcademicTerm[] {
  return mapTerm(terms, termId, (term) => {
    if (term.status === 'encerrado') return null;
    if (!canTransition(term.status, 'encerrado')) return null;
    return patchTerm(
      term,
      {
        status: 'encerrado',
        endedAt: closedAt,
        statusTransitionAt: closedAt,
        ...(summary ? { summary } : {}),
      },
      closedAt,
    );
  });
}

/** `planejado` → `ativo`. Idempotente. Não move um período já encerrado. */
export function openTerm(
  terms: AcademicTerm[],
  termId: EntityId,
  now: string,
): AcademicTerm[] {
  return mapTerm(terms, termId, (term) => {
    if (term.status === 'ativo') return null;
    if (!canTransition(term.status, 'ativo')) return null;
    return patchTerm(term, { status: 'ativo', statusTransitionAt: now }, now);
  });
}

/**
 * `encerrado` → `ativo`. A **única** transição que regride o status: é o
 * "re-roll" do Banner, o re-open do Canvas. Serve para corrigir um erro
 * ("era o 6º, não o 5º") sem apagar nada do que o período registrou.
 *
 * **Zera `endedAt` e `summary`** (SPEC-006 D7). O `summary` é o transcript de um
 * período **encerrado** — congelar e depois reexibi-lo num termo reaberto produz
 * dois bugs visíveis: o card do histórico mostra "32 aulas · 20h de foco" num
 * semester que está começando, e `shouldOfferRollover` lê `endedAt` e responde
 * `true` na hora, oferecendo uma virada que não faz sentido. Reabrir devolve o
 * termo ao estado de "ainda não terminou"; o que ele tinha fica no histórico de
 * quem o encerrou — nada é apagado do banco, apenas reclassificado.
 *
 * As chaves `endedAt`/`summary` são **removidas** (não deixadas como `undefined`):
 * elas são a marca de "encerrado", e `toEqual`/serialização do backup não devem
 * carregar lixo.
 */
export function reopenTerm(
  terms: AcademicTerm[],
  termId: EntityId,
  now: string,
): AcademicTerm[] {
  return mapTerm(terms, termId, (term) => {
    if (term.status !== 'encerrado') return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- a remoção é o ponto
    const { endedAt: _endedAt, summary: _summary, ...rest } = term;
    return { ...rest, status: 'ativo' as TermStatus, statusTransitionAt: now, updatedAt: now };
  });
}

/**
 * Corrige o rótulo/ordinal do período — a "porta de entrada fácil" do Perfil
 * (SPEC-006 D6).
 *
 * Só o período **ativo** é editável: um encerrado é o registro congelado de como
 * o semestre foi, e reescrever o ordinal dele bagunçaria a timeline inteira (o
 * 6º viraria 5º e o histórico mentiria). Para corrigir um período já encerrado,
 * reabra-o primeiro (`reopenTerm`) e ajuste aqui.
 *
 * O `label` é sempre rederivado do `ordinal` (`termLabel`) — assim não existe
 * estado meio-corrigido com ordinal 6 e rótulo "5º semestre". O `ordinal` é
 * clampado pelo `cap` (o teto do curso, via `clampTermOrdinal`), e `null`/`NaN`
 * caem no ordinal atual em vez de zerar o progresso.
 */
export function retitleTerm(
  terms: AcademicTerm[],
  termId: EntityId,
  ordinal: unknown,
  now: string,
  cap: number = MAX_TERM_ORDINAL,
): AcademicTerm[] {
  return mapTerm(terms, termId, (term) => {
    if (term.status !== 'ativo') return null;
    // Separa "entrada ausente" de "número fora de faixa": um input vazio não pode
    // virar "1º semestre" (zeraria o progresso sem a usuária pedir), mas um `0`
    // digitado é erro de dedo e deve clampar para 1 como qualquer fora-de-faixa.
    const ausente =
      ordinal === null || ordinal === undefined || ordinal === '' || Number.isNaN(Number(ordinal));
    const next = ausente ? term.ordinal : clampTermOrdinal(ordinal, cap);
    // ainda assim re-deriva o label, para consertar um rótulo drifted
    const label = termLabel(next);
    if (next === term.ordinal && label === term.label) return null;
    return patchTerm(term, { ordinal: next, label }, now);
  });
}

/* -------------------------------------------------------------------------- */
/* Invariantes                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * `a` é "mais novo" que `b`? Ordena por `statusTransitionAt` (o relógio que
 * decide qual é o período ativo) e desempata por `id`.
 *
 * O desempate por `id` não é preciosismo: `resolveActiveTerm` e
 * `enforceSingleActiveTerm` rodam em **dois dispositivos** com o mesmo conteúdo
 * mas potencialmente em ordens de array diferentes (o sync ordena por id, mas o
 * estado local não). Sem o desempate, dois períodos com o mesmo timestamp fariam
 * cada dispositivo escolher um "ativo" diferente — e como um deles vira
 * `encerrado` no merge, os dois bancos divergiriam para sempre.
 */
function newerTerm(a: AcademicTerm, b: AcademicTerm): boolean {
  if (a.statusTransitionAt !== b.statusTransitionAt) return a.statusTransitionAt > b.statusTransitionAt;
  return a.id > b.id;
}

/**
 * Invariante "no máximo um período ativo" (§D6).
 *
 * Se houver mais de um `ativo`, vence o de `statusTransitionAt` mais recente; os
 * outros **degradam para `encerrado` localmente** (com carimbo próprio — não é
 * tombstone, para que possam voltar a convergir num merge futuro). Roda no fim
 * de `mergeSyncedDatabases`, depois de toda virada, e no boot.
 */
export function enforceSingleActiveTerm(terms: AcademicTerm[]): AcademicTerm[] {
  const active = terms.filter((t) => t.status === 'ativo');
  if (active.length <= 1) return terms;

  const winner = active.reduce((best, t) => (newerTerm(t, best) ? t : best));

  return terms.map((term) =>
    term.status === 'ativo' && term.id !== winner.id
      ? {
          ...term,
          status: 'encerrado' as TermStatus,
          endedAt: term.endedAt ?? term.statusTransitionAt,
          statusTransitionAt: term.statusTransitionAt,
          updatedAt: term.statusTransitionAt,
        }
      : term,
  );
}

/**
 * Toda disciplina `ativa` deve pertencer a um período `ativo` — ou a nenhum
 * (`termId` ausente/`null` é o escape hatch anti-órfão, para disciplina avulsa ou
 * import sem período).
 *
 * Retorna as órfãs em vez de lançar: quem chama decide se corrige ou só avisa.
 */
export function assertTermIntegrity(
  terms: AcademicTerm[],
  courses: TermScopedCourse[],
): { orphans: TermScopedCourse[]; activeTermId: EntityId | null } {
  const activeTermId = resolveActiveTerm(terms)?.id ?? null;
  if (activeTermId === null) {
    return { orphans: courses.filter((c) => (c.status ?? 'ativo') === 'ativo'), activeTermId };
  }
  const orphans = courses.filter(
    (c) => (c.status ?? 'ativo') === 'ativo' && c.termId != null && c.termId !== activeTermId,
  );
  return { orphans, activeTermId };
}

/* -------------------------------------------------------------------------- */
/* Derivações                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Período ativo derivado — sem estado persistido, sem ponteiro por dispositivo
 * (§D4). Sem `ativo`, devolve `null`: a usuária está no vácuo e o app precisa
 * abrir o wizard de "começar o 1º semestre".
 */
export function resolveActiveTerm(terms: AcademicTerm[]): AcademicTerm | null {
  const active = terms.filter((t) => t.status === 'ativo');
  if (active.length === 0) return null;
  return active.reduce((best, t) => (newerTerm(t, best) ? t : best));
}

/** Período encerrado mais recente (para a timeline do Perfil). */
export function resolveLatestClosedTerm(terms: AcademicTerm[]): AcademicTerm | null {
  const closed = terms.filter((t) => t.status === 'encerrado');
  if (closed.length === 0) return null;
  return closed.reduce((best, t) =>
    (t.endedAt ?? t.statusTransitionAt) > (best.endedAt ?? best.statusTransitionAt) ? t : best,
  );
}

/**
 * **Todos** os períodos ativos, do mais recente para o mais antigo.
 *
 * `resolveActiveTerm` responde "qual é o meu semestre" — uma resposta só, a que a
 * UI mostra. Mas quando o banco tem **dois** ativos (merge de dois dispositivos,
 * import, ou um bug de virada que já rodou), a usuária precisa *ver* a
 * inconsistência para poder corrigir-la. Esta é a superfície do card de
 * integridade e do "reabrir" (SPEC-006 D9).
 *
 * O primeiro elemento é sempre o que `resolveActiveTerm` devolve, então dá para
 * usar `all[0]` como o ativo exibido e `all.length > 1` como o sinal de conflito.
 */
export function resolveAllActiveTerms(terms: AcademicTerm[]): AcademicTerm[] {
  return terms.filter((t) => t.status === 'ativo').sort((a, b) => (newerTerm(a, b) ? -1 : 1));
}

/** Períodos ordenados do mais recente para o mais antigo (para a timeline). */
export function termsByRecency(terms: AcademicTerm[]): AcademicTerm[] {
  const key = (t: AcademicTerm) => t.endedAt ?? t.statusTransitionAt ?? t.startedAt;
  return [...terms].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka > kb) return -1;
    if (ka < kb) return 1;
    return 0;
  });
}

/** `true` quando o período já cumpriu o fim (ou o ordinal chegou ao teto). */
export function shouldOfferRollover(
  term: AcademicTerm | null,
  today: string,
  totalSemesters: number,
): boolean {
  if (!term) return false;
  if (term.endedAt && term.endedAt <= today) return true;
  return term.ordinal >= totalSemesters;
}
