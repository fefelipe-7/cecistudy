import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMobileApp } from '@/context/mobileApp';
import { CaptureLinkSheet } from '../components/capture/CaptureLinkSheet';
import { CAPTURE_COPY } from '../components/capture/captureCopy';
import { captureLink, type CaptureLinkInput } from '../../packages/domain/src/core/domain/thesis';
import {
  readPendingShare,
  subscribeCaptureDeepLink,
  subscribeShareTarget,
} from '../lib/captureLink';

/**
 * Host da captura de link (SPEC-012 §8.4/§8.8, F8.4/F8.5).
 *
 * - **Camada 2 (iOS, deep link `cecistudy://captura?…`)**: as escolhas já vieram
 *   no atalho, então salva **direto** e mostra "prontinho ♡" — o app permanece
 *   aberto (§8.2 item 1).
 * - **Android (`ACTION_SEND`)**: abre a **mesma sheet** (§8.6) com o texto
 *   compartilhado; o guardar minimiza o app (`minimizeAfterCapture`).
 *
 * A branchagem por plataforma fica em `src/lib/captureLink.ts`; aqui não há
 * `isMobile`/`isNativePlatform`.
 */
export const CaptureHost: React.FC = () => {
  const app = useMobileApp();
  const [sheetText, setSheetText] = useState<string | null>(null);

  // Mantém o `app` fresco dentro dos listeners (a estante muda a cada captura).
  const appRef = useRef(app);
  appRef.current = app;

  const saveDirect = useCallback((input: CaptureLinkInput) => {
    const current = appRef.current;
    const outcome = captureLink(input, current.readings, new Date().toISOString());
    if (outcome.outcome === 'invalida') {
      current.showToast(CAPTURE_COPY.invalid);
      return;
    }
    if (outcome.outcome === 'duplicada') {
      current.showToast(CAPTURE_COPY.duplicate);
      return;
    }
    current.handleAddReading(outcome.reading);
    const reference = outcome.reference;
    if (reference) current.setThesisReferences((prev) => [...prev, reference]);
    current.showToast(CAPTURE_COPY.saved);
  }, []);

  // Camada 2 — deep link do atalho (escolhas prontas).
  useEffect(() => {
    return subscribeCaptureDeepLink((link) => {
      saveDirect({ url: link.url, kind: link.kind, thesis: link.thesis });
    });
  }, [saveDirect]);

  // Android — compartilhar abre a sheet (escolhas ainda por fazer).
  useEffect(() => {
    const open = (text: string) => setSheetText(text);
    const unsub = subscribeShareTarget(open);
    // Partida a frio: o texto já chegou antes do listener.
    void readPendingShare().then((text) => {
      if (text) open(text);
    });
    return unsub;
  }, []);

  if (sheetText === null) return null;
  return (
    <CaptureLinkSheet
      open
      initialText={sheetText}
      onClose={() => setSheetText(null)}
    />
  );
};
