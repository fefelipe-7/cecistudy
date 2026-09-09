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
import { MobileAppShell } from '@/shells/MobileAppShell';
import { MobileOverlays } from '@/overlays/MobileOverlays';
import { MobileAppProvider } from '../MobileAppProvider';
import { initPlatformFlags } from '@/lib/platform';
import { prefetchViewChunks } from '@/lib/prefetchViews';
import '@/index.css';

initPlatformFlags();
prefetchViewChunks();

/**
 * Entrypoint próprio do cliente mobile (Fase 5).
 * Renderiza `MobileAppShell` direto — sem o branch `isDesktop` do `src/App.tsx`.
 * O estado/navegação vêm do `MobileAppProvider` (casca mobile, spec 07).
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <MobileAppProvider>
          <BootSplash />
          <MobileAppShell />
          <MobileOverlays />
        </MobileAppProvider>
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>,
);
