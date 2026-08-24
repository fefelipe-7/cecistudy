/**
 * content:diff — compara o hash atual das fontes com o último build.
 *
 * - `last-build.json` (em content/) guarda o hash do build mais recente.
 * - Se divergir, as fontes mudaram e o `cecistudy_catalog.db` embutido está
 *   desatualizado → sugere re-executar `content:build` e `npm run cap:sync`.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeContentHash } from './content-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAST_BUILD = path.join(__dirname, 'last-build.json');

let last = null;
try {
  last = JSON.parse(readFileSync(LAST_BUILD, 'utf8'));
} catch {
  console.error('[content:diff] sem last-build.json — rode `npm run content:build` primeiro.');
  process.exit(1);
}

const current = computeContentHash();

if (last.contentHash === current) {
  console.log(
    `[content:diff] catálogo em dia (hash ${current.slice(0, 16)}…) — nada a fazer.`
  );
} else {
  console.log('[content:diff] fontes mudaram desde o último build:');
  console.log(`  anterior: ${last.contentHash.slice(0, 16)}…`);
  console.log(`  atual:    ${current.slice(0, 16)}…`);
  console.log('  → rode `npm run content:build` (e `npm run cap:sync` no nativo).');
  process.exit(2);
}