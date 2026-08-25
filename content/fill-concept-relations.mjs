/**
 * A3 — Preenche as relações vazias dos conceitos (`content/concepts/*.json`)
 * por matching de texto (decisão #8 do plano).
 *
 *   authorIds    ← nomes de autores curados (kind person/institution) citados no texto
 *   topicIds     ← nomes de tópicos do pacote citados no texto
 *   approachIds  ← nomes de abordagens editoriais citados no texto
 *
 * Só preenche campos VAZIOS; grava `relationStatus: 'auto'` quando inseriu algo.
 * Matching conservador: nome completo com fronteira de palavra no texto
 * normalizado; autores exigem ≥ 2 tokens ou sobrenome único (≥ 5 chars,
 * sem homônimos entre os curados). Tópicos exigem ≥ 2 tokens ou ≥ 8 chars.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import path from 'path';
import {
  ROOT,
  EDITORIAL_DIR,
  loadConceptFiles,
  loadTopics,
  loadTechniques,
  normalize,
} from './temple-lib.mjs';

const MAX_AUTHORS = 12;
const MAX_TOPICS = 10;
const MAX_APPROACHES = 4;

function buildCorpus(concept) {
  const parts = [concept.name ?? '', concept.definition ?? '', concept.detailMarkdown ?? ''];
  for (const v of Object.values(concept.sections ?? {})) {
    if (typeof v === 'string') parts.push(v);
  }
  parts.push(...(concept.tags ?? []));
  return normalize(parts.join(' \n '));
}

function hasWord(text, term) {
  const re = new RegExp(`(^| )${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`, 'i');
  return re.test(text);
}

function main() {
  const authors = JSON.parse(readFileSync(path.join(EDITORIAL_DIR, 'authors.json'), 'utf8'));
  const registry = JSON.parse(
    readFileSync(path.join(EDITORIAL_DIR, 'approachRegistry.json'), 'utf8')
  );
  const topics = loadTopics();
  const concepts = loadConceptFiles();

  // blocklist p/ matching de autores: nomes que na verdade são conceitos/técnicas.
  // Nomes que também pertencem a autores curados (ex.: "winnicott" é tópico E autor)
  // continuam liberados.
  const curatedNames = new Set(
    authors.authors
      .filter((a) => a.kind === 'person' || a.kind === 'institution')
      .flatMap((a) => [normalize(a.name)])
  );
  const notAnAuthor = new Set();
  for (const { data } of concepts) {
    notAnAuthor.add(normalize(data.name));
    notAnAuthor.add(normalize(String(data.name ?? '').replace(/^(o|a|os|as)\s+/i, '')));
  }
  const techniques = loadTechniques().techniques;
  for (const t of techniques) {
    notAnAuthor.add(normalize(t.nome ?? ''));
    notAnAuthor.add(normalize(t.canonicalKey ?? ''));
  }
  for (const n of [...notAnAuthor]) if (curatedNames.has(n)) notAnAuthor.delete(n);

  // índices de matching
  const matchableAuthors = authors.authors
    .filter((a) => a.kind === 'person' || a.kind === 'institution')
    .filter((a) => !notAnAuthor.has(normalize(a.name)))
    .map((a) => {
      const n = normalize(a.name);
      return { id: a.id, norm: n, toks: n.split(' '), questionCount: a.questionCount ?? 0 };
    })
    // só entra no matching quem foi citado em questões (elimina lixo editorial
    // tipo "traços"/"observação"); sobrenome solto exige ainda ≥ 5 chars
    .filter((a) => a.questionCount >= 2 && (a.toks.length >= 2 || a.norm.length >= 5));

  const surnameCount = new Map();
  for (const a of matchableAuthors) {
    const last = a.toks[a.toks.length - 1];
    if (last.length >= 5) surnameCount.set(last, (surnameCount.get(last) ?? 0) + 1);
  }

  /** remove matches cujos tokens são subconjunto de outro match ("freud" ⊂ "sigmund freud") */
  function dedupeSubset(found) {
    return found.filter((a) =>
      !found.some(
        (b) => b !== a && b.toks.length > a.toks.length && a.toks.every((t) => b.toks.includes(t))
      )
    );
  }

  const matchableTopics = topics
    .map((t) => ({ id: t.id, norm: normalize(t.name) }))
    .filter((t) => {
      const toks = t.norm.split(' ');
      return toks.length >= 2 || t.norm.length >= 8;
    });

  const editorialNames = registry.entries
    .filter((e) => e.system === 'editorial')
    .map((e) => ({ id: e.id, norm: normalize(e.name), toks: e.name ? normalize(e.name).split(' ') : [] }))
    .filter((e) => e.toks.length >= 2);

  let touched = 0;
  let addedAuthors = 0;
  let addedTopics = 0;
  let addedApproaches = 0;

  for (const { file, data } of concepts) {
    const corpus = buildCorpus(data);
    let changed = false;

    if ((data.authorIds ?? []).length === 0) {
      const found = [];
      for (const a of matchableAuthors) {
        const full = a.toks.join(' ');
        let hit = false;
        if (hasWord(corpus, full)) hit = true;
        else if (a.toks.length === 1 && a.norm.length >= 5 && (surnameCount.get(a.norm) ?? 0) === 1) {
          hit = hasWord(corpus, a.norm); // sobrenome único
        }
        if (hit) found.push(a);
        if (found.length >= MAX_AUTHORS + 8) break;
      }
      const deduped = dedupeSubset(found).slice(0, MAX_AUTHORS);
      if (deduped.length > 0) {
        data.authorIds = deduped.map((a) => a.id);
        changed = true;
        addedAuthors += deduped.length;
      }
    }

    if ((data.topicIds ?? []).length === 0) {
      const found = [];
      for (const t of matchableTopics) {
        if (corpus.includes(t.norm)) found.push(t.id);
        if (found.length >= MAX_TOPICS) break;
      }
      if (found.length > 0) {
        data.topicIds = found;
        changed = true;
        addedTopics += found.length;
      }
    }

    if ((data.approachIds ?? []).length === 0) {
      const found = [];
      for (const e of editorialNames) {
        if (hasWord(corpus, e.toks.join(' '))) found.push(e.id);
        if (found.length >= MAX_APPROACHES) break;
      }
      if (found.length > 0) {
        data.approachIds = found;
        changed = true;
        addedApproaches += found.length;
      }
    }

    if (changed) {
      data.relationStatus = 'auto';
      touched++;
      writeFileSync(path.join(ROOT, 'content', 'concepts', file), `${JSON.stringify(data, null, 2)}\n`);
    }
  }

  console.log(
    `[relations] ${touched}/${concepts.length} conceitos atualizados ` +
      `(autores +${addedAuthors} · tópicos +${addedTopics} · abordagens +${addedApproaches})`
  );
}

try {
  main();
} catch (e) {
  console.error('[relations] falhou:', e);
  process.exit(1);
}
