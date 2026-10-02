/**
 * Virada de semestre (`AcademicTerm`) — SPEC-005 §D5.
 *
 * A virada é um **rollover por cabeçalho**, nunca um update em lote. O
 * `SyncIndex` carimba **por registro**, então "atualizar o `termId` de todas as
 * disciplinas" em lote produziria estados mistos ("3 no 6º, 4 no 5º")
 * indistinguíveis de um estado legítimo. Aqui a virada é *calculada* como um
 * **plano** de escritas independentes — cada curso com o seu carimbo — e quem
 * aplica são as ações do contexto.
 *
 * Funções **puras**: `now` e `newTermId` chegam por argumento, nunca
 * `Date.now()`/`makeId()` dentro. Isso mantém a transição idempotente e
 * determinística (necessário para os golden files e para o undo).
 */
import type { AcademicTerm, TermScopedCourse, TermSummary, TermStatus } from '../../../../src/core/domain';
import { clampTermOrdinal, enforceSingleActiveTerm, termLabel, resolveActiveTerm } from '../../../../src/core/domain';

/** O que a usuária decidiu para cada disciplina no passo 2 do wizard. */
export type TermCourseDecision = 'continuar' | 'arquivar' | 'depois';

export type TermCourseDecisions = Record<string, TermCourseDecision>;

/** O que fazer com as pendências do semestre que está fechando. */
export type PendingCarry = 'adiar' | 'deixar';

export interface TermPendingInput {
  /** `true` = a pendência vai para o período novo. */
  tasks: { id: string; disciplineId?: string; completed: boolean; carry: PendingCarry }[];
  readings: { id: string; courseId?: string; status: string; carry: PendingCarry }[];
  cards: { id: string; courseId?: string; carry: PendingCarry }[];
}

/* -------------------------------------------------------------------------- */
/* Entradas                                                                    */
/* -------------------------------------------------------------------------- */

export interface TermAttendanceInput {
  records?: { status: string; hours?: number }[];
  baseHoursDone?: number;
}

export interface TermSummaryInput {
  courses: (TermScopedCourse & { attendance?: TermAttendanceInput })[];
  classNotes: { courseId: string; rating?: number }[];
  tasks: { disciplineId?: string; completed: boolean }[];
  exams: { courseId: string; title: string; completed: boolean; grade?: number }[];
  readings: { courseId?: string; status: string; readPages?: number }[];
  sessions: { courseId?: string; durationMinutes: number }[];
  /**
   * Maior streak do período, calculado pelo caller.
   *
   * ⚠️ `computeStreak` mora em `src/lib/streak.ts` e um pacote **não** pode
   * depender de código do app (boundary check) — então a agregação entra pela
   * porta, já calculada. O rollover segue puro.
   */
  bestStreak: number;
  /** Disciplinas que a usuária escolheu continuar (o wizard já decidiu). */
  carriedCourseIds?: string[];
}

/* -------------------------------------------------------------------------- */
/* Recorte por herança (escopo = `courseId`, §D3)                              */
/* -------------------------------------------------------------------------- */

function courseIdsInScope(input: TermSummaryInput): Set<string> {
  return new Set(input.courses.map((c) => c.id));
}

/** Disciplinas que continuam visíveis na grade (não arquivadas). */
export function gradeCourses(courses: TermScopedCourse[]): TermScopedCourse[] {
  return courses.filter((c) => (c.status ?? 'ativo') === 'ativo');
}

/** Horas registradas de verdade: registros `presente` com `hours` + base. */
function loggedHoursOf(courses: (TermScopedCourse & { attendance?: TermAttendanceInput })[]): number {
  const round = (n: number) => Math.round(n * 10) / 10;
  return round(
    courses.reduce((acc, course) => {
      const att = course.attendance;
      if (!att) return acc;
      const fromRecords = (att.records ?? [])
        .filter((r) => r.status === 'presente' && typeof r.hours === 'number')
        .reduce((sum, r) => sum + (r.hours as number), 0);
      return acc + fromRecords + (att.baseHoursDone ?? 0);
    }, 0),
  );
}

