/**
 * Estágio supervisionado: diário, supervisão, intervisão e a camada clínica do
 * atendimento (`InternshipLog`) — SPEC-009 (`SPEC-M-013` no grupo).
 *
 * Este arquivo é a **fonte única** de quatro coisas que antes viviam espalhadas e
 * divergentes entre telas:
 *
 * 1. **A data civil.** `InternshipLog.date` é uma `DateKey` (`YYYY-MM-DD`) em fuso
 *    **local**. `new Date('2026-08-26')` é UTC 00:00, então formatar por `Date`
 *    mostrava `25/08` em São Paulo. Nenhuma função aqui aceita uma `DateKey` e
 *    devolve `Date` para formatar: a string é quebrada, não convertida.
 * 2. **O estado de um registro.** Nada disto é persistido — `scheduled`, `done`,
 *    `reflected`, `supervised`, `intervised` são **derivados**.
 * 3. **O vínculo sessão ↔ supervisão.** Ele vive **só** em `discussedLogIds`, do
 *    lado da supervisão (`D3`). "Supervisionada" é derivado, nunca gravado nos dois
 *    lados — era a origem de `F2`/`F3`.
 * 4. **As escritas.** `planSave`/`planDelete`/`planRenamePatient` são a **única**
 *    porta de escrita, e cada uma devolve a lista inteira numa operação só.
 *
 * Funções puras: sem React, sem storage, sem Capacitor, sem `@/src`. `today` chega
 * por argumento — o único `new Date()` do arquivo é o **default** de `todayKey`, e
 * ele existe para o chamador de conveniência, não para esconder o relógio dentro
 * de regra.
 */

// ---------------------------------------------------------------------------
// Tipos (o contrato mora aqui; `src/types/internship.ts` reexporta)
// ---------------------------------------------------------------------------

/** Tipos de registro do estágio (clínica escola / campo). */
export type InternshipLogType =
  | 'estagio'
  | 'atendimento_clinico'
  | 'supervisao'
  | 'intervisao'
  | 'outro';

/**
 * Fase do ciclo de formação.
 *
 * @deprecated `D12` — a fase nunca refletiu nada e não é exibida na UI. Fica no
 * tipo para leitura de dados antigos e sai na fase 8 da spec.
 */
export type InternshipPhase = 'preparar' | 'registrar' | 'refletir' | 'supervisionar' | 'entregar';

// Datas civis: a fonte é `common.ts` (SPEC-012 F1.2). Reexportado aqui para os
// importadores existentes não mudarem — e para o domínio `thesis` não depender de
// `internship`.
import type { DateKey } from './common';
import {
  toDateKey,
  todayKey,
  formatDateBR,
  formatDateShortBR,
  dateKeyOrdinal,
  addDays,
  daysBetween,
  weekStartKey,
  inWeek,
} from './common';

export type { DateKey };
export {
  toDateKey,
  todayKey,
  formatDateBR,
  formatDateShortBR,
  dateKeyOrdinal,
  addDays,
  daysBetween,
  weekStartKey,
  inWeek,
};

// Privados deste arquivo (não são API pública de `common.ts`).
const parts = (key: string): { d: string; m: string; y: string } | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key ?? '');
  return m ? { y: m[1], m: m[2], d: m[3] } : null;
};

const dayNumber = (key: DateKey): number => {
  const p = parts(key);
  if (!p) return Number.NaN;
  return Date.UTC(Number(p.y), Number(p.m) - 1, Number(p.d)) / 86_400_000;
};

/** Vínculo de um próximo passo que já virou entidade (`D17`). */
export interface InternshipNextStepLink {
  /** Texto exato do próximo passo no momento da conversão. */
  step: string;
  kind: 'task' | 'reading' | 'session';
  entityId: string;
  createdAt: string; // ISO
}

export interface InternshipLog {
  id: string;
  /** Escopo de workspace. Default = `ws-academico`. */
  workspaceId?: string;
  /** Tipo do registro (default `'estagio'` para dados antigos — invariante `I7`). */
  type: InternshipLogType;
  /** `DateKey` em fuso local. Nunca `new Date(date)`. */
  date: DateKey;
  /** 0–24, passo 0,25 (`D18`). */
  hours: number;
  /** Resumo curto. Vazio salva com `suggestTitle`. */
  activity: string;
  /** Reflexão. Só o que a usuária digitar, ou o auto-texto do "não vou
   *  responder" que ela pediu ao desligar o switch (`SPEC-011 D12`). */
  reflections: string;
  conceptIds?: string[];
  referenceIds?: string[];

