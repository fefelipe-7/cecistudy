#!/usr/bin/env node

/**
 * Migração editorial v2 das Comparações.
 *
 * O SQL é uma fonte de build MySQL/MariaDB; este script não abre conexão nem
 * executa SQL. Ele parseia o dump, normaliza o conteúdo e pode gravar um
 * snapshot JSON reprodutível para inspeção. O app usa o mesmo normalizador nos
 * builders do facade web e do catálogo SQLite nativo.
 *
 * Uso:
 *   node content/comparations/migrations/import-comparacoes-sql.mjs
 *   node content/comparations/migrations/import-comparacoes-sql.mjs --write
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadComparisonSqlSources } from '../normalizer.mjs';

const migrationsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(migrationsDir, '../../..');
const sqlPath = path.join(migrationsDir, 'comparacoes_seed_completo.sql');
const sourcesPath = path.join(migrationsDir, 'fontes_referencias.json');
const snapshotPath = path.join(projectRoot, 'content/comparations/comparacoes_v2.snapshot.json');

const sql = readFileSync(sqlPath);
const loaded = loadComparisonSqlSources(sqlPath, readFileSync);
const comparisons = loaded.comparacoes;
const axes = comparisons.reduce((total, comparison) => total + comparison.eixos.length, 0);
const responses = comparisons.reduce(
  (total, comparison) => total + comparison.eixos.reduce((axisTotal, axis) => axisTotal + axis.respostas.length, 0),
  0,
);
const evidence = comparisons.reduce((total, comparison) => total + comparison.evidencias.length, 0);
const technique = comparisons.flatMap((comparison) => comparison.itens).find((item) => item.entidadeId === 'tec-psicoeducacao');
const uniqueIds = new Set(comparisons.map((comparison) => comparison.id));
const uniqueSlugs = new Set(comparisons.map((comparison) => comparison.slug));

const failures = [];
if (comparisons.length !== 130) failures.push(`comparações=${comparisons.length} (esperado 130)`);
if (axes !== 1170) failures.push(`eixos=${axes} (esperado 1170)`);
if (responses !== 2700) failures.push(`respostas=${responses} (esperado 2700)`);
if (evidence !== 132) failures.push(`evidências=${evidence} (esperado 132)`);
if (loaded.fontes.length !== 21) failures.push(`fontes=${loaded.fontes.length} (esperado 21)`);
if (uniqueIds.size !== comparisons.length) failures.push('ids de comparação duplicados');
if (uniqueSlugs.size !== comparisons.length) failures.push('slugs de comparação duplicados');
if (!technique) failures.push('item canônico tec-psicoeducacao ausente');
if (!readFileSync(sourcesPath, 'utf8')) failures.push('fontes_referencias.json vazio');

if (failures.length) {
  console.error(`[comparacoes:migration] falhou: ${failures.join('; ')}`);
  process.exitCode = 1;
} else {
  const manifest = {
    migration: '2026-08-27-comparacoes-v2',
    source: 'content/comparations/migrations/comparacoes_seed_completo.sql',
    sourceSha256: createHash('sha256').update(sql).digest('hex'),
    schemaVersion: loaded.schemaVersion,
    counts: { comparacoes: comparisons.length, itens: comparisons.reduce((total, c) => total + c.itens.length, 0), eixos: axes, respostas: responses, evidencias: evidence, fontes: loaded.fontes.length },
    canonicalEntityAdded: 'tec-psicoeducacao',
    idempotent: true,
  };
  if (process.argv.includes('--write')) {
    writeFileSync(snapshotPath, `${JSON.stringify({ ...loaded, migration: manifest }, null, 2)}\n`);
    console.log(`[comparacoes:migration] snapshot escrito em ${path.relative(projectRoot, snapshotPath)}`);
  }
  console.log(JSON.stringify(manifest, null, 2));
}
