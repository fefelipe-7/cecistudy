/**
 * classes-check.mjs — o gate "toda classe compila".
 *
 * Um className que o Tailwind não conhece não é erro de build: é silêncio. A
 * classe gera nada, o elemento renderiza sem a propriedade, e o bug só aparece
 * no aparelho — foi assim que `bg-surface-default` e `border-border-default`
 * viraram dois botões transparentes nesta revisão (a chave `DEFAULT` do
 * Tailwind mapeia para a classe base, não para `*-default`).
 *
 * O que este gate faz:
 *   1. extrai todo className estático de `src/**` (literal e template literal);
 *   2. compila o CSS real pelo próprio Tailwind com o mesmo tailwind.config;
 *   3. falha listando as classes que produzem nada.
 *
 * Limite conhecido (declarado, não escondido): classes MONTADAS em runtime por
 * interpolação fora de literal (`className={`base-${props.x}`}`) não são
 * visíveis aqui — este arquivo exclui tokens com `${` para não acusar falso
 * positivo. Se um dia houver classe dinâmica de verdade nas telas, o gate
 * precisa de um allowlist declarado, nunca de silêncio.
 *
 * Uso: node scripts/classes-check.mjs
 * Saída: 0 = todas compilam · 1 = classes mortas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

/* ── 1. extrair classNames ─────────────────────────────────────────────── */

function collectSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = collectSourceFiles(path.join(root, 'src'));
const classes = new Set();
const classNamesByFile = new Map();

// `className="a b c"` e `className={`a ${x} b`}` — os dois casos que as telas usam.
const RE = /className=(\{?["'`])([^"'`]+)\1}?/g;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf-8');
  const local = [];
  let m;
  while ((m = RE.exec(text)) !== null) {
    for (const token of m[2].split(/\s+/)) {
      if (!token || token.includes('${')) continue;
      classes.add(token);
      local.push(token);
    }
  }
  if (local.length) classNamesByFile.set(path.relative(root, file), local);
}

if (classes.size === 0) {
  console.error('[CLASSES] nenhum className encontrado — o extractor quebrou, não as telas.');
  process.exit(1);
}

/* ── 2. compilar o CSS real ────────────────────────────────────────────── */

const tmpCss = path.join(root, '.classes-check.tmp.css');
const inputCss = `${'@tailwind base;\n@tailwind components;\n@tailwind utilities;\n'}`;

fs.writeFileSync(tmpCss, inputCss, 'utf-8');
try {
  execFileSync(
    process.execPath,
    [
      path.join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js'),
      '-c', 'tailwind.config.js',
      '-i', path.basename(tmpCss),
      '-o', path.basename(tmpCss) + '.out',
    ],
    { cwd: root, stdio: 'pipe' },
  );
} catch (err) {
  fs.rmSync(tmpCss, { force: true });
  console.error('[CLASSES] o próprio Compilador do Tailwind falhou — conserte o tailwind.config antes deste gate:');
  console.error(err.stderr?.toString() ?? err.message);
  process.exit(1);
}

const compiled = fs.readFileSync(tmpCss + '.out', 'utf-8');
fs.rmSync(tmpCss, { force: true });
fs.rmSync(tmpCss + '.out', { force: true });

/* ── 3. conferir classe por classe ─────────────────────────────────────── */

/**
 * Escapa o que o CSS網 escapeia no seletor (`.` → `\.`, `[` → `\[`...).
 * As classes contêm exatamente os caracteres que o Tailwind gera, então a
 * comparação é na forma escapada do arquivo, não na cantada do JSX.
 */
const escapeSelector = (token) => token.replace(/[.:[\]()#%>'"*]/g, (c) => `\\${c}`);

const missing = [];
for (const token of [...classes].sort()) {
  const selector = '.' + escapeSelector(token);
  if (!compiled.includes(selector)) missing.push(token);
}

if (missing.length === 0) {
  console.log(`OK: ${classes.size} classes distintas de ${classNamesByFile.size} arquivos — todas compilam pelo tailwind.config.`);
  process.exit(0);
}

const where = new Map();
for (const token of missing) {
  for (const [file, tokens] of classNamesByFile) {
    if (tokens.includes(token)) where.set(token, file);
  }
}

console.error('[CLASSES] estas classes NÃO compilam pelo tailwind.config.js — o elemento renderiza sem estilo:');
for (const token of missing) {
  console.error(`  ${token}  → primeiro uso: ${where.get(token) ?? '?'}`);
}
console.error(
  '\nGeralmente é um destes três: chave DEFAULT sem alias `default`, token fora da escala\n' +
    'de `palette.js`, ou grafia de família de fonte que o `@expo-google-fonts` não exporta.\n' +
    'Se a classe MONTAR em runtime de propósito, declare-a em `scripts/classes-allowlist.json`.',
);
process.exit(1);
