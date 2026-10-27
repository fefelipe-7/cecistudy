/**
 * Container transform do cecistudy (SPEC-M-028 D25/D26).
 *
 * **O problema que este módulo resolve.** O app monta uma tela por vez
 * (`MobileAppShell`), e a tela que sai re-renderiza com o estado novo. Numa tela
 * com early return — o padrão do app — o card que a usuária tocou **desaparece**
 * no primeiro frame da navegação. Um par de `layoutId` não tem de onde partir.
 *
 * **A solução é uma camada, não um par.** No `pointerdown` o card é fotografado
 * (retângulo + clone do DOM). Depois da navegação, `MorphLayer` desenha esse
 * clone acima das duas telas e o leva até o retângulo do alvo no destino. A
 * origem pode desmontar: o clone não depende dela.
 *
 * **O que este módulo não faz.** Não decide navegação (`onClick` continua sendo
 * do card), não anima `width`/`height`/`top` (só `transform` e `opacity`) e não
 * toca em `prefers-reduced-motion` por conta própria — quem decide é o perfil.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { motion } from 'framer-motion';
import type { NavIntent } from './intent';
import type { MotionProfile } from './profile';
import { EASE } from './tokens';

/** Prazo do retrato capturado sem navegação (toque que virou scroll). */
const ORPHAN_MS = 600;
/** Quanto o `MorphLayer` espera a tela de destino (lazy) montar o alvo. */
const TARGET_WAIT_MS = 150;

export type MorphDirection = 'push' | 'pop';

export interface MorphRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface MorphPayload {
  readonly id: string;
  readonly direction: MorphDirection;
  /** Retângulo da origem, em coordenadas de viewport. */
  readonly rect: MorphRect;
  /** Clone do nó no instante do toque. `null` sem DOM (teste/SSR). */
  readonly clone: HTMLElement | null;
}

const rectOf = (element: Element | null): MorphRect | null => {
  if (!element || typeof element.getBoundingClientRect !== 'function') return null;
  const rect = element.getBoundingClientRect();
  if (!rect || (!rect.width && !rect.height)) return null;
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
};

const viewportRect = (): MorphRect => ({
  left: 0,
  top: 0,
  width: typeof window === 'undefined' ? 390 : window.innerWidth,
  height: typeof window === 'undefined' ? 844 : window.innerHeight,
});

/** Clona o nó sem ids duplicados (o original continua vivo ao lado). */
const cloneFor = (element: Element | null): HTMLElement | null => {
  if (!element || typeof element.cloneNode !== 'function') return null;
  const clone = element.cloneNode(true) as HTMLElement;
  const stripMorphMarks = (node: Element): void => {
    node.removeAttribute('data-morph-source');
    node.removeAttribute('data-morph-target');
  };
  if (typeof clone.querySelectorAll === 'function') {
    clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    // Sem isto a camada acharia a marca dentro do próprio clone e esconderia o
    // clone junto com a origem — o morph viraria um retângulo vazio.
    clone.querySelectorAll('[data-morph-source],[data-morph-target]').forEach(stripMorphMarks);
  }
  clone.removeAttribute?.('id');
  stripMorphMarks(clone);
  return clone;
};

// ---------------------------------------------------------------------------
// Store (estado de processo, como `overlayStack`)
// ---------------------------------------------------------------------------

let pending: MorphPayload | null = null;
let active: MorphPayload | null = null;
let target: { id: string; el: Element } | null = null;
let orphanTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();
const notify = (): void => {
  for (const listener of listeners) listener();
};

const clearOrphanTimer = (): void => {
  if (orphanTimer !== null) {
    clearTimeout(orphanTimer);
    orphanTimer = null;
  }
};

/**
 * Fotografa o card no `pointerdown`. **Não anima nada** — só guarda o retrato.
 *
 * Animar aqui seria animar todo toque: a maior parte dos `pointerdown` vira
 * rolagem. Quem promove o retrato a animação é `activateMorphForNavigation`,
 * chamado pelo motor de navegação quando a pilha de fato muda.
 */
export function beginMorph(id: string, element: Element | null, direction: MorphDirection = 'push'): void {
  const rect = rectOf(element);
  if (!rect) return;
  clearOrphanTimer();
  pending = { id, direction, rect, clone: cloneFor(element) };
  // Toque que não navegou: o retrato não sobrevive a este prazo.
  orphanTimer = setTimeout(() => {
    pending = null;
    orphanTimer = null;
  }, ORPHAN_MS);
}

/** O retrato capturado e ainda não consumido. Usado pelo motor de navegação. */
export const peekMorph = (): MorphPayload | null => pending;

/** A animação em curso. Usada pela camada. */
export const peekActiveMorph = (): MorphPayload | null => active;

/** Registra o âncora do destino enquanto ele está montado (é o que o pop usa). */
export function registerMorphTarget(id: string, element: Element | null): void {
  if (element) {
    target = { id, el: element };
    return;
  }
  if (target?.id === id) target = null;
}

