import React from 'react';
import { useDesktopApp } from '@/context/desktopApp';
import { OverlaysContent } from './OverlaysContent';

/**
 * Overlays da casca desktop (spec 07 §6.4): lê o `DesktopAppContext`
 * (`useDesktopApp()`, o supertype com sessão/painéis) e monta os mesmos modais
 * globais (QuickAdd/Search/EditCourse/EditTcc/Toast). Sem hook universal residual.
 */
export const DesktopOverlays: React.FC = () => <OverlaysContent app={useDesktopApp()} />;