/* -------------------------------------------------------------------------- */
/* Resumo do fechamento                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Frases do resumo, no tom do app (minúsculo, acolhedor, sem jargão).
 * Derivadas **só** das métricas — nada de "finalizado com sucesso".
 */
export function buildHighlights(s: Omit<TermSummary, 'highlights'>): string[] {
  const out: string[] = [];

  if (s.courses > 0) {
    out.push(
      s.courses === 1
        ? '1 disciplina com o seu cuidado ♡'
        : `${s.courses} disciplinas com o seu cuidado ♡`,
    );
  }
  if (s.classNotes > 0) {
    out.push(
      s.classNotes === 1 ? '1 aula anotada com carinho' : `${s.classNotes} aulas anotadas com carinho`,
    );
  }
  if (s.tasksCompleted > 0) {
    out.push(
      s.tasksCompleted === 1
        ? '1 tarefa cumprida — já conta ♡'
        : `${s.tasksCompleted} tarefas cumpridas — já conta ♡`,
    );
  }
  if (s.pagesRead > 0) {
    out.push(`${s.pagesRead} páginas lidas no seu tempo ♡`);
  }
  if (s.focusMinutes > 0) {
    const hours = Math.floor(s.focusMinutes / 60);
    const mins = s.focusMinutes % 60;
    out.push(
      hours > 0 && mins > 0
        ? `${hours}h${String(mins).padStart(2, '0')} de foco dedicado ♡`
        : hours > 0
          ? `${hours}h de foco dedicado ♡`
          : `${mins} min de foco dedicado ♡`,
    );
  }
  if (s.loggedHours > 0) {
    out.push(`${s.loggedHours}h de aula registrada`);
  }
  if (s.bestStreak > 0) {
    out.push(`melhor sequência: ${s.bestStreak} dias 🔥`);
  }
  if (s.grades.length > 0) {
    const withGrade = s.grades.filter((g) => typeof g.grade === 'number');
    if (withGrade.length > 0) {
      out.push(`${withGrade.length} ${withGrade.length === 1 ? 'avaliação feita' : 'avaliações feitas'} ✨`);
    }
  }

  if (out.length === 0) {
    out.push('um semestre recomeçando — tudo bem, a gente abre o próximo com calma ♡');
  }
  return out;
}

/**
 * Congela o resumo do período. **Pura**: `closedAt` chega por argumento e
 * entradas idênticas produzem saída idêntica (sem `Date.now()`).
 */
export function buildTermSummary(input: TermSummaryInput, closedAt: string): TermSummary {
  const scope = courseIdsInScope(input);
  const inScope = (courseId?: string) => courseId != null && scope.has(courseId);

  const classNotes = input.classNotes.filter((n) => inScope(n.courseId));
  const tasks = input.tasks.filter((t) => inScope(t.disciplineId));
  const exams = input.exams.filter((e) => inScope(e.courseId));
  const readings = input.readings.filter((r) => inScope(r.courseId));
  const sessions = input.sessions.filter((s) => inScope(s.courseId));

  const carried = new Set(input.carriedCourseIds ?? []);
  const active = input.courses.filter((c) => (c.status ?? 'ativo') === 'ativo');

  const base: Omit<TermSummary, 'highlights'> = {
    closedAt,
    courses: input.courses.length,
    archivedCourses: input.courses.length - active.length,
    carriedCourses: input.courses.filter((c) => carried.has(c.id)).length,
    classNotes: classNotes.length,
    tasksCompleted: tasks.filter((t) => t.completed).length,
    tasksCarriedOver: tasks.filter((t) => !t.completed).length,
    readingsCompleted: readings.filter((r) => r.status === 'concluido').length,
    pagesRead: readings.reduce((sum, r) => sum + (r.readPages ?? 0), 0),
    focusMinutes: sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0),
    loggedHours: loggedHoursOf(active),
    bestStreak: Math.max(0, Math.trunc(input.bestStreak) || 0),
    grades: exams
      .filter((e) => e.completed)
      .map((e) => ({ courseId: e.courseId, label: e.title, ...(e.grade != null ? { grade: e.grade } : {}) }))
      .sort((a, b) => a.courseId.localeCompare(b.courseId) || a.label.localeCompare(b.label)),
  };

  return { ...base, highlights: buildHighlights(base) };
}

