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
 * É mobile-first: web e nativo compartilham a mesma casca `MobileAppShell`.
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
