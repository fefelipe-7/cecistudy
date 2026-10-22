/**
 * Gera `.github/scripts/voice-allowlist.json` a partir da **medição real**.
 *
 * Uso único e com motivo explícito: criar a baseline da regra 4 (`F4.1`) e, a
 * cada módulo migrado, **rebaixar** a dívida. A partir daí o número só pode
 * cair, e ninguém edita o JSON à mão — quem manda é este comando, senão a
 * allowlist vira licença permanente (`D15`, `D10`).
 *
 *   node .github/scripts/gerar-voice-allowlist.mjs --fase "F5.2 TCC"
 *
 * Migrar uma frase faz o gate reprovar até este comando rodar de novo — e é
 * exatamente isso que impede a contagem de crescer.
 */
import fs from 'node:fs';
import path from 'node:path';

import { infracoesDeVoz, infracoesDeNotificacao, ISENTOS_DE_VOZ, ARQUIVO_DE_NOTIFICACAO } from './voz-gate.mjs';

const root = path.resolve(process.cwd());

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const cheio = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(cheio));
    else if (/\.tsx?$/.test(e.name)) out.push(cheio);
  }
  return out;
}

const contagem = new Map();

for (const file of walk(path.join(root, 'src'))) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (ISENTOS_DE_VOZ.includes(rel)) continue;
  if (rel.includes('__tests__/') || /\.test\.tsx?$/.test(rel)) continue;

  const infracoes = infracoesDeVoz(fs.readFileSync(file, 'utf-8'));
  if (infracoes.length) contagem.set(rel, infracoes.length);
}

// A notificação é medida à parte e somada — o gate faz o mesmo, e as duas
// contagens precisam concordar, senão o gate reprova uma baseline que ele mesmo
// gerou.
const arqNotificacao = path.join(root, ARQUIVO_DE_NOTIFICACAO);
if (fs.existsSync(arqNotificacao)) {
  const n = infracoesDeNotificacao(fs.readFileSync(arqNotificacao, 'utf-8')).length;
  if (n) contagem.set(ARQUIVO_DE_NOTIFICACAO, (contagem.get(ARQUIVO_DE_NOTIFICACAO) ?? 0) + n);
}

const arquivos = [...contagem.keys()].sort();
const total = [...contagem.values()].reduce((s, v) => s + v, 0);
const fase = process.argv.includes('--fase')
  ? process.argv[process.argv.indexOf('--fase') + 1]
  : 'F4.1 baseline';

const destino = path.join(root, '.github/scripts/voice-allowlist.json');
fs.writeFileSync(
  destino,
  JSON.stringify(
    {
      $descricao:
        'Dívida declarada da migração da camada 1 (SPEC-M-018 §11). GERADO por ' +
        'gerar-voice-allowlist.mjs — não editar à mão. O número só pode CAIR.',
      fase,
      linhas: total,
      arquivos: arquivos.length,
      porArquivo: Object.fromEntries(arquivos.map((f) => [f, contagem.get(f)])),
    },
    null,
    2,
  ) + '\n',
  'utf-8',
);

console.log(`[VOZ] baseline "${fase}": ${total} frases em ${arquivos.length} arquivos.`);
console.log(`       escrito em ${path.relative(root, destino)}`);
for (const [f, n] of [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)) {
  console.log(`       ${String(n).padStart(4)}  ${f}`);
}
if (contagem.size > 14) console.log(`       … e mais ${contagem.size - 14} arquivos`);