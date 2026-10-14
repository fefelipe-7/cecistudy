/**
 * SPEC-013 D1/I2/I3/D10/D11/D7 — **teste de composição** do perfil.
 *
 * Os testes por componente provam que cada bloco funciona; este prova a coisa
 * que a reescrita comprou: a tela **não repete** progresso nem CTA, tem **um**
 * `h1`, e a ordem do DOM é a narrativa — não a ordem de chegada dos componentes.
 *
 * A repetição era o defeito (SPEC-013 §1): progresso três vezes, CTA de virada
 * duas vezes. Regressão aqui é silenciosa — a tela só fica "mais informadinha"
 * — então precisa de teste, não de revisão (§12, plano F8).
 *
 * O view model vem de `deriveProfileViewModel` de verdade, para que a composição
 * seja exercitada junto da derivação (D2), e o estado seja o da usuária real
 * (período ativo + histórico), não um objeto montado à mão.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ProfilePage from '../ProfilePage';
import type { ProfilePageProps } from '../ProfilePage';
import { deriveProfileViewModel, type ProfileViewModelInput } from '../../../../lib/profileViewModel';
import type { AcademicTerm, UserProfile } from '../../../../types';

const profile: UserProfile = {
  name: 'Ceci',
  semester: 6,
  totalSemesters: 8,
  university: 'USP',
  targetCareer: 'Psicologia',
  dailyQuote: 'um passo por vez',
  stickersCollected: 0,
};

const term = (over: Partial<AcademicTerm> = {}): AcademicTerm => ({
  id: 'trm-6',
  ordinal: 6,
  label: '6º semestre',
  status: 'ativo',
  startedAt: '2026-02-01',
  statusTransitionAt: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

const closedTerm = (ordinal: number): AcademicTerm =>
  term({
    id: `trm-${ordinal}`,
    ordinal,
    label: `${ordinal}º semestre`,
    status: 'encerrado',
    startedAt: `2026-${String(ordinal).padStart(2, '0')}-01`,
    statusTransitionAt: `2026-${String(ordinal).padStart(2, '0')}-01T00:00:00.000Z`,
    summary: {
      closedAt: '2026-01-01T00:00:00.000Z',
      courses: 5,
      archivedCourses: 1,
      carriedCourses: 0,
      classNotes: 12,
      tasksCompleted: 3,
      tasksCarriedOver: 0,
      readingsCompleted: 2,
      pagesRead: 40,
      focusMinutes: 300,
      loggedHours: 5,
      bestStreak: 7,
      grades: [],
      highlights: ['fechou com carinho'],
    },
  });

/** Input completo: período ativo no 6º, com 2 períodos já fechados na memória. */
const input = (over: Partial<ProfileViewModelInput> = {}): ProfileViewModelInput => ({
  profile,
  activeTerm: term(),
  academicTerms: [closedTerm(4), closedTerm(5), term()],
  courses: [],
  classes: [],
  tasks: [],
  exams: [],
  readings: [],
  flashcards: [],
  sessions: [],
  stickers: [],
  streak: { current: 4, longest: 9, total: 20, alive: true },
  themePref: 'rosa-claro',
  reminderSettings: { enabled: true, time: '20:00' },
  reminderSupported: true,
  gcalConfigured: true,
  gcalEnabled: true,
  native: false,
  ...over,
});

const handlers = () => ({
  onEditOpen: vi.fn(),
  onEditClose: vi.fn(),
  onEditSave: vi.fn(),
  onPickPhoto: vi.fn(),
  onRemovePhoto: vi.fn(),
  onCorrectOrdinal: vi.fn(),
  onSetTotalSemesters: vi.fn(),
  onOpenSemesterWizard: vi.fn(),
  onOpenTermHistory: vi.fn(),
  onShowToast: vi.fn(),
  onOpenSessions: vi.fn(),
  onOpenReadings: vi.fn(),
  onOpenTasks: vi.fn(),
  onOpenExams: vi.fn(),
  onOpenStickers: vi.fn(),
  onOpenStreak: vi.fn(),
  onUpdateReminder: vi.fn(),
  onSetGcalEnabled: vi.fn(),
  onThemeSelect: vi.fn(),
  onOpenSync: vi.fn(),
  onExport: vi.fn(),
  onImport: vi.fn(),
  onReset: vi.fn(),
});

const renderPage = (over: Partial<ProfileViewModelInput> = {}) => {
  const props: ProfilePageProps = {
    vm: deriveProfileViewModel(input(over)),
    themePref: 'rosa-claro',
    editInitial: {
      name: profile.name,
      university: profile.university,
      dailyQuote: profile.dailyQuote,
    },
    editOpen: false,
    ...handlers(),
  };
  render(<ProfilePage {...props} />);
  return props;
};

