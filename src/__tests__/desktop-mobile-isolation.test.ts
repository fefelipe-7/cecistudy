/**
 * Garante no nível de teste que a camada mobile não importa estaticamente
 * código desktop, e que a camada desktop não importa estaticamente a UI mobile.
 * Espelha a validação do CI (check-boundaries.mjs) mas falha o `npm run test`.
 *
 * Import dinâmico (import('...')) é permitido: vira chunk separado e não entra
 * no bundle mobile. Por isso inspecionamos só importações estáticas.
 * Testes (pastas `__tests__`) são isentos, como no script do CI (`excludeTests`):
 * validam invariantes importando providers cruzados (ex.: nav-independence).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function staticImportSpecifiers(content: string): string[] {
  const specs: string[] = [];
  const re = /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    specs.push(m[1]);
  }
  return specs;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function resolveTargets(targets: string[]): string[] {
  const files: string[] = [];
  const seen = new Set<string>();
  for (const t of targets) {
    const abs = path.join(root, t);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    const found = stat.isDirectory() ? walk(abs) : [abs];
    for (const f of found) {
      const rel = path.relative(root, f);
      if (!seen.has(rel)) {
        seen.add(rel);
        files.push(f);
      }
    }
  }
  return files;
}

const mobileTargets = [
  'apps/mobile',
  'src/App.tsx',
  'src/shells/MobileAppShell.tsx',
  'src/shells/SharedScreenLayers.tsx',
  'src/overlays/MobileOverlays.tsx',
  'src/overlays/OverlaysContent.tsx',
];
const mobileForbidden = [
  'src/desktop',
  '../desktop',
  'apps/desktop',
  'desktop-tokens',
  'desktopApp',
];

const desktopTargets = [
  'apps/desktop',
  'src/desktop',
  'src/shells/DesktopAppShell.tsx',
  'src/overlays/DesktopOverlays.tsx',
  'src/overlays/OverlaysContent.tsx',
];
const desktopForbidden = [
  'src/components/views/',
  'BottomNav',
  'EdgeSwipeBack',
  'SlideScreen',
  'useMobileApp',
  'MobileAppShell',
  'src/App.tsx',
  'apps/mobile',
];

function violationsFor(targets: string[], forbidden: string[]): string[] {
  const violations: string[] = [];
  for (const file of resolveTargets(targets)) {
    if (/[\\/]__tests__[\\/]/.test(file)) continue;
    const specs = staticImportSpecifiers(fs.readFileSync(file, 'utf-8'));
    for (const spec of specs) {
      for (const forb of forbidden) {
        if (spec.includes(forb)) {
          violations.push(`${path.relative(root, file)}: import estático "${spec}" (proibido: ${forb})`);
        }
      }
    }
  }
  return violations;
}

describe('isolamento mobile ↔ desktop (imports estáticos)', () => {
  it('mobile não importa estaticamente código desktop', () => {
    const violations = violationsFor(mobileTargets, mobileForbidden);
    expect(violations).toEqual([]);
  });

  it('desktop não importa estaticamente a UI mobile', () => {
    const violations = violationsFor(desktopTargets, desktopForbidden);
    expect(violations).toEqual([]);
  });
});
