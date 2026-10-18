import React, { useCallback, useEffect, useRef } from 'react';

/**
 * Long-press (mobile) + clique com botão direito (desktop).
 *
 * - `pointerdown` + 500ms parado (≤10px de movimento) dispara `onLongPress`.
 * - O `click` que vem logo depois de um long-press é engolido (não chama `onClick`).
 * - `contextmenu` (botão direito) dispara `onLongPress` direto no desktop e é
 *   bloqueado (não abre o menu nativo do navegador).
 * - Long-press em elementos interativos (input, textarea, select, `a`, botões)
 *   não é iniciado — não conflita com toggles/links internos.
 *
 * ## A armadilha do `<button>` — `allowSelf`
 *
 * `INTERACTIVE_SELECTOR` inclui `button`, e o guard compara `e.target.closest(...)`.
 * Quando os handlers estão colados **num** botão — como no botão de voltar da barra
 * contextual (SPEC-M-018 D2) — o `closest` encontra o próprio host e o hook
 * **nunca dispara**. `allowSelf` compara o elemento encontrado com
 * `e.currentTarget`: se forem o mesmo nó, o gesto passa; um `input` aninhado
 * continua bloqueado. Sem essa prop, os dois jeitos de usar o hook se excluem.
 *
 * ## Ciclo de vida
 *
 * O timer é limpo no `pointerup`/`leave`/`cancel`, no movimento acima da
 * tolerância **e no unmount** (`useEffect` de cleanup). Antes o unmount não
 * limpava nada: um componente desmontado no meio do pressionar recebia o
 * `onLongPress` depois de morto.
 */

/** Estados do gesto. `cancelled` é distinto de `idle`: houve toque e houve cancelamento. */
export type PressPhase = 'idle' | 'pressing' | 'longPressRecognized' | 'cancelled';

/** Elementos onde o long-press não deve disparar (interação própria). */
const INTERACTIVE_SELECTOR = 'input, textarea, select, a, button, [data-no-manage]';

/** Janela de segurança para não disparar duas vezes (touch → contextmenu móvel). */
const DOUBLE_FIRE_GUARD_MS = 700;

/**
 * Por quanto tempo o engolidor de `click` fica armado (SPEC-M-018 §6.4).
 *
 * O engolidor existe para o `click` que o navegador gera **no mesmo contato** que
 * produziu o long-press. Se a plataforma não emitir esse `click` — Android em
 * alguns aparelhos não emite — o engolidor fica armado e comeria o **próximo**
 * toque legítimo da usuária. A janela fecha essa brecha: passado o prazo, o
 * evento passa direto e o engolidor sai.
 *
 * 400 ms é folgado para a latência do clique sintético e curto para não engolir
 * um toque deliberado.
 */
const SWALLOW_WINDOW_MS = 400;

interface UseLongPressOptions {
  onLongPress: () => void;
  /** Chamado apenas em toque normal (sem long-press). */
  onClick?: () => void;
  thresholdMs?: number;
  moveTolerance?: number;
  /**
   * Permite que o próprio elemento que recebe os handlers também case com
   * `INTERACTIVE_SELECTOR`. Use quando o host for um `<button>` (barra
   * contextual). Padrão `false`, que preserva o comportamento dos consumidores
   * que colam os handlers num wrapper `div`.
   */
  allowSelf?: boolean;
  /**
   * Notifica cada transição do gesto. Usado para feedback progressivo durante
   * o pressionar (SPEC-M-018 §6.5) — não substitui o clique nem o retorno visual
   * do próprio elemento.
   */
  onPressPhase?: (phase: PressPhase) => void;
}

