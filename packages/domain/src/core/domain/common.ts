/**
 * Tipos comuns do Domain Core (independentes de React/UI/persistência).
 */
export type Platform = 'desktop' | 'mobile';

/** Identificador de entidade do domínio (string opaca e estável). */
export type EntityId = string;

// ---------------------------------------------------------------------------
// Datas civis
// ---------------------------------------------------------------------------

/**
 * Data civil local, `YYYY-MM-DD`. Nunca `new Date('YYYY-MM-DD')` (que é UTC) e
 * nunca `toISOString().slice(0, 10)` (que é UTC e pode cair no dia anterior em
 * fuso negativo). Regra da SPEC-C-002.
 */
export type DateKey = string;

/** `DateKey` a partir de getters **locais**. */
export const toDateKey = (d: Date): DateKey =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** A `DateKey` de agora. Único `new Date()` do arquivo, e é um default explícito. */
export const todayKey = (now: Date = new Date()): DateKey => toDateKey(now);

/** Quebra uma `DateKey` em dia/mês/ano; `null` se não for `YYYY-MM-DD`. */
const dateParts = (key: string): { d: string; m: string; y: string } | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key ?? '');
  return m ? { y: m[1], m: m[2], d: m[3] } : null;
};

/** `'2026-08-26'` → `'26/08/2026'`. Entrada inválida volta como veio. */
export const formatDateBR = (key: DateKey): string => {
  const p = dateParts(key);
  return p ? `${p.d}/${p.m}/${p.y}` : key;
};

/** `'2026-08-26'` → `'26/08'`. */
export const formatDateShortBR = (key: DateKey): string => {
  const p = dateParts(key);
  return p ? `${p.d}/${p.m}` : key;
};

/** Inteiro para ordenar sem `Date` e sem fuso; inválida = `-Infinity` (ordena por último). */
export const dateKeyOrdinal = (key: DateKey): number => {
  const p = dateParts(key);
  return p ? Number(`${p.y}${p.m}${p.d}`) : Number.NEGATIVE_INFINITY;
};

/**
 * Número de dias desde a época, para **aritmética** de semana.
 *
 * Não serve `dateKeyOrdinal`: `20260907 - 20260817` dá 90, não 21 — é um inteiro
 * de formato `YYYYMMDD`, feito para comparar, não para subtrair. Aqui a data vira
 * `Date.UTC`, que é um eixo uniforme (e UTC de propósito: a semana civil é a
 * mesma nos dois lados, e o fuso local já entrou em `weekStartKey`).
 */
const dayNumber = (key: DateKey): number => {
  const p = dateParts(key);
  if (!p) return Number.NaN;
  return Date.UTC(Number(p.y), Number(p.m) - 1, Number(p.d)) / 86_400_000;
};

/** `'2026-08-26'` + n dias, em aritmética civil local (atravessa mês e ano). */
export const addDays = (key: DateKey, n: number): DateKey => {
  const p = dateParts(key);
  if (!p) return key;
  return toDateKey(new Date(Number(p.y), Number(p.m) - 1, Number(p.d) + n));
};

/**
 * Dias civis entre duas `DateKey` (`to - from`). É a **única** forma correta de
 * subtrair datas: `dateKeyOrdinal` é inteiro de formato `YYYYMMDD`, feito
 * para comparar — `20261201 - 20261008` dá 1193, não 54 (o aviso já estava no
 * `dayNumber`, e o bug aconteceu mesmo assim, pego por teste).
 */
export const daysBetween = (from: DateKey, to: DateKey): number =>
  dayNumber(to) - dayNumber(from);

/** Segunda-feira da semana de `key`. Domingo devolve a segunda anterior. */
export const weekStartKey = (key: DateKey): DateKey => {
  const p = dateParts(key);
  if (!p) return key;
  const iso = new Date(Number(p.y), Number(p.m) - 1, Number(p.d)).getDay(); // 0 = domingo
  return addDays(key, -((iso + 6) % 7));
};

/** `key` está em `[weekStart, weekStart+7)`? */
export const inWeek = (key: DateKey, weekStart: DateKey): boolean => {
  const o = dateKeyOrdinal(key);
  return o >= dateKeyOrdinal(weekStart) && o < dateKeyOrdinal(addDays(weekStart, 7));
};
