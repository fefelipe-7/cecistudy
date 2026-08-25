/**
 * A2 — Dedup conservador dos autores do pacote (`content/editorial/authors.json`).
 *
 * Entrada: 834 arquivos brutos {id,name,status} em content/catalogo/.../authors/.
 * Regras (decisões #4 e #5 do plano):
 *   - nomes com ';' são separados em autores individuais antes do agrupamento;
 *   - merge só de variantes óbvias: mesmo nome normalizado; sobrenome solto
 *     contido em composto cujos extras são iniciais ou 1 token ("freud" ⊂
 *     "sigmund freud"); composto ⊂ composto por subsequência com extras
 *     iniciais ou 1 token ("aaron beck" ⊂ "aaron t beck");
 *   - classifica kind: person | institution | topic-like;
 *   - placeholders de autoria autoral ("equipe de elaboração" etc.) ficam fora;
 *   - todos os válidos pós-dedup entram (sem corte por citações);
 *   - conta questões por autor (via authorIds das questões do pacote).
 *
 * Saída: { schemaVersion, generatedAt, authors[], excluded[], resolve{} }.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'path';
import {
  EDITORIAL_DIR,
  loadRawAuthors,
  loadAllQuestions,
  normalize,
  writeJsonPretty,
} from './temple-lib.mjs';

const INSTITUTION_RE =
  /(conselho|universidade|universidad|ministerio|associacao|federacao|sociedade|instituto|organizacao|coordenacao|secretaria|departamento|fundacao|academia|hospital|clinica escola|abp\b|\boms\b|opas|\blei\b|\bleis\b|codigo|resolucao|decreto|senado|congresso|camara|governo|policia|tribunal)/;

/** Tópicos genéricos demais p/ virarem autor (pseudo-autores do pacote). */
const TOPIC_LIKE = new Set([
  'memoria',
  'linguagem',
  'neuropsicologia',
  'psicometria',
  'etica',
  'desenvolvimento humano',
  'psicologia social',
  'saude mental',
  'psicopatologia',
  'personalidade',
  'percepcao',
  'atencao',
  'aprendizagem',
  'motivacao',
  'emocao',
  'consciencia',
  'inconsciente',
  'inteligencia',
  'crianca',
  'adolescente',
  'idoso',
  'familia',
  'grupo',
  'trabalho',
]);

/** Autores-placeholder da autoria autoral — não são pessoas reais. */
const PLACEHOLDER_RE =
  /^(autora?s?\b.*|autoria propria|autoria desconhecida|autor desconhecido|equipe\b.*|elaborado por.*|lote .*)$/;

const tokensOf = (name) => normalize(name).split(' ').filter(Boolean);

/** Variações normalizadas de um nome bruto (split em ';' + inversão "Sobrenome, X."). */
function nameVariants(rawName) {
  const variants = new Set();
  for (const part0 of String(rawName ?? '').split(';')) {
    const part = part0.trim();
    if (!part) continue;
    const n = normalize(part);
    if (!n) continue;
    variants.add(n);
    if (part.includes(',')) {
      const [last, ...rest] = part.split(',').map((s) => s.trim());
      const inv = normalize([...rest, last].filter(Boolean).join(' '));
      if (inv) variants.add(inv);
    }
  }
  return [...variants];
}

/** Todos os tokens extras de B além dos de A são iniciais (1 letra)? */
function extrasAllInitials(A, B) {
  return B.every((t) => A.includes(t) || t.length === 1);
}

/** A é subsequência de B (tokens na ordem). */
function isSubsequence(A, B) {
  let i = 0;
  for (const t of B) {
    if (t === A[i]) i++;
    if (i === A.length) return true;
  }
  return i === A.length;
}

function classifyKind(name) {
  const n = normalize(name);
  if (PLACEHOLDER_RE.test(n)) return 'placeholder';
  if (TOPIC_LIKE.has(n)) return 'topic-like';
  if (INSTITUTION_RE.test(n)) return 'institution';
  return 'person';
}

function pickCanonicalName(names) {
  // prefere o nome mais completo (mais tokens); empate → alfabético (determinístico)
  return [...new Set(names)].sort(
    (a, b) => tokensOf(b).length - tokensOf(a).length || a.localeCompare(b)
  )[0];
}