/** O alvo registrado mais recente — a tela do topo da pilha. */
export const peekMorphTarget = (): { id: string; el: Element } | null => target;

/**
 * Promove o retrato a animação quando a navegação acontece.
 *
 * - **push**: a captura pendente vira a animação;
 * - **pop**: o `MorphTarget` da tela que está saindo vira a origem, e a camada
 *   procura o card no destino — se ele não estiver lá, cai no crossfade.
 *
 * Devolve `true` se existe animação ativa, para a intenção marcar `morph`.
 */
export function activateMorphForNavigation(intent: Pick<NavIntent, 'kind' | 'morph'>): boolean {
  if (intent.morph && pending) {
    clearOrphanTimer();
    active = pending;
    pending = null;
    notify();
    return true;
  }

  if (intent.kind === 'pop' && target) {
    const rect = rectOf(target.el);
    if (!rect) return false;
    clearOrphanTimer();
    active = { id: target.id, direction: 'pop', rect, clone: cloneFor(target.el) };
    notify();
    return true;
  }

  return false;
}

/** Encerra a animação (fim, timeout ou perfil reduzido). */
export function clearMorph(): void {
  clearOrphanTimer();
  pending = null;
  if (!active) return;
  active = null;
  notify();
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Zera o estado entre casos de teste (o módulo é de processo). */
export function resetMorphForTests(): void {
  clearOrphanTimer();
  pending = null;
  active = null;
  target = null;
  listeners.clear();
}

// ---------------------------------------------------------------------------
// Primitivas
// ---------------------------------------------------------------------------

/** Props que as primitivas compõem no filho — sem criar nó extra. */
type MorphChildProps = {
  'data-morph-source'?: string;
  'data-morph-target'?: string;
  onPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
  ref?: React.Ref<HTMLElement>;
};

const onlyChild = (children: React.ReactNode): React.ReactElement<MorphChildProps> =>
  React.Children.only(children) as React.ReactElement<MorphChildProps>;

const composeRefs =
  <T,>(first: React.Ref<T> | undefined, second: React.Ref<T>) =>
  (node: T | null): void => {
    for (const ref of [first, second]) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };

interface MorphPairProps {
  id: string;
  /** **Um** elemento. Sem nó extra: `popLayout` exige filho `motion` direto. */
  children: React.ReactElement;
}

interface MorphTargetProps {
  /** `null` = pass-through: o elemento não é alvo de morph nesta montagem. */
  id: string | null;
  children: React.ReactElement;
}

/**
 * Elementos que navegam para outro lugar **de dentro** do card (editar, excluir,
 * concluir). Capturar o morph neles faria o card voar para uma tela que não é o
 * destino dele — e o clone iria para o retângulo da tela inteira.
 */
const INNER_INTERACTIVE = 'button, a, input, textarea, select, [data-no-morph]';

/**
 * A origem: o card/linha que vira a tela.
 *
 * É **headless** de propósito. Um `<div>` em volta mudaria o layout de toda
 * lista (e quebraria `AnimatePresence mode="popLayout"`, que exige filho
 * `motion` direto). Aqui só entram um `data-*` e um `onPointerDown` composto.
 */
export const MorphSource: React.FC<MorphPairProps> = ({ id, children }) => {
  const child = onlyChild(children);
  const childDown = child.props.onPointerDown;
  return React.cloneElement(child, {
    'data-morph-source': id,
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      childDown?.(event);
      const target = event.target as Element | null;
      const inner = target?.closest?.(INNER_INTERACTIVE) ?? null;
      if (inner && inner !== event.currentTarget) return;
      beginMorph(id, event.currentTarget);
    },
  });
};

/**
 * O destino: o âncora do detalhe (hero, painel do sheet).
 *
 * Registra o alvo enquanto está montado — é o que permite o caminho inverso no
 * pop sem que `goBack` saiba nada de movimento.
 */
export const MorphTarget: React.FC<MorphTargetProps> = ({ id, children }) => {
  const child = onlyChild(children);
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (id) registerMorphTarget(id, node);
    },
    [id],
  );
  if (!id) return child;
  return React.cloneElement(child, {
    'data-morph-target': id,
    ref: composeRefs(child.props.ref, setRef),
  });
};

/** O clone é um nó do DOM real: React só empresta o lugar dele. */
const CloneHost: React.FC<{ node: HTMLElement | null }> = ({ node }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host || !node) return;
    node.style.width = '100%';
    node.style.margin = '0';
    host.appendChild(node);
    return () => {
      node.remove();
    };
  }, [node]);
  return <div ref={ref} className="h-full w-full" />;
};

interface MorphLayerProps {
  /** Perfil de movimento. O reduzido não desenha clone: as telas fazem fade. */
  profile: MotionProfile;
}

/**
 * A camada que desenha o clone acima das duas telas.
 *
 * Mora no shell, `pointer-events-none`, `z-[55]`: acima do `Modal` (z-50) e
 * abaixo do toast (z-60), que continua sendo a camada mais alta (D42).
 *
 * Cadeia de fallback (D26): alvo em até 150 ms → retângulo do alvo; sem alvo no
 * push → retângulo da tela; sem origem no pop → crossfade (nenhum clone).
 */
