/**
 * Contrato de "intenção de navegação" (SPEC-007 §D1/§D2).
 *
 * Uma única verdade responde: **para onde a tela que entra está indo, e para
 * onde a tela que sai está indo?** Em vez de um escalar adivinhado por
 * `stack.length` (que erra `c1 → c2`, ver `deriveIntent`), a intenção é
 * derivada da **prefixo-comum** das duas pilhas — que, sendo pilhas, dá uma
 * classificação exata e total.
 *
 * Módulo **puro** (exceto o transporte de Context em §5.4, que é o mesmo
 * padrão já usado pelo `src/lib/motion.ts` legado).
 */

import type { NavScreen } from '../../types/navigation';

/** Como a navegação mudou a pilha. */
export type NavKind =
  /** Nada mudou (atualização de payload, não navegação). */
  | 'none'
  /** `prev` é prefixo de `next` — foi mais fundo na pilha. */
  | 'push'
  /** `next` é prefixo de `prev` — voltou. */
  | 'pop'
  /** Mesma raiz de aba, ramo diferente (`#/faculdade/c1` → `#/faculdade/c2`). */
  | 'replace'
  /** Raiz de aba diferente — a pilha foi resetada. */
  | 'tab';

export interface NavIntent {
  readonly kind: NavKind;
  /** +1 = indo mais fundo · -1 = voltando · 0 = lateral/mesmo nível. */
  readonly dir: -1 | 0 | 1;
  /** Índice do topo antes (profundidade, 0-based). */
  readonly fromDepth: number;
  /** Índice do topo depois. */
  readonly toDepth: number;
  /** px onde o gesto de borda soltou. Só válido com `fromGesture`. */
  readonly gestureX: number;
  /** O pop veio do gesto de borda (e não do botão de voltar). */
  readonly fromGesture: boolean;
  /** Perfil de movimento reduzido está ativo. */
  readonly reduced: boolean;
}

export const IDLE_INTENT: NavIntent = Object.freeze({
  kind: 'none',
  dir: 0,
  fromDepth: 0,
  toDepth: 0,
  gestureX: 0,
  fromGesture: false,
  reduced: false,
});

/**
 * Identidade de rota de um `NavScreen` — **sem payload**.
 *
 * `NavScreen` é uma união heterogênea e alguns kinds carregam objetos grandes e
 * voláteis (`quiz-play.state`, `quiz-result.answers/pool`). Comparar pilhas com
 * deep-equal seria caro e, pior, daria `replace` onde houve só uma troca de
 * payload dentro da mesma tela. Aqui só entram os campos que identificam o
 * **destino**, que é justamente o que o `hash` serializa.
 */
export const screenIdentity = (screen: NavScreen): string => {
  switch (screen.kind) {
    case 'tab':
      return `tab:${screen.tab}`;
    case 'course':
      return `course:${screen.courseId}`;
    case 'classNote':
      return `classNote:${screen.courseId}:${screen.classNoteId}`;
    case 'repertorioItem':
      return `repertorioItem:${screen.courseId}:${screen.itemId}`;
    case 'templeSection':
      return `templeSection:${screen.section}`;
    case 'comparison':
      return `comparison:${screen.slug}`;
    case 'noteDetail':
      return `noteDetail:${screen.noteId}`;
    case 'noteTransform':
      return `noteTransform:${screen.noteId}`;
    case 'wizard':
      return `wizard:${screen.type}`;
    case 'termHistory':
      return `termHistory:${screen.termId ?? ''}`;
    case 'approach':
      return `approach:${screen.approachId}`;
    case 'family':
      return `family:${screen.familyId}`;
    case 'quiz-group-detail':
      return `quiz-group-detail:${screen.group}`;
    case 'study':
      return `study:${screen.screen}`;
    // Demais kinds não carregam id: a identidade é o próprio kind.
    default:
      return screen.kind;
  }
};

/** Quantas telas do início das duas pilhas são a mesma rota. */
const commonPrefix = (prev: readonly NavScreen[], next: readonly NavScreen[]): number => {
  const max = Math.min(prev.length, next.length);
  let common = 0;
  while (common < max && screenIdentity(prev[common]!) === screenIdentity(next[common]!)) {
    common += 1;
  }
  return common;
};

/** Raiz de aba do fundo da pilha (a base). `null` se a pilha não começa numa aba. */
const tabRoot = (stack: readonly NavScreen[]): string | null => {
  const base = stack[0];
  return base?.kind === 'tab' ? base.tab : null;
};

