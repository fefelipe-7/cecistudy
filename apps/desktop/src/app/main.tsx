import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/dm-serif-display/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import { MotionConfig } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BootSplash } from '@/components/ui/BootSplash';
import { DesktopAppShell } from '@/shells/DesktopAppShell';
import { DesktopOverlays } from '@/overlays/DesktopOverlays';
import { DesktopAppProvider } from '../DesktopAppProvider';
import { initPlatformFlags } from '@/lib/platform';
import { preloadScreenChunks } from '@/shells/SharedScreenLayers';
import '@/index.css';
import '@/desktop/styles/desktop-tokens.css';

initPlatformFlags();
preloadScreenChunks();

/**
 * Entrypoint próprio do cliente desktop (Fase 6).
 * Renderiza `DesktopAppShell` direto — sem o branch `isDesktop` do `src/App.tsx`.
 * O estado/navegação vêm do `DesktopAppProvider` (casca desktop, spec 07).
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <DesktopAppProvider>
          <BootSplash />
          <DesktopAppShell />
          <DesktopOverlays />
        </DesktopAppProvider>
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>,
);
