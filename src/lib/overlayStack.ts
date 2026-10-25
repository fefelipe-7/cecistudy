/**
 * Pilha de overlays abertos (SPEC-M-027 D8 · I5, I6, I7).
 *
 * **Um só lugar decide quem é o topo.** Antes, cada `Modal` tinha o próprio
 * listener de `Esc`: com dois abertos, os dois fechavam. O back do Android
 * conhecia cinco overlays por nome e ignorava o resto. Aqui o `Esc`, o back, a
 * trava de scroll e o `inert` do conteúdo de trás leem a mesma pilha.
 *
 * Estado de processo, não React: o `Modal` entra ao abrir e sai ao fechar. Fora
 * do navegador (SSR/teste sem DOM) é inerte — as funções degradam para no-op.
 */

type Entry = { id: number; close: () => void };

const stack: Entry[] = [];
let nextId = 1;

let lockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

const doc = (): Document | null => (typeof document === 'undefined' ? null : document);

/** Conteúdo de trás. O portal do `Modal` fica em `body`, fora daqui. */
const appRoot = (): HTMLElement | null => doc()?.getElementById('root') ?? null;

const lockScroll = () => {
  if (lockCount > 0) {
    lockCount += 1;
    return;
  }
  const body = doc()?.body;
  if (body) {
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    // Compensa a barra de rolagem que some — sem isso o layout anda alguns px.
    const gap = (doc()?.documentElement.clientWidth ?? 0) > 0
      ? window.innerWidth - (doc()?.documentElement.clientWidth ?? 0)
      : 0;
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.overflow = 'hidden';
  }
  appRoot()?.setAttribute('inert', '');
  lockCount = 1;
};

const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  const body = doc()?.body;
  if (body) {
    body.style.overflow = savedOverflow;
    body.style.paddingRight = savedPaddingRight;
  }
  appRoot()?.removeAttribute('inert');
};

/** Registra um overlay aberto. Devolve o id para `removeOverlay`. */
export const pushOverlay = (close: () => void): number => {
  const id = nextId;
  nextId += 1;
  stack.push({ id, close });
  lockScroll();
  return id;
};

export const removeOverlay = (id: number): void => {
  const index = stack.findIndex((entry) => entry.id === id);
  if (index === -1) return;
  stack.splice(index, 1);
  unlockScroll();
};

export const isTopOverlay = (id: number): boolean =>
  stack.length > 0 && stack[stack.length - 1].id === id;

export const hasOverlay = (): boolean => stack.length > 0;

/**
 * Fecha o overlay do topo. `true` se havia algo para fechar — é o que o back do
 * Android usa antes de popar a tela.
 */
export const closeTopOverlay = (): boolean => {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.close();
  return true;
};

/** Zera o estado entre casos de teste (o módulo é de processo). */
export const resetOverlayStackForTests = (): void => {
  stack.length = 0;
  lockCount = 0;
  savedOverflow = '';
  savedPaddingRight = '';
  appRoot()?.removeAttribute('inert');
};
