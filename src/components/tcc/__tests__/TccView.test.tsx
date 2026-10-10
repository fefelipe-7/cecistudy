import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useEffect, useState } from 'react';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../../context/mobileApp';
import { ThesisChapter, ThesisMeeting, ThesisProject, ThesisReference, ThesisTask, ThesisWritingLog } from '../../../types';
import { addDaysKey, dateKeyOrdinal, formatDateBR, formatDateShortBR, todayKeyLocal } from '../../../lib/dateBR';
import type { ThesisTab } from '../../../../packages/navigation/src/types';
import { TccWizard } from '../../wizards/TccWizard';
import { ChapterSheet } from '../ChapterSheet';
import { TccView } from '../../views/TccView';

// SPEC-012 F3: a tela é um hero + 5 abas, e a aba mora no `NavScreen`
// (deep-link de notificação, Q10). F0.1/F0.4 seguem valendo: marcar capítulo
// não pode alterar o objeto anterior — `stableKey` do sync é `JSON.stringify`
// (`packages/sync/src/stamp.ts:83-89`).
//
// O teste usa o `MobileAppProvider` de verdade (o caminho usado em produção).

let seededChapters: ThesisChapter[];
let seededSnapshot: string;

const Seed = ({
  tcc,
  chapters,
  tab,
  focusId,
  refs,
  readings,
  logs,
  meetings,
  tasks,
}: {
  tcc: ThesisProject;
  chapters: ThesisChapter[];
  tab?: ThesisTab;
  focusId?: string;
  refs?: ThesisReference[];
  readings?: { id: string; title: string; rawCitation?: string; author?: string; year?: string; type?: 'livro' | 'artigo' | 'capitulo' | 'pdf' }[];
  logs?: ThesisWritingLog[];
  meetings?: ThesisMeeting[];
  tasks?: ThesisTask[];
}) => {
  const {
    handleUpdateTcc,
    setThesisChapters,
    setThesisReferences,
    setThesisWritingLogs,
    setThesisMeetings,
    setThesisTasks,
    setReadings,
    openTccScreen,
  } = useMobileApp();
  useEffect(() => {
    seededChapters = chapters;
    seededSnapshot = JSON.stringify(chapters);
    handleUpdateTcc(tcc);
    setThesisChapters(chapters);
    if (refs) setThesisReferences(refs);
    if (logs) setThesisWritingLogs(logs);
    if (meetings) setThesisMeetings(meetings);
    if (tasks) setThesisTasks(tasks);
    if (readings) setReadings(readings as never);
    if (tab) openTccScreen(tab, focusId);
    // Semeia uma vez por montagem: o provider é real e o efeito roda uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const tccBase = (): ThesisProject => ({
  id: 'tcc-main',
  title: 'luto e escuta clínica na psicoterapia do idoso',
  advisor: 'Helena Duarte',
  field: 'Psicologia Clínica',
  problemStatement: 'como a escuta clínica sustenta o processo de luto?',
  objectives: ['revisar a literatura sobre luto no idoso'],
  status: 'em_andamento',
  reminderPrefs: {
    enabled: false,
    chapterDaysBefore: [7, 1, 0],
    milestoneDaysBefore: [30, 14, 7, 1],
    time: '09:00',
    meetingEve: true,
    meetingMinutesBefore: [60],
  },
});

const capitulos = (): ThesisChapter[] => [
  {
    id: 'thc-1',
    thesisId: 'tcc-main',
    position: 0,
    title: 'introdução',
    kind: 'capitulo',
    requiredness: 'obrigatorio',
    stage: 'a_fazer',
    dueDate: '2026-10-01',
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
  {
    id: 'thc-2',
    thesisId: 'tcc-main',
    position: 1,
    title: 'revisão de literatura',
    kind: 'capitulo',
    requiredness: 'obrigatorio',
    stage: 'a_fazer',
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
];

const referencia = (): ThesisReference[] => [
  {
    id: 'thr-1',
    thesisId: 'tcc-main',
    readingId: 'r-legacy-tcc-1',
    status: 'citada',
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
];

const leitura = () => [
  {
    id: 'r-legacy-tcc-1',
    title: 'Worden (2018)',
    rawCitation: 'Worden, J. W. (2018). Tratamento do luto.',
  },
];

const brincar = () => ({
  id: 'r-brincar',
  title: 'O brincar e a realidade',
  author: 'Winnicott, D. W.',
  year: '1971',
  type: 'livro' as const,
});

const candidata = (): ThesisReference[] => [
  {
    id: 'thr-2',
    thesisId: 'tcc-main',
    readingId: 'r-brincar',
    status: 'candidata',
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
];

const renderTcc = (
  chapters: ThesisChapter[],
  opts: {
    tab?: ThesisTab;
    focusId?: string;
    tcc?: ThesisProject;
    refs?: ThesisReference[];
    readings?: { id: string; title: string; rawCitation?: string }[];
    logs?: ThesisWritingLog[];
    meetings?: ThesisMeeting[];
    tasks?: ThesisTask[];
  } = {},
) =>
  render(
    <MobileAppProvider>
      <Seed
        tcc={opts.tcc ?? tccBase()}
        chapters={chapters}
        tab={opts.tab}
        focusId={opts.focusId}
        refs={opts.refs}
        readings={opts.readings}
        logs={opts.logs}
        meetings={opts.meetings}
        tasks={opts.tasks}
      />
      <TccView />
    </MobileAppProvider>,
  );

const ariaChecked = (titulo: string) =>
  screen.getByRole('checkbox', { name: `capítulo ${titulo}` }).getAttribute('aria-checked');

const irParaAba = (label: string) => fireEvent.click(screen.getByRole('button', { name: label }));

beforeEach(() => {
  history.replaceState(null, '', '#/home');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('TccView — shell (SPEC-012 F3 / SPEC-010 D1-D3)', () => {
  it('renderiza exatamente um hero-card, com o número no título', () => {
    renderTcc(capitulos());
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    expect(screen.getByText('0 de 2 capítulos')).toBeInTheDocument();
  });

  it('trocar de aba mantém um único hero (D3: aba é conteúdo, não cabeçalho)', () => {
    renderTcc(capitulos());
    irParaAba('capítulos');
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    irParaAba('leituras');
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
  });

  it('aba mora no NavScreen: deep-link com tab abre direto na aba certa', () => {
    renderTcc(capitulos(), { tab: 'capitulos' });
    // Sem clicar em nada: o capítulo já está visível (aba capítulos).
    expect(screen.getByRole('checkbox', { name: 'capítulo introdução' })).toBeInTheDocument();
  });

  it('focusId inexistente degrada para a aba, sem erro', () => {
    renderTcc(capitulos(), { tab: 'capitulos', focusId: 'thc-999' });
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    expect(ariaChecked('introdução')).toBe('false');
  });

  it('sem tcc: hero convita e as abas ainda não existem (sem segunda ação primária)', () => {
    renderTcc([], {
      tcc: { ...tccBase(), title: '', problemStatement: '', objectives: [] },
    });
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'criar tcc' })).toBeInTheDocument();
    // As abas só nascem quando o trabalho existe.
    expect(screen.queryByRole('button', { name: 'capítulos' })).not.toBeInTheDocument();
  });

  it('aba leituras mostra a citação da usuária (rawCitation, ADR-010)', () => {
    renderTcc(capitulos(), { tab: 'leituras', refs: referencia(), readings: leitura() });
    expect(
      screen.getByText('Worden, J. W. (2018). Tratamento do luto.')
    ).toBeInTheDocument();
  });

  // F7.2: a citação é *derivada* da estante por `abntDataFromReading` +
  // `formatAbnt`; o filtro é o `PillGroup` (SPEC-010 D7), e o cartão leva à
  // sheet — o caminho usado em produção (MobileAppProvider de verdade).
  it('aba leituras filtra por estado (F7.2: PillGroup de filtro)', () => {
    renderTcc(capitulos(), {
      tab: 'leituras',
      refs: [...referencia(), ...candidata()],
      readings: [...leitura(), brincar()],
    });
    // citada e candidata visíveis em "todas".
    expect(screen.getByText('Worden, J. W. (2018). Tratamento do luto.')).toBeInTheDocument();
    expect(screen.getAllByText(/WINNICOTT/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'candidatas' }));
    expect(screen.queryAllByText('Worden, J. W. (2018). Tratamento do luto.')).toHaveLength(0);
    expect(screen.getAllByText(/WINNICOTT/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'citadas' }));
    expect(screen.getByText('Worden, J. W. (2018). Tratamento do luto.')).toBeInTheDocument();
    expect(screen.queryAllByText(/WINNICOTT/)).toHaveLength(0);
  });

  it('nova referência escolhe da estante só o que ainda não virou referência (F7.3/ADR-010)', async () => {
    renderTcc(capitulos(), {
      tab: 'leituras',
      refs: referencia(),
      readings: [...leitura(), brincar()],
    });
    expect(screen.queryAllByText(/WINNICOTT/)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'nova referência' }));
    // A leitura sobrando aparece no seletor (título só existe no picker).
    fireEvent.click(screen.getByText('O brincar e a realidade'));
    // O picker fecha e a obra vira referência candidata na lista.
    await waitFor(() => expect(screen.queryByLabelText('de qual leitura?')).not.toBeInTheDocument());
    expect(screen.getAllByText(/WINNICOTT/).length).toBeGreaterThan(0);
  });

  it('nova referência não repete leitura já citada (dedupe por readingId)', () => {
    renderTcc(capitulos(), {
      tab: 'leituras',
      refs: referencia(),
      readings: [...leitura(), brincar()],
    });
    fireEvent.click(screen.getByRole('button', { name: 'nova referência' }));
    // A leitura já citada segue **uma única vez** na tela (o cartão da lista
    // atrás do modal): se o seletor a repetisse, seriam duas ocorrências.
    expect(screen.queryAllByText('Worden, J. W. (2018). Tratamento do luto.')).toHaveLength(1);
  });

  it('tocar num cartão abre a sheet da referência (F7.3)', () => {
    renderTcc(capitulos(), { tab: 'leituras', refs: referencia(), readings: leitura() });
    fireEvent.click(screen.getByRole('button', { name: /referência: Worden/ }));
    expect(screen.getByLabelText('tipo abnt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'copiar referência' })).toBeInTheDocument();
  });

  it('guarda um link pela aba leituras (F8.3): abre a sheet de captura', async () => {
    renderTcc(capitulos(), { tab: 'leituras', refs: referencia(), readings: leitura() });
    fireEvent.click(screen.getByRole('button', { name: 'guardar link' }));
    await waitFor(() =>
      expect(screen.getByText('guardar no cecistudy ♡')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('link')).toBeInTheDocument();
  });
});

describe('TccView — marcar capítulo (SPEC-012 F0.1)', () => {
  it('não altera o array de capítulos que já estava no estado', () => {
    renderTcc(capitulos(), { tab: 'capitulos' });
    expect(ariaChecked('introdução')).toBe('false');

    fireEvent.click(screen.getByRole('checkbox', { name: 'capítulo introdução' }));

    // A invariante: o objeto entregue ao estado segue byte a byte igual.
    expect(JSON.stringify(seededChapters)).toBe(seededSnapshot);
    expect(seededChapters[0].stage).toBe('a_fazer');
  });

  it('alterna pronto ↔ escrevendo e atualiza o progresso', () => {
    renderTcc(capitulos(), { tab: 'capitulos' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'capítulo introdução' }));

    expect(ariaChecked('introdução')).toBe('true');
    expect(ariaChecked('revisão de literatura')).toBe('false');

    fireEvent.click(screen.getByRole('checkbox', { name: 'capítulo introdução' }));
    expect(ariaChecked('introdução')).toBe('false');
  });

  it('toque na linha abre a sheet do capítulo (F4.1 — o toggle é só no círculo)', () => {
    renderTcc(capitulos(), { tab: 'capitulos' });
    fireEvent.click(screen.getByText('revisão de literatura'));

    // A sheet abre com o capítulo vivo (D5), não com cópia congelada.
    expect(screen.getByText('editar capítulo')).toBeInTheDocument();
    expect(screen.getByLabelText('título')).toHaveValue('revisão de literatura');
  });
});

describe('TccView — prazo do capítulo (SPEC-012 F0.2)', () => {
  it('mostra o prazo em dd/mm/aaaa, nunca a data civil crua', () => {
    renderTcc(capitulos(), { tab: 'capitulos' });

    expect(screen.getByText('prazo: 01/10/2026')).toBeInTheDocument();
    expect(screen.queryByText(/2026-10-01/)).not.toBeInTheDocument();
  });

  it('não mostra prazo quando o capítulo não tem', () => {
    renderTcc([capitulos()[1]], { tab: 'capitulos' });

    expect(screen.queryByText(/prazo:/)).not.toBeInTheDocument();
  });
});

describe('TccWizard — concluir com capítulo pendente (SPEC-012 F0.3 / D4)', () => {
  const renderWizard = (tcc: ThesisProject, chapters: ThesisChapter[]) => {
    // O wizard semeia **no mount**, a partir do singleton que o provider já
    // tinha carregado do storage (`useStampedState('tcc', ...)`). Para o teste
    // não depender do que um teste anterior deixou em `localStorage`, grava a
    // ficha antes de montar — mesmo caminho do dreno do boot (SPEC-012 §17.2).
    localStorage.setItem('cecistudy_tcc', JSON.stringify(tcc));
    return render(
      <MobileAppProvider>
        <Seed tcc={tcc} chapters={chapters} tab="capitulos" />
        <TccWizard />
        <TccView />
      </MobileAppProvider>,
    );
  };

  const marcarConcluido = () => {
    // `SegmentedControl` é `radiogroup`/`radio` sem `aria-label` por opção
    // (`src/components/ui/SegmentedControl.tsx:42-53`), então o clique é pelo
    // texto do botão.
    fireEvent.click(screen.getByText('concluído'));
  };

  // O wizard tem 4 passos (identificação → prazos → pergunta → revisar) e o
  // botão "continuar" avança um passo por vez.
  const avancarPassos = (n: number) => {
    for (let i = 0; i < n; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'continuar' }));
    }
  };

  it('pede confirmação ao concluir com capítulo pendente e não salva antes', () => {
    renderWizard(tccBase(), capitulos());
    marcarConcluido();
    avancarPassos(3);
    fireEvent.click(screen.getByRole('button', { name: 'guardar tcc ♡' }));

    expect(screen.getByText(/ainda tem 2 capítulos sem pronto/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'concluir mesmo assim' })).toBeInTheDocument();
  });

  it('salva quando confirma a conclusão', async () => {
    renderWizard(tccBase(), capitulos());
    marcarConcluido();
    avancarPassos(3);
    fireEvent.click(screen.getByRole('button', { name: 'guardar tcc ♡' }));
    fireEvent.click(screen.getByRole('button', { name: 'concluir mesmo assim' }));

    // O `Modal` sai com `AnimatePresence` + `motion`
    // (`src/components/ui/Modal.tsx:94-153`): a saída é animada, espera sair.
    await waitFor(() => expect(screen.queryByText(/ainda tem/)).not.toBeInTheDocument());
  });

  it('não pede confirmação quando todos os capítulos estão prontos', () => {
    const prontos = capitulos().map((c) => ({ ...c, stage: 'pronto' as const }));
    renderWizard(tccBase(), prontos);
    marcarConcluido();
    avancarPassos(3);
    fireEvent.click(screen.getByRole('button', { name: 'guardar tcc ♡' }));

    expect(screen.queryByText(/ainda tem/)).not.toBeInTheDocument();
  });

  it('não pede confirmação quando a situação não é concluído', () => {
    renderWizard(tccBase(), capitulos());
    avancarPassos(3);
    fireEvent.click(screen.getByRole('button', { name: 'guardar tcc ♡' }));

    expect(screen.queryByText(/ainda tem/)).not.toBeInTheDocument();
  });

  it('salva entrega, banca e metas no singleton (F3.6; vazio = ausente, INV-T7)', async () => {
    // Datas relativas a hoje — asserção de prazo não pode ser bomba-relógio.
    // A banca (+40d) vence antes da entrega (+54d), então é ela no hero.
    const hoje = todayKeyLocal();
    const bancaKey = addDaysKey(hoje, 40);
    const entregaKey = addDaysKey(hoje, 54);
    const semPrazo = capitulos().map((c) => ({ ...c, stage: 'pronto' as const, dueDate: undefined }));
    renderWizard(tccBase(), semPrazo);

    // passo 2 (prazos & metas)
    avancarPassos(1);
    fireEvent.change(screen.getByLabelText('entrega final'), { target: { value: entregaKey } });
    fireEvent.change(screen.getByLabelText('banca'), { target: { value: bancaKey } });
    fireEvent.change(screen.getByLabelText('meta total de palavras'), { target: { value: '20000' } });
    fireEvent.change(screen.getByLabelText('meta semanal'), { target: { value: '500' } });
    fireEvent.click(screen.getByLabelText('lembretes de prazo'));
    avancarPassos(2);
    fireEvent.click(screen.getByRole('button', { name: 'guardar tcc ♡' }));

    expect(
      screen.getByText(`próximo: ${formatDateShortBR(bancaKey)} · em 40 dias`)
    ).toBeInTheDocument();

    // E o singleton persistiu os dois marcos, as duas metas e o interruptor
    // de lembretes (F4.6).
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('cecistudy_tcc') ?? '{}');
      expect(stored.deliveryDate).toBe(entregaKey);
      expect(stored.defenseDate).toBe(bancaKey);
      expect(stored.wordGoalTotal).toBe(20000);
      expect(stored.weeklyWordGoal).toBe(500);
      expect(stored.reminderPrefs.enabled).toBe(true);
    });
  });
});

