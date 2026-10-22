/**
 * Gatilhos de sync em background — spec-performance.md §7 Fase 8.
 *
 * Problema que resolve: o efeito antigo dependia de closures largas
 * (`syncInBackground` → `performSync` → `getSyncPayloadJson` → ~30 estados),
 * então timer + listeners eram reinstalados a CADA mudança de qualquer
 * coleção sincronizada — e a reinstalação re-agendava um `setTimeout` de
 * 1,5 s, transformando o "sync ao abrir" num sync de rede ~1,5 s depois de
 * CADA edição.
 *
 * Contrato novo:
 * - o lifecycle (timer + listeners) depende SÓ da configuração ativa;
 * - o callback operacional vive em ref (sempre o snapshot mais fresco);
 * - trava `inFlight`: no máximo UM sync por vez (abertura + `online` + timer
 *   nunca concorrem localmente);
 * - `pagehide` (não `beforeunload` — o antigo não dispara de forma confiável
 *   em WebView mobile);
 * - `setTimeout` de 1,5 s roda UMA vez por ativação da configuração — não
 *   após cada edição.
 */
import { useEffect, useRef } from 'react';

/** Intervalo do sync periódico (spec §Fase 8: constante nomeada). */
export const SYNC_INTERVAL_MS = 30 * 60 * 1000;

/** Sync logo após ativar a configuração / abrir o app com ela ativa. */
const INITIAL_SYNC_DELAY_MS = 1500;

export type BackgroundSyncRunner = () => void | Promise<unknown>;

/**
 * Instala os gatilhos de sync de fundo enquanto `config` estiver ativo
 * (qualquer objeto não-nulo; a identidade da configuração reinstala os
 * gatilhos — reconfigurar é evento de lifecycle).
 */
export function useBackgroundSyncTriggers(config: unknown, run: BackgroundSyncRunner): void {
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (!config) return;

    let inFlight = false;
    const attempt = () => {
      if (inFlight) return; // trava: no máximo um sync por vez
      inFlight = true;
      void Promise.resolve(runRef.current()).finally(() => {
        inFlight = false;
      });
    };

    const id = window.setInterval(attempt, SYNC_INTERVAL_MS);
    window.addEventListener('online', attempt);
    window.addEventListener('pagehide', attempt);
    const initial = window.setTimeout(attempt, INITIAL_SYNC_DELAY_MS);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(initial);
      window.removeEventListener('online', attempt);
      window.removeEventListener('pagehide', attempt);
    };
  }, [config]);
}
