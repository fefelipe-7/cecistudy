import React from 'react';
import { MotionConfig } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { BootSplash } from './components/ui/BootSplash';
import { isDesktop } from './lib/platform';
import { preloadScreenChunks } from './shells/ScreenLayers';

import { MobileAppShell } from './shells/MobileAppShell';
import { DesktopAppShell } from './shells/DesktopAppShell';

/**
 * Raiz fina: escolhe a casca pela PLATAFORMA (não por breakpoint).
 * - MobileAppShell → web responsiva + nativo Capacitor (Android/iOS)
 * - DesktopAppShell → app desktop Tauri (sidebar, topbar, master-detail)
 * Ambas consomem o mesmo estado/navegação do AppContext.
 */
const Shell = isDesktop ? DesktopAppShell : MobileAppShell;

export default function App() {
  // Pré-carga dos chunks de tela no primeiro idle: as transições animam
  // conteúdo real, nunca skeleton (ver ScreenLayers.preloadScreenChunks).
  React.useEffect(() => {
    preloadScreenChunks();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <AppProvider>
          <BootSplash />
          <Shell />
        </AppProvider>
      </ErrorBoundary>
    </MotionConfig>
  );
}