/* -------------------------------------------------------------------------- */
/* A virada                                                                    */
/* -------------------------------------------------------------------------- */

export interface TermRolloverPlan {
  /** Lista de períodos **após** a virada (o antigo encerrado + o novo ativo). */
  terms: AcademicTerm[];
  /** Lista de disciplinas **após** a virada, com `termId`/`status` ajustados. */
  courses: TermScopedCourse[];
  /** Resumo congelado no período encerrado. */
  summary: TermSummary;
  closedTermId: string;
  nextTermId: string;
  /**
   * Estado de origem (`termId` + `status`) de cada disciplina que a virada toca.
   * É o que torna o desfazer um **round-trip exato** sem o chamador precisar
   * reconstruir nada — ver `planTermRollover`.
   */
  originalTermIds: Record<
    string,
    { termId: string | null; status: TermScopedCourse['status'] | undefined }
  >;
  /**
   * O que muda, para a tela de revisão (passo 4 do wizard) montar o texto.
   *
   * `carry`/`archive`/`undecided` são **ids de disciplina** (nomes de campo
   * herdados de "diff", não de "frase"), e as contagens são totais. O texto em
   * linguagem natural é montado pela UI — o pacote não escreve copy, e assim o
   * passo 4 mostra "Psicologia Social → 7º semestre" e não `c1`.
   */
  diff: {
    carry: string[];
    archive: string[];
    undecided: string[];
    carriedTasks: number;
    carriedReadings: number;
    carriedCards: number;
  };
}

/**
 * Calcula o plano da virada. **Não escreve nada** — quem aplica é
 * `dataActions` (um setter por registro, com carimbo próprio).
 *
 * Idempotente no conteúdo: rodar duas vezes com a mesma entrada e o mesmo
 * `newTermId`/`now` produz exatamente o mesmo plano.
 *
 * Decisões:
 * - `continuar` → a disciplina **mantém o `id`** e passa a apontar para o
 *   período novo (é o conhecimento que viaja com a matéria);
 * - `arquivar` → `status: 'arquivado'`, sai da grade e **fica pesquisável**;
 * - `depois` (grace period) → fica no período que está encerrando, com aviso
 *   não-bloqueante no app.
 */
