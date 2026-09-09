/**
 * Fontes do catálogo + mapeamento + hash — compartilhado entre os scripts de
 * conteúdo (`content:build`, `content:check`, `content:diff`).
 *
 * Roda no Node (type-stripping). Nenhum import do app runtime.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BANCO_QUESTOES } from '../src/data/bancoQuestoes.ts';
import { PSICOTERAPIA_APPROACHES } from '../src/data/psicoterapiaApproaches.ts';
import { PSICOTERAPIA_FAMILIES } from '../src/data/psicoterapiaFamilies.ts';
import {
  PSYCHOTHERAPY_FAMILIES,
  INTERDISCIPLINARY_AREAS,
} from '../src/data/books/families.ts';

import rawCatalog from '../src/data/books/catalogo_livros_portugues.json' with { type: 'json' };
import rawInterdisciplinary from '../src/data/books/livros_interdisciplinares_100.json' with {
  type: 'json',
};
import rawArticles from '../src/data/books/artigos_150.json' with { type: 'json' };

import {
  loadConceptFiles,
  loadTechniques,
  loadCategories,
  loadTopics,
} from './temple-lib.mjs';
import { loadComparisonSqlSources } from './comparations/normalizer.mjs';

export { BANCO_QUESTOES, PSICOTERAPIA_APPROACHES, PSICOTERAPIA_FAMILIES };

const FALLBACK_STYLE = { color: '#DCCBB8', accent: '#756354' };
const SEM_EDICAO_BR = '[sem edição brasileira confirmada]';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Consistência com o facade web (`src/data/books/index.ts`). */
export function mapCatalogBooks() {
  return rawCatalog
    .filter((b) => !b.nome.includes(SEM_EDICAO_BR))
    .map((b, i) => {
      const meta = PSYCHOTHERAPY_FAMILIES[b.familia] ?? FALLBACK_STYLE;
      return {
        id: `cat-${i + 1}`,
        familia: b.familia,
        nome: b.nome,
        autor: b.autor,
        resumo: b.resumo_do_livro,
        trecho: b.trecho_memoravel,
        tipoTrecho: b.tipo_trecho,
        coverColor: meta.color,
        accentColor: meta.accent,
      };
    });
}

export function mapInterdisciplinaryBooks() {
  return rawInterdisciplinary.map((b, i) => {
    const meta = INTERDISCIPLINARY_AREAS[b.area] ?? FALLBACK_STYLE;
    return {
      id: `inter-${i + 1}`,
      area: b.area,
      nome: b.nome,
      autor: b.autor,
      resumo: b.resumo_do_livro,
      trecho: b.trecho_memoravel,
      tipoTrecho: b.tipo_trecho,
      coverColor: meta.color,
      accentColor: meta.accent,
    };
  });
}

export function mapArticles() {
  return rawArticles.map((a, i) => ({
    id: `art-${i + 1}`,
    familia: a.familia,
    titulo: a.titulo,
    autores: a.autores,
    ano: a.ano,
    periodico: a.periodico,
    resumo: a.resumo,
    doi: a.doi,
    linkDireto: a.link_direto,
    classificacao: a.classificacao,
    observacao: a.observacao_relevancia,
  }));
}

export function listAreas() {
  const order = [];
  for (const q of BANCO_QUESTOES) {
    if (q.area && !order.includes(q.area)) order.push(q.area);
  }
  return order;
}

/**
 * Fontes do Templo de Conhecimento (conceitos, técnicas, autores curados,
 * categorias/tópicos do pacote). Autores vêm das fichas editoriais
 * (`content/editorial/authorsCurated.json` gerado por `build-authors-fichas.mjs`)
 * — entidade de consulta, separada das questões.
 */
export function loadTempleSources() {
  const concepts = loadConceptFiles().map(({ file, data }) => data);
  const { categories: techniqueCategories, techniques } = loadTechniques();
  let curatedAuthorsFile = { authors: [], families: [] };
  try {
    curatedAuthorsFile = JSON.parse(
      readFileSync(path.join(__dirname, 'editorial', 'authorsCurated.json'), 'utf8')
    );
  } catch {
    // pipeline de fichas ainda não rodou — build-catalog falha depois com contagem mínima
  }
  const comparisons = loadComparisonSqlSources(
    path.join(__dirname, 'comparations', 'migrations', 'comparacoes_seed_completo.sql'),
    readFileSync
  );
  return {
    concepts,
    techniqueCategories,
    techniques,
    curatedAuthors: curatedAuthorsFile.authors ?? [],
    questionCategories: loadCategories(),
    topics: loadTopics(),
    comparisons,
  };
}

/** Hash estável do conteúdo das fontes (para detectar drift no content:diff). */
export function computeContentHash() {
  const temple = loadTempleSources();
  const h = createHash('sha256');
  h.update(JSON.stringify(BANCO_QUESTOES));
  h.update(JSON.stringify(PSICOTERAPIA_APPROACHES));
  h.update(JSON.stringify(PSICOTERAPIA_FAMILIES));
  h.update(JSON.stringify(mapCatalogBooks()));
  h.update(JSON.stringify(mapInterdisciplinaryBooks()));
  h.update(JSON.stringify(mapArticles()));
  h.update(JSON.stringify(PSYCHOTHERAPY_FAMILIES));
  h.update(JSON.stringify(INTERDISCIPLINARY_AREAS));
  // templo (resumido p/ hash: ids + hashes de conteúdo, não o corpo inteiro)
  h.update(
    JSON.stringify({
      concepts: temple.concepts.map((c) => [c.id, c.contentHash ?? null]),
      techniques: temple.techniques.map((t) => [t.id, t.dataUltimaRevisao ?? null]),
      authors: temple.curatedAuthors.map((a) => [a.id, a.name, a.order]),
      categories: temple.questionCategories.map((c) => [c.id, c.name]),
      topics: temple.topics.length,
      comparisons: temple.comparisons.comparacoes,
      comparisonSources: temple.comparisons.fontes,
    })
  );
  return h.digest('hex');
}