function slugify(s) {
  return normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function main() {
  const questions = loadAllQuestions();

  // ---- expansão: nomes compostos (';' ) viram partes individuais ----
  /** parts: {sourceId, rawName} */
  const parts = [];
  for (const a of loadRawAuthors()) {
    const pieces = String(a.name ?? '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const piece of pieces) parts.push({ sourceId: a.id, rawName: piece });
  }

  // ---- citações brutas por sourceId ----
  const rawCounts = new Map();
  for (const q of questions) {
    for (const id of q.authorIds ?? []) {
      rawCounts.set(id, (rawCounts.get(id) ?? 0) + 1);
    }
  }

  // ---- agrupamento por variante exata ----
  const groups = []; // {key, names:[], memberIdx:[]}
  const byVariant = new Map(); // variant -> groupKey
  const groupOfPart = [];

  for (const p of parts) {
    const variants = nameVariants(p.rawName);
    let key = null;
    for (const v of variants) {
      if (byVariant.has(v)) {
        key = byVariant.get(v);
        break;
      }
    }
    if (key === null) {
      key = variants[0];
      groups.push({ key, names: [], memberIdx: [] });
    }
    const g = groups.find((x) => x.key === key);
    g.names.push(p.rawName);
    g.memberIdx.push(groupOfPart.length);
    for (const v of variants) {
      if (!byVariant.has(v)) byVariant.set(v, key);
      else if (byVariant.get(v) !== key) {
        // colisão rara: mantém 1º grupo (conservador)
        byVariant.set(v, byVariant.get(v));
      }
    }
    groupOfPart.push({ part: p, groupKey: key });
  }

  // ---- merges conservadores entre grupos ----
  const mergedInto = new Map();
  const finalKeyOf = (k) => mergedInto.get(k) ?? k;

  const liveGroups = () => groups.filter((g) => !mergedInto.has(g.key));
  const singles = () => liveGroups().filter((g) => tokensOf(g.key).length === 1);
  const multis = () => liveGroups().filter((g) => tokensOf(g.key).length > 1);

  // 1) sobrenome solto ⊂ composto
  for (const s of singles()) {
    const st = s.key;
    if (st.length < 4) continue; // "lei", "apa"… não mergeia
    const candidates = multis().filter((m) => {
      const mt = m.key.split(' ');
      if (!mt.includes(st)) return false;
      const extras = mt.filter((t) => t !== st);
      return extras.every((t) => t.length === 1) || extras.length === 1;
    });
    if (candidates.length === 0) continue;
    const allInitialsOnly = candidates.every((m) =>
      m.key.split(' ').filter((t) => t !== st).every((t) => t.length === 1)
    );
    // seguros: todos os compostos têm só iniciais além do sobrenome (mesma pessoa
    // com iniciais variadas), ou há exatamente 1 candidato (caso freud ⊂ sigmund freud)
    if (!allInitialsOnly && candidates.length > 1) continue;
    const best = candidates.sort((a, b) => tokensOf(b.key).length - tokensOf(a.key).length)[0];
    mergedInto.set(s.key, best.key);
    if (allInitialsOnly) {
      for (const c of candidates) {
        if (c !== best && !mergedInto.has(c.key)) mergedInto.set(c.key, best.key);
      }
    }
  }

  // 2) composto ⊂ composto: subsequência com extras todos iniciais OU 1 token extra
  let changed = true;
  while (changed) {
    changed = false;
    const ms = multis().sort((a, b) => tokensOf(a.key).length - tokensOf(b.key).length);
    for (const a of ms) {
      if (mergedInto.has(a.key)) continue;
      const at = a.key.split(' ');
      for (const b of ms) {
        if (b === a || mergedInto.has(b.key)) continue;
        const bt = b.key.split(' ');
        if (bt.length <= at.length) continue;
        const extras = bt.filter((t) => !at.includes(t));
        const ok =
          (isSubsequence(at, bt) && extras.every((t) => t.length === 1)) ||
          (isSubsequence(at, bt) && extras.length === 1);
        if (ok) {
          mergedInto.set(a.key, b.key);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  // ---- monta grupos finais ----
  const finals = new Map(); // finalKey -> {names:[], parts:[]}
  for (const [i, { part }] of groupOfPart.entries()) {
    const fk = finalKeyOf(groupOfPart[i].groupKey);
    if (!finals.has(fk)) finals.set(fk, { names: [], parts: [] });
    finals.get(fk).names.push(part.rawName);
    finals.get(fk).parts.push(part);
  }

  // ---- saída ----
  const authors = [];
  const excluded = [];
  const usedIds = new Set();
  for (const entry of finals.values()) {
    const canonicalName = pickCanonicalName(entry.names);
    const kind = classifyKind(canonicalName);
    const sourceIds = [...new Set(entry.parts.map((p) => p.sourceId))];
    let id = `cur-${slugify(canonicalName)}`;
    while (usedIds.has(id)) id += '-x';
    usedIds.add(id);
    const info = {
      id,
      name: canonicalName,
      kind,
      aliases: [...new Set(entry.names)],
      questionCount: sourceIds.reduce((acc, sid) => acc + (rawCounts.get(sid) ?? 0), 0),
      sourceIds,
    };
    if (kind === 'person' || kind === 'institution') {
      authors.push(info);
    } else {
      excluded.push({
        id,
        name: canonicalName,
        reason: kind,
        aliases: info.aliases,
      });
    }
  }

  authors.sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name));

  const resolve = {};
  for (const a of authors) {
    resolve[a.id] = a.id;
    for (const alias of a.aliases) resolve[normalize(alias)] = a.id;
    for (const sid of a.sourceIds) resolve[sid] = a.id;
  }
  for (const e of excluded) {
    for (const sid of e.id.split('-').length ? [] : []) void sid;
  }

  const out = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    stats: {
      rawFiles: loadRawAuthors().length,
      partsAfterSplit: parts.length,
      curated: authors.length,
      persons: authors.filter((a) => a.kind === 'person').length,
      institutions: authors.filter((a) => a.kind === 'institution').length,
      excludedTopicLike: excluded.length,
      questionsWithAuthor: questions.filter((q) => (q.authorIds ?? []).length > 0).length,
    },
    authors,
    excluded,
    resolve,
  };

  mkdirSync(EDITORIAL_DIR, { recursive: true });
  writeFileSync(path.join(EDITORIAL_DIR, 'authors.json'), writeJsonPretty('authors.json', out));

  console.log(
    `[authors] ${out.stats.rawFiles} arquivos → ${parts.length} partes → ${out.stats.curated} curados ` +
      `(${out.stats.persons} pessoas · ${out.stats.institutions} instituições · ${excluded.length} excluídos)`
  );
}

try {
  main();
} catch (e) {
  console.error('[authors] falhou:', e);
  process.exit(1);
}