export function planTermRollover(input: {
  terms: AcademicTerm[];
  courses: TermScopedCourse[];
  decisions: TermCourseDecisions;
  summaryInput: TermSummaryInput;
  newTermId: string;
  nextOrdinal?: number;
  nextLabel?: string;
  /**
   * Total de semestres do curso (SPEC-006 D8 → **revisto pela SPEC-008 D3**).
   *
   * Antes isto era o **teto** do `nextOrdinal` (`min(totalSemesters, 12)`), para
   * que num curso de 10 a 10ª virada não criasse um "11º semestre". O cap foi
   * removido: o total é um palpite editável, e um teto que depende de outro
   * campo dá o pior resultado possível quando o palpite está errado — a usuária
   * digita 9 num curso de 8, o passo de revisão promete "9º semestre" e a gravação
   * joga 8 em silêncio. Ela nunca descobre de onde veio o 8.
   *
   * O `nextOrdinal` agora é limitado só pelo teto global (`MAX_TERM_ORDINAL`), e
   * a UI **avisa** quando o número passa do total do curso, monitored
   * (`JourneyTermCard`) ou no wizard — onde dá para corrigir o total. O
   * `totalSemesters` continua no input e no resumo congelado, mas não decide
   * nada: um teto não pode depender de um campo que a usuária ainda não corrigiu.
   *
   * @deprecated Mantido só para não quebrar chamadores externos. Não afeta o
   * `nextOrdinal` — use `MAX_TERM_ORDINAL` para o teto.
   */
  totalSemesters?: number;
  /** Data do fechamento (YYYY-MM-DD) e carimbo ISO das transições. */
  closedAt: string;
  now: string;
  workspaceId?: string;
  /** Decisões de pendência (passo 3 do wizard). Só entram no diff. */
  pendingDecisions?: TermPendingInput;
}): TermRolloverPlan {
  const { courses, decisions, closedAt, now } = input;
  // D4: a virada é a 2ª das 3 portas de escrita da invariante "no máximo um
  // `ativo`" (a 1ª é o pós-merge, a 3ª a pós-correção). Consolida **antes** de
  // mapear, para o plano devolvido já nascer válido: com dois `ativo` no
  // snapshot (merge de dois dispositivos, import, ou uma virada antiga rodada
  // com o bug B2) o plano fechava o período certo e devolvia o outro ainda
  // `ativo` — o passo 4 do wizard mostrava um resumo que a virada não produz,
  // e o undo fechava num estado que não era o de origem. `enforceSingleActiveTerm`
  // devolve a **mesma referência** quando há um ativo só, então o caminho comum
  // não aloca nada.
  const terms = enforceSingleActiveTerm(input.terms);
  // B2 (SPEC-006 D4): `terms.find(status === 'ativo')` pegava o **primeiro do
  // array**, e a ordem do array não é a ordem da recência (o sync ordena por id).
  // Com dois ativos — merge de dois dispositivos, import, ou uma virada anterior
  // já rodada com o bug — a virada encerrava o período que a tela NÃO estava
  // mostrando, e as disciplinas migravam do semestre errado. `resolveActiveTerm`
  // é a mesma função que a UI usa para escolher o ativo, então as duas nunca
  // discordam.
  const activeTerm = resolveActiveTerm(terms);
  if (!activeTerm) {
    throw new Error('planTermRollover: não há período ativo para encerrar');
  }

  const inTerm = courses.filter((c) => c.termId === activeTerm.id && (c.status ?? 'ativo') === 'ativo');
  const dec = (courseId: string): TermCourseDecision => decisions[courseId] ?? 'continuar';

  const carriedIds = inTerm.filter((c) => dec(c.id) === 'continuar').map((c) => c.id);
  const archivedIds = inTerm.filter((c) => dec(c.id) === 'arquivar').map((c) => c.id);
  const undecidedIds = inTerm.filter((c) => dec(c.id) === 'depois').map((c) => c.id);

  const summary = buildTermSummary(
    { ...input.summaryInput, carriedCourseIds: carriedIds },
    closedAt,
  );

  // 1) o período antigo: encerrado, com o resumo congelado (imutável dali pra frente)
  const nextTerms: AcademicTerm[] = terms.map((t) =>
    t.id === activeTerm.id
      ? {
          ...t,
          status: 'encerrado' as TermStatus,
          endedAt: closedAt,
          statusTransitionAt: now,
          updatedAt: now,
          summary,
        }
      : t,
  );

  // 2) o período novo: ativo, com o próximo `ordinal`, limitado pelo **teto global**
  //    (SPEC-008 D3 — não mais pelo total do curso; ver o `@deprecated` acima).
  //    `statusTransitionAt: now` (e não `closedAt`) é o que faz este período
  //    ganhar a disputa de recência contra qualquer outro ativo.
  const nextOrdinal = clampTermOrdinal(input.nextOrdinal ?? activeTerm.ordinal + 1);
  nextTerms.push({
    id: input.newTermId,
    workspaceId: input.workspaceId ?? activeTerm.workspaceId,
    label: input.nextLabel ?? termLabel(nextOrdinal),
    ordinal: nextOrdinal,
    status: 'ativo',
    startedAt: closedAt,
    statusTransitionAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // 3) as disciplinas, uma a uma: quem continua muda de período; quem arquiva sai
  //    da grade; quem ficou pra depois não é tocado.
  const nextCourses = courses.map((c): TermScopedCourse => {
    if (carriedIds.includes(c.id)) return { ...c, termId: input.newTermId };
    if (archivedIds.includes(c.id)) return { ...c, status: 'arquivado' };
    return c;
  });

  const pending = input.pendingDecisions;
  return {
    terms: nextTerms,
    courses: nextCourses,
    summary,
    closedTermId: activeTerm.id,
    nextTermId: input.newTermId,
    // O `termId`/status de origem de cada disciplina que a virada toca. Fica no
    // plano (e não num argumento separado do desfazer) porque é o **único**
    // momento em que a informação existe: depois da escrita, o estado anterior
    // está perdido. Quem chamava `undoTermRollover` era obrigado a reconstruir
    // esse mapa à mão, e qualquer reconstrução errada ali desfazia a virada para
    // o período errado — silenciosamente.
    originalTermIds: Object.fromEntries(
      inTerm.map((c) => [c.id, { termId: c.termId ?? null, status: c.status }]),
    ),
    diff: {
      carry: carriedIds,
      archive: archivedIds,
      undecided: undecidedIds,
      carriedTasks: (pending?.tasks ?? []).filter((p) => p.carry === 'adiar').length,
      carriedReadings: (pending?.readings ?? []).filter((p) => p.carry === 'adiar').length,
      carriedCards: (pending?.cards ?? []).filter((p) => p.carry === 'adiar').length,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Desfazer                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Reverte a virada.
 *
 * Nada foi apagado na virada (§D5), então a reversão é trivial: reabre o
 * período anterior, devolve cada disciplina ao `termId`/status de origem,
 * desarquiva o que foi arquivado e remove o período novo.
 *
 * A reabertura **limpa `endedAt`/`summary`** (SPEC-006 D7) pelo mesmo motivo de
 * `reopenTerm`: um período `ativo` carregando o transcript de um encerramento é
 * um estado que não existe — o card do histórico mentiria e um `endedAt` num termo
 * `ativo` faria a elegibilidade da virada responder `true` na hora (SPEC-008 N1).
 * Depois do desfazer, a
 * usuária está de volta **dentro** do semestre, como se a virada nunca tivesse
 * acontecido.
 *
 * `originalTermIds` é opcional: quando ausente, usa o `plan.originalTermIds`. O
 * argumento continua aceito para quem tem o mapa à mão, mas o plano é a fonte
 * autoritativa (é ele que foi gravado junto com a virada).
 */
export function undoTermRollover(input: {
  terms: AcademicTerm[];
  courses: TermScopedCourse[];
  plan: TermRolloverPlan;
  /** `termId` de origem por disciplina. Cai para `plan.originalTermIds`. */
  originalTermIds?: Record<string, string | null | undefined>;
  now: string;
}): { terms: AcademicTerm[]; courses: TermScopedCourse[] } {
  const { terms, courses, plan, now } = input;
  const legacyIds = input.originalTermIds;

  const nextTerms = terms
    .filter((t) => t.id !== plan.nextTermId)
    .map((t) => {
      if (t.id !== plan.closedTermId) return t;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- remover as chaves é o ponto
      const { endedAt: _endedAt, summary: _summary, ...rest } = t;
      return {
        ...rest,
        status: 'ativo' as TermStatus,
        statusTransitionAt: now,
        updatedAt: now,
      };
    });

  const nextCourses = courses.map((c) => {
    const original = plan.originalTermIds[c.id];
    // `status` é restaurado **como estava**, inclusive a ausência da chave: o
    // round-trip do desfazer tem que devolver o objeto idêntico, senão um
    // `toEqual` de paridade (e o diff de sync) acusam mudança onde não houve.
    const restoreStatus = (base: TermScopedCourse): TermScopedCourse => {
      if (original?.status === undefined) delete base.status;
      else base.status = original.status;
      return base;
    };
    if (plan.diff.carry.includes(c.id)) {
      const termId = original?.termId ?? legacyIds?.[c.id] ?? plan.closedTermId;
      return restoreStatus({ ...c, termId });
    }
    if (plan.diff.archive.includes(c.id)) {
      return restoreStatus({ ...c });
    }
    return c;
  });

  return { terms: nextTerms, courses: nextCourses };
}
