import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_CATEGORIES,
  normalizeReminderSettings,
} from '../reminderSettings';

describe('normalizeReminderSettings (SPEC-M-025 D12)', () => {
  it('formato antigo sem `categories` liga tudo e herda o TCC desligado', () => {
    const settings = normalizeReminderSettings(
      { enabled: true, time: '20:00' },
      false
    );
    expect(settings).toEqual({
      enabled: true,
      time: '20:00',
      categories: { ...DEFAULT_REMINDER_CATEGORIES, thesis: false },
    });
  });

  it('formato antigo com o TCC ligado mantém `thesis` ligado', () => {
    const settings = normalizeReminderSettings({ enabled: true, time: '20:00' }, true);
    expect(settings.categories).toEqual(DEFAULT_REMINDER_CATEGORIES);
  });

  it('categorias explícitas vencem e as ausentes caem no default', () => {
    const settings = normalizeReminderSettings({
      enabled: false,
      time: '07:30',
      categories: { class: false, task: true } as never,
    });
    expect(settings).toEqual({
      enabled: false,
      time: '07:30',
      categories: { ...DEFAULT_REMINDER_CATEGORIES, class: false },
    });
  });

  it('vazio vira o default desligado', () => {
    expect(normalizeReminderSettings(undefined)).toEqual({
      enabled: false,
      time: '19:00',
      categories: DEFAULT_REMINDER_CATEGORIES,
    });
  });
});