describe('ProfilePage — composição (SPEC-013 D1/D10/D11, I2/I3/D7)', () => {
  it('a ordem do DOM é a narrativa: eu sou → eu estou → eu construí → eu cuido (D1)', () => {
    renderPage();
    const headings = screen
      .getAllByRole('heading')
      .map((h) => h.textContent?.trim().toLowerCase() ?? '');

    const expected = [
      'ceci', // hero — o h1 é o nome
      'sua jornada',
      'seu ritmo',
      'memória da graduação',
      'conquistas',
      'cuidado do cantinho',
      'seus dados',
    ];
    // `getAllByRole('heading')` respeita a ordem do documento; filtrar só os
    // títulos de seção evita britabilidade contra o h2 do sheet de tema, que
    // só existe quando o sheet está aberto.
    expect(headings.filter((h) => expected.includes(h))).toEqual(expected);
  });

  it('o progresso da graduação aparece em um lugar só (I2)', () => {
    renderPage();
    // A barra do curso é a única cujo `aria-valuetext` fala da graduação — o
    // `AchievementsPreview` também tem `progressbar`, mas é o nível, não o curso.
    const doCurso = screen
      .getAllByRole('progressbar')
      .filter((el) => /da graduação concluída/.test(el.getAttribute('aria-valuetext') ?? ''));
    expect(doCurso).toHaveLength(1);
    expect(doCurso[0].getAttribute('aria-valuenow')).toBe('75'); // 6 de 8
  });

  it('o CTA de virar semestre aparece em um lugar só (I3)', () => {
    renderPage();
    expect(screen.getAllByRole('button', { name: /virar o semestre/ })).toHaveLength(1);
  });

  it('a memória não repete o CTA de virada nem o progresso do curso', () => {
    renderPage();
    const memoria = screen.getByRole('region', { name: /memória da graduação/ });
    expect(within(memoria).queryByRole('button', { name: /virar o semestre/ })).toBeNull();
    expect(within(memoria).queryByRole('progressbar')).toBeNull();
  });

  it('tem um h1 só — o nome — e um h2 por seção (D11)', () => {
    renderPage();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ceci');
    // cinco seções nomeadas + o h2 do hero não existe (o hero usa h1)
    for (const nome of [
      'sua jornada',
      'seu ritmo',
      'memória da graduação',
      'conquistas',
      'cuidado do cantinho',
      'seus dados',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: nome })).toBeTruthy();
    }
  });

  it('cada seção é uma região nomeada pelo próprio título (D11)', () => {
    renderPage();
    for (const nome of [
      'sua jornada',
      'seu ritmo',
      'memória da graduação',
      'conquistas',
      'cuidado do cantinho',
      'seus dados',
    ]) {
      expect(screen.getByRole('region', { name: new RegExp(nome, 'i') })).toBeTruthy();
    }
  });

  it('nenhuma ação nova é `div role="button"` (D11)', () => {
    const { container } = render(
      <ProfilePage
        vm={deriveProfileViewModel(input())}
        themePref="rosa-claro"
        editInitial={{ name: 'Ceci', university: 'USP', dailyQuote: 'um passo por vez' }}
        editOpen={false}
        {...handlers()}
      />,
    );
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  it('a partir de 900 px a narrativa vira 7/5 e o container fecha em 1120 px (D10)', () => {
    const { container } = render(
      <ProfilePage
        vm={deriveProfileViewModel(input())}
        themePref="rosa-claro"
        editInitial={{ name: 'Ceci', university: 'USP', dailyQuote: 'um passo por vez' }}
        editOpen={false}
        {...handlers()}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('min-[1200px]:max-w-[1120px]');
    const grid = root.firstElementChild as HTMLElement;
    expect(grid.className).toContain('min-[900px]:grid-cols-12');

    const [historia, cuidado] = Array.from(grid.children) as HTMLElement[];
    // 7 = identidade/jornada/ritmo/memória/conquistas · 5 = preferências + dados
    expect(historia.className).toContain('min-[900px]:col-span-7');
    expect(cuidado.className).toContain('min-[900px]:col-span-5');
  });

  it('o funil dither não volta para a tela (D7)', () => {
    const { container } = render(
      <ProfilePage
        vm={deriveProfileViewModel(input())}
        themePref="rosa-claro"
        editInitial={{ name: 'Ceci', university: 'USP', dailyQuote: 'um passo por vez' }}
        editOpen={false}
        {...handlers()}
      />,
    );
    // O funil antigo era um gráfico sem ação; ele não volta para a tela.
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.queryByText(/funil/i)).toBeNull();
  });

  it('a ofensiva é item de conquistas, não bloco próprio (D8)', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /ofensiva atual de 4 dias/ }),
    ).toBeTruthy();
    // E está dentro de conquistas — não na sua própria seção.
    const conquistas = screen.getByRole('region', { name: /conquistas/ });
    expect(within(conquistas).getByRole('button', { name: /ofensiva atual/ })).toBeTruthy();
  });
});