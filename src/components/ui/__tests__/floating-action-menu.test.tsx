import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { FloatingActionMenu } from '../floating-action-menu';
import { LONG_PRESS_MS } from '@/lib/usePressGesture';

/**
 * O contrato do FAB: **toque curto abre o menu de atalhos; segurar abre a
 * busca** — e um gesto físico nunca produz os dois. O limiar não é literal:
 * é o token `LONG_PRESS_MS` dono do gesto, então o relógio é controlado.
 *
 * A busca não abre "junto" porque a máquina de estados engole o click que o
 * navegador sintetiza depois do pressed longo — é a invariante que este
 * teste guarda no nível do componente (o hook já a cobre no dele).
 */

const options = [{ label: 'novo item', onClick: vi.fn() }];

/**
 * Query estável do FAB: o `aria-label` muda com o estado (abrir ↔ fechar),
 * mas "menu de atalhos" é o nome em ambos — é ele que identifica o botão.
 */
const fab = () => screen.getByRole('button', { name: /menu de atalhos/ });

const contactDown = () =>
  fireEvent.pointerDown(fab(), { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
const contactUp = () => fireEvent.pointerUp(fab(), { pointerId: 1, clientX: 0, clientY: 0 });

/** Atravessa o relógio com o React dentro do `act` (o flush é síncrono). */
const passa = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('FloatingActionMenu — toque × segurar', () => {
  it('toque curto abre o menu de atalhos', () => {
    const onLongPress = vi.fn();
    render(<FloatingActionMenu options={options} onLongPress={onLongPress} />);

    fireEvent.click(fab());

    expect(fab()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'novo item' })).toBeInTheDocument();
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('segurar além do limiar abre a busca e não o menu', () => {
    const onLongPress = vi.fn();
    render(<FloatingActionMenu options={options} onLongPress={onLongPress} />);

    contactDown();
    passa(LONG_PRESS_MS);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(fab()).toHaveAttribute('aria-expanded', 'false');
  });

  it('soltar depois do pressed longo não abre o menu (click engolido)', () => {
    const onLongPress = vi.fn();
    render(<FloatingActionMenu options={options} onLongPress={onLongPress} />);

    contactDown();
    passa(LONG_PRESS_MS);
    contactUp();
    fireEvent.click(fab());

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(fab()).toHaveAttribute('aria-expanded', 'false');
  });

  it('arrastar além da tolerância cancela: nem busca nem menu', () => {
    const onLongPress = vi.fn();
    render(<FloatingActionMenu options={options} onLongPress={onLongPress} />);

    contactDown();
    fireEvent.pointerMove(fab(), { pointerId: 1, clientX: 40, clientY: 0 });
    passa(LONG_PRESS_MS + 100);
    contactUp();
    fireEvent.click(fab());

    expect(onLongPress).not.toHaveBeenCalled();
    expect(fab()).toHaveAttribute('aria-expanded', 'false');
  });

  it('segurar com o menu aberto fecha o menu e abre a busca', () => {
    const onLongPress = vi.fn();
    render(<FloatingActionMenu options={options} onLongPress={onLongPress} />);

    fireEvent.click(fab());
    expect(fab()).toHaveAttribute('aria-expanded', 'true');

    contactDown();
    passa(LONG_PRESS_MS);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(fab()).toHaveAttribute('aria-expanded', 'false');
  });

  it('sem onLongPress configurado, o toque curto segue abrindo o menu', () => {
    render(<FloatingActionMenu options={options} />);

    fireEvent.click(fab());

    expect(fab()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'novo item' })).toBeInTheDocument();
  });
});