export const MorphLayer: React.FC<MorphLayerProps> = ({ profile }) => {
  const morph = useSyncExternalStore(subscribe, peekActiveMorph, peekActiveMorph);
  const [to, setTo] = useState<MorphRect | null>(null);

  // Acha o alvo (ou desiste) e define o retângulo de chegada.
  useEffect(() => {
    if (!morph) {
      setTo(null);
      return;
    }
    if (profile.reduced) {
      clearMorph();
      return;
    }

    const { id, direction } = morph;
    const selector =
      direction === 'push' ? `[data-morph-target="${id}"]` : `[data-morph-source="${id}"]`;
    const startedAt = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const look = () => {
      if (cancelled) return;
      const rect = rectOf(document.querySelector(selector));
      if (rect) {
        setTo(rect);
        return;
      }
      if (Date.now() - startedAt >= TARGET_WAIT_MS) {
        // Push sem alvo ainda é uma abertura: o clone vai para a tela. Pop sem
        // card é uma lista que mudou: crossfade, nada voa para lugar nenhum.
        if (direction === 'push') setTo(viewportRect());
        else clearMorph();
        return;
      }
      timer = setTimeout(look, 16);
    };
    look();

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [morph, profile.reduced]);

  // Esconde a origem enquanto o clone existe — é o que impede dois cards no
  // mesmo frame (I30). Roda antes do paint: o clone já está montado.
  useLayoutEffect(() => {
    if (!morph || !to) return;
    const selector =
      morph.direction === 'push'
        ? `[data-morph-source="${morph.id}"]`
        : `[data-morph-target="${morph.id}"]`;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const previous = nodes.map((node) => node.style.visibility);
    nodes.forEach((node) => {
      node.style.visibility = 'hidden';
    });
    return () => {
      nodes.forEach((node, index) => {
        node.style.visibility = previous[index] ?? '';
      });
    };
  }, [morph, to]);

  // Rede de segurança: se `onAnimationComplete` não vier (aba em background,
  // jsdom), o clone não fica no DOM.
  useEffect(() => {
    if (!morph || !to) return;
    const guard = setTimeout(() => clearMorph(), (profile.d.morph + 0.4) * 1000);
    return () => clearTimeout(guard);
  }, [morph, to, profile.d.morph]);

  if (!morph || !to) return null;

  const { rect } = morph;
  const scaleX = rect.width > 0 && Number.isFinite(to.width / rect.width) ? to.width / rect.width : 1;
  const scaleY =
    rect.height > 0 && Number.isFinite(to.height / rect.height) ? to.height / rect.height : 1;

  return (
    <motion.div
      aria-hidden
      data-morph-clone={morph.id}
      className="pointer-events-none fixed z-[55] overflow-hidden"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        transformOrigin: 'top left',
      }}
      initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
      animate={{
        x: to.left - rect.left,
        y: to.top - rect.top,
        scaleX,
        scaleY,
        // O conteúdo some no último terço: é o que troca o card pelo destino.
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: profile.d.morph,
        ease: EASE.emphasized,
        opacity: { duration: profile.d.morph, times: [0, 0.66, 1], ease: 'linear' },
      }}
      onAnimationComplete={() => clearMorph()}
    >
      <CloneHost node={morph.clone} />
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Helpers de par (um por fluxo)
// ---------------------------------------------------------------------------

/**
 * Origem e destino chamam **esta** função. Dois literais `note-${id}` em
 * arquivos diferentes é como o par deixaria de casar sem ninguém notar.
 *
 * O prefixo nunca é igual à chave de camada (`slideBaseKeyOf`): são dois
 * significados diferentes na mesma string, e a leitura confunde.
 */
export const sharedNoteId = (noteId: string): string => `note-${noteId}`;
export const sharedCourseId = (courseId: string): string => `course-card-${courseId}`;
export const sharedFamilyId = (familyId: string): string => `family-card-${familyId}`;
export const sharedApproachId = (approachId: string): string => `approach-card-${approachId}`;
export const sharedTempleId = (section: string): string => `temple-card-${section}`;
export const sharedQuizGroupId = (group: string): string => `quiz-group-card-${group}`;
export const sharedCaseId = (patientKey: string): string => `case-card-${patientKey}`;
export const sharedChapterId = (chapterId: string): string => `chapter-card-${chapterId}`;
export const sharedBookId = (bookId: string): string => `book-card-${bookId}`;
/**
 * Sem consumidor nesta onda: o par da linha do calendário resolve para o helper
 * do **destino** (`calendarDestination.morphIdForEntry`), porque a linha abre
 * nove destinos e só o hero da disciplina é alvo. Fica no contrato (§5) para o
 * fluxo cujo destino é a própria superfície do item.
 */
export const sharedEntryId = (entryId: string): string => `entry-card-${entryId}`;
