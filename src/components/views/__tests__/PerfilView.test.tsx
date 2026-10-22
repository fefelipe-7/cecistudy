/**
 * SPEC-013 I1/D12 — `PerfilView` responde a `mode="profile"` e
 * `mode="stickers"`, contrato consumido por `src/shells/SharedScreenLayers.tsx:358`.
 * A página e a coleção são mockadas aqui: o que este teste fixa é a **rota**, o
 * wiring do view model (perfil real vira `vm.identity.displayName`) e o fato de
 * que nenhum hook roda para a rota errada.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UserProfile } from '../../../types';

const profile: UserProfile = {
  name: 'ceci',
  semester: 6,
  totalSemesters: 8,
  university: 'USP',
  targetCareer: 'Psicologia',
  dailyQuote: 'um passo por vez',
  stickersCollected: 0,
};

vi.mock('../StickersView', () => ({
  StickersView: () => <div data-testid="stickers-view" />,
}));

vi.mock('../perfil/ProfilePage', () => ({
  default: (props: { vm: { identity: { displayName: string } } }) => (
    <div data-testid="profile-page" data-name={props.vm.identity.displayName} />
  ),
}));

vi.mock('@/context/DataClientProvider', () => ({
  useDataClientApp: () => ({
    profile,
    stickers: [],
    reminderSettings: { enabled: false, time: '20:00' },
    gcalEnabled: false,
    resetApp: vi.fn(),
    exportData: vi.fn(),
    importData: vi.fn(),
    themePref: 'rosa-claro',
    setThemePref: vi.fn(),
    academicTerms: [],
  }),
  useDataClientCourses: () => ({ courses: [], classes: [], tasks: [], exams: [] }),
  useDataClientStudy: () => ({ readings: [], flashcards: [], sessions: [] }),
}));

vi.mock('@/context/shellNavContexts', () => ({
  useAppActions: () => ({
    handleUpdateProfile: vi.fn(),
    showToast: vi.fn(),
    updateReminder: vi.fn(),
    setGcalEnabled: vi.fn(),
  }),
  useTermActions: () => ({ correctTermOrdinal: vi.fn(), setTotalSemesters: vi.fn() }),
  useStudyActions: () => ({
    streakStats: { current: 0, longest: 0, total: 0, alive: false },
  }),
  useNavValue: () => ({
    handleNavigate: vi.fn(),
    openStickersScreen: vi.fn(),
    openStreak: vi.fn(),
    openWizard: vi.fn(),
    openTermHistory: vi.fn(),
    openSyncScreen: vi.fn(),
  }),
}));

import { PerfilView } from '../PerfilView';

describe('PerfilView — rota (SPEC-013 I1/D12)', () => {
  it('mode="stickers" renderiza a coleção, não a página', () => {
    render(<PerfilView mode="stickers" />);
    expect(screen.getByTestId('stickers-view')).toBeTruthy();
    expect(screen.queryByTestId('profile-page')).toBeNull();
  });

  it('mode="profile" renderiza a página composta (default)', () => {
    render(<PerfilView mode="profile" />);
    expect(screen.getByTestId('profile-page')).toBeTruthy();
    expect(screen.queryByTestId('stickers-view')).toBeNull();
  });

  it('sem mode, o default é a página', () => {
    render(<PerfilView />);
    expect(screen.getByTestId('profile-page')).toBeTruthy();
  });

  it('a página recebe o view model derivado do perfil real', () => {
    render(<PerfilView mode="profile" />);
    expect(screen.getByTestId('profile-page').getAttribute('data-name')).toBe('ceci');
  });
});
