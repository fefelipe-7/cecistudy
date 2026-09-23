import {
  CheckCircle2,
  FileText,
  GitCompare,
  HeartHandshake,
  Lightbulb,
  Pencil,
  Settings2,
  StickyNote,
  User,
  Wrench,
} from 'lucide-react';
import type {
  ClassNote,
  Course,
  CourseIconName,
  DynamicHeaderConfig,
  HeaderAction,
  NavScreen,
  PsicoterapiaFamily,
  PsychologyApproach,
  QuizPlayState,
  StudyScreen,
  TempleSection,
  WizardFlow,
} from '../types';

/** Metadados das seções do templo (título/ícone/cor do header detail). */
export const TEMPLE_SECTION_META: Record<
  TempleSection,
  { title: string; subtitle: string; icon: CourseIconName; color: string; Icon: typeof Lightbulb }
> = {
  conceitos: {
    title: 'conceitos',
    subtitle: 'ideias-chave da psicologia, por domínio',
    icon: 'Lightbulb',
    color: '#4A879F',
    Icon: Lightbulb,
  },
  autores: {
    title: 'autores',
    subtitle: 'pensadores e instituições do acervo',
    icon: 'User',
    color: '#756354',
    Icon: User,
  },
  tecnicas: {
    title: 'técnicas',
    subtitle: 'instrumentos clínicos e como aplicá-los',
    icon: 'Wrench',
    color: '#43805B',
    Icon: Wrench,
  },
  comparacoes: {
    title: 'comparações',
    subtitle: 'lado a lado das abordagens para entender diferenças e pontes',
    icon: 'HeartHandshake',
    color: '#8C7338',
    Icon: GitCompare,
  },
};

export interface HeaderConfigActions {
  onBack: () => void;
  openWizard: (flow: WizardFlow, courseId?: string) => void;
  openCompose: (courseId?: string) => void;
  openEditCourse: () => void;
  openEditTcc: () => void;
  toggleBookmarkCourse: (id: string) => void;
  setIsCreatingLooseNote: (value: boolean) => void;
  editManagedItem: (kind: 'class' | 'task' | 'exam', id: string) => void;
}

export interface HeaderConfigInput extends HeaderConfigActions {
  currentScreen: NavScreen;
  focusedFamily: PsicoterapiaFamily | null;
  focusedApproach: PsychologyApproach | null;
  focusedCourse: Course | undefined;
  focusedClassNote: ClassNote | undefined;
  bookmarkedCourseIds: string[];
  tccTitle: string;
  questionsCount: number;
  currentQuizPlayState: QuizPlayState | null;
  quizResultCorrectCount: number | null;
  quizResultTotalCount: number | null;
  dueCardsCount: number;
}

const STUDY_TITLES: Record<
  StudyScreen,
  { title: string; subtitle: string; icon: CourseIconName; color: string }
> = {
  focus: { title: 'sessão de foco', subtitle: 'timer em tela cheia, sem distrações', icon: 'Clock', color: '#D85F79' },
  revisar: { title: 'para revisar', subtitle: 'cartões esperando por você', icon: 'Brain', color: '#D85F79' },
  leituras: { title: 'leituras', subtitle: 'continue de onde você parou', icon: 'BookOpen', color: '#4A879F' },
  historico: { title: 'histórico', subtitle: 'tudo que você já estudou por aqui', icon: 'History', color: '#B94862' },
};