  // ---- camada clínica do atendimento (liberada por `D20`) ----
  /** Iniciais anônimas do(a) paciente (sem nome completo). */
  patient?: string;
  /** Número da sessão do atendimento. */
  sessionNumber?: number;
  patientAge?: string;
  /** Tema central / queixa / demanda da sessão. */
  theme?: string;
  /** Abordagem teórica usada (ex.: TCC, psicanálise). */
  approach?: string;
  /** O que foi feito na sessão (intervenções, técnicas). */
  interventionNotes?: string;
  /** Impressões clínicas / observações. */
  observations?: string;
  /**
   * `SPEC-011 D11` — campos de referência que a usuária optou por **não**
   * responder. Ausência = todos os cinco ativos. Só para os tipos com campos de
   * referência (`camposDeReferencia`); nunca em `supervisao`.
   */
  declinedFields?: CampoPendencia[];

  // ---- supervisão / intervisão ----
  supervisor?: string;
  /** Temas discutidos. */
  topics?: string[];
  /** Orientações recebidas. */
  orientations?: string;
  /** Dúvidas levadas / a investigar. */
  doubts?: string;
  /** Próximos passos combinados. */
  nextSteps?: string[];

  /** Referências (leituras/autores) ligadas à supervisão. */
  beforeNotes?: string;
  afterNotes?: string;
  selfAssessment?: {
    confidence?: string;
    limits?: string;
    themes?: string;
  };

  // ---- vínculo sessão ↔ supervisão (fonte única, `D3`) ----
  /** **Só** em `supervisao`/`intervisao`: ids dos atendimentos discutidos (`I1`–`I3`). */
  discussedLogIds?: string[];
  /**
   * @deprecated `D3` — ponteiro legado do atendimento para a supervisão. Lido só
   * pela `MIGRATIONS[20]` e nunca escrito. some do dado; o campo fica no tipo por
   * uma versão para import de backup antigo.
   */
  supervisionLogId?: string;
  /** `D17` — só em `supervisao`/`intervisao`. */
  nextStepLinks?: InternshipNextStepLink[];

  // ---- legado (dados antigos sem `type`) ----
  /** @deprecated `D12` */
  phase?: InternshipPhase;
  /** @deprecated `D12` — continua exibido se existir */
  prepChecklist?: string[];
  supervisionNotes?: string;
}

/**
 * Caderno de supervisão — coleção legada (`supervision`), drenada pela
 * `MIGRATIONS[20]` e por `drainLegacySupervision`. Sobrevive como **tipo de
 * leitura**, nunca é escrito.
 */
export interface SupervisionNotebook {
  id: string;
  workspaceId?: string;
  date: DateKey;
  supervisor?: string;
  questions: string[];
  conceptIds: string[];
  referenceIds: string[];
  nextSteps: string[];
  selfAssessment: {
    confidence?: string;
    limits?: string;
    themes?: string;
  };
  beforeNotes?: string;
  afterNotes?: string;
}

// ---------------------------------------------------------------------------
// 2. Estado derivado
// ---------------------------------------------------------------------------

/** Agendado é `date > hoje` (`D7`). Hoje conta como feito. */
export const isScheduled = (log: InternshipLog, today: DateKey): boolean => log.date > today;
export const isDone = (log: InternshipLog, today: DateKey): boolean => log.date <= today;

/** Índice de vínculos, montado a partir de `discussedLogIds` (`D3`). */
export interface LinkIndexEntry {
  supervisionIds: string[];
  intervisionIds: string[];
}
export type LinkIndex = Map<string, LinkIndexEntry>;

/**
 * Monta o índice de vínculos a partir de `discussedLogIds`.
 *
 * Ignora id que não existe e **ignora supervisão/intervisão ainda agendada**: uma
 * supervisão marcada para a próxima semana ainda não supervisionou ninguém (`E2`).
 */
export const buildLinkIndex = (logs: InternshipLog[], today: DateKey): LinkIndex => {
  const byId = new Map(logs.map((l) => [l.id, l]));
  const index: LinkIndex = new Map();

  for (const sup of logs) {
    if (sup.type !== 'supervisao' && sup.type !== 'intervisao') continue;
    if (isScheduled(sup, today)) continue;
    const ids = sup.discussedLogIds ?? [];
    for (const id of ids) {
      if (byId.get(id)?.type !== 'atendimento_clinico') continue; // `I2`
      const entry = index.get(id) ?? { supervisionIds: [], intervisionIds: [] };
      (sup.type === 'supervisao' ? entry.supervisionIds : entry.intervisionIds).push(sup.id);
      index.set(id, entry);
    }
  }

  // Ordena por data da supervisão — "discutida em" se lê em ordem cronológica.
  const order = new Map(logs.map((l) => [l.id, dateKeyOrdinal(l.date)]));
  for (const entry of index.values()) {
    entry.supervisionIds.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    entry.intervisionIds.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }
  return index;
};

