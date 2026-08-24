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
} from './content-data.mjs';

const MIN = {
  questoes: 100,
  abordagens: 50,
  familias: 5,
  areas: 1,
  livrosCatalogo: 1,
  livrosInter: 1,
  artigos: 1,
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

if (failures.length > 0) {
  console.error(`[content:check] falhou: ${failures.join('; ')}`);
  process.exit(1);
}
console.log('[content:check] ok — fontes íntegras.');