/**
 * tokens-sync.mjs — o gate da D1.
 *
 * A D1 diz que `src/tokens/palette.js` e uma **ponte**, nao uma fonte. Isso so
 * vale enquanto a ponte aponta para o mesmo lugar. Este script compara as
 * cores semanticas do laboratorio com o bloco `@theme` do app web e falha se
 * elas divergirem sem declaration.
 *
 * Por que isto importa: sem ele, `palette.js` envelhece em silencio e vira a
 * segunda fonte da verdade que a D1 diz nao existir — exatamente o debito C10
 * (`packages/design-tokens`, copia morta e divergente em 12 de 19 cores).
 *
 * Uso: node scripts/tokens-sync.mjs [--fix]
 * Saida: 0 = ponte intacta, 1 = drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require_ = createRequire(import.meta.url);

/** O que o gate compara: tokens semanticos, nao as 7 paletas de 50 tons. */
const SEMANTIC = {
  canvas: ['--color-canvas'],
  'surface.default': ['--color-surface-default'],
  'surface.subtle': ['--color-surface-subtle'],
  'surface.muted': ['--color-surface-muted'],
  'surface.rose': ['--color-surface-rose'],
  'surface.blue': ['--color-surface-blue'],
  'surface.input': ['--color-surface-input'],
  'surface.warm': ['--color-surface-warm'],
  'ceci.primary': ['--color-ceci-primary'],
  'ceci.secondary': ['--color-ceci-secondary'],
  'ceci.tertiary': ['--color-ceci-tertiary'],
  'ceci.muted': ['--color-ceci-muted'],
  'ceci.faded': ['--color-ceci-faded'],
  'ceci.ink': ['--color-ceci-ink'],
  'ceci.text-soft': ['--color-ceci-text-soft'],
  'ceci.brand': ['--color-ceci-brand'],
  'ceci.brand-strong': ['--color-ceci-brand-strong'],
  'ceci.brand-soft': ['--color-ceci-brand-soft'],
  'ceci.brand-hover': ['--color-ceci-brand-hover'],
  'ceci.academic': ['--color-ceci-academic'],
  'ceci.academic-strong': ['--color-ceci-academic-strong'],
  'border.subtle': ['--color-ceci-border-subtle'],
  'border.default': ['--color-ceci-border-default'],
  'border.strong': ['--color-ceci-border-strong'],
  'border.brand': ['--color-ceci-border-brand'],
  'border.academic': ['--color-ceci-border-academic'],
};

const DRIFT_ALLOWLIST = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/tokens-drift.json'), 'utf-8'),
);

/**
 * O `index.css` vive dois niveis acima: `apps/rn-expo/scripts` -> `apps/rn-expo`
 * -> `apps` -> raiz do app mobile. O `..` a mais nao e exagero, e o caminho
 * certo — e o erro que este gate acusaria primeiro se estivesse errado.
 */
function readCssTokens() {
  const css = fs.readFileSync(path.join(root, '..', '..', 'src', 'index.css'), 'utf-8');
  const out = new Map();
  const re = /(--color-[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css)) !== null) out.set(m[1], m[2].trim());
  return out;
}

function readPalette() {
  const p = require_('../src/tokens/palette.js');
  const flat = new Map();
  /** `DEFAULT` no objeto JS tem que virar `default` no nome do token. */
  const norm = (k) => (k === 'DEFAULT' ? 'default' : k);
  const push = (prefix, obj) => {
    for (const [k, v] of Object.entries(obj)) flat.set(`${prefix}.${norm(k)}`, v);
  };
  push('surface', p.surface);
  push('ceci', p.ceci);
  push('border', p.border);
  flat.set('canvas', p.canvas);
  return flat;
}

const cssTokens = readCssTokens();
const palette = readPalette();

const drift = [];

for (const [name, cssVars] of Object.entries(SEMANTIC)) {
  for (const cssVar of cssVars) {
    const inCss = cssTokens.get(cssVar);
    const inPalette = palette.get(name);

    if (inCss === undefined) {
      drift.push({ token: name, cssVar, reason: `nao existe no index.css` });
      continue;
    }
    if (inPalette === undefined) {
      drift.push({ token: name, cssVar, reason: `nao existe no palette.js` });
      continue;
    }
    const a = inCss.toUpperCase();
    const b = String(inPalette).toUpperCase();
    if (a !== b && !DRIFT_ALLOWLIST.declarados.includes(name)) {
      drift.push({ token: name, cssVar, css: inCss, palette: inPalette, reason: 'valores divergem' });
    }
  }
}

if (!drift.length) {
  console.log(`OK: ponte intacta — ${Object.keys(SEMANTIC).length} tokens semanticos conferem com src/index.css.`);
  process.exit(0);
}

for (const d of drift) {
  console.error(`[TOKENS] ${d.token} (${d.cssVar}): ${d.reason}${d.css ? ` — index.css=${d.css} palette=${d.palette}` : ''}`);
}
console.error(
  '\nO laboratorio espelha o design do app. Se o index.css mudou de proposito, replica\n' +
    'no palette.js. Se a divergencia e temporanea, declara em scripts/tokens-drift.json\n' +
    '`declarados` — com o motivo. Allowlist que cresce sem motivo e a D7 da SPEC-C-013\n' +
    'morrendo de novo (SPEC-015 D1).',
);
process.exit(1);