export function useLongPress({
  onLongPress,
  onClick,
  thresholdMs = 500,
  moveTolerance = 10,
  allowSelf = false,
  onPressPhase,
}: UseLongPressOptions) {
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const pressElRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastFireRef = useRef(0);
  /**
   * Listener `click` de engolimento ainda pendente. Ele só sai sozinho quando um
   * clique chega — num browser real sempre chega, mas entre um gesto e o
   * unmount ele ficaria registrado no `window` para sempre. Guardar a referência
   * é o que permite limpá-lo nos três pontos: unmount, gesto seguinte e
   * reconhecimento seguinte.
   */
  const swallowRef = useRef<((e: MouseEvent) => void) | null>(null);
  /** Instante do reconhecimento — delimita a janela do engolidor. */
  const armedAtRef = useRef(0);
  // Espelho síncrono do callback: os handlers são estáveis e não podem
  // depender de uma prop que muda a cada render (o guard de `fire` é temporal).
  const phaseCbRef = useRef(onPressPhase);
  phaseCbRef.current = onPressPhase;

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const setPhase = useCallback((phase: PressPhase) => {
    phaseCbRef.current?.(phase);
  }, []);

  /** Remove o engolidor pendente, se houver. Seguro para chamar sempre. */
  const dropSwallow = useCallback(() => {
    const pending = swallowRef.current;
    if (pending) {
      window.removeEventListener('click', pending, true);
      swallowRef.current = null;
    }
  }, []);

  // Unmount no meio do pressionar: sem isto o timer sobrevive ao componente e
  // `onLongPress` roda contra um componente morto.
  //
  // Deliberadamente **não** notifica `onPressPhase` aqui. Um callback disparado
  // de dentro de um cleanup significa rodar `setState` enquanto a árvore está
  // desmontando — que é exatamente o "setState em componente desmontado" que
  // este hook existe para evitar. E o feedback pressionado morre junto com o
  // elemento, então nada fica preso na tela.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      startRef.current = null;
      dropSwallow();
    };
  }, [dropSwallow]);

  const fire = useCallback(() => {
    const now = Date.now();
    if (now - lastFireRef.current < DOUBLE_FIRE_GUARD_MS) return;
    lastFireRef.current = now;
    clear();
    const pressedEl = pressElRef.current;
    pressElRef.current = null;
    const armedAt = Date.now();
    armedAtRef.current = armedAt;
    // Engole o click que a sequência pointerup → click geraria logo depois,
    // apenas se ele nascer dentro do elemento pressionado.
    const swallow = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const hit = pressedEl ? (target && pressedEl.contains(target)) : true;
      // Fora da janela, este clique **não** é o do gesto reconhecido: passa.
      const dentroDaJanela = Date.now() - armedAt < SWALLOW_WINDOW_MS;
      dropSwallow();
      if (!hit || !dentroDaJanela) return;
      e.stopPropagation();
      e.preventDefault();
    };
    // Reconhecer de novo substitui o engolidor anterior em vez de acumular.
    dropSwallow();
    window.addEventListener('click', swallow, true);
    swallowRef.current = swallow;
    setPhase('longPressRecognized');
    onLongPress();
  }, [clear, dropSwallow, onLongPress, setPhase]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (e.button !== 0) return;
      const interactive = target.closest?.(INTERACTIVE_SELECTOR);
      if (interactive) {
        // `allowSelf` compara com o host: o próprio botão passa, um input dentro
        // dele continua bloqueado.
        if (!allowSelf || interactive !== e.currentTarget) return;
      }
      clear();
      // Um gesto novo começa com o engolidor anterior descartado.
      dropSwallow();
      pressElRef.current = target;
      startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      timerRef.current = window.setTimeout(fire, thresholdMs);
      setPhase('pressing');
    },
    [allowSelf, clear, dropSwallow, fire, setPhase, thresholdMs],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start || start.id !== e.pointerId) return;
      if (
        Math.abs(e.clientX - start.x) > moveTolerance ||
        Math.abs(e.clientY - start.y) > moveTolerance
      ) {
        clear();
        setPhase('cancelled');
      }
    },
    [clear, moveTolerance, setPhase],
  );

  const handlePointerEnd = useCallback(
    (_e: React.PointerEvent) => {
      // Soltar o dedo **resolve** o gesto: se o limiar passou, o recognizer já
      // disparou; se não passou, o `click` decide. Nenhum dos dois é cancelamento.
      // Só devolve para `idle` se havia um pressionar em curso — depois do
      // reconhecimento o timer já limpou `startRef`, então não há duplicar fase.
      const wasPressing = startRef.current !== null;
      clear();
      if (wasPressing) setPhase('idle');
    },
    [clear, setPhase],
  );

  const handlePointerCancel = useCallback(
    (_e: React.PointerEvent) => {
      // O SO ou o navegador interrompeu (chamada entrante, gesto de volta do
      // sistema, contexto perdido): §6.3 passo 4 — feedback para, e **nenhuma**
      // das duas ações acontece.
      const wasPressing = startRef.current !== null;
      clear();
      if (wasPressing) setPhase('cancelled');
    },
    [clear, setPhase],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Long-press já engoliu o click no capture do window; aqui só segue o fluxo normal.
      void e;
      onClick?.();
    },
    [onClick],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      fire();
    },
    [fire],
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerLeave: handlePointerEnd,
    onPointerCancel: handlePointerCancel,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  };
}