/**
 * Falha o CI se encontrar importações que violam as fronteiras de separação
 * mobile/desktop/packages. Regras:
 *
 * 1. apps/mobile nunca importa apps/desktop, e vice-versa.
 * 2. packages/* nunca importa react/ui de cliente, @capacitor/* ou __TAURI__.
 * 3. A camada mobile (apps/mobile, src/App.tsx, src/shells/MobileAppShell,
 *    src/shells/SharedScreenLayers, src/overlays/MobileOverlays) NUNCA importa
 *    estaticamente código desktop (src/desktop, apps/desktop, desktopApp,
 *    desktop-tokens). Import dinâmico (import('...')) é permitido — vira chunk
 *    separado e não entra no bundle mobile.
 * 4. A camada desktop (apps/desktop, src/desktop, src/shells/DesktopAppShell,
 *    src/overlays/DesktopOverlays) NUNCA importa estaticamente a UI mobile
 *    (views de src/components/views, BottomNav, EdgeSwipeBack, SlideScreen,
 *    useMobileApp, MobileAppShell, src/App.tsx, apps/mobile).
 *
 * Uso: node .github/scripts/check-boundaries.mjs
 * Saída: 0 = ok, 1 = violação encontrada.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());

/**
 * Extrai os específicos de import ESTÁTICO (ignora `import('...')` dinâmico,
 * que vira chunk separado e não viola a fronteira de bundle).
 */
function staticImportSpecifiers(content) {
  const specs = [];
  const re = /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    specs.push(m[1]);
  }
  return specs;
}

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