describe('ChapterSheet — CRUD com uma escrita por ação (SPEC-012 F4.3/D5)', () => {
  const SheetHost = ({
    tcc,
    chapters,
    chapterId,
  }: {
    tcc: ThesisProject;
    chapters: ThesisChapter[];
    chapterId: string | 'new';
  }) => {
    const [open, setOpen] = useState(true);
    return (
      <div>
        <button type="button" onClick={() => setOpen(true)}>
          abrir sheet
        </button>
        <ChapterSheet open={open} chapterId={chapterId} onClose={() => setOpen(false)} />
      </div>
    );
  };

  const renderSheet = (tcc: ThesisProject, chapters: ThesisChapter[], chapterId: string | 'new') =>
    render(
      <MobileAppProvider>
        <Seed tcc={tcc} chapters={chapters} tab="capitulos" />
        <SheetHost tcc={tcc} chapters={chapters} chapterId={chapterId} />
        <TccView />
      </MobileAppProvider>,
    );

  it('cria capítulo com id estável (uma escrita na coleção)', () => {
    renderSheet(tccBase(), [], 'new');

    fireEvent.change(screen.getByLabelText('título'), { target: { value: 'metodologia' } });
    fireEvent.change(screen.getByLabelText('prazo'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/ }));

    expect(ariaChecked('metodologia')).toBe('false');
    expect(screen.getByText('prazo: 01/11/2026')).toBeInTheDocument();
  });

  it('edita o capítulo vivo pelo id (título e estágio)', () => {
    renderSheet(tccBase(), capitulos(), 'thc-1');

    fireEvent.change(screen.getByLabelText('título'), { target: { value: 'introdução revisada' } });
    // SegmentedControl: clique pelo texto da opção.
    fireEvent.click(screen.getByText('em revisão'));
    fireEvent.click(screen.getByRole('button', { name: /guardar/ }));

    expect(screen.getByText('introdução revisada')).toBeInTheDocument();
    // `em revisão` existe na linha (StatusChip) — e a sheet em saída animada
    // ainda pode ter o botão do SegmentedControl: usa `getAllByText`.
    expect(screen.getAllByText('em revisão').length).toBeGreaterThan(0);
  });

  it('mover para cima reordena entre irmãos (o caminho acessível do arrastar)', () => {
    renderSheet(tccBase(), capitulos(), 'thc-2');

    fireEvent.click(screen.getByRole('button', { name: 'mover capítulo para cima' }));
    // thc-2 assumiu a posição 0: a ordem de render inverteu.
    const rows = screen.getAllByRole('checkbox');
    expect(rows[0].getAttribute('aria-label')).toContain('revisão de literatura');
  });

  it('remover pede confirmação e tira o capítulo sem tocar nas referências', async () => {
    renderSheet(tccBase(), capitulos(), 'thc-1');

    fireEvent.click(screen.getByRole('button', { name: /remover$/ }));
    expect(screen.getByText(/remover “introdução”\?/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'remover mesmo assim' }));

    await waitFor(() => expect(screen.queryByText('introdução')).not.toBeInTheDocument());
    expect(ariaChecked('revisão de literatura')).toBe('false');
  });

  it('sem título, guardar avisa e não escreve', () => {
    renderSheet(tccBase(), [], 'new');

    fireEvent.click(screen.getByRole('button', { name: /guardar/ }));

    // A sheet continua aberta (nada foi escrito: sem capítulo na lista) e o
    // campo continua aí para digitar. O toast em si é renderizado pela casca
    // do app, que não existe neste teste — o que se prova é o não-escrito.
    expect(screen.getByLabelText('título')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

describe('TccView — aba escrita (SPEC-012 F5)', () => {
  const logs = (): ThesisWritingLog[] => [
    {
      id: 'twl-1',
      thesisId: 'tcc-main',
      date: todayKeyLocal(),
      chapterId: 'thc-1',
      words: 300,
      minutes: 40,
      note: 'travei na conclusão',
      createdAt: '2026-10-09T10:00:00.000Z',
      updatedAt: '2026-10-09T10:00:00.000Z',
    },
  ];

  it('hero com tcc: a ação primária é "registrar escrita", não "editar dados"', () => {
    renderTcc(capitulos());
    expect(screen.getAllByRole('button', { name: 'registrar escrita' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'editar dados do trabalho' })).not.toBeInTheDocument();
  });

  it('F5.1: cartão semana mostra palavras vs. meta e lista as sessões recentes', () => {
    renderTcc(capitulos(), { tab: 'escrita', tcc: { ...tccBase(), weeklyWordGoal: 500 }, logs: logs() });

    expect(screen.getByText('300/500')).toBeInTheDocument();
    expect(screen.getByText(/300 palavras/)).toBeInTheDocument();
    expect(screen.getByText('travei na conclusão')).toBeInTheDocument();
  });

  it('F5.3: sem metas, o texto é o convite e nenhum valor vem preenchido', () => {
    renderTcc(capitulos(), { tab: 'escrita' });

    expect(screen.getByText('metas são opcionais — defina quando quiser')).toBeInTheDocument();
    // Sem meta: o atalho secundário abre os dados do trabalho.
    expect(screen.getByRole('button', { name: 'definir metas' })).toBeInTheDocument();
  });

  it('F5.2: registrar escrita guarda o log e soma as palavras ao wordCount do capítulo (uma ação)', async () => {
    renderTcc(capitulos(), { tab: 'escrita' });

    fireEvent.click(screen.getAllByRole('button', { name: 'registrar escrita' })[0]);
    fireEvent.change(screen.getByLabelText('capítulo'), { target: { value: 'thc-1' } });
    fireEvent.change(screen.getByLabelText('palavras escritas'), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/ }));

    await waitFor(() => {
      const storedLogs = JSON.parse(localStorage.getItem('cecistudy_thesisWritingLogs') ?? '[]');
      expect(storedLogs).toHaveLength(1);
      expect(storedLogs[0]).toMatchObject({ words: 250, chapterId: 'thc-1', minutes: 30 });
    });
    await waitFor(() => {
      const storedChapters: { id: string; wordCount?: number }[] = JSON.parse(
        localStorage.getItem('cecistudy_thesisChapters') ?? '[]',
      );
      expect(storedChapters.find((c) => c.id === 'thc-1')?.wordCount).toBe(250);
    });
  });

  it('F5.2/F5.4: palavras vazias não viram 0 — avisa e não escreve (vazio ≠ zero)', () => {
    renderTcc(capitulos(), { tab: 'escrita' });

    fireEvent.click(screen.getAllByRole('button', { name: 'registrar escrita' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /guardar/ }));

    // A sheet continua aberta (nada foi escrito) — o toast vive na casca.
    expect(screen.getByLabelText('palavras escritas')).toBeInTheDocument();
    const storedLogs = JSON.parse(localStorage.getItem('cecistudy_thesisWritingLogs') ?? '[]');
    expect(storedLogs).toHaveLength(0);
  });
});

describe('TccView — aba orientação (SPEC-012 F6)', () => {
  const ontem = () => addDaysKey(todayKeyLocal(), -1);
  const amanha = () => addDaysKey(todayKeyLocal(), 1);

  const tarefas = (): ThesisTask[] => [
    {
      id: 'tts-1',
      thesisId: 'tcc-main',
      title: 'revisar metodologia',
      origin: 'orientadora',
      dueDate: ontem(),
      status: 'aberta',
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    },
    {
      id: 'tts-2',
      thesisId: 'tcc-main',
      title: 'enviar sumário',
      origin: 'minha',
      dueDate: amanha(),
      status: 'aberta',
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    },
    {
      id: 'tts-3',
      thesisId: 'tcc-main',
      title: 'pedido antigo',
      origin: 'minha',
      status: 'resolvida',
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    },
  ];

  const reunioes = (): ThesisMeeting[] => [
    {
      id: 'thm-1',
      thesisId: 'tcc-main',
      date: amanha(),
      time: '14:00',
      mode: 'online',
      status: 'agendada',
      decisions: [],
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    },
    {
      id: 'thm-2',
      thesisId: 'tcc-main',
      date: addDaysKey(todayKeyLocal(), -7),
      mode: 'presencial',
      status: 'realizada',
      summary: 'falamos do capítulo 2',
      decisions: ['reescrever a introdução'],
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    },
    {
      id: 'thm-3',
      thesisId: 'tcc-main',
      date: addDaysKey(todayKeyLocal(), -3),
      mode: 'online',
      status: 'cancelada',
      decisions: [],
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    },
  ];

  const pendenciaChecked = (titulo: string) =>
    screen.getByRole('checkbox', { name: `pendência ${titulo}` }).getAttribute('aria-checked');

  it('F6.1: abertas primeiro, vencida no topo e resolvida por último', () => {
    renderTcc(capitulos(), { tab: 'orientacao', tasks: tarefas() });

    const boxes = screen.getAllByRole('checkbox').map((b) => b.getAttribute('aria-label'));
    expect(boxes[0]).toContain('revisar metodologia'); // vencida
    expect(boxes[1]).toContain('enviar sumário');
    expect(boxes[2]).toContain('pedido antigo'); // resolvida
    expect(screen.getByText('vencida')).toBeInTheDocument();
  });

  it('F6.1: toque no check marca a pendência como resolvida (uma escrita)', async () => {
    renderTcc(capitulos(), { tab: 'orientacao', tasks: tarefas() });
    fireEvent.click(screen.getByRole('checkbox', { name: 'pendência revisar metodologia' }));

    expect(pendenciaChecked('revisar metodologia')).toBe('true');
    await waitFor(() => {
      const stored: { id: string; status: string }[] = JSON.parse(
        localStorage.getItem('cecistudy_thesisTasks') ?? '[]',
      );
      expect(stored.find((t) => t.id === 'tts-1')?.status).toBe('resolvida');
    });
  });

  it('F6.2: as duas ações de reunião existem e a cancelada fica recolhida', () => {
    renderTcc(capitulos(), { tab: 'orientacao', meetings: reunioes() });

    expect(screen.getByRole('button', { name: 'agendar reunião' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'registrar o que foi conversado' }),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(formatDateBR(amanha())))).toBeInTheDocument();
    // A cancelada não aparece até pedir.
    expect(screen.queryByText('cancelada')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /mostrar canceladas/ }));
    expect(screen.getByText('cancelada')).toBeInTheDocument();
  });

  it('F6.4: registrar cria pendências das decisões e agenda a próxima na mesma ação', async () => {
    renderTcc(capitulos(), { tab: 'orientacao', meetings: reunioes() });

    fireEvent.click(screen.getByRole('button', { name: 'registrar o que foi conversado' }));
    fireEvent.change(screen.getByLabelText('o que foi conversado'), {
      target: { value: 'falamos da revisão' },
    });
    fireEvent.change(screen.getByLabelText('decisões'), {
      target: { value: 'reescrever a introdução' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adicionar decisão' }));
    fireEvent.click(screen.getByRole('button', { name: /guardar/ }));

    // Fase "gerar pendências": a decisão entra marcada por padrão.
    const decisao = await screen.findByRole('checkbox', { name: 'reescrever a introdução' });
    expect(decisao).toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: /agendar a próxima reunião/ }));
    fireEvent.change(screen.getByLabelText('data'), {
      target: { value: addDaysKey(todayKeyLocal(), 14) },
    });
    fireEvent.click(screen.getByRole('button', { name: /concluir/ }));

    await waitFor(() => {
      const tasks: { title: string; origin: string; meetingId?: string }[] = JSON.parse(
        localStorage.getItem('cecistudy_thesisTasks') ?? '[]',
      );
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        title: 'reescrever a introdução',
        origin: 'orientadora',
        meetingId: 'thm-1',
      });
    });
    await waitFor(() => {
      const meetings: { status: string }[] = JSON.parse(
        localStorage.getItem('cecistudy_thesisMeetings') ?? '[]',
      );
      // thm-1 virou realizada + a próxima agendada.
      expect(meetings.filter((m) => m.status === 'agendada')).toHaveLength(1);
    });
  });
});

