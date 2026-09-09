/**
 * content:check — valida as fontes do catálogo (parse + contagens + shape).
 * Sai com código ≠ 0 quando alguma fonte está ausente/vazia/malformada.
 */

import {
  BANCO_QUESTOES,
  PSICOTERAPIA_APPROACHES,
  PSICOTERAPIA_FAMILIES,
  mapCatalogBooks,
  mapInterdisciplinaryBooks,
  mapArticles,
  listAreas,
  computeContentHash,
  loadTempleSources,
} from './content-data.mjs';
import approachRegistryFile from '../src/data/temple/approachRegistry.json' with { type: 'json' };

const MIN = {
  questoes: 100,
  abordagens: 50,
  familias: 5,
  areas: 1,
  livrosCatalogo: 1,
  livrosInter: 1,
  artigos: 1,
  conceitos: 200,
  dominiosConceito: 10,
  tecnicas: 130,
  autores: 120,
  categoriasQuestao: 18,
  topicos: 1400,
  comparacoes: 130,
};

const failures = [];
const check = (label, value, min) => {
  const ok = typeof value === 'number' && value >= min;
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}: ${value}`);
  if (!ok) failures.push(`${label} (${value} < ${min})`);
};

console.log('[content:check] fontes do catálogo:');
check('questões', BANCO_QUESTOES.length, MIN.questoes);
check('abordagens', PSICOTERAPIA_APPROACHES.length, MIN.abordagens);
check('famílias de abordagem', PSICOTERAPIA_FAMILIES.length, MIN.familias);
check('áreas (questões)', listAreas().length, MIN.areas);
check('livros do catálogo', mapCatalogBooks().length, MIN.livrosCatalogo);
check('livros interdisciplinares', mapInterdisciplinaryBooks().length, MIN.livrosInter);
check('artigos', mapArticles().length, MIN.artigos);

// templo de conhecimento
const temple = loadTempleSources();
const conceptDomains = new Set(temple.concepts.map((c) => c.domainId));
check('conceitos', temple.concepts.length, MIN.conceitos);
check('domínios de conceito', conceptDomains.size, MIN.dominiosConceito);
check('técnicas', temple.techniques.length, MIN.tecnicas);
check(
  'autores (fichas curadas)',
  temple.curatedAuthors.length,
  MIN.autores
);
check('categorias de questão (pacote)', temple.questionCategories.length, MIN.categoriasQuestao);
check('tópicos', temple.topics.length, MIN.topicos);
check('comparações', temple.comparisons.comparacoes.length, MIN.comparacoes);
check('fontes de comparações', temple.comparisons.fontes.length, 21);

const hash = computeContentHash();
console.log(`hash do conteúdo: ${hash.slice(0, 16)}…`);

// Validação básica de shape (IDs únicos e obrigatórios).
const ids = (arr, field) => new Set(arr.map((x) => x[field]));
if (ids(BANCO_QUESTOES, 'id').size !== BANCO_QUESTOES.length) {
  failures.push('ids duplicados em questões');
}
if (ids(PSICOTERAPIA_APPROACHES, 'id').size !== PSICOTERAPIA_APPROACHES.length) {
  failures.push('ids duplicados em abordagens');
}
if (BANCO_QUESTOES.some((q) => !q.question || !q.answer)) {
  failures.push('questão sem pergunta/resposta');
}
// shape do templo: conceito sem id/nome/domínio; técnica fora de categoria conhecida
if (temple.concepts.some((c) => !c.id || !c.name || !c.domainId)) {
  failures.push('conceito sem id/nome/domínio');
}
const techniqueCategoryIds = new Set(temple.techniqueCategories.map((c) => c.id));
if (temple.techniques.some((t) => !t.id || !techniqueCategoryIds.has(t.dominioId))) {
  failures.push('técnica sem id ou categoria desconhecida');
}
const comparisonIds = temple.comparisons.comparacoes.map((c) => c.id);
const comparisonSlugs = temple.comparisons.comparacoes.map((c) => c.slug);
if (new Set(comparisonIds).size !== comparisonIds.length) failures.push('ids duplicados em comparações');
if (new Set(comparisonSlugs).size !== comparisonSlugs.length) failures.push('slugs duplicados em comparações');
if (temple.comparisons.comparacoes.some((c) => !c.id || !c.slug || !c.titulo || !c.perguntaCentral || c.itens.length < 2)) {
  failures.push('comparação sem id/slug/título/pergunta ou com menos de duas entidades');
}

const comparisonSources = new Set(temple.comparisons.fontes.map((source) => source.id));
const techniqueIds = new Set(temple.techniques.map((technique) => technique.id));
const conceptIds = new Set(temple.concepts.map((concept) => concept.id));
const comparisonEntityTypes = new Set(['abordagem', 'tecnica', 'conceito', 'autor', 'fenomeno']);
const approachIds = new Set(approachRegistryFile.entries.map((entry) => entry.id));
const authorIds = new Set(temple.curatedAuthors.map((author) => author.id));
const normalizeLookup = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const authorNames = new Set(temple.curatedAuthors.map((author) => normalizeLookup(author.name)));
for (const comparison of temple.comparisons.comparacoes) {
  if (comparison.eixos.length !== 9) failures.push(`${comparison.id}: esperado 9 eixos`);
  if (comparison.eixos.some((axis) => axis.respostas.length !== comparison.itens.length)) {
    failures.push(`${comparison.id}: respostas não cobrem todos os itens em cada eixo`);
  }
  if (comparison.fontesDetalhadas.some((source) => !comparisonSources.has(source.id))) {
    failures.push(`${comparison.id}: fonte detalhada inexistente`);
  }
  if (comparison.evidencias.some((evidence) => !comparisonSources.has(evidence.fonteId))) {
    failures.push(`${comparison.id}: evidência com fonte inexistente`);
  }
  if (comparison.itens.some((item) => {
    if (!comparisonEntityTypes.has(item.tipoEntidade)) return true;
    if (item.tipoEntidade === 'tecnica') return !techniqueIds.has(item.entidadeId);
    if (item.tipoEntidade === 'conceito') return !conceptIds.has(item.entidadeId);
    if (item.tipoEntidade === 'autor') return !authorIds.has(item.entidadeId) && !authorNames.has(normalizeLookup(item.entidadeNome));
    if (item.tipoEntidade === 'abordagem') return !approachIds.has(item.entidadeId);
    return false;
  })) {
    failures.push(`${comparison.id}: item com tipo ou entidade não resolvível`);
  }
}
if (!techniqueIds.has('tec-psicoeducacao')) failures.push('técnica canônica tec-psicoeducacao ausente');

if (failures.length > 0) {
  console.error(`[content:check] falhou: ${failures.join('; ')}`);
  process.exit(1);
}
console.log('[content:check] ok — fontes íntegras.');