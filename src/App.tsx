import React from 'react';
import { MotionConfig } from 'framer-motion';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { BootSplash } from './components/ui/BootSplash';
import { preloadScreenChunks } from './shells/SharedScreenLayers';

import { MobileAppShell } from './shells/MobileAppShell';
import { MobileOverlays } from './overlays/MobileOverlays';
import { MobileAppProvider } from '../apps/mobile/src/MobileAppProvider';

/**
 * Raiz da experiência web (PWA responsiva + nativo Capacitor Android/iOS).
 * É mobile-first e NÃO faz branch por `isDesktop` (Fase 9): a casca desktop tem
 * seu próprio entrypoint nativo em `apps/desktop/src/app/main.tsx`, então o preview
 * `?platform=desktop` na web foi substituído pelo bundle nativo desktop. `isDesktop`
 * permanece definido em `src/lib/platform.ts` para UI pontual (ex.: PerfilView).
 */
export default function App() {
  // Pré-carga dos chunks de tela no primeiro idle: as transições animam
  // conteúdo real, nunca skeleton (ver SharedScreenLayers.preloadScreenChunks).
  React.useEffect(() => {
    preloadScreenChunks();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <MobileAppProvider>
          <BootSplash />
          <MobileAppShell />
          <MobileOverlays />
        </MobileAppProvider>
      </ErrorBoundary>
    </MotionConfig>
  );
}
