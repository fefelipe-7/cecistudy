import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FOCUS_PRESET_MS,
  IDLE_FOCUS,
  elapsedSeconds,
  isFinished,
  isRunning,
  partialMinutes,
  pauseFocus,
  prepareFocus,
  remainingMs,
  resetFocus,
  resumeFocus,
  startFocus,
  tickFocus,
  type FocusTimerState,
} from './focusTimer';
import { focusController } from './focusController';

const TICK_MS = 500;

/**
 * Timer por relógio de parede: `endAt = Date.now() + restante`, `remaining` é
 * DERIVADO de `Date.now()` a cada tick — sobrevive a background (app volta e
 * mostra o tempo real decorrido; ver EST-002 AC3). Loop de efeito colateral
 * fica aqui (fora da view); a máquina pura vive em `packages/application`.
 */
export interface FocusTimer {
  isRunning: boolean;
  isFinishedNow: boolean;
  /** Restante atual em ms (atualizado a cada tick). */
  remaining: number;
  /** Decorrido em segundos (relógio de parede enquanto roda). */
  elapsed: number;
  /** Minutos parciais guardáveis (>=1 só com 1 min completo; 0 = não pode). */
  partial: number;
  /** Duração da fase atual em minutos (para exibição/progresso). */
  presetMin: number;
  toggle: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  /** Muda a duração do preset e zera (fase não iniciada ainda). */
  setDuration: (minutes: number) => void;
}

export function useFocusTimer(durationMs: number = FOCUS_PRESET_MS): FocusTimer {
  const [state, setState] = useState<FocusTimerState>(IDLE_FOCUS);
  const [now, setNow] = useState<number>(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  // Loop de tick: intervalo único criado uma vez; lê o estado via ref (não
  // recria o interval a cada render). Enquanto nunca iniciado, nada roda.
  useEffect(() => {
    if (!stateRef.current.running && stateRef.current.totalMs === 0) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState(tickFocus(stateRef.current, t));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [stateRef.current.running, stateRef.current.totalMs]);

  // Ao voltar do background, recalcula imediatamente (sem esperar o tick).
  useEffect(() => {
    const onVisible = () => {
      const t = Date.now();
      setNow(t);
      setState(tickFocus(stateRef.current, t));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const syncRunning = useCallback((next: FocusTimerState) => {
    focusController.setRunning(isRunning(next));
  }, []);

  const start = useCallback(() => {
    const t = Date.now();
    // Se um preset foi pré-definido (setDuration), parte dele; senão, do default.
    const ms = stateRef.current.totalMs || durationMs;
    const next = startFocus(stateRef.current, t, ms);
    setState(next);
    syncRunning(next);
  }, [durationMs, syncRunning]);

  const pause = useCallback(() => {
    const next = pauseFocus(stateRef.current, Date.now());
    setState(next);
    syncRunning(next);
  }, [syncRunning]);

  const resume = useCallback(() => {
    const next = resumeFocus(stateRef.current, Date.now());
    setState(next);
    syncRunning(next);
  }, [syncRunning]);

  const toggle = useCallback(() => {
    const current = stateRef.current;
    if (isRunning(current)) {
      pause();
    } else if (current.totalMs === 0) {
      start();
    } else {
      resume();
    }
  }, [pause, resume, start]);

  const reset = useCallback(() => {
    const next = resetFocus(stateRef.current, Date.now());
    setState(next);
    setNow(Date.now());
    syncRunning(next);
  }, [syncRunning]);

  const setDuration = useCallback(
    (minutes: number) => {
      const next = prepareFocus(stateRef.current, Date.now(), minutes * 60_000);
      setState(next);
      setNow(Date.now());
      syncRunning(next);
    },
    [syncRunning]
  );

  const running = isRunning(state);
  const finishedNow = isFinished(state, now);

  return {
    isRunning: running,
    isFinishedNow: finishedNow,
    remaining: remainingMs(state, now),
    elapsed: elapsedSeconds(state, now),
    partial: partialMinutes(state, now),
    presetMin: state.totalMs > 0 ? Math.round(state.totalMs / 60_000) : Math.round(durationMs / 60_000),
    toggle,
    start,
    pause,
    resume,
    reset,
    setDuration,
  };
}