function resolveTargets(targets) {
  const files = [];
  const seen = new Set();
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

const checks = [
  {
    name: 'mobile → desktop (proibido, estático)',
    targets: [
      'apps/mobile',
      'src/App.tsx',
      'src/shells/MobileAppShell.tsx',
      'src/shells/SharedScreenLayers.tsx',
      'src/overlays/MobileOverlays.tsx',
      'src/overlays/OverlaysContent.tsx',
    ],
    excludeTests: true,
    forbiddenSpecifiers: [
      'src/desktop',
      '../desktop',
      'apps/desktop',
      'desktop-tokens',
      'desktopApp',
      'KnowledgeGraphScreen',
      'ProjectsScreen',
      'InboxScreen',
    ],
  },
  {
    name: 'desktop → mobile (proibido, estático)',
    targets: [
      'apps/desktop',
      'src/desktop',
      'src/shells/DesktopAppShell.tsx',
      'src/overlays/DesktopOverlays.tsx',
      'src/overlays/OverlaysContent.tsx',
    ],
    excludeTests: true,
    forbiddenSpecifiers: [
      'src/components/views/',
      'BottomNav',
      'EdgeSwipeBack',
      'SlideScreen',
      'useMobileApp',
      'MobileAppShell',
      'src/App.tsx',
      'apps/mobile',
    ],
  },
  {
    // spec 06 (B6/B7): a camada compartilhada src/lib não pode puxar o estado
    // visual de sessão desktop (dono em apps/desktop) nem o provider desktop.
    // Testes em src/lib/__tests__ são isentos (importam providers cruzados p/ validar).
    name: 'src/lib não deve importar apps/desktop estaticamente',
    targets: ['src/lib'],
    excludeTests: true,
    forbiddenSpecifiers: ['apps/desktop', 'desktopSessionState', 'DesktopAppProvider', 'useDesktopSession'],
  },
  {
    name: 'packages/domain toca em UI/plataforma',
    targets: ['packages/domain'],
    forbiddenContent: ['from "react"', "from 'react'", '@capacitor/', '__TAURI__', 'window.__TAURI'],
  },
  {
    name: 'packages/sync toca em UI/plataforma',
    targets: ['packages/sync'],
    forbiddenContent: ['from "react"', "from 'react'", '@capacitor/', '__TAURI__', 'window.__TAURI'],
  },
  {
    name: 'packages/data toca em UI/plataforma',
    targets: ['packages/data'],
    forbiddenContent: ['from "react"', "from 'react'", '@capacitor/', '__TAURI__', 'window.__TAURI'],
  },
  {
    name: 'packages/application toca em UI/plataforma',
    targets: ['packages/application'],
    forbiddenContent: ['from "react"', "from 'react'", '@capacitor/', '__TAURI__', 'window.__TAURI'],
  },
  {
    name: 'packages/contracts toca em UI/plataforma',
    targets: ['packages/contracts'],
    forbiddenContent: ['from "react"', "from 'react'", '@capacitor/', '__TAURI__', 'window.__TAURI'],
  },
  {
    name: 'packages/design-tokens toca em UI/plataforma',
    targets: ['packages/design-tokens'],
    forbiddenContent: ['from "react"', "from 'react'", '@capacitor/', '__TAURI__', 'window.__TAURI'],
  },
  {
    name: 'packages/navigation toca em UI/plataforma',
    targets: ['packages/navigation'],
    forbiddenContent: ['from "react"', "from 'react'", '@capacitor/', '__TAURI__', 'window.__TAURI'],
  },
  {
    // spec 07 Phase 5 (T6a): só `packages/navigation` CONHECE (declara)
    // NavScreen/derivação — tipos puros da pilha. Stubs compat (`src/lib/routing`,
    // `src/types/navigation`) re-exportam de lá; declará-los fora quebra a fronteira.
    name: 'tipos de navegação declarados fora de packages/navigation',
    targets: ['src', 'apps'],
    forbiddenContent: [
      'export type NavTab =',
      'export type SubTabFaculdade',
      'export type SubTabBiblioteca',
      'export type NavScreen',
      'export type StudyScreen',
    ],
  },
  {
    // spec 07 Phase 5 (T6c): independência dos motores de navegação por casca.
    // Os arquivos de motor (`apps/mobile/src/mobileNavigation.ts` e
    // `apps/desktop/src/desktopNavigation.ts`) re-exportam só do engine puro
    // (`src/context/navigationEngine`) e NUNCA puxam o estado/UI da outra casca.
    // (O grosso de B3/B4 já é coberto pelas regras 1/3/4 acima — aqui garantimos
    //  que o mobile não puxa sessão/runtime desktop e vice-versa, mesmo via alias.)
    name: 'independência dos motores mobile/desktop (spec 07 T6c)',
    targets: [
      'apps/mobile/src/mobileNavigation.ts',
      'apps/desktop/src/desktopNavigation.ts',
      'src/context/navigationEngine.ts',
    ],
    forbiddenSpecifiers: [
      'desktopSessionState',
      'apps/desktop',
      'apps/mobile',
      'DesktopAppProvider',
      'MobileAppProvider',
    ],
  },
  {
    name: 'shared UI não deve branchar por plataforma (isDesktop/isMobile/Capacitor/TAURI)',
    targets: [
      'src/components',
      'src/shells/SharedScreenLayers.tsx',
      'src/overlays/MobileOverlays.tsx',
      'src/overlays/DesktopOverlays.tsx',
      'src/overlays/OverlaysContent.tsx',
    ],
    forbiddenContent: ['isDesktop', 'isMobile', 'Capacitor.isNativePlatform', '__TAURI__', 'window.__TAURI__'],
  },
];

let failed = false;

for (const check of checks) {
  const files = resolveTargets(check.targets);
  for (const file of files) {
    if (check.excludeTests && /[\\/]__tests__[\\/]/.test(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');

    if (check.forbiddenSpecifiers) {
      const specs = staticImportSpecifiers(content);
      for (const spec of specs) {
        for (const forb of check.forbiddenSpecifiers) {
          if (spec.includes(forb)) {
            console.error(
              `[BOUNDARY] ${check.name}: "${forb}" em import estático "${spec}" (${path.relative(root, file)})`,
            );
            failed = true;
          }
        }
      }
    }

    if (check.forbiddenContent) {
      for (const pat of check.forbiddenContent) {
        if (content.includes(pat)) {
          console.error(`[BOUNDARY] ${check.name}: "${pat}" encontrado em ${path.relative(root, file)}`);
          failed = true;
        }
      }
    }
  }
}

if (failed) {
  console.error('\nFalha: fronteira violada. Veja os detalhes acima.');
  process.exit(1);
} else {
  console.log('OK: fronteiras respeitadas.');
  process.exit(0);
}
