import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reconhecimento de **clique curto × pressionamento prolongado** numa máquina de
 * estados explícita.
 *
 * Por que um hook só, e não o `useLongPress` que já existe (`useLongPress.ts`):
 * aquele ignora alvos interativos (`input, a, button, …`) — que é exatamente o
 * alvo do botão de voltar — e o gesto dele é "card abre menu universal", não
 * "mesmo botão, dois resultados". Duplicar a máquina aqui dentro seria a dívida;
 * o que muda é a **semântica**, não o reconhecimento. O limiar e a tolerância
 * moram em `src/lib/motion/tokens.ts` (`LONG_PRESS_MS`), para o valor ficar num
 * lugar só depois de ajuste com usuária.
 *
 * Estados: `idle` → `pressing` → (`longPress` | `cancelled`) → `idle`.
 *
 * Invariante central: **um gesto físico produz no máximo um resultado**. Depois
 * de reconhecer o pressed longo, o `click` que o navegador sintetiza depois do
 * `pointerup` é engolido (`suppressClickRef`), então compactar e voltar não
 * acontecem juntos.
 *
 * `onPress` NÃO é chamado no `pointerup`: quem chama é o `click` nativo, que já
 * resolve teclado (Enter/Espaço), mouse e toque com o mesmo caminho.
 */

/** Reconhecimento do pressed prolongado (ms). Token único, ajustável. */
export const LONG_PRESS_MS = 500;

/** Tolerância de movimento antes de cancelar o gesto (px). */
export const PRESS_MOVE_TOLERANCE_PX = 10;

/** Janela de guarda: `touch` longo também pode gerar `contextmenu` no Android. */
const CONTEXTMENU_GUARD_MS = 700;

export type PressPhase = 'idle' | 'pressing' | 'longPress' | 'cancelled';

export interface PressGestureOptions {
  /** Toque curto encerrado (disparado pelo `click` nativo). */
  onPress: () => void;
  /** Pressionamento prolongado reconhecido. */
  onLongPress: () => void;
  /** Notifica cada mudança de fase — é o que alimenta o feedback visual. */
  onPhaseChange?: (phase: PressPhase) => void;
  /** Desliga o reconhecimento (ex.: durante uma transição em andamento). */
  disabled?: boolean;
}

export interface PressGesture {
  phase: PressPhase;
  /** Espalha no elemento: `<button {...handlers}>` (React) ou `bind` (nativo). */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
}

export function usePressGesture({
  onPress,
  onLongPress,
  onPhaseChange,
  disabled = false,
}: PressGestureOptions): PressGesture {
  const [phase, setPhase] = useState<PressPhase>('idle');

  // Refs, não estado: o timer e a janela de supressão não podem renderizar.
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressClickRef = useRef(false);
  const lastLongPressRef = useRef(0);
  const stateRef = useRef({ onPress, onLongPress, onPhaseChange, disabled });
  stateRef.current = { onPress, onLongPress, onPhaseChange, disabled };

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Publica a fase e **mata o timer**. Não mexe em `startRef`: enquanto o dedo
   * está na tela o contato é o mesmo, e o `pointermove` precisa das coordenadas
   * de origem para decidir se saiu da tolerância.
   */
  const goTo = useCallback(
    (next: PressPhase) => {
      clearTimer();
      setPhase((current) => (current === next ? current : next));
      stateRef.current.onPhaseChange?.(next);
    },
    [clearTimer],
  );

  /** Fim do contato: libera o timer e o ponto de origem. */
  const endGesture = useCallback(() => {
    clearTimer();
    startRef.current = null;
    setPhase((current) => (current === 'idle' ? current : 'idle'));
    stateRef.current.onPhaseChange?.('idle');
  }, [clearTimer]);

  /** Reconhece o pressed longo — usado pelo timer e pelo `contextmenu`. */
  const recognizeLongPress = useCallback(() => {
    if (stateRef.current.disabled) return;
    const now = Date.now();
    if (now - lastLongPressRef.current < CONTEXTMENU_GUARD_MS) return;
    lastLongPressRef.current = now;
    suppressClickRef.current = true;
    goTo('longPress');
    stateRef.current.onLongPress();
  }, [goTo]);

  // Nenhum timer sobrevive ao unmount (o componente pode sair no meio do gesto).
  useEffect(() => clearTimer, [clearTimer]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (stateRef.current.disabled) return;
      // Só o contato principal: botão secundário do mouse não inicia gesto.
      if (e.button !== 0) return;
      // Contato já em curso não é reiniciado por um segundo dedo.
      if (startRef.current) return;
      // A supressão é por gesto: um novo contato começa limpo, mesmo que o
      // `click` do gesto anterior nunca tenha chegado (cancelamento do SO).
      suppressClickRef.current = false;
      // A janela de guarda do `contextmenu` vale **dentro** do contato: sem
      // reset, dois gestures próximos (alternar rápido expand/compact) não
      // reconheciam o segundo.
      lastLongPressRef.current = 0;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      goTo('pressing');
      timerRef.current = window.setTimeout(recognizeLongPress, LONG_PRESS_MS);
    },
    [goTo, recognizeLongPress],
  );

  const cancelIfMoved = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start || start.id !== e.pointerId) return;
      if (phase !== 'pressing') return;
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > PRESS_MOVE_TOLERANCE_PX || dy > PRESS_MOVE_TOLERANCE_PX) {
        // Saiu da tolerância: o gesto vira arrasto/cancelamento, então o
        // `click` que o navegador sintetiza no `pointerup` também é engolido.
        suppressClickRef.current = true;
        goTo('cancelled');
      }
    },
    [goTo, phase],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (start && start.id !== e.pointerId) return;
      // `cancelled` e `longPress` já decidiram: soltar não executa nada — o
      // clique curto é o `click` nativo, e ele só acontece se a fase era
      // `pressing` quando o dedo saiu.
      endGesture();
    },
    [endGesture],
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (startRef.current && startRef.current.id !== e.pointerId) return;
      endGesture();
    },
    [endGesture],
  );

  const onClick = useCallback((e: React.MouseEvent) => {
    if (!suppressClickRef.current) {
      if (!stateRef.current.disabled) stateRef.current.onPress();
      return;
    }
    // O `click` do mesmo contato que já reconheceu o pressed longo: engolido
    // aqui e **não** propagado, senão um handler ancestral também dispara.
    suppressClickRef.current = false;
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Botão direito no desktop é o mesmo "pressed longo" (paridade de
      // entrada) — sem isso, o gesto existiria só no toque.
      e.preventDefault();
      recognizeLongPress();
    },
    [recognizeLongPress],
  );

  return {
    phase,
    handlers: {
      onPointerDown,
      onPointerMove: cancelIfMoved,
      onPointerUp,
      onPointerCancel,
      onPointerLeave: onPointerCancel,
      onClick,
      onContextMenu,
    },
  };
}
