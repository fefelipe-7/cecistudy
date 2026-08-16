import type { NavTab, NavScreen, WizardFlow, QuizConfig, QuizAnswer, QuizPlayState } from '../types';

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
  streak?: boolean;
  /** Diário de estágio (tela cheia de todos os registros, empilhada sobre o perfil). */
  internshipDiary?: boolean;
  /** Tela cheia do meu TCC (criar/manter), empilhada sobre o perfil. */
  tcc?: boolean;
  /** Tela cheia de stickers & conquistas, empilhada sobre o perfil. */
  stickers?: boolean;
  /** Quiz: tela de escolha de filtros/categoria. */
  quizCategory?: boolean;
  /** Quiz: tela de jogo (pergunta + alternativas). */
  quizPlay?: boolean;
  /** Quiz: tela de resultado/estatísticas. */
  quizResult?: boolean;
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
  /** Detalhe de abordagem (ex.: `#/biblioteca/abordagens/:id`). */
  approachId?: string;
  /** Tela de famílias de psicoterapias (ex.: `#/biblioteca/familias`). */
  families?: boolean;
  /** Detalhe de uma família (ex.: `#/biblioteca/familias/:famId`). */
  familyId?: string;
}

/** Valores de sub-tab conhecidos por aba (usados para distinguir sub-tab de courseId na rota). */
const SUB_TAB_BY_TAB: Record<string, string[]> = {
  faculdade: ['disciplinas', 'aulas', 'avaliacoes', 'calendario'],
  estudos: ['sessoes', 'leituras', 'flashcards', 'questoes', 'historico'],
  biblioteca: ['materiais', 'autores', 'conceitos', 'abordagens', 'mapa'],
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
  internship: 'estagio',
  session: 'estudo',
  author: 'autor',
};

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '').split('/');
  const seg = h[0];

  if (seg === 'streak') return { tab: 'home', streak: true };

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

  // Abordagem detalhe: `#/biblioteca/abordagens/:id`
  if (seg === 'biblioteca' && h[1] === 'abordagens' && h[2]) {
    return { tab: 'biblioteca', approachId: h[2] };
  }

  // Famílias de psicoterapias: `#/biblioteca/familias` e `#/biblioteca/familias/:famId`
  if (seg === 'biblioteca' && h[1] === 'familias') {
    if (h[2]) return { tab: 'biblioteca', familyId: h[2] };
    return { tab: 'biblioteca', families: true };
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
    if (seg === 'perfil' && h[1] === 'estagio') {
      return { tab: 'perfil', internshipDiary: true };
    }
    if (seg === 'perfil' && h[1] === 'tcc') {
      return { tab: 'perfil', tcc: true };
    }
    if (seg === 'perfil' && h[1] === 'stickers') {
      return { tab: 'perfil', stickers: true };
    }
    if (seg === 'estudos' && h[1] === 'quiz') {
      return { tab: 'estudos', quizCategory: true };
    }
    if (h[1] === 'streak') return { tab: seg as NavTab, streak: true };
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
  if (route.streak) return [...baseStackFor(route.tab ?? 'home'), { kind: 'streak' }];
  if (route.internshipDiary) return [{ kind: 'tab', tab: 'perfil' }, { kind: 'internshipDiary' }];
  if (route.tcc) return [{ kind: 'tab', tab: 'perfil' }, { kind: 'tcc' }];
  if (route.stickers) return [{ kind: 'tab', tab: 'perfil' }, { kind: 'stickers' }];
  if (route.notes) return [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }];
  if (route.temple) return [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'temple' }];
  if (route.approachId) {
    return [...baseStackFor('biblioteca'), { kind: 'approach', approachId: route.approachId }];
  }
  if (route.familyId) {
    return [...baseStackFor('biblioteca'), { kind: 'family', familyId: route.familyId }];
  }
  if (route.families) {
    return [...baseStackFor('biblioteca'), { kind: 'families' }];
  }
  if (route.quizCategory) {
    return [...baseStackFor('estudos'), { kind: 'quiz-category' }];
  }
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
  if (top.kind === 'streak') {
    const base = stack[0];
    const tab = base?.kind === 'tab' ? base.tab : 'home';
    return tab === 'home' ? '#/streak' : `#/${tab}/streak`;
  }
  if (top.kind === 'internshipDiary') return '#/perfil/estagio';
  if (top.kind === 'tcc') return '#/perfil/tcc';
  if (top.kind === 'stickers') return '#/perfil/stickers';
  if (top.kind === 'notes') return '#/biblioteca/notas';
  if (top.kind === 'temple') return '#/biblioteca/templo';
  if (top.kind === 'course') return `#/faculdade/${top.courseId}`;
  if (top.kind === 'approach') {
    return `#/biblioteca/abordagens/${top.approachId}`;
  }
  if (top.kind === 'families') return '#/biblioteca/familias';
  if (top.kind === 'family') return `#/biblioteca/familias/${top.familyId}`;
  if (top.kind === 'quiz-category') return '#/estudos/quiz';
  if (top.kind === 'quiz-play') return '#/quiz/play';
  if (top.kind === 'quiz-result') return '#/quiz/result';
  const base = `#/${top.tab}`;
  const subtab = subTab && subTab !== DEFAULT_SUB_TAB[top.tab] ? subTab : undefined;
  return subtab ? `${base}/${subtab}` : base;
}
