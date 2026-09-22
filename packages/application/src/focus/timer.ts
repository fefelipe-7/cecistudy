// Máquina de estados pura do timer de foco (pomodoro imersivo).
// Modelo por relógio de parede: enquanto roda, `endAt` é a fonte da verdade —
// `remaining`/`elapsed` são DERIVADOS de `now` (sobrevive a background).
// Pura: sem efeito colateral — todas as funções recebem `now: number`.
// Pomodoro clássico é fase/estado de sessão (opcional, P2); aqui fica só o relógio.

/** Estado puro do timer de foco (fase única foco/descanso). */
export interface FocusTimerState {
  running: boolean;
  /** Duração total da fase atual em ms (0 = nunca iniciado). */
  totalMs: number;
  /** Instante de fim (only meaningful enquanto `running`). */
  endAt: number;
  /** Restante em ms (cacheados quando pausado / no último tick). */
  remainingMs: number;
  /** Instante em que a fase rodando começou. */
  phaseStartedAt: number;
  /** Tempo acumulado antes da fase rodando atual. */
  elapsedBaseMs: number;
}

export const FOCUS_PRESET_MINUTES = 25;
export const FOCUS_PRESET_MS = FOCUS_PRESET_MINUTES * 60 * 1000;

export const IDLE_FOCUS: FocusTimerState = {
  running: false,
  totalMs: 0,
  endAt: 0,
  remainingMs: 0,
  phaseStartedAt: 0,
  elapsedBaseMs: 0,
};

/** Tempo decorrido de foco em ms (acumula apenas enquanto roda). */
export function elapsedMs(state: FocusTimerState, now: number): number {
  return (
    state.elapsedBaseMs +
    (state.running ? Math.max(0, now - state.phaseStartedAt) : 0)
  );
}

/** Tempo decorrido em segundos inteiros. */
export function elapsedSeconds(state: FocusTimerState, now: number): number {
  return Math.floor(elapsedMs(state, now) / 1000);
}

/** Minutos parciais guardáveis: só >= 1 min completo (0 = não pode guardar). */
export function partialMinutes(state: FocusTimerState, now: number): number {
  const secs = elapsedSeconds(state, now);
  return secs >= 60 ? Math.max(1, Math.floor(secs / 60)) : 0;
}

/** Restante em ms (relógio de parede enquanto roda; cache quando pausado). */
export function remainingMs(state: FocusTimerState, now: number): number {
  if (state.running) {
    return Math.max(0, state.endAt - now);
  }
  return state.remainingMs;
}

export function isRunning(state: FocusTimerState): boolean {
  return state.running;
}

/** Fase terminou (restante zerado com o relógio). */
export function isFinished(state: FocusTimerState, now: number): boolean {
  return state.running && remainingMs(state, now) <= 0;
}

/** Inicia uma fase de foco nova (zera o tempo decorrido anterior). */
export function startFocus(
  _state: FocusTimerState,
  now: number,
  durationMs: number
): FocusTimerState {
  return {
    running: true,
    totalMs: durationMs,
    endAt: now + durationMs,
    remainingMs: durationMs,
    phaseStartedAt: now,
    elapsedBaseMs: 0,
  };
}

/** Pré-define um preset (pausado, aguardando iniciar) sem zerar contagens. */
export function prepareFocus(
  _state: FocusTimerState,
  _now: number,
  durationMs: number
): FocusTimerState {
  return {
    running: false,
    totalMs: durationMs,
    endAt: 0,
    remainingMs: durationMs,
    phaseStartedAt: 0,
    elapsedBaseMs: 0,
  };
}

/**
 * Tick de parede: recalcula `remainingMs` (nada mais muda). Não mexe em nada
 * se pausado — o tempo decorrido já está congelado em `elapsedBaseMs`.
 */
export function tickFocus(state: FocusTimerState, now: number): FocusTimerState {
  if (!state.running) return state;
  return { ...state, remainingMs: Math.max(0, state.endAt - now) };
}

/** Pausa, congelando restante e acumulando o decorrido da fase rodando. */
export function pauseFocus(state: FocusTimerState, now: number): FocusTimerState {
  if (!state.running) return state;
  return {
    ...state,
    running: false,
    remainingMs: Math.max(0, state.endAt - now),
    elapsedBaseMs: elapsedMs(state, now),
  };
}

/** Retoma com o mesmo remanescente (endAt recomputado a partir de now). */
export function resumeFocus(state: FocusTimerState, now: number): FocusTimerState {
  if (state.running || state.remainingMs <= 0) return state;
  return {
    ...state,
    running: true,
    endAt: now + state.remainingMs,
    phaseStartedAt: now,
  };
}

/** Reinicia a sessão (zera tudo — guarda parcial é decisão da UI antes). */
export function resetFocus(_state: FocusTimerState, _now: number): FocusTimerState {
  return IDLE_FOCUS;
}