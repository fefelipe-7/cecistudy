import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LONG_PRESS_MS, usePressGesture, type PressPhase } from '../usePressGesture';

/**
 * Relógio controlado: o limiar do gesto é 500ms e nenhum teste espera 500ms de
 * verdade — o `advance` é o que atravessa o limiar.
 */

function Harness({
  onPress,
  onLongPress,
  onPhase,
}: {
  onPress: () => void;
  onLongPress: () => void;
  onPhase?: (p: PressPhase) => void;
}) {
  const { handlers, phase } = usePressGesture({ onPress, onLongPress, onPhaseChange: onPhase });
  return (
    <button type="button" data-testid="alvo" {...handlers} data-phase={phase}>
      voltar
    </button>
  );
}

const alvo = () => screen.getByTestId('alvo');

const contactDown = () =>
  fireEvent.pointerDown(alvo(), { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
const contactUp = () => fireEvent.pointerUp(alvo(), { pointerId: 1, clientX: 0, clientY: 0 });

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

describe('usePressGesture — clique curto × pressed longo', () => {
  it('toque abaixo do limiar executa o clique e não o pressed longo', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    render(<Harness onPress={onPress} onLongPress={onLongPress} />);

    contactDown();
    passa(LONG_PRESS_MS - 50);
    contactUp();
    fireEvent.click(alvo());

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('toque acima do limiar compacta e o clique do mesmo contato é engolido', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    render(<Harness onPress={onPress} onLongPress={onLongPress} />);

    contactDown();
    passa(LONG_PRESS_MS);
    contactUp();
    fireEvent.click(alvo());

    // O invariante: um gesto físico, no máximo um resultado.
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('movimento além da tolerância cancela: soltar não executa nada', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    const phases: PressPhase[] = [];
    render(
      <Harness onPress={onPress} onLongPress={onLongPress} onPhase={(p) => phases.push(p)} />,
    );

    contactDown();
    fireEvent.pointerMove(alvo(), { pointerId: 1, clientX: 40, clientY: 0 });
    passa(LONG_PRESS_MS * 2);
    fireEvent.pointerUp(alvo(), { pointerId: 1, clientX: 40, clientY: 0 });
    fireEvent.click(alvo());

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
    expect(phases).toContain('cancelled');
  });

  it('cancelamento do sistema (pointercancel) não executa nada', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    render(<Harness onPress={onPress} onLongPress={onLongPress} />);

    contactDown();
    fireEvent.pointerCancel(alvo(), { pointerId: 1 });
    passa(LONG_PRESS_MS * 2);

    expect(onPress).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('a fase de pressionamento é publicada (é o feedback progressivo)', () => {
    const phases: PressPhase[] = [];
    render(<Harness onPress={vi.fn()} onLongPress={vi.fn()} onPhase={(p) => phases.push(p)} />);

    contactDown();
    expect(phases).toEqual(['pressing']);
    expect(alvo()).toHaveAttribute('data-phase', 'pressing');

    passa(LONG_PRESS_MS);
    expect(alvo()).toHaveAttribute('data-phase', 'longPress');
  });

  it('cliques rápidos seguidos disparam duas vezes (são dois gestos)', () => {
    const onPress = vi.fn();
    render(<Harness onPress={onPress} onLongPress={vi.fn()} />);

    for (let i = 0; i < 3; i += 1) {
      contactDown();
      passa(10);
      contactUp();
      fireEvent.click(alvo());
    }
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('contato secundário do mouse não inicia gesto', () => {
    const onLongPress = vi.fn();
    render(<Harness onPress={vi.fn()} onLongPress={onLongPress} />);

    fireEvent.pointerDown(alvo(), { pointerId: 1, button: 2, clientX: 0, clientY: 0 });
    passa(LONG_PRESS_MS * 2);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('clique sem toque prévio (teclado, Enter/Espaço) passa direto', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    render(<Harness onPress={onPress} onLongPress={onLongPress} />);

    fireEvent.click(alvo());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('botão direito no desktop é o mesmo pressed longo (paridade de entrada)', () => {
    const onLongPress = vi.fn();
    render(<Harness onPress={vi.fn()} onLongPress={onLongPress} />);

    fireEvent.contextMenu(alvo());
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('o pressed longo engolido não vaza para o clique seguinte (outro gesto)', () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    render(<Harness onPress={onPress} onLongPress={onLongPress} />);

    contactDown();
    passa(LONG_PRESS_MS);
    // o `click` não chega (o SO cancelou o toque depois do reconhecimento)
    contactUp();

    // gesto seguinte, sem long-press
    contactDown();
    passa(20);
    contactUp();
    fireEvent.click(alvo());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('desmontar no meio do gesto não deixa timer vivo', () => {
    const onLongPress = vi.fn();
    const { unmount } = render(<Harness onPress={vi.fn()} onLongPress={onLongPress} />);

    contactDown();
    unmount();
    passa(LONG_PRESS_MS * 2);

    expect(onLongPress).not.toHaveBeenCalled();
  });
});