/** Constrói a config do header dinâmico a partir do topo da pilha (função pura). */
export function buildHeaderConfig(input: HeaderConfigInput): DynamicHeaderConfig | null {
  const {
    currentScreen,
    focusedFamily,
    focusedApproach,
    focusedCourse,
    bookmarkedCourseIds,
    tccTitle,
    questionsCount,
    currentQuizPlayState,
    quizResultCorrectCount,
    quizResultTotalCount,
    dueCardsCount,
    onBack,
    openWizard,
    openCompose,
    openEditCourse,
    openEditTcc,
    toggleBookmarkCourse,
    setIsCreatingLooseNote,
    editManagedItem,
    focusedClassNote,
  } = input;

  let headerConfig: DynamicHeaderConfig | null = null;

  if (currentScreen.kind === 'streak') {
    headerConfig = {
      type: 'detail',
      title: 'sua ofensiva de estudos',
      subtitle: 'a chama dos seus estudos ♡',
      icon: 'Flame',
      color: '#D85F79',
      onBack,
    };
  } else if (currentScreen.kind === 'internshipDiary') {
    headerConfig = {
      type: 'detail',
      title: 'diário de estágio',
      subtitle: 'todos os registros por extenso',
      icon: 'HeartHandshake',
      color: '#D85F79',
      onBack,
      actions: [
        { label: 'nova anotação', Icon: HeartHandshake, onClick: () => openWizard('internship') },
      ],
    };
  } else if (currentScreen.kind === 'tcc') {
    headerConfig = {
      type: 'detail',
      title: 'meu tcc',
      subtitle: tccTitle ? 'criando e mantendo seu trabalho' : 'ainda sem título',
      icon: 'GraduationCap',
      color: '#D85F79',
      onBack,
      actions: [
        { label: 'editar tcc', Icon: FileText, onClick: () => openEditTcc() },
      ],
    };
  } else if (currentScreen.kind === 'stickers') {
    headerConfig = {
      type: 'detail',
      title: 'stickers & conquistas',
      subtitle: 'celebrando cada passo do cantinho ♡',
      icon: 'Sparkles',
      color: '#D85F79',
      onBack,
    };
  } else if (currentScreen.kind === 'notes') {
    headerConfig = {
      type: 'detail',
      title: 'suas notas avulsas',
      subtitle: 'anotações rápidas e pensamentos soltos',
      icon: 'FileText',
      color: '#D85F79',
      onBack,
      actions: [
        { label: 'nova nota avulsa', Icon: StickyNote, onClick: () => setIsCreatingLooseNote(true) },
      ],
    };
  } else if (currentScreen.kind === 'temple') {
    headerConfig = {
      type: 'detail',
      title: 'templo de conhecimento',
      subtitle: 'mapa de famílias, conceitos, autores e técnicas',
      icon: 'Landmark',
      color: '#B94862',
      onBack,
    };
  } else if (currentScreen.kind === 'templeSection') {
    const meta = TEMPLE_SECTION_META[currentScreen.section];
    headerConfig = {
      type: 'detail',
      title: meta.title,
      subtitle: meta.subtitle,
      icon: meta.icon,
      color: meta.color,
      onBack,
    };
  } else if (currentScreen.kind === 'comparison') {
    headerConfig = {
      type: 'detail',
      title: 'comparação em estudo',
      subtitle: 'uma leitura lado a lado entre perspectivas',
      icon: 'HeartHandshake',
      color: '#8C7338',
      onBack,
    };
  } else if (currentScreen.kind === 'families') {
    headerConfig = {
      type: 'detail',
      title: 'famílias de psicoterapias',
      subtitle: '10 grupos de teorias e correntes clínicas',
      icon: 'Landmark',
      color: '#B94862',
      onBack,
    };
  } else if (currentScreen.kind === 'family' && focusedFamily) {
    headerConfig = {
      type: 'detail',
      title: focusedFamily.name,
      subtitle: `${focusedFamily.approachCount} abordagens nesta família`,
      code: String(focusedFamily.order).padStart(2, '0'),
      icon: 'Landmark',
      color: focusedFamily.color,
      onBack,
    };
  } else if (currentScreen.kind === 'approach' && focusedApproach) {
    headerConfig = {
      type: 'detail',
      title: focusedApproach.name,
      subtitle: focusedApproach.family ?? 'abordagem de psicoterapia',
      icon: 'Brain',
      color: focusedApproach.color,
      onBack,
    };
  } else if (currentScreen.kind === 'quiz-category') {
    headerConfig = {
      type: 'detail',
      title: 'novo quiz',
      subtitle: `${questionsCount} questões no acervo`,
      icon: 'Target',
      color: '#D85F79',
      onBack,
    };
  } else if (currentScreen.kind === 'quiz-loading') {
    headerConfig = {
      type: 'detail',
      title: 'preparando o quiz',
      subtitle: 'escrevendo suas questões',
      icon: 'Sparkles',
      color: '#D85F79',
      onBack,
    };
  } else if (currentScreen.kind === 'study') {
    const meta = STUDY_TITLES[currentScreen.screen];
    const subtitle =
      currentScreen.screen === 'revisar'
        ? `${dueCardsCount} cartões esperando por você`
        : meta.subtitle;
    headerConfig = {
      type: 'detail',
      title: meta.title,
      subtitle,
      icon: meta.icon,
      color: meta.color,
      onBack,
    };
  } else if (currentScreen.kind === 'quiz-play') {
    const playState = currentQuizPlayState;
    headerConfig = {
      type: 'detail',
      title: 'quiz',
      subtitle:
        playState && playState.pool.length > 0
          ? `questão ${playState.currentIdx + 1} de ${playState.pool.length}`
          : 'só um minutinho...',
      icon: 'Target',
      color: '#4A879F',
      onBack,
    };
  } else if (currentScreen.kind === 'quiz-result') {
    headerConfig = {
      type: 'detail',
      title: 'resultado do quiz',
      subtitle:
        quizResultTotalCount && quizResultTotalCount > 0
          ? `${quizResultCorrectCount} de ${quizResultTotalCount} • ${Math.round((quizResultCorrectCount! / quizResultTotalCount) * 100)}% de acerto`
          : 'quiz finalizado ♡',
      icon: 'Trophy',
      color: '#B94862',
      onBack,
    };
  } else if (currentScreen.kind === 'classNote' && focusedClassNote) {
    const note = focusedClassNote;
    const title = note.number ? `aula ${note.number} • ${note.title}` : note.title;
    headerConfig = {
      type: 'detail',
      title,
      subtitle: `${focusedCourse?.name ?? 'anotação de aula'} • ${note.date}`,
      icon: 'FileText',
      color: focusedCourse?.color ?? '#D85F79',
      onBack,
      actions: [
        {
          label: 'editar aula',
          Icon: Pencil,
          onClick: () => editManagedItem('class', note.id),
        },
      ],
    };
  } else if (currentScreen.kind === 'repertorioItem') {
    const REPERTORIO_ITEM_META: Record<
      string,
      { title: string; icon: CourseIconName; color: string }
    > = {
      'con-': { title: 'conceito-chave', icon: 'Lightbulb', color: '#4A879F' },
      'aut-': { title: 'autor fundamental', icon: 'User', color: '#756354' },
      'r-': { title: 'leitura', icon: 'BookOpen', color: '#43805B' },
      'm-': { title: 'material', icon: 'FileText', color: '#6D6366' },
      'cat-': { title: 'livro do catálogo', icon: 'BookOpen', color: '#4A879F' },
      'inter-': { title: 'livro complementar', icon: 'BookOpen', color: '#8C7338' },
      'art-': { title: 'artigo do catálogo', icon: 'FileText', color: '#B94862' },
    };
    const prefix = Object.keys(REPERTORIO_ITEM_META).find((p) =>
      currentScreen.itemId.startsWith(p)
    );
    const meta = prefix ? REPERTORIO_ITEM_META[prefix] : REPERTORIO_ITEM_META['r-'];
    headerConfig = {
      type: 'detail',
      title: meta.title,
      subtitle: `do repertório de ${focusedCourse?.name ?? 'sua disciplina'}`,
      icon: meta.icon,
      color: meta.color,
      onBack,
    };
  } else if (currentScreen.kind === 'course' && focusedCourse) {
    const isBookmarked = bookmarkedCourseIds.includes(focusedCourse.id);
    const courseActions: HeaderAction[] = [
      { label: 'nova anotação de aula', Icon: FileText, onClick: () => openCompose(focusedCourse.id) },
      { label: 'nova prova / avaliação', Icon: CheckCircle2, onClick: () => openWizard('exam', focusedCourse.id) },
      { label: 'editar detalhes da matéria', Icon: Settings2, onClick: () => openEditCourse() },
    ];
    headerConfig = {
      type: 'detail',
      title: focusedCourse.name,
      subtitle: `${focusedCourse.code || 'sem código'} • ${focusedCourse.professor}`,
      code: focusedCourse.code || 'sem código',
      icon: focusedCourse.icon,
      color: focusedCourse.color,
      onBack,
      isBookmarked,
      onToggleBookmark: () => toggleBookmarkCourse(focusedCourse.id),
      actions: courseActions,
    };
  }
  return headerConfig;
}