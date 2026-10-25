/**
 * SPEC-013 D1/I2/I3/D11 — a página composta é a unidade de leitura da spec: a
 * narrativa tem ordem fixa (identidade → agora → construído → cuidado), existe
 * **um** `h1`, o progresso da graduação aparece **uma vez** (I2), o CTA de virada
 * **uma vez** (I3), e os sheets (identidade, tema) abrem por gesto explícito.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from '../ProfilePage';
import {
  deriveProfileViewModel,
  type ProfileViewModelInput,
} from '../../../../lib/profileViewModel';
import type { AcademicTerm, UserProfile } from '../../../../types';

const profile = (over: Partial<UserProfile> = {}): UserProfile => ({
  name: 'ceci',
  semester: 1,
  totalSemesters: 8,
  university: 'USP',
  targetCareer: 'Psicologia',
  dailyQuote: 'um passo por vez',
  stickersCollected: 0,
  ...over,
});

const term = (over: Partial<AcademicTerm> = {}): AcademicTerm => ({
  id: 'trm-1',
  ordinal: 6,
  label: '6º semestre',
  status: 'ativo',
  startedAt: '2026-02-01',
  statusTransitionAt: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

const vmInput = (over: Partial<ProfileViewModelInput> = {}): ProfileViewModelInput => ({
  profile: profile(),
  activeTerm: term(),
  academicTerms: [term()],
  courses: [],
  classes: [],
  tasks: [],
  exams: [],
  readings: [],
  flashcards: [],
  sessions: [],
  stickers: [],
  streak: { current: 0, longest: 0, total: 0, alive: false },
  themePref: 'rosa-claro',
  reminderSettings: { enabled: false, time: '20:00' },
  reminderSupported: true,
  gcalConfigured: false,
  gcalEnabled: false,
  native: false,
  ...over,
});

const renderPage = (input: Partial<ProfileViewModelInput> = {}) => {
  const handlers = {
    onEditClose: vi.fn(),
    onEditSave: vi.fn(),
    onCorrectOrdinal: vi.fn(),
    onSetTotalSemesters: vi.fn(),
    onOpenSemesterWizard: vi.fn(),
    onOpenTermHistory: vi.fn(),
    onOpenSessions: vi.fn(),
    onOpenReadings: vi.fn(),
    onOpenTasks: vi.fn(),
    onOpenExams: vi.fn(),
    onOpenStickers: vi.fn(),
    onOpenStreak: vi.fn(),
    onUpdateReminder: vi.fn(),
    onSetGcalEnabled: vi.fn(),
    onThemeSelect: vi.fn(),
    onMotionPrefSelect: vi.fn(),
    onOpenSync: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onReset: vi.fn(),
  };
  const value = deriveProfileViewModel(vmInput(input));
  const rawProfile = input.profile ?? vmInput().profile;

  // Espelha `PerfilView`: a página é controlada — quem guarda o estado do sheet é
  // a casca de rota. O wrapper existe só para exercitar o ciclo abrir → guardar.
  const Harness: React.FC = () => {
    const [editOpen, setEditOpen] = React.useState(false);
    return (
      <ProfilePage
        vm={value}
        themePref="rosa-claro"
        motionPref="sistema"
        editInitial={{
          name: rawProfile.name,
          university: rawProfile.university,
          dailyQuote: rawProfile.dailyQuote,
          nomeAutorizado: false,
        }}
        editOpen={editOpen}
        onEditOpen={() => setEditOpen(true)}
        onPickPhoto={vi.fn()}
        onRemovePhoto={vi.fn()}
        onShowToast={vi.fn()}
        {...handlers}
      />
    );
  };

  render(<Harness />);
  return handlers;
};

describe('ProfilePage — narrativa composta', () => {
  it('tem um único h1 (o nome) e a ordem dos movimentos é fixa', () => {
    renderPage();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'sua jornada',
      'seu ritmo',
      'memória da graduação',
      'conquistas',
      'cuidado do cantinho',
      'seus dados',
      'backup em nuvem',
      'zona de cuidado',
    ]);
  });

  it('o progresso da graduação aparece uma vez na página inteira (I2)', () => {
    renderPage();
    const graus = screen
      .getAllByRole('progressbar')
      .filter((p) => (p.getAttribute('aria-valuetext') ?? '').includes('da graduação'));
    expect(graus).toHaveLength(1);
  });

  it('o CTA de virada aparece uma vez na página inteira (I3)', () => {
    renderPage();
    expect(screen.getAllByRole('button', { name: /virar o semestre/ })).toHaveLength(1);
  });

  it('sem período ativo, a página abre o primeiro semestre e não mostra virada', () => {
    renderPage({ activeTerm: null, academicTerms: [] });
    expect(screen.getByRole('button', { name: /abrir meu 1º semestre/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /virar o semestre/ })).toBeNull();
  });

  it('a identidade abre o sheet de edição e o salvar devolve os valores', () => {
    const h = renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'editar perfil' }));
    fireEvent.change(screen.getByLabelText('seu nome'), { target: { value: 'maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'guardar perfil' }));
    expect(h.onEditSave).toHaveBeenCalledWith({
      name: 'maria',
      university: 'USP',
      dailyQuote: 'um passo por vez',
      nomeAutorizado: false,
    });
  });

  it('a row do tema abre o seletor reaproveitado em sheet', () => {
    renderPage();
    expect(screen.queryByLabelText('selecionar tema')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /tema do cantinho/ }));
    expect(screen.getByLabelText('selecionar tema')).toBeTruthy();
  });

  it('cada métrica do ritmo leva à sua tela', () => {
    const h = renderPage({
      sessions: [
        { id: 'ses-1', topic: 'psicologia social', date: '2026-10-10', durationMinutes: 45 },
      ],
      tasks: [
        {
          id: 't-1',
          title: 'ler o capítulo 3',
          completed: true,
          priority: 'media',
          category: 'leitura',
        },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: /estudados/ }));
    fireEvent.click(screen.getByRole('button', { name: /tarefas concluídas/ }));
    expect(h.onOpenSessions).toHaveBeenCalledTimes(1);
    expect(h.onOpenTasks).toHaveBeenCalledTimes(1);
  });

  it('a ofensiva e os stickers saem do bloco de conquistas (D8)', () => {
    const h = renderPage();
    fireEvent.click(screen.getByRole('button', { name: /ofensiva atual de/ }));
    fireEvent.click(screen.getByRole('button', { name: /ver todas/ }));
    expect(h.onOpenStreak).toHaveBeenCalledTimes(1);
    expect(h.onOpenStickers).toHaveBeenCalledTimes(1);
  });
});
