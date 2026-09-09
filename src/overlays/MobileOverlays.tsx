import React from 'react';
import { useMobileApp } from '@/context/mobileApp';
import { OverlaysContent } from './OverlaysContent';

/**
 * Overlays da casca mobile (spec 07 §6.4): lê o `MobileAppContext` via
 * `useMobileApp()` e monta os modais globais (QuickAdd/Search/EditCourse/
 * EditTcc/Toast). Substitui o antigo `SharedOverlays` — sem hook universal residual.
 */
export const MobileOverlays: React.FC = () => <OverlaysContent app={useMobileApp()} />;