export interface LogStatus {
  scheduled: boolean;
  done: boolean;
  reflectionExpected: boolean;
  reflected: boolean;
  supervised: boolean;
  intervised: boolean;
  supervisionIds: string[];
  intervisionIds: string[];
}

/** Reflexão esperada vale para atendimento clínico e estágio (`D11`). */
export const reflectionExpectedFor = (type: InternshipLogType): boolean =>
  type === 'atendimento_clinico' || type === 'estagio';

export const statusOf = (log: InternshipLog, index: LinkIndex, today: DateKey): LogStatus => {
  const link = index.get(log.id);
  const scheduled = isScheduled(log, today);
  return {
    scheduled,
    done: !scheduled,
    reflectionExpected: reflectionExpectedFor(log.type),
    reflected: (log.reflections ?? '').trim() !== '',
    supervised: !scheduled && (link?.supervisionIds.length ?? 0) > 0,
    // Intervisão é chip secundário e NÃO fecha a pendência de supervisão (`D5`).
    intervised: !scheduled && (link?.intervisionIds.length ?? 0) > 0,
    supervisionIds: link?.supervisionIds ?? [],
    intervisionIds: link?.intervisionIds ?? [],
  };
};

/** Pendências por **registro** (não por caso), só de registros `done`. */
export const computePendencies = (
  logs: InternshipLog[],
  today: DateKey
): { noReflection: string[]; noSupervision: string[] } => {
  const index = buildLinkIndex(logs, today);
  const noReflection: string[] = [];
  const noSupervision: string[] = [];

  for (const log of logs) {
    const st = statusOf(log, index, today);
    if (!st.done) continue; // agendado nunca é pendência (`D7`)
    if (st.reflectionExpected && !st.reflected) noReflection.push(log.id);
    if (log.type === 'atendimento_clinico' && !st.supervised) noSupervision.push(log.id);
  }
  return { noReflection, noSupervision };
};

// ---------------------------------------------------------------------------
// 2.1 Campos de referência e pendências de preenchimento (SPEC-011 D2, D10-D13)
// Derivadas, nunca persistidas — exceto a **escolha** `declinedFields` (D11).
// ---------------------------------------------------------------------------

/** Campos preenchíveis pelo fluxo "completar registro". */
export type CampoPendencia =
  | 'reflexoes'
  | 'tema'
  | 'abordagem'
  | 'intervencoes'
  | 'impressoes';

/** Os cinco campos de referência, na ordem canônica (`D10`). */
export const CAMPOS_DE_REFERENCIA: readonly CampoPendencia[] = [
  'reflexoes',
  'tema',
  'abordagem',
  'intervencoes',
  'impressoes',
];

/** Rótulo de cada campo para a copy ("falta tema"). */
export const CAMPO_REFERENCIA_LABEL: Record<CampoPendencia, string> = {
  reflexoes: 'reflexões',
  tema: 'tema',
  abordagem: 'abordagem',
  intervencoes: 'intervenções',
  impressoes: 'impressões clínicas',
};

/** Descrição de cada campo para os switches (wizard e modal). */
export const CAMPO_REFERENCIA_DESCRICAO: Record<CampoPendencia, string> = {
  reflexoes: 'o que você sentiu, pensou ou notou',
  tema: 'queixa, demanda ou foco da sessão',
  abordagem: 'a lente teórica que guiou o atendimento',
  intervencoes: 'o que foi feito na sessão',
  impressoes: 'suas observações sobre o processo',
};

/** Campo → chave do `InternshipLog` (as chaves de texto dos campos de referência). */
const CAMPO_REFERENCIA_CHAVE: Record<
  CampoPendencia,
  'reflections' | 'theme' | 'approach' | 'interventionNotes' | 'observations'
> = {
  reflexoes: 'reflections',
  tema: 'theme',
  abordagem: 'approach',
  intervencoes: 'interventionNotes',
  impressoes: 'observations',
};

/** Texto automático do "não vou responder" (`SPEC-011 D12`). */
export const TEXTO_NAO_RESPONDER: Record<CampoPendencia, string> = {
  reflexoes: 'não precisou escrever as reflexões',
  tema: 'não precisou listar o tema',
  abordagem: 'não precisou escolher a abordagem',
  intervencoes: 'não precisou listar as intervenções',
  impressoes: 'não precisou listar motivos sobre',
};

const vazio = (v?: string): boolean => (v ?? '').trim() === '';

/** Campos de referência aplicáveis ao tipo — tudo menos supervisão (`D10`). */
export const camposDeReferencia = (type: InternshipLogType): CampoPendencia[] =>
  type === 'supervisao' ? [] : [...CAMPOS_DE_REFERENCIA];

