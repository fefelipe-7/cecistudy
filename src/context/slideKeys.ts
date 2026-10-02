/**
 * Derivação das chaves de camada (SPEC-007 Slice B, fecha B1/B4/B5).
 *
 * Antes estas chaves eram ternários de 20 níveis dentro do `navigationEngine`.
 * Viram funções puras aqui por três motivos:
 * 1. Dá para **testar** a derivação (o wiring do shell não tem teste de integração).
 * 2. Os kinds sem caso (`termHistory`) caíam silenciosamente no caso base — a
 *    cadeia não deixava o bug visível. Um `switch` com `default` explícito,
 *    somado a `UNKNOWN_SLIDE_KINDS`, torna isso observável.
 * 3. Acrescentar casos novos deixa de ser "mais um nível de ternário".
 *
 * Módulo **puro** (só tipos): sem React, sem DOM, sem hooks.
 */

import type { NavScreen } from '../types/navigation';

/** Kinds que vivem na camada overlay (fade+scale) — empilhadas ACIMA da de slide. */
export const OVERLAY_KINDS: ReadonlySet<NavScreen['kind']> = new Set<NavScreen['kind']>([
  'compose',
  'composeDetails',
  'wizard',
  'noteDetail',
  'noteTransform',
]);

/**
 * Chave da camada de slide horizontal.
 *
 * Cobre a base (tab/curso) e os auxiliares de 1º nível. Telas em camadas mais
 * profundas que são overlay (compose, wizard, nota) ficam **fora** desta chave —
 * elas não devem remontar a tela de baixo (Slice B da SPEC-002).
 *
 * @param screen  topo da pilha.
 * @param base    fundo da pilha, usado como fallback quando o topo é uma tela
 *                que não tem camada própria (a base é sempre o que fica visível).
 */
export function slideBaseKeyOf(screen: NavScreen, base: NavScreen | undefined): string {
  switch (screen.kind) {
    case 'tab':
      return `tab-${screen.tab}`;
    case 'course':
      return `course-${screen.courseId}`;
    // Sub-telas do curso são camada PRÓPRIA (B5): antes compartilhavam a key do
    // curso, o que remontava o CourseDetailView e perdia a sub-tab ativa.
    case 'classNote':
      return `classNote-${screen.courseId}-${screen.classNoteId}`;
    case 'repertorioItem':
      return `repertorioItem-${screen.courseId}-${screen.itemId}`;
    // O histórico de períodos é camada de slide própria (B1): antes caía no caso
    // base e, como a pilha é `[perfil, wizard semester, termHistory]`, o guard
    // de overlay impedia o bump de revisão ⇒ nenhuma animação acontecia.
    case 'termHistory':
      return `termHistory-${screen.termId ?? 'all'}`;
    case 'notes':
      return 'notes';
    // `noteDetail`/`noteTransform` são overlay: a base visível é a de notas.
    case 'noteDetail':
    case 'noteTransform':
      return 'notes';
    case 'temple':
      return 'temple';
    case 'templeSection':
      return `temple-${screen.section}`;
    case 'comparison':
      return `comparison-${screen.slug}`;
    case 'families':
      return 'families';
    case 'family':
      return `family-${screen.familyId}`;
    case 'approach':
      return `approach-${screen.approachId}`;
    case 'streak':
      return 'streak';
    case 'internshipDiary':
      return 'internshipDiary';
    case 'tcc':
      return 'tcc';
    case 'stickers':
      return 'stickers';
    case 'sync':
      return 'sync';
    case 'study':
      return `study-${screen.screen}`;
    case 'quiz-loading':
      return 'quiz-loading';
    // Kinds que são overlay: a camada de slide embaixo é a base da pilha.
    case 'compose':
    case 'composeDetails':
    case 'wizard':
      return base ? slideBaseKeyOf(base, base) : 'tab-home';
    default:
      // Kinds sem camada de slide própria (quiz de grupo/jogo/resultado, e os
      // kinds de desktop sem UI). A base da pilha é o que fica visível.
      return base ? slideBaseKeyOf(base, base) : 'tab-home';
  }
}

/** Chave da camada overlay — vazia quando não há overlay. */
export function overlayKeyOf(screen: NavScreen): string {
  switch (screen.kind) {
    case 'compose':
      return 'compose';
    case 'composeDetails':
      return 'composeDetails';
    case 'wizard':
      return `wizard-${screen.type}`;
    case 'noteDetail':
      return `noteDetail-${screen.noteId}`;
    case 'noteTransform':
      return `noteTransform-${screen.noteId}`;
    default:
      return '';
  }
}

/**
 * Kinds que não têm renderização em lugar nenhum do app (B4).
 *
 * `knowledge-graph`, `projects` e `inbox` são placeholders de desktop: se alguém
 * empilhar um deles, o app caía **silenciosamente** na aba base. Este conjunto
 * existe para o dispatcher avisar em vez de fingir que deu certo.
 */
export const UNKNOWN_SLIDE_KINDS: ReadonlySet<NavScreen['kind']> = new Set<NavScreen['kind']>([
  'knowledge-graph',
  'projects',
  'inbox',
]);

export const isUnknownSlideKind = (screen: NavScreen): boolean =>
  UNKNOWN_SLIDE_KINDS.has(screen.kind);

/**
 * O topo **não-overlay** da pilha — ou seja, a tela que a camada de slide está
 * renderizando de fato.
 *
 * Esta é a peça que faltava. A camada de slide é única e fica *embaixo* da de
 * overlay; logo, quem a identifica não é o topo da pilha, e sim o topo saltando
 * os kinds de overlay.
 *
 * Sem isso, abrir um compose *a partir do detalhe de uma disciplina* trocava a
 * `slideKey` de `course-c1` para `tab-faculdade` e remontava a tela de baixo —
 * a SPEC-002 Slide B cobria isso só quando a base era uma aba (o teste de
 * regressão usava `[tab] → [tab, compose]`, onde as duas chaves coincidem por
 * acaso e o bug passava despercebido).
 */
export function slideTopOf(stack: readonly NavScreen[]): NavScreen {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const screen = stack[i]!;
    if (!OVERLAY_KINDS.has(screen.kind)) return screen;
  }
  return HOME_FALLBACK;
}

/**
 * A camada de slide **precisa** remontar?
 *
 * A regra real é "o conteúdo da camada de slide mudou" — não um proxy sobre
 * `OVERLAY_KINDS`. A versão anterior ("nenhum dos dois topos é overlay") quebrava
 * em dois casos reais:
 * - `wizard semester → termHistory`: o topo **era** overlay, então a revisão não
 *   bumpara e a tela aparecia sem transição (B1).
 * - `classNote`/`repertorioItem`: sem key própria, o conteúdo não mudava mas a
 *   sub-tab do curso era perdida mesmo assim (B5).
 */
export const slideLayerChanged = (prev: readonly NavScreen[], next: readonly NavScreen[]): boolean =>
  slideBaseKeyOf(slideTopOf(next), next[0]) !== slideBaseKeyOf(slideTopOf(prev), prev[0]);

const HOME_FALLBACK: NavScreen = { kind: 'tab', tab: 'home' };
