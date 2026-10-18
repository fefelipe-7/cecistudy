/**
 * `useLongPress` — recognizer de pressionar-e-seguir (SPEC-M-018 D2/I1/I2).
 *
 * Este arquivo fecha uma dívida que a auditoria encontrou: o hook tinha
 * **quatro** consumidores e **zero** testes. As três partes mais sutis — engolir o
 * `click` pós-reconhecimento, a guarda `DOUBLE_FIRE_GUARD_MS` e o
 * auto-bloqueio em `<button>` — estavam sem rede.
 *
 * Os testes usam **elementos reais** e `fireEvent`, não chamadas diretas aos
 * handlers. Isso não é estética: o ponto de maior risco do hook é um listener de
 * `click` registrado em `window` com `capture`, que **só** existe se o evento
 * passar pela árvore de dispatch. Chamar `result.current.onClick(...)` não
 * exercita o `swallow` — e o teste passaria dando uma garantia falsa.
 *
 * Relógio controlado (`vi.useFakeTimers`): nenhum teste espera 500 ms de
 * verdade, então a suíte não fica lenta nem instável.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { useLongPress, type PressPhase } from '../useLongPress';

interface Harness {
  onLongPress: ReturnType<typeof vi.fn>;
  onClick: ReturnType<typeof vi.fn>;
  onPressPhase: Mock<(p: PressPhase) => void>;
  host: HTMLElement;
  child?: HTMLElement;
}

function montarHarness(
  over: Partial<Parameters<typeof useLongPress>[0]> = {},
  { comFilho = false }: { comFilho?: boolean } = { comFilho: false },
): Harness {
  const onLongPress = vi.fn();
  const onClick = vi.fn();
  const onPressPhase = vi.fn() as Mock<(p: PressPhase) => void>;

  // Host: o botão de voltar da barra contextual. `allowSelf` é o que o salva do
  // auto-bloqueio, então o default do teste é `true`.
  function Alvo() {
    const handlers = useLongPress({
      onLongPress,
      onClick,
      onPressPhase,
      allowSelf: true,
      ...over,
    });
    return (
      <div>
        <button type="button" data-testid="host" {...handlers} />
        {comFilho && (
          <button type="button" data-testid="filho" onClick={vi.fn()}>
            filho
          </button>
        )}
      </div>
    );
  }

  render(<Alvo />);
  const host = screen.getByTestId('host');
  const child = comFilho ? screen.getByTestId('filho') : undefined;
  return { onLongPress, onClick, onPressPhase, host, child };
}

const LIMIAR = 500;

function pressionar(alvo: Element) {
  fireEvent.pointerDown(alvo, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
}
function mover(alvo: Element, x: number) {
  fireEvent.pointerMove(alvo, { pointerId: 1, clientX: x, clientY: 10 });
}
function avancar(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLongPress — limiar (I1)', () => {
  it('toque abaixo do limiar: só o clique', () => {
    const { host, onLongPress, onClick } = montarHarness();
    pressionar(host);
    avancar(LIMIAR - 1);
    fireEvent.pointerUp(host);
    fireEvent.click(host);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('toque acima do limiar: o long-press dispara', () => {
    const { host, onLongPress } = montarHarness();
    pressionar(host);
    avancar(LIMIAR);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('o clique que o browser gera depois do reconhecimento é engolido (I1)', () => {
    const { host, onLongPress, onClick } = montarHarness();
    pressionar(host);
    avancar(LIMIAR);
    fireEvent.pointerUp(host);
    // **Evento real**: é o `swallow` em capture no `window` que tem que impedir.
    fireEvent.click(host);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('um toque não produz as duas coisas — o contrato central (I1)', () => {
    const { host, onLongPress, onClick } = montarHarness();
    pressionar(host);
    avancar(LIMIAR + 10);
    fireEvent.pointerUp(host);
    fireEvent.click(host);
    const disparados = onLongPress.mock.calls.length + onClick.mock.calls.length;
    expect(disparados).toBe(1);
  });

  it('o limiar é configurável', () => {
    const { host, onLongPress } = montarHarness({ thresholdMs: 120 });
    pressionar(host);
    avancar(119);
    expect(onLongPress).not.toHaveBeenCalled();
    avancar(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});

describe('useLongPress — cancelamento', () => {
  it('sair da área de tolerância antes do limiar: nenhum long-press', () => {
    const { host, onLongPress } = montarHarness();
    pressionar(host);
    mover(host, 40);
    avancar(LIMIAR + 100);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('dentro da tolerância, o gesto continua', () => {
    const { host, onLongPress } = montarHarness({ moveTolerance: 10 });
    pressionar(host);
    mover(host, 15);
    avancar(LIMIAR);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('pointercancel interrompe sem long-press', () => {
    const { host, onLongPress } = montarHarness();
    pressionar(host);
    fireEvent.pointerCancel(host);
    avancar(LIMIAR + 100);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('pointerleave cancela', () => {
    const { host, onLongPress } = montarHarness();
    pressionar(host);
    fireEvent.pointerLeave(host);
    avancar(LIMIAR + 100);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('só o botão principal começa gesto', () => {
    const { host, onLongPress } = montarHarness();
    fireEvent.pointerDown(host, { button: 2, pointerId: 1 });
    avancar(LIMIAR + 100);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});

describe('useLongPress — desktop', () => {
  it('botão direito dispara o long-press e bloqueia o menu nativo', () => {
    const { host, onLongPress } = montarHarness();
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    fireEvent(host, ev);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('toque seguido de contextmenu não dispara duas vezes (guarda de 700 ms)', () => {
    const { host, onLongPress } = montarHarness();
    pressionar(host);
    avancar(LIMIAR);
    fireEvent.pointerUp(host);
    // O iOS emite `contextmenu` logo depois de um long-press; a guarda absorve.
    fireEvent(host, new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});

describe('useLongPress — auto-bloqueio em interativos', () => {
  it('sem `allowSelf`, um host que é <button> nunca dispara — a armadilha do D2', () => {
    const { host, onLongPress } = montarHarness({ allowSelf: false });
    pressionar(host);
    avancar(LIMIAR + 100);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('com `allowSelf`, o próprio host passa', () => {
    const { host, onLongPress } = montarHarness({ allowSelf: true });
    pressionar(host);
    avancar(LIMIAR);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('com `allowSelf`, um botão aninhado continua bloqueado', () => {
    const { child, onLongPress } = montarHarness(
      { allowSelf: true },
      { comFilho: true },
    );
    // O `closest('button')` do alvo aninhado acha o **filho**, não o host —
    // e o filho não é o host, então o gesto é recusado.
    pressionar(child!);
    avancar(LIMIAR + 100);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});

describe('useLongPress — fases do gesto (§6.3)', () => {
  const fases = (h: Harness) => h.onPressPhase.mock.calls.map((c) => c[0]);

  it('pressing → longPressRecognized', () => {
    const h = montarHarness();
    pressionar(h.host);
    avancar(LIMIAR);
    expect(fases(h)).toEqual(['pressing', 'longPressRecognized']);
  });

  it('pressing → idle no toque curto', () => {
    const h = montarHarness();
    pressionar(h.host);
    fireEvent.pointerUp(h.host);
    expect(fases(h)).toEqual(['pressing', 'idle']);
  });

  it('pressing → cancelled ao sair da tolerância', () => {
    const h = montarHarness();
    pressionar(h.host);
    mover(h.host, 40);
    expect(fases(h)).toEqual(['pressing', 'cancelled']);
  });

  it('pressing → cancelled no pointercancel', () => {
    const h = montarHarness();
    pressionar(h.host);
    fireEvent.pointerCancel(h.host);
    expect(fases(h)).toEqual(['pressing', 'cancelled']);
  });

  it('o botão do host não pode ser usado para ler a fase: nada sem toque', () => {
    const h = montarHarness();
    expect(fases(h)).toEqual([]);
  });
});

describe('useLongPress — ciclo de vida', () => {
  it('desmontar no meio do pressionar não deixa timer vivo', () => {
    const onLongPress = vi.fn();
    function Alvo() {
      const handlers = useLongPress({ onLongPress, allowSelf: true });
      return <button type="button" data-testid="host" {...handlers} />;
    }
    const { unmount } = render(<Alvo />);
    pressionar(screen.getByTestId('host'));
    unmount();
    avancar(LIMIAR + 500);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('o cleanup não notifica fase: `setState` durante unmount é o que se evita', () => {
    const onPressPhase = vi.fn() as Mock<(p: PressPhase) => void>;
    function Alvo() {
      const handlers = useLongPress({ onLongPress: vi.fn(), onPressPhase, allowSelf: true });
      return <button type="button" data-testid="host" {...handlers} />;
    }
    const { unmount } = render(<Alvo />);
    pressionar(screen.getByTestId('host'));
    expect(onPressPhase).toHaveBeenCalledWith('pressing');
    unmount();
    expect(onPressPhase).toHaveBeenCalledTimes(1);
    expect(onPressPhase).not.toHaveBeenCalledWith('cancelled');
  });

  it('o engolidor de click não sobrevive ao unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const onLongPress = vi.fn();
    function Alvo() {
      const handlers = useLongPress({ onLongPress, allowSelf: true });
      return <button type="button" data-testid="host" {...handlers} />;
    }
    const { unmount } = render(<Alvo />);
    pressionar(screen.getByTestId('host'));
    avancar(LIMIAR);
    // Nenhum clique chega depois do reconhecimento — o engolidor fica pendente.
    unmount();
    const removidos = remove.mock.calls.filter(([tipo]) => tipo === 'click').length;
    expect(removidos).toBe(1);
    remove.mockRestore();
  });

  it('um gesto novo descarta o engolidor anterior em vez de acumular', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const onLongPress = vi.fn();
    function Alvo() {
      const handlers = useLongPress({ onLongPress, allowSelf: true });
      return <button type="button" data-testid="host" {...handlers} />;
    }
    render(<Alvo />);
    const host = screen.getByTestId('host');
    pressionar(host);
    avancar(LIMIAR);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    // Passa a janela de 700 ms para o guard não absorver o segundo reconhecimento.
    avancar(800);
    pressionar(host);
    avancar(LIMIAR);
    expect(onLongPress).toHaveBeenCalledTimes(2);
    const removidos = remove.mock.calls.filter(([tipo]) => tipo === 'click').length;
    expect(removidos).toBeGreaterThanOrEqual(1);
    remove.mockRestore();
  });
});