/** Conteúdo de um campo de referência (string, vazio quando ausente). */
export const valorCampoReferencia = (log: InternshipLog, campo: CampoPendencia): string =>
  (log[CAMPO_REFERENCIA_CHAVE[campo]] as string | undefined) ?? '';

/** Campos que a usuária optou por não responder, já limpos (`D11`). */
export const declinadosDe = (log: InternshipLog): CampoPendencia[] =>
  (log.declinedFields ?? []).filter((c) => camposDeReferencia(log.type).includes(c));

/**
 * Aplica a escolha persistida de campos (`SPEC-011 D11/D12`) e devolve o log com:
 * - `declinedFields` limpo (só campos aplicáveis, ordem canônica) ou `undefined`
 *   quando a lista é vazia;
 * - texto automático no declinado que está vazio;
 * - declinado que voltou a ligar com o texto automático exato limpo de volta.
 *
 * Função pura. `supervisao` nunca declina (`D10`) e nunca ganha texto automático
 * por aqui — o auto-texto é **ação explícita da usuária**, nunca do `sanitizeLog`.
 */
export const comDeclinados = (log: InternshipLog, declinados: CampoPendencia[]): InternshipLog => {
  if (log.type === 'supervisao') return { ...log, declinedFields: undefined };
  const aplicaveis = camposDeReferencia(log.type);
  const clean = CAMPOS_DE_REFERENCIA.filter(
    (c) => aplicaveis.includes(c) && declinados.includes(c)
  );
  const next: InternshipLog = { ...log, declinedFields: clean.length ? clean : undefined };
  for (const campo of CAMPOS_DE_REFERENCIA) {
    const chave = CAMPO_REFERENCIA_CHAVE[campo];
    const atual = (next[chave] as string | undefined) ?? '';
    const declinou = clean.includes(campo);
    if (declinou && vazio(atual)) next[chave] = TEXTO_NAO_RESPONDER[campo];
    else if (!declinou && atual === TEXTO_NAO_RESPONDER[campo]) next[chave] = '';
  }
  return next;
};

/** Numeral por extenso para o chip "ainda falta preencher N" (`D13`). */
const NUMEROS_POR_EXTENSO = ['', '', 'dois', 'três', 'quatro', 'cinco'] as const;

/**
 * Status do chip de preenchimento do card (`SPEC-011 D13`) — informativo, sem
 * clique. `null` quando o tipo não tem chip (supervisão).
 */
export const statusPreenchimento = (
  log: InternshipLog
): { tone: 'success' | 'warning'; label: string } | null => {
  const campos = camposDeReferencia(log.type);
  if (!campos.length) return null;
  const faltando = campos.filter((c) => vazio(valorCampoReferencia(log, c)));
  if (faltando.length === 0) return { tone: 'success', label: 'tudo preenchido' };
  if (faltando.length === 1)
    return { tone: 'warning', label: `falta ${CAMPO_REFERENCIA_LABEL[faltando[0]]}` };
  return {
    tone: 'warning',
    label: `ainda falta preencher ${NUMEROS_POR_EXTENSO[faltando.length] ?? faltando.length}`,
  };
};

/**
 * Quais campos de referência estão vazios **e não declinados** neste registro
 * (`trim() === ''`), na ordem canônica. Função pura: sem relógio, sem I/O.
 * Supervisão não entra aqui — ela é vínculo derivado (D7 da SPEC-011).
 *
 * Vale para `estagio`, `atendimento_clinico`, `intervisao` e `outro` (`D10`);
 * o declinado (`D11`) sai da lista.
 */
export const proximasPendenciasDePreenchimento = (log: InternshipLog): CampoPendencia[] => {
  const declinados = new Set(declinadosDe(log));
  return camposDeReferencia(log.type).filter(
    (c) => !declinados.has(c) && vazio(valorCampoReferencia(log, c))
  );
};

// ---------------------------------------------------------------------------
// 3. Estatísticas
// ---------------------------------------------------------------------------

/** Posições do gráfico semanal: 7 semanas passadas + a corrente. */
export const WEEKS_IN_SERIES = 8;

export interface InternshipStats {
  /** Soma das horas dos registros `done` — agendados nunca somam (`D7`). */
  doneHours: number;
  weekHours: number;
  doneCount: number;
  clinicalDoneCount: number;
  scheduledCount: number;
  nextScheduled?: DateKey;
  /** 8 posições, do mais antigo ao mais novo, só `done`. */
  weeklySeries: number[];
  weeksWithData: number;
}

