import { describe, expect, it } from 'vitest';
import {
  IDLE_FOCUS,
  elapsedSeconds,
  isFinished,
  isRunning,
  pauseFocus,
  prepareFocus,
  resetFocus,
  resumeFocus,
  startFocus,
  tickFocus,
  partialMinutes,
} from '../focusTimer';

const MIN = 60_000;

function nowAt() {
  return 1_000_000;
}

describe('focusTimer (máquina pura do foco)', () => {
  it('startFocus inicia fase com endAt = now + duração', () => {
    const t0 = nowAt();
    const state = startFocus(IDLE_FOCUS, t0, 25 * MIN);
    expect(isRunning(state)).toBe(true);
    expect(state.endAt).toBe(t0 + 25 * MIN);
    expect(state.remainingMs).toBe(25 * MIN);
    expect(state.totalMs).toBe(25 * MIN);
    expect(elapsedSeconds(state, t0)).toBe(0);
    expect(isFinished(state, t0)).toBe(false);
  });

  it('tick recalcula o restante pelo relógio de parede', () => {
    const t0 = nowAt();
    let state = startFocus(IDLE_FOCUS, t0, 25 * MIN);
    const t5 = t0 + 5 * MIN;
    state = tickFocus(state, t5);
    expect(state.remainingMs).toBe(20 * MIN);
    expect(elapsedSeconds(state, t5)).toBe(300);
    expect(isFinished(state, t5)).toBe(false);
  });

  it('conclui quando o restante zera (isFinished)', () => {
    const t0 = nowAt();
    let state = startFocus(IDLE_FOCUS, t0, 25 * MIN);
    const t25 = t0 + 25 * MIN;
    state = tickFocus(state, t25);
    expect(state.remainingMs).toBe(0);
    expect(isFinished(state, t25)).toBe(true);
  });

  it('pause/retoma preservam o restante e o tempo decorrido', () => {
    const t0 = nowAt();
    let state = startFocus(IDLE_FOCUS, t0, 25 * MIN);
    const t5 = t0 + 5 * MIN;
    let paused = pauseFocus(state, t5);

    expect(isRunning(paused)).toBe(false);
    expect(paused.remainingMs).toBe(20 * MIN);

    // tempo decorrido congela mesmo se o relógio anda enquanto pausado
    let later = 0;
    for (let k = 0; k < 10; k++) {
      later = t5 + k * MIN + 1;
      expect(elapsedSeconds(tickFocus(paused, later), later)).toBe(300);
    }

    paused = pauseFocus(tickFocus(paused, later), later);
    expect(paused.remainingMs).toBe(20 * MIN);

    const resumeAt = later;
    const resumed = resumeFocus(paused, resumeAt);
    expect(isRunning(resumed)).toBe(true);
    expect(resumed.endAt).toBe(resumeAt + 20 * MIN);

    const t10afterResume = resumeAt + 5 * MIN;
    expect(elapsedSeconds(tickFocus(resumed, t10afterResume), t10afterResume)).toBe(600);
  });

  it('retomar sobre estado zerado não muda nada', () => {
    expect(resumeFocus(IDLE_FOCUS, nowAt())).toBe(IDLE_FOCUS);
    const finished = { ...IDLE_FOCUS, remainingMs: 0, running: false };
    expect(resumeFocus(finished, nowAt())).toBe(finished);
  });

  it('reset zera a sessão (guarda parcial é decisão da UI antes)', () => {
    const t0 = nowAt();
    const state = startFocus(IDLE_FOCUS, t0, 25 * MIN);
    const t10 = tickFocus(state, t0 + 10 * MIN);
    const zeroed = resetFocus(t10, t10.endAt);
    expect(zeroed).toEqual(IDLE_FOCUS);
  });

  it('prepareFocus pré-define preset pausado (aguardando iniciar)', () => {
    const t0 = nowAt();
    const ready = prepareFocus(IDLE_FOCUS, t0, 45 * MIN);
    expect(isRunning(ready)).toBe(false);
    expect(ready.totalMs).toBe(45 * MIN);
    expect(ready.remainingMs).toBe(45 * MIN);
    expect(elapsedSeconds(ready, t0)).toBe(0);

    // retomar a partir do "ready" começa a contar do preset
    const running = resumeFocus(ready, t0);
    expect(isRunning(running)).toBe(true);
    expect(running.endAt).toBe(t0 + 45 * MIN);
  });

  it('AC3 — sobrevive a background: Date.now() salta sem ticks → restante correto', () => {
    const t0 = nowAt();
    let state = startFocus(IDLE_FOCUS, t0, 25 * MIN);

    // background de 23min: nenhum callback de timer rodou, o relógio saltou
    const backAt = t0 + 23 * MIN;
    expect(remainingAfterJump(state, backAt)).toBe(2 * MIN);
    state = tickFocus(state, backAt);
    expect(elapsedSeconds(state, backAt)).toBe(1380);
  });

  it('partialMinutes: só >= 1 min completo, senão 0', () => {
    const t0 = nowAt();
    const s = startFocus(IDLE_FOCUS, t0, 25 * MIN);
    expect(partialMinutes(s, t0 + 30_000)).toBe(0);
    expect(partialMinutes(s, t0 + 90_000)).toBe(1);
    expect(partialMinutes(s, t0 + 61 * MIN)).toBe(61);
  });
});

/** Restante sem mutar o estado (mostra que a derivação é pura). */
function remainingAfterJump(state: ReturnType<typeof startFocus>, now: number) {
  return Math.max(0, state.endAt - now);
}