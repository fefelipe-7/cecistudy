import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadComparisonSqlSources } from './normalizer.mjs';

const root = path.resolve(new URL('../../', import.meta.url).pathname);
const sqlPath = path.join(root, 'content/comparations/migrations/comparacoes_seed_completo.sql');
const loaded = loadComparisonSqlSources(sqlPath, readFileSync);
const comparisons = loaded.comparacoes;
const axes = comparisons.reduce((total, comparison) => total + (comparison.eixos?.length ?? 0), 0);
const responses = comparisons.reduce(
  (total, comparison) => total + (comparison.eixos ?? []).reduce((axisTotal, axis) => axisTotal + axis.respostas.length, 0),
  0,
);
const evidence = comparisons.reduce((total, comparison) => total + (comparison.evidencias?.length ?? 0), 0);
const technique = comparisons.flatMap((comparison) => comparison.itens).find((item) => item.entidadeId === 'tec-psicoeducacao');

if (comparisons.length !== 130) throw new Error(`comparações: esperado 130, recebido ${comparisons.length}`);
if (axes !== 1170) throw new Error(`eixos: esperado 1170, recebido ${axes}`);
if (responses !== 2700) throw new Error(`respostas: esperado 2700, recebido ${responses}`);
if (evidence !== 132) throw new Error(`evidências: esperado 132, recebido ${evidence}`);
if (!technique) throw new Error('tec-psicoeducacao não foi encontrado nas comparações');
if (loaded.fontes.length !== 21) throw new Error(`fontes: esperado 21, recebido ${loaded.fontes.length}`);

console.log(JSON.stringify({
  comparisons: comparisons.length,
  axes,
  responses,
  evidence,
  sources: loaded.fontes.length,
  technique,
  schemaVersion: loaded.schemaVersion,
}, null, 2));