export const computeStats = (logs: InternshipLog[], today: DateKey): InternshipStats => {
  const ws = weekStartKey(today);
  const buckets = new Array<number>(WEEKS_IN_SERIES).fill(0);

  let doneHours = 0;
  let weekHours = 0;
  let doneCount = 0;
  let clinicalDoneCount = 0;
  let scheduledCount = 0;
  let nextScheduled: DateKey | undefined;

  for (const log of logs) {
    if (isScheduled(log, today)) {
      scheduledCount += 1;
      if (!nextScheduled || log.date < nextScheduled) nextScheduled = log.date;
      continue;
    }
    const h = log.hours || 0;
    doneHours += h;
    doneCount += 1;
    if (log.type === 'atendimento_clinico') clinicalDoneCount += 1;
    if (inWeek(log.date, ws)) weekHours += h;
    // Série de 8 posições, do mais antigo ao mais novo: a semana corrente é a
    // última (índice 7). `weeksAgo` é medido em semanas inteiras de segunda.
    const weeksAgo = Math.round((dayNumber(ws) - dayNumber(weekStartKey(log.date))) / 7);
    const idx = WEEKS_IN_SERIES - 1 - weeksAgo;
    if (idx >= 0 && idx < WEEKS_IN_SERIES) buckets[idx] += h;
  }

  return {
    doneHours,
    weekHours,
    doneCount,
    clinicalDoneCount,
    scheduledCount,
    nextScheduled,
    weeklySeries: buckets,
    weeksWithData: buckets.filter((h) => h > 0).length,
  };
};

// ---------------------------------------------------------------------------
// 4. Casos (paciente)
// ---------------------------------------------------------------------------

