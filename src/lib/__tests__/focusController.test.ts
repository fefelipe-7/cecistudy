import { describe, expect, it, vi, beforeEach } from 'vitest';
import { focusController, resetFocusController } from '../focusController';

describe('focusController (pub/sub da guarda de back)', () => {
  beforeEach(() => resetFocusController());

  it('setActive/isActive', () => {
    expect(focusController.isActive()).toBe(false);
    focusController.setActive(true);
    expect(focusController.isActive()).toBe(true);
  });

  it('setRunning/isRunning', () => {
    expect(focusController.isRunning()).toBe(false);
    focusController.setRunning(true);
    expect(focusController.isRunning()).toBe(true);
    focusController.setRunning(false);
    expect(focusController.isRunning()).toBe(false);
  });

  it('emitBackRequested notifica ouvintes', () => {
    const a = vi.fn();
    const b = vi.fn();
    focusController.onBackRequested(a);
    focusController.onBackRequested(b);

    focusController.emitBackRequested();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe remove o ouvinte', () => {
    const a = vi.fn();
    const off = focusController.onBackRequested(a);
    off();

    focusController.emitBackRequested();
    expect(a).not.toHaveBeenCalled();
  });

  it('reset limpa tudo', () => {
    focusController.setActive(true);
    focusController.setRunning(true);
    focusController.onBackRequested(() => {});
    resetFocusController();
    expect(focusController.isActive()).toBe(false);
    expect(focusController.isRunning()).toBe(false);
    /* emitir depois do reset não deve causar erro nem notificar */
    expect(() => focusController.emitBackRequested()).not.toThrow();
  });
});