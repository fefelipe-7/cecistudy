import {
  Activity,
  ArrowRightCircle,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Edit2,
  FileText,
  HeartHandshake,
  Link2,
  ListChecks,
  PenLine,
  Timer,
  Users,
  Zap,
  Pencil,
  StickyNote,
  UserPlus,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type {
  Course,
  InternshipWizardSeed,
  NavScreen,
  NavTab,
  StudyScreen,
  WizardFlow,
} from '../types';

/**
 * Ações contextuais da **barra inferior contextual** (telas auxiliares).
 *
 * É o irmão de `headerConfig.ts`: mesma forma (função pura que recebe o topo da
 * pilha + um punhado de handlers e devolve configuração declarativa), mesmo
 * dono (o `navigationEngine` memoiza). A barra **não** consulta rota nem estado:
 * ela recebe isto pronto.
 *
 * Layout da barra (SPEC-021): duas peças de vidro pura (`liquid-glass-nav`),
 * igual tamanho, centralizadas na base da tela:
 *  - esquerda: ação principal (ícone + rótulo + setinha de expansão para cima
 *    quando há mais de uma candidata);
 *  - direita: "voltar" + seta (toque sempre navega).
 *
 * Quando não há ação principal candidata, só a peça de "voltar" é renderizada,
 * centralizada, no tamanho normal.
 *
 * Por que só em telas auxiliares: a barra de abas (`BottomNav`) já ocupa a base
 * das telas primárias (`isBottomNavVisible = kind === 'tab'`), e as telas de
 * formulário (compose/wizards) têm `FixedBottomBar`/`WizardScaffoldFooter`.
 * Onde há auxiliar empilhado, a barra contextual é o rodapé de ação.
 */

/**
 * A folha (sheet) aberta da tela do TCC (SPEC-022 D3).
 *
 * Mora no **contexto do app**, e não na view, porque a barra contextual e o
 * conteúdo abrem a **mesma** folha: são a mesma porta, e porta não tem dois
 * donos. `id` é o id da entidade — `'new'` cria.
 */
export type TccSheet =
  | { type: 'chapter'; id: string }
  | { type: 'reference'; id: string }
  | { type: 'meeting'; id: string; intent: 'agendar' | 'registrar' }
  | { type: 'task'; id: string }
  | { type: 'writing' }
  | { type: 'capture' };

export interface ContextBarAction {
  /** id estável dentro do contexto (a seleção sobrevive à troca de tela). */
  id: string;
  /** Rótulo curto do botão da ação principal. */
  label: string;
  /** Rótulo acessível — pode ser mais completo que o visual. */
  ariaLabel: string;
  Icon: ComponentType<{ className?: string }>;
  /** Executa a ação. Promise = operação assíncrona (a barra mostra o estado). */
  onSelect: () => void | Promise<void>;
  /** Ação destrutiva — pintada com a cor de perigo. */
  destructive?: boolean;
  /** Visível porém indisponível (a barra não esconde ação, ela informa). */
  disabled?: boolean;
}

export interface ContextBarConfig {
  /** Identidade do contexto. Troca = a seleção da ação principal reinicia. */
  contextKey: string;
  /** Candidatas ao botão principal. A 1ª é a selecionada por padrão.
   * Quando vazio, só a barra de "voltar" é renderizada. Com 2 ou mais, a
   * setinha de expansão aparece (SPEC-021 D2 · SPEC-022 D6). */
  primaryActions: ContextBarAction[];
}

/** Handlers que a barra pode acionar. Todos vêm do `navigationEngine`. */
export interface ContextBarConfigActions {
  openWizard: (flow: WizardFlow, courseId?: string, seed?: InternshipWizardSeed) => void;
  openCompose: (courseId?: string) => void;
  openEditCourse: (courseId?: string) => void;
  toggleBookmarkCourse: (courseId: string) => void;
  setIsCreatingLooseNote: (value: boolean) => void;
  openSearch: () => void;
  openStudy: (screen: StudyScreen) => void;
  openInternshipWizard: (seed?: InternshipWizardSeed) => void;
  /** Abre a folha da tela do TCC (SPEC-022 D3). */
  openTccSheet: (sheet: TccSheet) => void;
  /** Abre a folha de captura de link com o texto do clipboard (D3). */
  openTccCapture: () => Promise<void>;
  /** Abre o wizard de sessão já com o caso do paciente preenchido (D1). */
  openInternshipCaseSession: () => void;
  /** Vai para uma aba da base (mesma porta que o botão da tela usa). */
  handleNavigate: (tab: NavTab, subTab?: string) => void;
}

export interface ContextBarConfigInput extends ContextBarConfigActions {
  currentScreen: NavScreen;
  /** `screenKey` do topo da pilha — identidade estável do contexto. */
  screenKey: string;
  focusedCourse: Course | undefined;
  bookmarkedCourseIds: string[];
}

/**
 * Quais telas **recebem** a barra contextual (SPEC-022 D8).
 *
 * O tipo é `Record<NavScreen['kind'], boolean>`: o **compilador** é o gate.
 * Um `kind` novo no `NavScreen` sem linha aqui quebra o build — que é
 * exatamente o que a lista copiada à mão (`KIND_COM_RODAPE_PROPRIO`, que já
 * divergiu: o quiz em andamento recebia a barra por cima) não fazia.
 *
 * `false` = a tela não recebe a barra. `true` = recebe; se a tela não tiver
 * ação contextual, a barra mostra só "voltar".
 */
export const BARRA_APARECE: Record<NavScreen['kind'], boolean> = {
  // Aba primária: a barra de abas ocupa a base.
  tab: false,
  // Fluxos de formulário: são overlay, com o próprio rodapé.
  compose: false,
  composeDetails: false,
  noteDetail: false,
  noteTransform: false,
  wizard: false,
  // Telas que já têm rodapé próprio (`FixedBottomBar`).
  classNote: false,
  'quiz-category': false,
  'quiz-group-detail': false,
  'quiz-result': false,
  // Fluxos modais em tela cheia: a barra ficaria por cima do conteúdo.
  'quiz-loading': false,
  'quiz-play': false,
  // Calendário empilhado: tem seu próprio rodapé (SPEC-024 D4).
  calendar: false,
  // Desktop: sem barra contextual (o rodapé é outro).
  'knowledge-graph': false,
  projects: false,
  inbox: false,
  // Demais telas auxiliares: a barra aparece.
  course: true,
  'repertorioItem': true,
  notes: true,
  temple: true,
  templeSection: true,
  comparison: true,
  streak: true,
  internshipDiary: true,
  internshipCase: true,
  tcc: true,
  stickers: true,
  sync: true,
  termHistory: true,
  approach: true,
  families: true,
  family: true,
  // `study` tem sub-telas: `focus` (imersiva, sem chrome) e `leituras` (tem
  // `FixedBottomBar`) ficam de fora — decididas abaixo, por sub-tela.
  study: true,
};

const NOME_DO_CURSO = 'disciplina';

/** Monta a configuração da barra para o topo da pilha.
 * `null` = a barra não aparece neste contexto (aba primária, fluxo de
 * formulário, tela de foco imersiva ou tela que já tem rodapé).
 */
export function buildContextBarConfig(input: ContextBarConfigInput): ContextBarConfig | null {
  const {
    currentScreen,
    screenKey,
    focusedCourse,
    bookmarkedCourseIds,
    openWizard,
    openCompose,
    openEditCourse,
    openInternshipWizard,
    openStudy,
    openTccSheet,
    openTccCapture,
    openInternshipCaseSession,
    handleNavigate,
    setIsCreatingLooseNote,
  } = input;

  if (!BARRA_APARECE[currentScreen.kind]) return null;
  // A sessão de foco imersiva é full-screen landscape sem chrome.
  if (currentScreen.kind === 'study' && currentScreen.screen === 'focus') return null;
  // `study > leituras` já tem rodapé (ReadingTrackerScreen via FixedBottomBar).
  if (currentScreen.kind === 'study' && currentScreen.screen === 'leituras') return null;

  const base = { contextKey: screenKey };

  /* ------------------------------------------------------------------ */
  // Estágio > diário: nova anotação
  //
  // A barra é a **dona da primária** no Estágio desde 2026-10-19 (SPEC-022
  // D2-ii): o herói cedeu a ação para a barra. A semente é a mesma que o
  // herói usava — sem ela, o wizard abria no passo "tipo" e a usuária
  // escolhia de novo.
  if (
    currentScreen.kind === 'internshipDiary' &&
    currentScreen.tab === 'diario'
  ) {
    return {
      ...base,
      primaryActions: [
        {
          id: 'nova-anotacao-estagio',
          label: 'anotar',
          ariaLabel: 'anotar no diário do estágio',
          Icon: StickyNote,
          onSelect: () => openInternshipWizard(),
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  // Estágio > pacientes: novo atendimento
  if (
    currentScreen.kind === 'internshipDiary' &&
    currentScreen.tab === 'pacientes'
  ) {
    return {
      ...base,
      primaryActions: [
        {
          id: 'novo-atendimento',
          label: 'anotar atendimento',
          ariaLabel: 'anotar novo atendimento de estágio',
          Icon: HeartHandshake,
          onSelect: () => openInternshipWizard({ kind: 'atendimento_clinico' }),
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  // Estágio > supervisão: nova supervisão
  if (
    currentScreen.kind === 'internshipDiary' &&
    currentScreen.tab === 'supervisao'
  ) {
    return {
      ...base,
      primaryActions: [
        {
          id: 'nova-supervisao',
          label: 'anotar supervisão',
          ariaLabel: 'anotar nova supervisão de estágio',
          Icon: Activity,
          onSelect: () => openInternshipWizard({ kind: 'supervisao' }),
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  // Estágio > caso do paciente: nova sessão, já com o paciente preenchido.
  // A semente é montada pelo motor (`openInternshipCaseSession`), que conhece
  // o caso derivado — a barra não sabe nada do paciente além da chave.
  if (currentScreen.kind === 'internshipCase') {
    return {
      ...base,
      primaryActions: [
        {
          id: 'nova-sessao-caso',
          label: 'nova sessão',
          ariaLabel: 'nova sessão com o paciente',
          Icon: HeartHandshake,
          onSelect: () => openInternshipCaseSession(),
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  // Estudos > revisar: criar flashcard
  if (currentScreen.kind === 'study' && currentScreen.screen === 'revisar') {
    return {
      ...base,
      primaryActions: [
        {
          id: 'criar-flashcard',
          label: 'criar flashcard',
          ariaLabel: 'criar um novo flashcard',
          Icon: Zap,
          onSelect: () => openWizard('flashcard'),
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  // Estudos > histórico: somente voltar (sem ação principal)
  if (currentScreen.kind === 'study' && currentScreen.screen === 'historico') {
    return { ...base, primaryActions: [] };
  }

  /* ------------------------------------------------------------------ */
  // TCC
  //
  // A barra do TCC executa a **mesma** função que a tela executa (D1): a
  // folha que o botão do conteúdo abre é a folha que a barra abre. Antes
  // esta barra abria wizards globais — "adicionar capítulos" abria a edição
  // completa do TCC, "registrar escrita" criava uma tarefa — e as cinco
  // folhas do TCC (`TccView.tsx:1174-1204`) ficavam fora do seu alcance.
  //
  // Visão geral é a única aba em que o **herói** expõe a primária
  // ("registrar escrita"), então a barra não a repete: mostra só "voltar"
  // (D2-i).
  if (currentScreen.kind === 'tcc') {
    const tab = currentScreen.tab ?? 'visao';
    if (tab === 'visao') return { ...base, primaryActions: [] };

    if (tab === 'capitulos') {
      return {
        ...base,
        primaryActions: [
          {
            id: 'tcc-capitulos',
            label: 'adicionar capítulo',
            ariaLabel: 'adicionar capítulo ao seu tcc',
            Icon: ListChecks,
            onSelect: () => openTccSheet({ type: 'chapter', id: 'new' }),
          },
        ],
      };
    }

    if (tab === 'leituras') {
      return {
        ...base,
        primaryActions: [
          {
            id: 'tcc-leituras',
            label: 'nova referência',
            ariaLabel: 'nova referência no seu tcc',
            Icon: BookOpen,
            onSelect: () => openTccSheet({ type: 'reference', id: 'new' }),
          },
          {
            id: 'tcc-guardar-link',
            label: 'guardar link',
            ariaLabel: 'guardar um link do clipboard como referência',
            Icon: Link2,
            onSelect: () => openTccCapture(),
          },
        ],
      };
    }

    if (tab === 'orientacao') {
      return {
        ...base,
        primaryActions: [
          {
            id: 'tcc-orientacao',
            label: 'agendar reunião',
            ariaLabel: 'agendar nova reunião de orientação do tcc',
            Icon: Users,
            onSelect: () =>
              openTccSheet({ type: 'meeting', id: 'new', intent: 'agendar' }),
          },
          {
            id: 'tcc-pendencia',
            label: 'adicionar pendência',
            ariaLabel: 'adicionar pendência da orientação do tcc',
            Icon: ListChecks,
            onSelect: () => openTccSheet({ type: 'task', id: 'new' }),
          },
        ],
      };
    }

    if (tab === 'escrita') {
      return {
        ...base,
        primaryActions: [
          {
            id: 'tcc-escrita',
            label: 'registrar escrita',
            ariaLabel: 'registrar escrita do seu tcc',
            Icon: PenLine,
            onSelect: () => openTccSheet({ type: 'writing' }),
          },
        ],
      };
    }

    return { ...base, primaryActions: [] };
  }

  /* ------------------------------------------------------------------ */
  // Biblioteca > notas: nova nota — o **formulário inline** da tela, e não o
  // `compose` (que é outro fluxo para a mesma coisa).
  if (currentScreen.kind === 'notes') {
    return {
      ...base,
      primaryActions: [
        {
          id: 'nova-nota',
          label: 'nova nota',
          ariaLabel: 'nova nota avulsa',
          Icon: StickyNote,
          onSelect: () => setIsCreatingLooseNote(true),
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  // Faculdade > disciplina: as mesmas ações do menu "novo registro" da
  // tela (`CourseCreateMenu.tsx:16-21`) — quatro candidatas, para a setinha
  // de expansão existir de verdade.
  if (currentScreen.kind === 'course' && focusedCourse) {
    return {
      ...base,
      primaryActions: [
        {
          id: 'anotar-aula',
          label: 'anotar aula',
          ariaLabel: `anotar aula em ${NOME_DO_CURSO} ${focusedCourse.name ?? focusedCourse.id}`,
          Icon: FileText,
          onSelect: () => openCompose(focusedCourse.id),
        },
        {
          id: 'nova-prova',
          label: 'nova prova',
          ariaLabel: `registrar nova prova em ${NOME_DO_CURSO} ${focusedCourse.name ?? focusedCourse.id}`,
          Icon: ClipboardList,
          onSelect: () => openWizard('exam', focusedCourse.id),
        },
        {
          id: 'registrar-estudo',
          label: 'registrar estudo',
          ariaLabel: `registrar estudo em ${NOME_DO_CURSO} ${focusedCourse.name ?? focusedCourse.id}`,
          Icon: Timer,
          onSelect: () => openWizard('session', focusedCourse.id),
        },
        {
          id: 'registrar-leitura',
          label: 'registrar leitura',
          ariaLabel: `registrar leitura em ${NOME_DO_CURSO} ${focusedCourse.name ?? focusedCourse.id}`,
          Icon: BookOpen,
          onSelect: () => openWizard('reading', focusedCourse.id),
        },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  // Biblioteca > templo / seções / comparações / abordagens / famílias:
  // somente voltar (sem ação principal)
  if (
    currentScreen.kind === 'temple' ||
    currentScreen.kind === 'templeSection' ||
    currentScreen.kind === 'comparison' ||
    currentScreen.kind === 'approach' ||
    currentScreen.kind === 'family'
  ) {
    return { ...base, primaryActions: [] };
  }

  /* ------------------------------------------------------------------ */
  // Perfil > histórico de períodos: somente voltar (sem ação principal)
  if (currentScreen.kind === 'termHistory') {
    return { ...base, primaryActions: [] };
  }

  /* ------------------------------------------------------------------ */
  // Streak: o **mesmo destino** do botão da tela ("bora estudar?" →
  // estudos › sessões). Antes a barra ia para a revisão de flashcards — outra
  // coisa, com o mesmo rótulo.
  if (currentScreen.kind === 'streak') {
    return {
      ...base,
      primaryActions: [
        {
          id: 'ir-para-estudar',
          label: 'ir para estudar',
          ariaLabel: 'ir para estudar, como o botão da tela',
          Icon: ArrowRightCircle,
          onSelect: () => handleNavigate('estudos', 'sessoes'),
        },
      ],
    };
  }

  // Demais telas auxiliares sem ação principal cadastrada: somente voltar.
  return { ...base, primaryActions: [] };
}