/** NFD, sem diacríticos, minúsculas, só `[a-z0-9]` (`D8`). */
export const normalizePatientKey = (raw?: string): string =>
  (raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Combining Diacritical Marks
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Rótulo exibido: `trim` + colapsa espaços internos; não altera pontuação. */
export const formatPatientLabel = (raw?: string): string =>
  (raw ?? '').trim().replace(/\s+/g, ' ');

export interface DerivedCase {
  patientKey: string;
  patientLabel: string;
  logs: InternshipLog[];
  doneLogs: InternshipLog[];
  scheduledLogs: InternshipLog[];
  totalHours: number;
  sessionsDone: number;
  sessionsSupervised: number;
  /** 0–100, arredondado; 0 quando `sessionsDone = 0`. */
  progress: number;
  pendingReflection: number;
  pendingSupervision: number;
  /** Maior data `done` — **não** a última por número de sessão (regressão `F23`). */
  lastSessionDate?: DateKey;
  nextScheduledDate?: DateKey;
  latestAge?: string;
  latestApproach?: string;
}

/** Só atendimentos clínicos viram caso. */
export const isClinical = (log: InternshipLog): boolean => log.type === 'atendimento_clinico';

/** Ordena logs de um caso: sessão nº asc, depois data asc. */
const bySessionThenDate = (a: InternshipLog, b: InternshipLog): number => {
  const an = a.sessionNumber ?? 0;
  const bn = b.sessionNumber ?? 0;
  if (an !== bn) return an - bn;
  const d = dateKeyOrdinal(a.date) - dateKeyOrdinal(b.date);
  return d !== 0 ? d : a.id.localeCompare(b.id);
};

export const deriveCases = (
  logs: InternshipLog[],
  today: DateKey
): { cases: DerivedCase[]; orphans: InternshipLog[] } => {
  const index = buildLinkIndex(logs, today);
  const groups = new Map<string, InternshipLog[]>();
  const orphans: InternshipLog[] = [];

  for (const log of logs) {
    if (!isClinical(log)) continue;
    const key = normalizePatientKey(log.patient);
    if (!key) {
      orphans.push(log); // `D9`: órfão não some, vira grupo próprio
      continue;
    }
    const arr = groups.get(key);
    if (arr) arr.push(log);
    else groups.set(key, [log]);
  }

  const cases: DerivedCase[] = [];
  for (const [key, groupLogs] of groups) {
    const doneLogs = groupLogs.filter((l) => isDone(l, today));
    const scheduledLogs = groupLogs.filter((l) => isScheduled(l, today));
    const sessionsSupervised = doneLogs.filter(
      (l) => (index.get(l.id)?.supervisionIds.length ?? 0) > 0
    ).length;

    // Rótulo vem do atendimento mais recente (`D8`), por data e depois por sessão.
    const mostRecent = [...groupLogs].sort(
      (a, b) =>
        dateKeyOrdinal(b.date) - dateKeyOrdinal(a.date) ||
        (b.sessionNumber ?? 0) - (a.sessionNumber ?? 0)
    )[0];

    let lastSessionDate: DateKey | undefined;
    for (const l of doneLogs) if (!lastSessionDate || l.date > lastSessionDate) lastSessionDate = l.date;
    let nextScheduledDate: DateKey | undefined;
    for (const l of scheduledLogs)
      if (!nextScheduledDate || l.date < nextScheduledDate) nextScheduledDate = l.date;

    const latestAge = [...groupLogs].reverse().find((l) => l.patientAge?.trim())?.patientAge;
    const latestApproach = [...groupLogs]
      .reverse()
      .find((l) => l.approach?.trim())?.approach;

    cases.push({
      patientKey: key,
      patientLabel: formatPatientLabel(mostRecent?.patient) || key,
      logs: [...groupLogs].sort(bySessionThenDate),
      doneLogs,
      scheduledLogs,
      totalHours: doneLogs.reduce((a, l) => a + (l.hours || 0), 0),
      sessionsDone: doneLogs.length,
      sessionsSupervised,
      progress:
        doneLogs.length === 0
          ? 0
          : Math.round((sessionsSupervised / doneLogs.length) * 100),
      pendingReflection: doneLogs.filter(
        (l) => !(l.reflections ?? '').trim()
      ).length,
      pendingSupervision: doneLogs.filter(
        (l) => (index.get(l.id)?.supervisionIds.length ?? 0) === 0
      ).length,
      lastSessionDate,
      nextScheduledDate,
      latestAge,
      latestApproach,
    });
  }

  // Casos só com agendados vão antes (são os próximos), por data; depois, os
  // que têm sessão feita, do mais recente ao mais antigo.
  cases.sort((a, b) => {
    if (!a.sessionsDone || !b.sessionsDone) {
      if (a.sessionsDone !== b.sessionsDone) return a.sessionsDone ? 1 : -1;
      return (a.nextScheduledDate ?? '').localeCompare(b.nextScheduledDate ?? '');
    }
    return (b.lastSessionDate ?? '').localeCompare(a.lastSessionDate ?? '');
  });

  return { cases, orphans };
};

/** Próximo número de sessão do caso; 1 sem sessões numeradas. */
export const nextSessionNumber = (c?: DerivedCase): number =>
  (c?.logs.reduce((max, l) => Math.max(max, l.sessionNumber ?? 0), 0) ?? 0) + 1;

// ---------------------------------------------------------------------------
// 5. Agrupamento por semana
// ---------------------------------------------------------------------------

/** `upcoming` = agendados; `sem-data` = registro com data inválida (`E7`). */
export type LogGroupId = 'upcoming' | 'sem-data' | DateKey;

export interface LogGroup {
  id: LogGroupId;
  label: string;
  hours: number;
  logs: InternshipLog[];
}

export const groupByWeek = (logs: InternshipLog[], today: DateKey): LogGroup[] => {
  const scheduled = logs.filter((l) => isScheduled(l, today)).sort((a, b) => a.date.localeCompare(b.date));
  const done = logs.filter((l) => isDone(l, today));

  const groups: LogGroup[] = [];
  if (scheduled.length) {
    groups.push({ id: 'upcoming', label: 'próximos', hours: 0, logs: scheduled });
  }

  const byWeek = new Map<DateKey, InternshipLog[]>();
  for (const l of done) {
    const ws = weekStartKey(l.date);
    const arr = byWeek.get(ws);
    if (arr) arr.push(l);
    else byWeek.set(ws, [l]);
  }

  const thisWeek = weekStartKey(today);
  const lastWeek = addDays(thisWeek, -7);
  const undated = byWeek.get('');
  const weeks = [...byWeek.entries()]
    .filter(([ws]) => ws !== '')
    .sort((a, b) => b[0].localeCompare(a[0])); // mais recente primeiro

  for (const [ws, groupLogs] of weeks) {
    groupLogs.sort(
      (a, b) =>
        dateKeyOrdinal(b.date) - dateKeyOrdinal(a.date) ||
        (b.sessionNumber ?? 0) - (a.sessionNumber ?? 0) ||
        a.id.localeCompare(b.id)
    );
    groups.push({
      id: ws,
      label:
        ws === thisWeek
          ? 'esta semana'
          : ws === lastWeek
          ? 'semana passada'
          : `${formatDateShortBR(ws)} – ${formatDateShortBR(addDays(ws, 6))}`,
      hours: groupLogs.reduce((a, l) => a + (l.hours || 0), 0),
      logs: groupLogs,
    });
  }

  // Registro com data inválida cai no fim, e conta como feito (`E7`).
  if (undated?.length) {
    groups.push({
      id: 'sem-data',
      label: 'sem data',
      hours: undated.reduce((a, l) => a + (l.hours || 0), 0),
      logs: undated,
    });
  }
  return groups;
};

// ---------------------------------------------------------------------------
// 6. Título sugerido e escrita
// ---------------------------------------------------------------------------

export const suggestTitle = (log: InternshipLog): string => {
  switch (log.type) {
    case 'atendimento_clinico': {
      const who = formatPatientLabel(log.patient);
      if (log.sessionNumber) return who ? `sessão ${log.sessionNumber} · ${who}` : `sessão ${log.sessionNumber}`;
      return who ? `atendimento · ${who}` : 'atendimento clínico';
    }
    case 'supervisao':
      return log.supervisor?.trim() ? `supervisão com ${log.supervisor.trim()}` : 'supervisão';
    case 'intervisao':
      return log.supervisor?.trim() ? `intervisão com ${log.supervisor.trim()}` : 'intervisão';
    case 'estagio':
      return 'dia de estágio';
    default:
      return 'registro de campo';
  }
};

const trimOrUndefined = (v?: string): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

const clampHours = (n: number): number => {
  if (!Number.isFinite(n)) return 0; // NaN → 0 (`E8`)
  return Math.min(24, Math.max(0, Math.round(n * 4) / 4)); // passo 0,25 (`D18`)
};

/**
 * Aplica `I1`–`I8`. É a **única** porta de sanitização: toda escrita passa aqui.
 * Nunca toca `reflections` (I4) e nunca inventa conteúdo — o texto automático do
 * "não vou responder" (`SPEC-011 D12`) é escrito pelo `comDeclinados`, antes de
 * chegar aqui; o sanitize apenas o preserva.
 */
export const sanitizeLog = (log: InternshipLog, all: InternshipLog[]): InternshipLog => {
  const byId = new Map(all.map((l) => [l.id, l]));
  const out: InternshipLog = { ...log };

  out.type = log.type ?? 'estagio'; // `I7`
  out.hours = clampHours(log.hours); // `I5`
  out.reflections = (log.reflections ?? '').trim(); // `I4`: limpa, não fabrica
  out.date = parts(log.date) ? log.date : todayKey(); // `I6`

  if (!out.activity?.trim()) out.activity = suggestTitle(out); // `D10`
  else out.activity = out.activity.trim();

  out.patient = trimOrUndefined(out.patient);
  out.patientAge = trimOrUndefined(out.patientAge);
  out.theme = trimOrUndefined(out.theme);
  out.approach = trimOrUndefined(out.approach);
  out.interventionNotes = trimOrUndefined(out.interventionNotes);
  out.observations = trimOrUndefined(out.observations);
  out.supervisor = trimOrUndefined(out.supervisor);
  out.orientations = trimOrUndefined(out.orientations);
  out.doubts = trimOrUndefined(out.doubts);

  // `I1`–`I3`: vínculo só em supervisão/intervisão, só para clínico existente,
  // sem duplicata e sem auto-referência.
  if (out.type === 'supervisao' || out.type === 'intervisao') {
    const ids = [
      ...new Set(
        (out.discussedLogIds ?? []).filter(
          (id) => id !== out.id && byId.get(id)?.type === 'atendimento_clinico'
        )
      ),
    ];
    if (ids.length) out.discussedLogIds = ids;
    else delete out.discussedLogIds;
  } else {
    delete out.discussedLogIds;
  }

  // `D3`: o ponteiro legado nunca é escrito.
  delete out.supervisionLogId;

  // `SPEC-011 D11`: a lista declina da escolha persistida — só campos aplicáveis
  // ao tipo, nunca em `supervisao` (`D10`). `comDeclinados` escreve os textos
  // automáticos; este passo só garante a forma, não fabrica nada (`D12`).
  const declinados = declinadosDe(out);
  if (out.type === 'supervisao' || declinados.length === 0) delete out.declinedFields;
  else out.declinedFields = declinados;

  // `I8`: autoavaliação vazia não existe.
  if (out.selfAssessment && !hasAnyText(out.selfAssessment)) delete out.selfAssessment;

  // `D17`: vínculo de próximo passo cujo texto mudou é podado (`E19`).
  if (out.nextStepLinks?.length) {
    const steps = new Set((out.nextSteps ?? []).map((s) => s.trim()));
    const kept = out.nextStepLinks.filter((l) => steps.has(l.step.trim()));
    if (kept.length) out.nextStepLinks = kept;
    else delete out.nextStepLinks;
  }

  return out;
};

const hasAnyText = (o: Record<string, string | undefined>): boolean =>
  Object.values(o).some((v) => typeof v === 'string' && v.trim() !== '');

/**
 * A porta de escrita única. Substitui por id ou anexa; **não** toca em nenhum
 * outro registro, porque o vínculo é derivado e mora no log salvo.
 */
export const planSave = (logs: InternshipLog[], draft: InternshipLog): InternshipLog[] => {
  const clean = sanitizeLog(draft, logs);
  const i = logs.findIndex((l) => l.id === clean.id);
  if (i === -1) return [...logs, clean];
  const next = [...logs];
  next[i] = { ...logs[i], ...clean };
  return next;
};

/** Apagar um registro e retirar o id de todo `discussedLogIds` (`E3`, `E4`). */
export const planDelete = (logs: InternshipLog[], id: string): InternshipLog[] =>
  logs
    .filter((l) => l.id !== id)
    .map((l) => {
      if (!(l.discussedLogIds ?? []).includes(id)) return l;
      const discussedLogIds = l.discussedLogIds!.filter((x) => x !== id);
      return discussedLogIds.length ? { ...l, discussedLogIds } : { ...l, discussedLogIds: undefined };
    });

export interface RenamePatientResult {
  logs: InternshipLog[];
  /** A chave de destino **já existia** — os dois casos viram um. */
  merged: boolean;
}

/**
 * Reescreve as iniciais de um caso inteiro.
 *
 * `toLabel` vazio é rejeitado (`logs` volta idêntico). Órfãos (`fromKey === ''`)
 * **não** são renomeados em bloco: podem ser pacientes diferentes — para eles
 * existe `planSetPatient` (`D9`).
 */
export const planRenamePatient = (
  logs: InternshipLog[],
  fromKey: string,
  toLabel: string
): RenamePatientResult => {
  const label = formatPatientLabel(toLabel);
  if (!label || !fromKey) return { logs, merged: false };

  const toKey = normalizePatientKey(label);
  // `merged` = a chave de destino já existia **em outro caso**. Renomear "MS" para
  // "M. S." não é juntar com ninguém: é o mesmo caso com outra grafia, e a UI não
  // pode oferecer "os dois casos viram um só" para o caso que ela está editando.
  const merged = logs.some(
    (l) => isClinical(l) && normalizePatientKey(l.patient) === toKey && toKey !== fromKey
  );

  return {
    merged,
    logs: logs.map((l) =>
      isClinical(l) && normalizePatientKey(l.patient) === fromKey ? { ...l, patient: label } : l
    ),
  };
};

/** Define as iniciais de registros **específicos** — a única forma de completar órfãos. */
export const planSetPatient = (
  logs: InternshipLog[],
  ids: string[],
  label: string
): InternshipLog[] => {
  const clean = formatPatientLabel(label);
  if (!clean) return logs;
  const target = new Set(ids);
  return logs.map((l) => (target.has(l.id) && isClinical(l) ? { ...l, patient: clean } : l));
};

/** Acrescenta o vínculo de um próximo passo, substituindo o do mesmo texto (`D17`). */
export const planLinkNextStep = (
  log: InternshipLog,
  step: string,
  kind: InternshipNextStepLink['kind'],
  entityId: string,
  nowIso: string
): InternshipLog => {
  const text = step.trim();
  const link: InternshipNextStepLink = { step: text, kind, entityId, createdAt: nowIso };
  const nextStepLinks = [...(log.nextStepLinks ?? []).filter((l) => l.step.trim() !== text), link];
  return { ...log, nextStepLinks };
};

/** O texto do passo ainda está em `nextSteps` **e** a entidade ligada existe? */
export const hasLiveNextStepLink = (
  log: InternshipLog,
  step: string,
  exists: (entityId: string) => boolean
): boolean => {
  const text = step.trim();
  const link = (log.nextStepLinks ?? []).find((l) => l.step.trim() === text);
  if (!link) return false;
  return (log.nextSteps ?? []).some((s) => s.trim() === text) && exists(link.entityId);
};

/**
 * Caderno de supervisão legado → `InternshipLog` (`supervisao`).
 *
 * Função **compartilhada** pela `MIGRATIONS[20]` e por `drainLegacySupervision`
 * (`F8`): uma regra, um lugar. Repete o `id` do caderno, então rodar duas vezes
 * não duplica nada.
 */
export const legacyNotebookToLog = (
  nb: SupervisionNotebook,
  defaultWorkspaceId = 'ws-academico'
): InternshipLog => ({
  id: nb.id,
  // `F8`: o caderno legado nunca recebeu workspaceId; o default é o do domínio.
  workspaceId: nb.workspaceId ?? defaultWorkspaceId,
  type: 'supervisao',
  date: nb.date,
  hours: 0,
  activity: nb.supervisor?.trim() ? `supervisão com ${nb.supervisor.trim()}` : 'supervisão',
  reflections: '',
  supervisor: nb.supervisor,
  topics: nb.questions ?? [],
  referenceIds: nb.referenceIds ?? [],
  conceptIds: nb.conceptIds ?? [],
  nextSteps: nb.nextSteps ?? [],
  beforeNotes: nb.beforeNotes,
  afterNotes: nb.afterNotes,
  selfAssessment: nb.selfAssessment,
});