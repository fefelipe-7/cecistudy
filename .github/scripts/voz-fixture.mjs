/**
 * Fixture da regra 4 — a voz **tem** que reprovar (`SPEC-M-003` D4: "o gate tem
 * teste: existe um fixture que prova que cada regra reprova").
 *
 * Este arquivo não é um app. Ele é uma infração de voz real, escrita num
 * arquivo temporário dentro de `src/`, e o gate é rodado contra ele. Um gate que
 * nunca falhou não foi verificado — foi só escrito.
 *
 *   node .github/scripts/voz-fixture.mjs
 *
 * Sai com 0 se o gate **reprovou** cada caso, e com 1 se algum passou. Um script
 * de teste que sai 0 quando tudo está certo é indistinguível de um que não roda.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(process.cwd());
const ALVO = path.join(root, 'src/__voz_fixture__.tsx');
const GATE = path.join(root, '.github/scripts/check-boundaries.mjs');

/** Cada caso é uma infração que a regra **tem** que pegar. */
const CASOS = [
  {
    nome: 'erro inline',
    fonte: `export const A = () => setError('não consegui carregar isso agora');`,
  },
  {
    nome: 'toast inline',
    fonte: `export const B = () => showToast('guardei suas configurações com carinho ♡');`,
  },
  {
    nome: 'confirmação inline',
    fonte: `export const C = () => window.confirm('isso apaga tudo, tem certeza?');`,
  },
  {
    nome: 'estado vazio inline',
    fonte: `export const D = () => <EmptyState description="nenhuma leitura em andamento" />;`,
  },
];

/**
 * Casos que a regra **não** pode pegar — porque estão certos (`D9`, camadas 2 e
 * 3). Um gate que só sabe acusar reprova o app inteiro, e é desligado.
 */
const NAO_DEVE_PEGAR = [
  {
    nome: 'rótulo de campo de catálogo (camada 3)',
    fonte: `export const E = { title: 'Hábitos Atômicos', author: 'James Clear' };`,
  },
  {
    nome: 'rótulo de seção (camada 2)',
    fonte: `export const F = { title: 'técnicas', subtitle: 'o que você pratica' };`,
  },
  {
    nome: 'constante visual sem acento',
    fonte: `export const G = { className: 'bg-ceci-brand-strong text-white' };`,
  },
];

/** O gate, rodado contra um arquivo-plantado. Devolve se ele reprovou. */
function gateReprova(conteudo) {
  fs.writeFileSync(ALVO, conteudo, 'utf-8');
  try {
    execFileSync(process.execPath, [GATE], { cwd: root, stdio: 'pipe' });
    return { reprovou: false, saida: '' };
  } catch (e) {
    return { reprovou: true, saida: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

let falhas = 0;
try {
  console.log('[fixture] casos que a regra DEVE reprovar:');
  for (const caso of CASOS) {
    const { reprovou, saida } = gateReprova(caso.fonte);
    const linha = /\[VOZ\].*:/m.exec(saida)?.[0] ?? '';
    if (reprovou) {
      console.log(`  ok    ${caso.nome.padEnd(28)} ${linha.trim()}`);
    } else {
      console.log(`  FALHA ${caso.nome.padEnd(28)} o gate passou por uma infração real`);
      falhas += 1;
    }
  }

  console.log('[fixture] casos que a regra NÃO pode pegar (código certo):');
  for (const caso of NAO_DEVE_PEGAR) {
    const { reprovou, saida } = gateReprova(caso.fonte);
    if (!reprovou) {
      console.log(`  ok    ${caso.nome}`);
    } else {
      console.log(`  FALHA ${caso.nome.padEnd(28)} o gate acusou código que está certo`);
      console.log(`        ${saida.split('\n').filter(Boolean)[0] ?? ''}`);
      falhas += 1;
    }
  }
} finally {
  fs.rmSync(ALVO, { force: true });
}

console.log(
  falhas === 0
    ? '[fixture] todos os casos behaved como esperado — a regra 4 funciona.'
    : `[fixture] ${falhas} caso(s) errado(s).`,
);
process.exit(falhas === 0 ? 0 : 1);
