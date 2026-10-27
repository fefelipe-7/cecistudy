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
 *
 * `kind` define o comportamento de isolamento:
 * - `modal`: trava scroll, aplica `inert` no conteúdo de trás, fecha com `Esc`/back.
 * - `popover`: menu leve, sem trava de scroll nem `inert`; fecha com `Esc`/back.
 * - `fullscreen`: ocupa a tela, sem trava de scroll nem `inert`; fecha com `Esc`/back.
 *
 * Apenas `modal` isola o conteúdo de trás. Popover/fullscreen não trancam a
 * tela: a usuária continua podendo interagir com o que está por baixo.
 */

type OverlayKind = 'modal' | 'popover' | 'fullscreen';

type Entry = { id: number; close: () => void; kind: OverlayKind };

const stack: Entry[] = [];
let nextId = 1;

let lockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

const doc = (): Document | null => (typeof document === 'undefined' ? null : document);

/** Conteúdo de trás. O portal do `Modal` fica em `body`, fora de `#root`. */
const appRoot = (): HTMLElement | null => doc()?.getElementById('root') ?? null;

const isModalStack = (): boolean => stack.some((entry) => entry.kind === 'modal');

/** Handler global de `Esc`: fecha o topo da pilha, qualquer `kind`. */
let escapeBound = false;
const onEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && hasOverlay()) closeTopOverlay();
};
const bindEscape = () => {
  if (escapeBound || typeof document === 'undefined') return;
  document.addEventListener('keydown', onEscape);
  escapeBound = true;
};
const unbindEscape = () => {
  if (!escapeBound) return;
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onEscape);
  }
  escapeBound = false;
};

const lockScroll = () => {
  if (lockCount > 0) {
    lockCount += 1;
    return;
  }
  const body = doc()?.body;
  if (body) {
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
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
export const pushOverlay = (close: () => void, kind: OverlayKind = 'modal'): number => {
  const id = nextId;
  nextId += 1;
  stack.push({ id, close, kind });
  if (stack.length === 1) bindEscape();
  if (kind === 'modal') lockScroll();
  return id;
};

export const removeOverlay = (id: number): void => {
  const index = stack.findIndex((entry) => entry.id === id);
  if (index === -1) return;
  const entry = stack[index];
  stack.splice(index, 1);
  if (stack.length === 0) unbindEscape();
  if (entry.kind === 'modal') unlockScroll();
};

export const isTopOverlay = (id: number): boolean =>
  stack.length > 0 && stack[stack.length - 1].id === id;

export const hasOverlay = (): boolean => stack.length > 0;

/** Somente modais isolam o conteúdo de trás. */
export const hasModal = (): boolean => isModalStack();

/**
 * Fecha o overlay do topo. `true` se havia algo para fechar — é o que o back do
 * Android e o `Esc` usam antes de popar a tela. Fecha qualquer `kind`.
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
  nextId = 1;
  lockCount = 0;
  savedOverflow = '';
  savedPaddingRight = '';
  unbindEscape();
  appRoot()?.removeAttribute('inert');
};