describe('Dreno do boot — tcc legado vira coleções (SPEC-012 §17.2 A1)', () => {
  // `migrateDatabase` só rota pelo import de backup (`exportImport.ts:110`):
  // nem a hidratação web (localStorage) nem a nativa passam por ela. O dreno do
  // `DataClientProvider` é o que impede os capítulos de sumirem da tela no
  // primeiro boot pós-22. Aqui ele é exercitado de ponta a ponta.
  it('tcc legado no localStorage aparece como thesisChapters na tela', async () => {
    // `storage` prefixa as chaves com `cecistudy_` (`src/lib/storage.ts`).
    const KEY = 'cecistudy_tcc';
    localStorage.setItem(
      KEY,
      JSON.stringify({
        title: 'luto e escuta clínica',
        advisor: 'Helena Duarte',
        field: 'Psicologia Clínica',
        problemStatement: '',
        objectives: [],
        status: 'em_andamento',
        chapters: [{ title: 'introdução', completed: false, dueDate: '2026-10-01' }],
        references: ['Worden, J. W. (2018). Tratamento do luto.'],
      })
    );

    render(
      <MobileAppProvider>
        <TccView />
      </MobileAppProvider>,
    );

    // O dreno roda em efeito no mount. A aba padrão é a visão geral: o capítulo
    // drenado aparece no hero (`1 de 1 capítulos` — 0 prontos) e na aba.
    await screen.findByText('0 de 1 capítulos');
    irParaAba('capítulos');
    expect(ariaChecked('introdução')).toBe('false');

    // O singleton foi reescrito sem `chapters` — o marcador de dreno completo.
    // O write-through tem debounce de 200ms (`useSqliteState`), então a
    // persistência também é esperada, não afirmada de imediato.
    await waitFor(() => {
      const storedTcc = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      expect(storedTcc.chapters).toBeUndefined();
      expect(storedTcc.id).toBe('tcc-main');
    });
    await waitFor(() => {
      const storedChapters = JSON.parse(localStorage.getItem('cecistudy_thesisChapters') ?? '[]');
      expect(storedChapters[0]).toMatchObject({ id: 'thc-1', stage: 'a_fazer' });
    });
  });
});
