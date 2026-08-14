import type { NavTab, NavScreen } from '../types';

/**
 * Rota virtual (espelho do `location.hash`).
 * A pilha de navegação é a fonte da verdade; a rota permite deep-link,
 * voltar/avançar do browser e o histórico do webview (swipe-back do iOS).
 */
export interface Route {
  tab?: NavTab;
  focusedCourseId?: string | null;
  notes?: boolean;
  temple?: boolean;
  mood?: boolean;
  compose?: boolean;
  composeDetails?: boolean;
  /** Sub-tab da aba base, codificada no hash (ex.: `#/estudos/leituras`). */
  subTab?: string;
}

/** Valores de sub-tab conhecidos por aba (usados para distinguir sub-tab de courseId na rota). */
const SUB_TAB_BY_TAB: Record<string, string[]> = {
  faculdade: ['disciplinas', 'aulas', 'avaliacoes', 'calendario'],
  estudos: ['sessoes', 'leituras', 'flashcards', 'questoes', 'historico'],
  biblioteca: ['materiais', 'autores', 'conceitos', 'abordagens', 'mapa'],
  perfil: ['jornada', 'stickers', 'estagio', 'tcc', 'configuracoes'],
};

/** Sub-tab padrão de cada aba (não é codificada no hash — mantém URLs limpas). */
export const DEFAULT_SUB_TAB: Record<NavTab, string> = {
  home: 'home',
  faculdade: 'disciplinas',
  estudos: 'sessoes',
  biblioteca: 'autores',
  perfil: 'jornada',
};

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '').split('/');
  const seg = h[0];

  if (seg === 'mood') return { mood: true };
  if (h[0] === 'nota' && h[1] === 'detalhes') return { composeDetails: true };
  if (seg === 'nota') return { compose: true };

  const subtab = (tab: string): string | undefined => {
    if (!h[1]) return undefined;
    return SUB_TAB_BY_TAB[tab]?.includes(h[1]) ? h[1] : undefined;
  };

  if (!seg || seg === 'home') return { tab: 'home' };
  if (seg === 'faculdade') {
    const s = subtab('faculdade');
    if (s) return { tab: 'faculdade', subTab: s };
    return { tab: 'faculdade', focusedCourseId: h[1] || null };
  }
  if (seg === 'biblioteca') {
    if (h[1] === 'notas') return { tab: 'biblioteca', notes: true };
    if (h[1] === 'templo') return { tab: 'biblioteca', temple: true };
    const s = subtab('biblioteca');
    if (s) return { tab: 'biblioteca', subTab: s };
    return { tab: 'biblioteca' };
  }
  if (seg === 'estudos' || seg === 'perfil') {
    const s = subtab(seg);
    if (s) return { tab: seg as NavTab, subTab: s };
    return { tab: seg as NavTab };
  }
  return { tab: 'home' };
}

/** Reconstrói a pilha de navegação a partir da rota hash. */
export function routeToStack(route: Route): NavScreen[] {
  if (route.composeDetails) {
    return [{ kind: 'tab', tab: 'home' }, { kind: 'compose' }, { kind: 'composeDetails' }];
  }
  if (route.compose) return [{ kind: 'tab', tab: 'home' }, { kind: 'compose' }];
  if (route.mood) return [{ kind: 'tab', tab: 'home' }, { kind: 'mood' }];
  if (route.notes) return [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }];
  if (route.temple) return [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'temple' }];
  if (route.tab === 'faculdade' && route.focusedCourseId) {
    return [{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: route.focusedCourseId }];
  }
  return [{ kind: 'tab', tab: route.tab ?? 'home' }];
}

/**
 * Serializa a pilha em uma rota hash.
 * Sub-tab da aba base é incluída quando for diferente da padrão (ex.: `#/estudos/leituras`).
 */
export function stackToHash(stack: NavScreen[], subTab?: string): string {
  const top = stack[stack.length - 1];
  if (top.kind === 'composeDetails') return '#/nota/detalhes';
  if (top.kind === 'compose') return '#/nota';
  if (top.kind === 'mood') return '#/mood';
  if (top.kind === 'notes') return '#/biblioteca/notas';
  if (top.kind === 'temple') return '#/biblioteca/templo';
  if (top.kind === 'course') return `#/faculdade/${top.courseId}`;
  const base = `#/${top.tab}`;
  const subtab = subTab && subTab !== DEFAULT_SUB_TAB[top.tab] ? subTab : undefined;
  return subtab ? `${base}/${subtab}` : base;
}
