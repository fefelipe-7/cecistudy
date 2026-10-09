/**
 * Adaptador de rede do enriquecimento (SPEC-012 §7.3, F7.5).
 *
 * A regra de transformação mora em `parseCitationMeta.ts`; aqui só o **transporte**: 
 * - DOI presente (`reading.doi` ou da URL `doi.org/…`) → Crossref (`GET
 *   api.crossref.org/works/<doi>`), que é o mais confiável (autores já
 *   separados — §7.3 item 0).
 * - Sem DOI → `GET` da própria URL e `parseCitationMeta`.
 * - No web puro o enriquecimento fica **desligado** (§7.3 fim): é no WebView
 *   nativo que o `CapacitorHttp` resolve o CORS.
 *
 * Timeout curto (8 s) e nunca bloqueia a UI; falha vira `falhou` (ou `offline`,
 * que mantém `pendente` para a próxima abertura — máx. `MAX_ENRICH_ATTEMPTS`).
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { ReadingItem } from '../types';
import {
  extractDoi,
  isProvisionalTitle,
  mapCrossrefWork,
  mergeEnrichment,
  normalizeDoi,
  parseCitationMeta,
  type EnrichmentFields,
} from './parseCitationMeta';

export const CROSSREF_BASE = 'https://api.crossref.org/works/';

/** Máximo de aberturas tentando enriquecer uma leitura antes de `falhou`. */
export const MAX_ENRICH_ATTEMPTS = 3;

/** Contrato do transporte — injetável para teste (a rede é o adaptador). */
export interface HttpResult {
  status: number;
  /** JSON já parseado (Crossref) ou string (HTML da página). */
  data: unknown;
  text: string;
}

export type Transport = (url: string, responseType: 'json' | 'text') => Promise<HttpResult>;

/** Parte da leitura que o plano de enriquecimento lê. */
export interface EnrichableReading {
  id: string;
  url?: string;
  doi?: string;
}

export interface EnrichmentPlan {
  url: string;
  source: 'crossref' | 'page';
}

/**
 * Decide de onde vem o enriquecimento. DOI (do campo ou da URL) vence — é a
 * ordem 0 do §7.3. Sem DOI e sem URL: nada a buscar (`null`).
 */
export const buildEnrichmentPlan = (reading: EnrichableReading): EnrichmentPlan | null => {
  const doi = reading.doi ? normalizeDoi(reading.doi) : reading.url ? extractDoi(reading.url) : null;
  if (doi) return { url: `${CROSSREF_BASE}${doi}`, source: 'crossref' };
  if (reading.url) return { url: reading.url, source: 'page' };
  return null;
};

export type EnrichResult =
  | { kind: 'ok'; patch: Partial<ReadingItem> }
  | { kind: 'falhou' }
  | { kind: 'offline' }
  | { kind: 'nada' };

const isOffline = (): boolean =>
  typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * Roda o enriquecimento de uma leitura com um transporte DADO. Sem rede não
 * bloqueia: `offline` (mantém `pendente`) para rede fora; `falhou` para o resto.
 */
export const enrichReadingWith = async (
  reading: EnrichableReading & ReadingItem,
  transport: Transport,
): Promise<EnrichResult> => {
  const plan = buildEnrichmentPlan(reading);
  if (!plan) return { kind: 'nada' };

  let res: HttpResult;
  try {
    res = await transport(plan.url, plan.source === 'crossref' ? 'json' : 'text');
  } catch {
    return isOffline() ? { kind: 'offline' } : { kind: 'falhou' };
  }
  if (res.status < 200 || res.status >= 300) return { kind: 'falhou' };

  let fields: EnrichmentFields;
  if (plan.source === 'crossref') {
    fields = mapCrossrefWork(res.data);
  } else {
    fields = parseCitationMeta(res.text, plan.url);
  }
  if (isProvisionalTitle(reading) && !fields.title && !fields.authors?.length) {
    return { kind: 'falhou' };
  }
  return { kind: 'ok', patch: mergeEnrichment(reading, fields) };
};

const nativeTransport: Transport = async (url, responseType) => {
  const res = await CapacitorHttp.get({
    url,
    responseType,
    connectTimeout: 8000,
    readTimeout: 8000,
  });
  const data = res.data;
  return {
    status: res.status,
    data,
    text: typeof data === 'string' ? data : JSON.stringify(data),
  };
};

/**
 * Transporte de produção. No web puro devolve `nada` (enriquecimento
 * desligado — §7.3); no nativo usa o `CapacitorHttp`, que resolve o CORS.
 */
export const enrichReading = (reading: EnrichableReading & ReadingItem): Promise<EnrichResult> =>
  Capacitor.isNativePlatform()
    ? enrichReadingWith(reading, nativeTransport)
    : Promise.resolve({ kind: 'nada' });

/**
 * Processa as leituras `enrichStatus === 'pendente'` na abertura do app.
 * Quem chama: o shell (uma vez por sessão). Sempre é o produtor de um estado
 * novo (uma escrita): chama o `setReadings` com o patch de cada uma.
 * O `enrich` (`(r) => Promise<EnrichResult>`) é injetado para teste.
 */
export const enrichPendingWith = async (
  readings: ReadingItem[],
  setReadings: (updater: (prev: ReadingItem[]) => ReadingItem[]) => void,
  enrich: (r: ReadingItem) => Promise<EnrichResult>,
): Promise<void> => {
  const pending = readings.filter((r) => r.enrichStatus === 'pendente' && (r.url || r.doi));
  const patches = new Map<string, Partial<ReadingItem>>();

  for (const reading of pending) {
    const res = await enrich(reading);
    if (res.kind === 'ok') {
      patches.set(reading.id, res.patch);
    } else if (res.kind === 'falhou') {
      patches.set(reading.id, { enrichStatus: 'falhou' });
    } else if (res.kind === 'offline') {
      const attempts = (reading.enrichAttempts ?? 0) + 1;
      patches.set(
        reading.id,
        attempts >= MAX_ENRICH_ATTEMPTS
          ? { enrichStatus: 'falhou', enrichAttempts: attempts }
          : { enrichAttempts: attempts },
      );
    }
  }

  if (patches.size === 0) return;
  setReadings((prev) =>
    prev.map((r) => {
      const patch = patches.get(r.id);
      return patch ? { ...r, ...patch } : r;
    }),
  );
};

/** Versão de produção do processador — usa o transporte nativo. */
export const enrichPending = (
  readings: ReadingItem[],
  setReadings: (updater: (prev: ReadingItem[]) => ReadingItem[]) => void,
): Promise<void> => enrichPendingWith(readings, setReadings, enrichReading);