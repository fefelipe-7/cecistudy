import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfilePreferences from '../ProfilePreferences';
import { DEFAULT_REMINDER_CATEGORIES } from '../../../../lib/reminderSettings';
import type { ProfilePreferences as ProfilePreferencesVm } from '../../../../lib/profileViewModel';

const h = vi.hoisted(() => ({
  status: vi.fn(),
  open: vi.fn(),
  supports: vi.fn(),
}));

vi.mock('../../../../lib/notifications', () => ({
  checkExactAlarmStatus: h.status,
  openExactAlarmSettings: h.open,
  supportsExactAlarmPrompt: h.supports,
}));

const preferences = (over: Partial<ProfilePreferencesVm> = {}): ProfilePreferencesVm => ({
  reminderSupported: true,
  reminderEnabled: false,
  reminderTime: '19:00',
  reminderCategories: { ...DEFAULT_REMINDER_CATEGORIES },
  calendarConfigured: false,
  calendarEnabled: false,
  themeLabel: 'campinho',
  ...over,
});

const renderPreferences = (vm: ProfilePreferencesVm) => {
  const onUpdateReminder = vi.fn();
  const ui = (p: ProfilePreferencesVm) => (
    <ProfilePreferences
      preferences={p}
      themePref="campinho"
      onUpdateReminder={onUpdateReminder}
      onSetGcalEnabled={() => {}}
      onThemeSelect={() => {}}
    />
  );
  const view = render(ui(vm));
  return { onUpdateReminder, rerender: (p: ProfilePreferencesVm) => view.rerender(ui(p)) };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.supports.mockReturnValue(true);
  h.status.mockResolvedValue('granted');
  h.open.mockResolvedValue(true);
});

describe('ProfilePreferences — um lugar de controle (SPEC-M-025 D9, D12)', () => {
  it('alarme negado: pergunta antes; "agora não" liga o lembrete e avisa', async () => {
    h.status.mockResolvedValue('denied');
    const { onUpdateReminder, rerender } = renderPreferences(preferences());

    fireEvent.click(screen.getByRole('switch', { name: /lembretes/ }));

    expect(await screen.findByText('deixar o lembrete na hora?')).toBeInTheDocument();
    expect(h.open).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'agora não' }));

    expect(onUpdateReminder).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    rerender(preferences({ reminderEnabled: true }));
    expect(screen.getByText(/pode atrasar o aviso/)).toBeInTheDocument();
    expect(h.open).not.toHaveBeenCalled();
  });

  it('"abrir agora" aplica e abre a tela do sistema', async () => {
    h.status.mockResolvedValue('denied');
    const { onUpdateReminder } = renderPreferences(preferences());

    fireEvent.click(screen.getByRole('switch', { name: /lembretes/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'abrir agora' }));

    expect(onUpdateReminder).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    expect(h.open).toHaveBeenCalledTimes(1);
  });

  it('categoria desligada vira `categories.class = false` na mesma escrita', async () => {
    const { onUpdateReminder } = renderPreferences(
      preferences({ reminderEnabled: true })
    );

    fireEvent.click(screen.getByRole('switch', { name: /lembrete de aulas/ }));

    await waitFor(() => {
      expect(onUpdateReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          categories: { ...DEFAULT_REMINDER_CATEGORIES, class: false },
        })
      );
    });
  });

  it('master desligado desliga tudo numa escrita', () => {
    const { onUpdateReminder } = renderPreferences(
      preferences({ reminderEnabled: true })
    );

    fireEvent.click(screen.getByRole('switch', { name: /lembretes/ }));

    expect(onUpdateReminder).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });
});
