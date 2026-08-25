/**
 * Lib compartilhada da pipeline do Templo de Conhecimento
 * (`build-approach-registry`, `build-authors`, `fill-concept-relations`,
 * `build-questions-bank`, `build-temple-facades`).
 *
 * Roda no Node (type-stripping p/ importar `.ts`). Nenhum import do app runtime.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const PACKAGE_DIR = path.join(
  __dirname,
  'catalogo',
  'cecistudy_catalogo_modular_3004'
);
export const PKG_CONTENT = path.join(PACKAGE_DIR, 'content');
export const EDITORIAL_DIR = path.join(__dirname, 'editorial');

/** Normaliza texto p/ matching: minúsculo, sem acentos, só letras/números/espaço. */
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Tokens normalizados de um nome (remove parênteses/siglas curtas órfãs). */
export function nameTokens(name) {
  return normalize(String(name ?? '').replace(/\([^)]*\)/g, ' '))
    .split(' ')
    .filter((t) => t.length > 1);
}

/** Abordagens editoriais geradas (`psic-*`, famílias `fam-*`). */
export async function loadEditorialApproaches() {
  const mod = await import('../src/data/psicoterapiaApproaches.ts');
  return mod.PSICOTERAPIA_APPROACHES;
}

/** Famílias editoriais (`fam-01..10`). */
export async function loadEditorialFamilies() {
  const mod = await import('../src/data/psicoterapiaFamilies.ts');
  return mod.PSICOTERAPIA_FAMILIES;
}

/** Abordagens taxonômicas do pacote (17, ids `app-<slug>`, `familyId` family-*). */
export function loadTaxonomicApproaches() {
  const raw = JSON.parse(readFileSync(path.join(PKG_CONTENT, 'taxonomies', 'approaches.json'), 'utf8'));
  return raw.items;
}

/** Categorias de questões do pacote (18). */
export function loadCategories() {
  const raw = JSON.parse(readFileSync(path.join(PKG_CONTENT, 'taxonomies', 'categories.json'), 'utf8'));
  return raw.items;
}

/** Tópicos hierárquicos do pacote (1518). */
export function loadTopics() {
  const raw = JSON.parse(readFileSync(path.join(PKG_CONTENT, 'taxonomies', 'topics.json'), 'utf8'));
  return raw.items;
}

/** Autores brutos do pacote (834 arquivos {id,name,status}). */
export function loadRawAuthors() {
  const dir = path.join(PKG_CONTENT, 'authors');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')));
}

/** Obras/referências do pacote (1382). */
export function loadWorks() {
  const raw = JSON.parse(
    readFileSync(path.join(PKG_CONTENT, 'works', 'catalog.references.json'), 'utf8')
  );
  return raw.items ?? raw;
}

/** Todos os blocos de questões do pacote (29 arquivos .questions.json). */
export function loadQuestionBlocks() {
  const base = path.join(PKG_CONTENT, 'questions');
  const blocks = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.questions.json')) {
        blocks.push(JSON.parse(readFileSync(p, 'utf8')).questions);
      }
    }
  };
  walk(base);
  return blocks;
}

/** Todas as questões do pacote em um array plano. */
export function loadAllQuestions() {
  return loadQuestionBlocks().flat();
}

/** Conceitos oficiais (`content/concepts/*.json`, 225). */
export function loadConceptFiles() {
  const dir = path.join(__dirname, 'concepts');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({
      file: f,
      data: JSON.parse(readFileSync(path.join(dir, f), 'utf8')),
    }));
}

/** Técnicas canônicas (arquivos tec-*.json em content/techniques/<categoria>/) + categorias. */
export function loadTechniques() {
  const base = path.join(__dirname, 'techniques');
  const categories = [];
  const techniques = [];
  for (const d of readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const catPath = path.join(base, d.name, 'category.json');
    if (!existsSync(catPath)) continue;
    categories.push(JSON.parse(readFileSync(catPath, 'utf8')));
    for (const f of readdirSync(path.join(base, d.name)).filter((f) => /^tec-.*\.json$/.test(f))) {
      techniques.push(JSON.parse(readFileSync(path.join(base, d.name, f), 'utf8')));
    }
  }
  categories.sort((a, b) => (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0));
  return { categories, techniques };
}

/** Ids de abordagem usados pelas técnicas (25 distintos, zero interseção c/ editoriais). */
export function techniqueApproachIds(techniques) {
  const set = new Map(); // id -> exemplo de técnica
  for (const t of techniques) {
    for (const id of t.abordagemIds ?? []) {
      if (!set.has(id)) set.set(id, t.id);
    }
  }
  return [...set.entries()].map(([id, exampleTechniqueId]) => ({ id, exampleTechniqueId }));
}

/**
 * Similaridade por contenção de tokens: |interseção| / |menor conjunto|.
 * 1.0 = o menor nome está contido no maior.
 */
export function tokenContainment(a, b) {
  const A = new Set(nameTokens(a));
  const B = new Set(nameTokens(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.min(A.size, B.size);
}

function writeJsonPretty(filePath, data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export { writeJsonPretty };
