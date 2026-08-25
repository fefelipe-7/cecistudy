/**
 * B1 — Banco de questões 3.004 (`src/data/questions/cecistudy_banco_3004_questoes.json`).
 *
 * Converte o pacote modular p/ o MESMO shape raw do banco atual
 * (`BancoQuestaoRaw`) — decisão #1 do plano: as 3.004 SUBSTITUEM as 745 e o
 * quiz (QuizCategorySelector/filterQuestionPool/QuizPlayer) funciona inalterado.
 *
 * Mapeamento (seção 3.1 do plano):
 *   texto = stem · alternativas = options[].text · gabarito = letra da correta
 *   explicacao = explanation · area = título da categoria (18)
 *   tema = nome do 1º topicId · subtema = null
 *   autor_ou_autores = nomes curados (authors.json) · escola_ou_abordagem =
 *   nome do 1º approachId · dificuldade basic→basica / unspecified→null
 *   referencias_de_apoio = títulos dos referenceIds · origem autoral/prova_real
 * Exclui apenas deprecated/isAnnulled (decisão #2: review entra como publicada).
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'path';
import {
  ROOT,
  loadCategories,
  loadTopics,
  loadAllQuestions,
  loadWorks,
  loadTaxonomicApproaches,
  normalize,
} from './temple-lib.mjs';

const DIFF_MAP = {
  basic: 'basica',
  intermediate: 'intermediaria',
  advanced: 'avancada',
};

const FORMAT_MAP = {
  multiple_choice: 'multipla_escolha',
  true_false: 'certo_errado',
};

function main() {
  const categories = new Map(loadCategories().map((c) => [c.id, c]));
  const topics = new Map(loadTopics().map((t) => [t.id, t]));
  const works = new Map(loadWorks().map((w) => [w.id, w]));
  const taxonomicNames = new Map(loadTaxonomicApproaches().map((a) => [a.id, a.name]));

  const editorial = JSON.parse(
    readFileSync(path.join(ROOT, 'content', 'editorial', 'authors.json'), 'utf8')
  );
  const authorNameById = new Map();
  for (const a of editorial.authors) {
    authorNameById.set(a.id, a.name);
    for (const sid of a.sourceIds) authorNameById.set(sid, a.name);
    for (const alias of a.aliases) authorNameById.set(normalize(alias), a.name);
  }
  // ids excluídos (topic-like/placeholder) resolvem vazio

  const all = loadAllQuestions();
  const skipped = { annulled: 0, inactive: 0 };
  const out = [];

  for (const q of all) {
    if (q.isAnnulled || q.reviewStatus === 'deprecated') {
      skipped.annulled++;
      continue;
    }
    if (q.isActive === false) {
      skipped.inactive++;
      continue;
    }

    const isTF = q.format === 'true_false';
    const optionTexts = (q.options ?? []).map((o) => o.text);
    const correctIdx = (q.options ?? []).findIndex((o) => o.isCorrect);
    if (correctIdx < 0) continue; // sem gabarito → fora
    const gabarito = String.fromCharCode(65 + correctIdx);

    const category = categories.get(q.categoryId);
    const firstTopic = topics.get((q.topicIds ?? [])[0]);
    const approachName = taxonomicNames.get((q.approachIds ?? [])[0]) ?? null;

    const autores = [
      ...new Set(
        (q.authorIds ?? [])
          .map((id) => authorNameById.get(id) ?? authorNameById.get(normalize(id)))
          .filter(Boolean)
      ),
    ];

    out.push({
      id: q.id,
      texto: q.stem,
      tipo: FORMAT_MAP[q.format] ?? 'multipla_escolha',
      alternativas: optionTexts,
      gabarito,
      explicacao: q.explanation ?? '',
      area: category?.name ?? null,
      tema: firstTopic?.name ?? null,
      subtema: null,
      autor_ou_autores: autores,
      escola_ou_abordagem: approachName,
      dificuldade: DIFF_MAP[q.difficulty] ?? null,
      tipo_conhecimento: q.knowledgeType ?? null,
      referencias_de_apoio: [
        ...new Set(
          (q.referenceIds ?? [])
            .map((id) => works.get(id)?.title)
            .filter(Boolean)
        ),
      ],
      origem: q.origin === 'real' ? 'prova_real' : 'autoral',
      status_revisao: q.reviewStatus ?? null,
      banca: q.bank ?? null,
      prova: q.exam ?? null,
      ano: q.year != null ? String(q.year) : null,
      formato: FORMAT_MAP[q.format] ?? 'multipla_escolha',
      resposta_discursiva: '',
      criterios_de_correcao: [],
      afirmativas: [],
      itens_de_associacao: [],
    });
  }

  // ids únicos
  const seen = new Set();
  for (const q of out) {
    if (seen.has(q.id)) throw new Error(`id duplicado no banco gerado: ${q.id}`);
    seen.add(q.id);
  }

  const outDir = path.join(ROOT, 'src', 'data', 'questions');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, 'cecistudy_banco_3004_questoes.json'),
    JSON.stringify(out, null, 2)
  );

  const byArea = new Map();
  for (const q of out) byArea.set(q.area, (byArea.get(q.area) ?? 0) + 1);
  console.log(
    `[questions-bank] ${out.length} questões ` +
      `(MC ${out.filter((q) => q.formato === 'multipla_escolha').length} · CE ${out.filter((q) => q.formato === 'certo_errado').length})`
  );
  console.log(`[questions-bank] excluídas: ${JSON.stringify(skipped)}`);
  console.log(`[questions-bank] áreas (${byArea.size}):`, [...byArea.entries()].map(([a, n]) => `${a}:${n}`).join(' · '));
}

try {
  main();
} catch (e) {
  console.error('[questions-bank] falhou:', e);
  process.exit(1);
}
