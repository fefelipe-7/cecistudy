import type { NavTab, NavScreen, WizardFlow } from '../types';

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
  /** Wizard de criação em tela cheia (ex.: `#/novo/conceito`, `#/faculdade/c3/novo/prova`). */
  wizard?: WizardFlow;
  /** Sub-tab da aba base, codificada no hash (ex.: `#/estudos/leituras`). */
  subTab?: string;
  /** Aba base sob a qual a composição/wizard foi empilhada (default: home). */
  baseTab?: NavTab;
  /** Curso sob o qual a composição/wizard foi empilhada (ex.: `faculdade/c3`). */
  baseCourseId?: string;
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

const NAV_TABS: NavTab[] = ['home', 'faculdade', 'estudos', 'biblioteca', 'perfil'];

/** Slug de URL ↔ tipo de wizard (rota `#/novo/:slug`). */
const WIZARD_SLUGS: Record<string, WizardFlow> = {
  tarefa: 'task',
  prova: 'exam',
  'prova-atividade': 'task-exam',
  leitura: 'reading',
  flashcard: 'flashcard',
  conceito: 'concept',
  estagio: 'internship',
  estudo: 'session',
  autor: 'author',
};
const WIZARD_SLUG_TO_TYPE: Record<WizardFlow, string> = {
  task: 'tarefa',
  exam: 'prova',
  'task-exam': 'prova-atividade',
  reading: 'leitura',
  flashcard: 'flashcard',
  concept: 'conceito',
  internship: 'estagio',
  session: 'estudo',
  author: 'autor',
};

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '').split('/');
  const seg = h[0];

  if (seg === 'mood') return { mood: true };

  // Telas de composição: "nota" (e "detalhes") pode aparecer em qualquer nível,
  // com base opcional codificada antes — ex.: `#/biblioteca/nota`, `#/faculdade/c3/nota/detalhes`.
  const notaIdx = h.indexOf('nota');
  if (notaIdx !== -1) {
    const prefix = h.slice(0, notaIdx);
    let baseTab: NavTab = 'home';
    let baseCourseId: string | undefined;
    if (prefix[0] === 'faculdade' && prefix[1]) {
      baseTab = 'faculdade';
      baseCourseId = prefix[1];
    } else if (prefix.length === 1 && (NAV_TABS as string[]).includes(prefix[0])) {
      baseTab = prefix[0] as NavTab;
    } else if (prefix.length > 0) {
      return { tab: 'home' }; // rota de composição inválida → home
    }
    const composeDetails = h[notaIdx + 1] === 'detalhes';
    return {
      baseTab,
      baseCourseId,
      ...(composeDetails ? { composeDetails: true } : { compose: true }),
    };
  }

  // Telas de wizard: "novo" pode aparecer em qualquer nível, com base opcional antes
  // — ex.: `#/novo/conceito`, `#/faculdade/c3/novo/prova`.
  const novoIdx = h.indexOf('novo');
  if (novoIdx !== -1) {
    const prefix = h.slice(0, novoIdx);
    let baseTab: NavTab = 'home';
    let baseCourseId: string | undefined;
    if (prefix[0] === 'faculdade' && prefix[1]) {
      baseTab = 'faculdade';
      baseCourseId = prefix[1];
    } else if (prefix.length === 1 && (NAV_TABS as string[]).includes(prefix[0])) {
      baseTab = prefix[0] as NavTab;
    } else if (prefix.length > 0) {
      return { tab: 'home' }; // rota de wizard inválida → home
    }
    const type = h[novoIdx + 1] ? WIZARD_SLUGS[h[novoIdx + 1]] : undefined;
    if (!type) return { tab: 'home' };
    return { baseTab, baseCourseId, wizard: type };
  }

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

/** Pilha base para telas auxiliares empilhadas sobre uma aba (+ curso opcional). */
function baseStackFor(baseTab: NavTab, baseCourseId?: string): NavScreen[] {
  if (baseTab === 'faculdade' && baseCourseId) {
    return [{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: baseCourseId }];
  }
  return [{ kind: 'tab', tab: baseTab }];
}

/** Reconstrói a pilha de navegação a partir da rota hash. */
export function routeToStack(route: Route): NavScreen[] {
  if (route.composeDetails) {
    return [...baseStackFor(route.baseTab ?? 'home', route.baseCourseId), { kind: 'composeDetails' }];
  }
  if (route.compose) {
    return [...baseStackFor(route.baseTab ?? 'home', route.baseCourseId), { kind: 'compose' }];
  }
  if (route.wizard) {
    return [...baseStackFor(route.baseTab ?? 'home', route.baseCourseId), { kind: 'wizard', type: route.wizard }];
  }
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
  if (top.kind === 'composeDetails' || top.kind === 'compose') {
    const base = stack[0];
    const course = stack[1]?.kind === 'course' ? stack[1] : undefined;
    const tab = base?.kind === 'tab' ? base.tab : 'home';
    const suffix = top.kind === 'composeDetails' ? '/detalhes' : '';
    if (tab !== 'home') {
      const prefix = course ? `#/${tab}/${course.courseId}` : `#/${tab}`;
      return `${prefix}/nota${suffix}`;
    }
    return `#/nota${suffix}`;
  }
  if (top.kind === 'wizard') {
    const base = stack[0];
    const course = stack[1]?.kind === 'course' ? stack[1] : undefined;
    const tab = base?.kind === 'tab' ? base.tab : 'home';
    const suffix = WIZARD_SLUG_TO_TYPE[top.type];
    if (tab !== 'home') {
      const prefix = course ? `#/${tab}/${course.courseId}` : `#/${tab}`;
      return `${prefix}/novo/${suffix}`;
    }
    return `#/novo/${suffix}`;
  }
  if (top.kind === 'mood') return '#/mood';
  if (top.kind === 'notes') return '#/biblioteca/notas';
  if (top.kind === 'temple') return '#/biblioteca/templo';
  if (top.kind === 'course') return `#/faculdade/${top.courseId}`;
  const base = `#/${top.tab}`;
  const subtab = subTab && subTab !== DEFAULT_SUB_TAB[top.tab] ? subTab : undefined;
  return subtab ? `${base}/${subtab}` : base;
}
