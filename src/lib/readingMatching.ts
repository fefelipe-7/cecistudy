/**
 * Matching puro de obras e autores p/ o ReadingWizard (duplicata + sugestões).
 *
 * Web e nativo compartilham a mesma lógica: as entradas são apenas dados
 * (`ReadingItem` do estado pessoal e refs leves do catálogo da biblioteca).
 */
import type { ReadingItem } from '../types';

/** Normaliza texto p/ comparação: minúsculo, sem acentos, sem pontuação. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MIN_FUZZY_LENGTH = 4;

function titlesMatch(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length < MIN_FUZZY_LENGTH || nb.length < MIN_FUZZY_LENGTH) return false;
  return na.includes(nb) || nb.includes(na);
}

/** Ref leve de obra do catálogo (só o que o wizard precisa). */
export interface CatalogWorkRef {
  id: string;
  title: string;
  author: string;
}

/** Leituras pessoais que batem com o título digitado. */
export function findMyReadingMatches(
  title: string,
  readings: ReadingItem[],
  excludeId?: string
): ReadingItem[] {
  if (!title.trim()) return [];
  return readings.filter(
    (r) => r.id !== excludeId && titlesMatch(title, r.title)
  );
}

/** Obras do catálogo da biblioteca que batem com o título digitado. */
export function findCatalogMatches(
  title: string,
  works: CatalogWorkRef[]
): CatalogWorkRef[] {
  if (!title.trim()) return [];
  return works.filter((w) => titlesMatch(title, w.title));
}

/**
 * Sugestões de autor: banco pessoal de autores + autores já usados nas
 * leituras + autores das obras casadas no catálogo — dedupe por nome
 * normalizado, preservando a grafia da primeira ocorrência.
 */
export function buildAuthorSuggestions(input: {
  authors: { name: string }[];
  readings: ReadingItem[];
  catalogWorks?: CatalogWorkRef[];
}): string[] {
  const keys: string[] = [];
  const names: string[] = [];
  const add = (name?: string) => {
    const trimmed = name?.trim();
    if (!trimmed) return;
    const key = normalizeText(trimmed);
    if (!key || names.some((n) => normalizeText(n) === key)) return;
    // Sobrenome solto já coberto por um nome mais completo ("freud" ⊂
    // "sigmund freud"): pula para não sugerir duplicata óbvia.
    if (keys.some((k) => k.includes(key))) return;
    keys.push(key);
    names.push(trimmed);
  };
  input.authors.forEach((a) => add(a.name));
  input.readings.forEach((r) => add(r.author));
  (input.catalogWorks ?? []).forEach((w) => add(w.author));
  return [...names];
}