export interface DeriveIntentOptions {
  /** px onde o gesto de borda soltou. */
  gestureX?: number;
  /** O pop veio do gesto de borda. */
  fromGesture?: boolean;
  /** Perfil reduzido ativo. */
  reduced?: boolean;
}

/**
 * Deriva a intenção de navegação a partir das duas pilhas.
 *
 * | condição                                  | `kind`    | `dir` |
 * |-------------------------------------------|-----------|-------|
 * | pilhas com o mesmo conteúdo               | `none`    | `0`   |
 * | `next` é prefixo de `prev`                | `pop`     | `-1`  |
 * | `prev` é prefixo de `next`                | `push`    | `+1`  |
 * | mesma raiz de aba, ramo diferente         | `replace` | `0`   |
 * | raiz de aba diferente                     | `tab`     | `0`   |
 *
 * `replace` é o ganho sobre a direção por `stack.length`: trocar de uma disciplina
 * para outra **não** deve empurrar a tela cheia — é uma troca lateral.
 */
export function deriveIntent(
  prev: readonly NavScreen[],
  next: readonly NavScreen[],
  opts: DeriveIntentOptions = {},
): NavIntent {
  const fromDepth = Math.max(0, prev.length - 1);
  const toDepth = Math.max(0, next.length - 1);
  const base = {
    fromDepth,
    toDepth,
    gestureX: opts.gestureX ?? 0,
    fromGesture: opts.fromGesture ?? false,
    reduced: opts.reduced ?? false,
  };

  const common = commonPrefix(prev, next);
  if (common === prev.length && common === next.length) {
    return { kind: 'none', dir: 0, ...base };
  }
  if (common === next.length) {
    return { kind: 'pop', dir: -1, ...base };
  }
  if (common === prev.length) {
    return { kind: 'push', dir: 1, ...base };
  }

  const prevRoot = tabRoot(prev);
  const nextRoot = tabRoot(next);
  if (prevRoot !== null && prevRoot === nextRoot) {
    return { kind: 'replace', dir: 0, ...base };
  }
  return { kind: 'tab', dir: 0, ...base };
}

// ---------------------------------------------------------------------------
// Transporte (SPEC-007 §5.4 — corrige o bug B2)
// ---------------------------------------------------------------------------

/**
 * A instância que **sai** de um `AnimatePresence` tem props congeladas do último
 * render: a direção fresca e o offset do gesto não chegam por props. Por isso o
 * `intent` viaja por um canal de módulo, escrito de forma **síncrona antes** de
 * cada navegação e consumido **uma única vez** pela variante de exit.
 *
 * O canal carrega o `NavIntent` **inteiro**. A versão anterior
 * (`setNavMotionContext(direction, gestureX)`) quebrava porque o segundo escritor
 * — `setStack` — chamava sem `gestureX` e **resetava para 0** o offset que o
 * gesto de borda tinha acabado de escrever (bug B2). Por isso `setMotionIntent`
 * é chamado **uma vez por navegação** (ver `setStack`), nunca duas.
 */
let currentIntent: NavIntent = IDLE_INTENT;

/** Escreve a intenção da navegação que está começando. Uma vez por navegação. */
export const setMotionIntent = (intent: NavIntent): void => {
  currentIntent = intent;
};

/** Lê a intenção atual e volta ao ocioso. Usado pela variante de `exit`. */
export const consumeMotionIntent = (): NavIntent => {
  const intent = currentIntent;
  currentIntent = IDLE_INTENT;
  return intent;
};

/** Só para teste/inspeção: o `intent` pendente sem consumir. */
export const peekMotionIntent = (): NavIntent => currentIntent;

/**
 * Intent de um pop disparado pelo **gesto de borda**.
 *
 * O gesto não conhece a pilha (e não deve: é UI compartilhada, sem plumbing de
 * navegação). Ele só sabe que vai ocorrer um pop e onde o dedo soltou — que é tudo
 * que a variante de `exit` precisa para partir do ponto certo, sem salto de
 * continuidade. `setStack` reconhece `fromGesture` e **preserva** este intent em
 * vez de derivar outro (bug B2).
 */
export const gesturePopIntent = (gestureX: number, reduced = false): NavIntent => ({
  kind: 'pop',
  dir: -1,
  fromDepth: 0,
  toDepth: 0,
  gestureX,
  fromGesture: true,
  reduced,
});
