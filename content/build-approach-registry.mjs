/**
 * A1 — Registro canônico de abordagens (`content/editorial/approachRegistry.json`).
 *
 * Une os 3 sistemas de ids (decisão #9 do plano):
 *   - editorial:   `psic-<fam>-<nn>` + famílias `fam-01..10`  (97)
 *   - taxonômico:  `app-<slug>` do pacote de questões          (17)
 *   - técnicas:    `app-<categoria>-<terapia-slug>`            (25)
 *
 * Estratégia:
 *   1. Editoriais são canônicas. Técnicas e taxonômicas tentam casar por
 *      contenção de tokens contra nomes editoriais (limiar conservador).
 *   2. Taxonômicas sem match: fallback keyword → família editorial; áreas
 *      metodológicas/contextuais ficam como entradas canônicas próprias.
 *   3. Técnicas sem match: herdam a família da categoria da técnica.
 *
 * Saída: { schemaVersion, generatedAt, entries[], resolve{} } — `resolve`
 * mapeia qualquer id (canônico ou alias) → id canônico.
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'path';
import {
  EDITORIAL_DIR,
  loadEditorialApproaches,
  loadTaxonomicApproaches,
  loadTechniques,
  techniqueApproachIds,
  tokenContainment,
  normalize,
  writeJsonPretty,
} from './temple-lib.mjs';

const MATCH_THRESHOLD = 0.8;

/** keyword → família editorial p/ abordagens taxonômicas sem match por nome. */
const TAXONOMIC_FAMILY_KEYWORDS = [
  [/psicanal|psicodinam/, 'fam-01'],
  [/humanista|existencial|fenomenol/, 'fam-02'],
  [/behaviorism|aprendizagem/, 'fam-03'],
  [/cognitiv|tcc/, 'fam-04'],
  [/sistemica|familiar|casais/, 'fam-05'],
  [/narrativ|construtivista/, 'fam-06'],
  [/social|comunitaria|grupos|diversidade/, 'fam-09'],
];

/** categoria slug das técnicas → família editorial. */
const TECHNIQUE_DOMAIN_FAMILY = {
  cognitivas: 'fam-04',
  comportamentais: 'fam-03',
  'exposicao-aprendizagem': 'fam-03',
  'humanistas-existenciais': 'fam-02',
  'emocionais-experienciais': 'fam-02',
  'mindfulness-aceitacao-regulacao': 'fam-04',
  psicodinamicas: 'fam-01',
  'sistemicas-familiares-casais': 'fam-05',
  'narrativas-construtivistas': 'fam-06',
  'motivacionais-solucao': 'fam-10',
};

function bestEditorialMatch(name, editorial) {
  let best = null;
  let bestScore = 0;
  for (const a of editorial) {
    const score = tokenContainment(name, a.name);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? { approach: best, score: bestScore } : null;
}

async function main() {
  const editorial = await loadEditorialApproaches();
  const taxonomic = loadTaxonomicApproaches();
  const { techniques } = loadTechniques();
  const techIds = techniqueApproachIds(techniques);

  /** canonicalId -> entry */
  const entries = new Map();
  /** alias/canonical id -> canonicalId */
  const resolve = new Map();

  for (const a of editorial) {
    entries.set(a.id, {
      id: a.id,
      name: a.name,
      system: 'editorial',
      familyId: a.familyId ?? null,
      aliases: [],
    });
    resolve.set(a.id, a.id);
  }

  // --- técnicas (25) ---
  const unmatchedTechnique = [];
  for (const { id } of techIds) {
    if (resolve.has(id)) continue;
    // nome humanizado do slug: app-<categoria>-<terapia-slug>
    const withoutPrefix = id.replace(/^app-/, '');
    const domainSlug = Object.keys(TECHNIQUE_DOMAIN_FAMILY).find((d) =>
      withoutPrefix.startsWith(`${d}-`)
    );
    const therapySlug = domainSlug
      ? withoutPrefix.slice(domainSlug.length + 1)
      : withoutPrefix.replace(/^[a-z_]+-/, '');
    const humanized = therapySlug.replace(/_/g, '-').replace(/-/g, ' ');
    const titleCase = humanized
      .split(' ')
      .map((w) => (w.length <= 3 && ['tcc', 'act', 'dbt', 'mbt', 'eft'].includes(w) ? w.toUpperCase() : w))
      .join(' ');
    const match = bestEditorialMatch(titleCase, editorial);
    const fallbackFamily = domainSlug ? TECHNIQUE_DOMAIN_FAMILY[domainSlug] ?? null : null;
    if (match) {
      entries.get(match.approach.id).aliases.push({ id, source: 'techniques' });
      resolve.set(id, match.approach.id);
    } else {
      unmatchedTechnique.push({
        id,
        name: titleCase,
        system: 'techniques',
        familyId: fallbackFamily,
        aliases: [],
        note: 'entrada própria — sem equivalente editorial exato',
      });
    }
  }

  // --- taxonômicas (17) ---
  const unmatchedTaxonomic = [];
  for (const t of taxonomic) {
    if (resolve.has(t.id)) continue;
    const match = bestEditorialMatch(t.name, editorial);
    if (match) {
      entries.get(match.approach.id).aliases.push({
        id: t.id,
        source: 'taxonomic',
        packageName: t.name,
      });
      resolve.set(t.id, match.approach.id);
      continue;
    }
    const n = normalize(t.name);
    const kw = TAXONOMIC_FAMILY_KEYWORDS.find(([re]) => re.test(n));
    const fam = kw ? kw[1] : null;
    unmatchedTaxonomic.push({
      id: t.id,
      name: t.name,
      system: 'taxonomic',
      familyId: fam,
      taxonomyFamilyId: t.familyId ?? null,
      questionCount: t.questionCount ?? 0,
      aliases: [],
      note: fam
        ? 'área ampla — mapeada à família editorial por keyword'
        : 'área metodológica/contextual — entrada canônica própria',
    });
  }

  const all = [...entries.values(), ...unmatchedTechnique, ...unmatchedTaxonomic];
  for (const e of unmatchedTechnique.concat(unmatchedTaxonomic)) resolve.set(e.id, e.id);

  const registry = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    stats: {
      canonical: all.length,
      editorialCanonicals: entries.size,
      techniqueAliases: techIds.length,
      taxonomicAliases: taxonomic.length,
    },
    entries: all,
    resolve: Object.fromEntries([...resolve.entries()].sort(([a], [b]) => a.localeCompare(b))),
  };

  mkdirSync(EDITORIAL_DIR, { recursive: true });
  writeFileSync(
    path.join(EDITORIAL_DIR, 'approachRegistry.json'),
    writeJsonPretty('approachRegistry.json', registry)
  );

  console.log(
    `[registry] ${all.length} canônicas (${entries.size} editoriais · ` +
      `${unmatchedTechnique.length} técnicas próprias · ${unmatchedTaxonomic.length} taxonômicas próprias)`
  );
  console.log(`[registry] aliases: ${techIds.length} de técnicas · ${taxonomic.length} taxonômicas`);
  for (const e of [...unmatchedTechnique, ...unmatchedTaxonomic]) {
    console.log(`  ↳ própria: ${e.id} (${e.note})`);
  }
}

main().catch((e) => {
  console.error('[registry] falhou:', e);
  process.exit(1);
});
