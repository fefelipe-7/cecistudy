import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  platform: { value: 'android' },
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
  getPending: vi.fn(),
  checkExactNotificationSetting: vi.fn(),
  changeExactNotificationSetting: vi.fn(),
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: h.checkPermissions,
    requestPermissions: h.requestPermissions,
    schedule: h.schedule,
    cancel: h.cancel,
    getPending: h.getPending,
    checkExactNotificationSetting: h.checkExactNotificationSetting,
    changeExactNotificationSetting: h.changeExactNotificationSetting,
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => h.platform.value },
}));

vi.mock('../storage', () => ({ isNativePlatform: true }));

import {
  auditPendingNotifications,
  enforcePendingBudget,
  openExactAlarmSettings,
  syncClassReminders,
  syncDailySummary,
  syncExamReminders,
  syncFamily,
  syncTaskReminders,
} from '../notifications';

function scheduledPayload(call = 0): { notifications: any[] } {
  return h.schedule.mock.calls[call][0];
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 23, 8, 0));
  vi.clearAllMocks();
  h.platform.value = 'android';
  h.checkPermissions.mockResolvedValue({ display: 'granted' });
  h.requestPermissions.mockResolvedValue({ display: 'granted' });
  h.schedule.mockResolvedValue(undefined);
  h.cancel.mockResolvedValue(undefined);
  h.getPending.mockResolvedValue({ notifications: [] });
  h.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'granted' });
  h.changeExactNotificationSetting.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('adaptador de notificações', () => {
  it('sem permissão: não agenda e nunca abre a tela de alarmes', async () => {
    h.checkPermissions.mockResolvedValue({ display: 'denied' });
    const ok = await syncExamReminders(
      [{ id: 'ex', title: 'neuro', date: '2026-11-10' }],
      { enabled: true, time: '19:00' },
      '2026-10-01'
    );
    expect(ok).toBe(false);
    expect(h.schedule).not.toHaveBeenCalled();
    expect(h.changeExactNotificationSetting).not.toHaveBeenCalled();
  });

  it('plano vazio: cancela a faixa e devolve sucesso', async () => {
    const ok = await syncExamReminders(
      [{ id: 'ex', title: 'neuro', date: '2026-11-10', completed: true }],
      { enabled: true, time: '19:00' },
      '2026-10-01'
    );
    expect(ok).toBe(true);
    expect(h.schedule).not.toHaveBeenCalled();
  });

  it('tarefa: agenda véspera e dia com `extra` de rota e `at`', async () => {
    await syncTaskReminders(
      [{ id: 't1', title: 'resenha', dueDate: '2026-10-25' }],
      { enabled: true, time: '19:00' },
      '2026-10-23'
    );

    const { notifications } = scheduledPayload();
    expect(notifications.map((n) => n.id)).toEqual([6000, 6001]);
    expect(notifications[0].extra).toEqual({
      family: 'task',
      target: { tab: 'home', entityId: 't1' },
    });
    expect(notifications[0].schedule.at).toBeInstanceOf(Date);
    expect(notifications[0].schedule.allowWhileIdle).toBe(true);
    expect(notifications[0].body).toContain('amanhã é o prazo de resenha');
    expect(notifications[1].body).toContain('hoje é o prazo de resenha');
  });

  it('aula: 10 min antes, `on.weekday` convertido e rota da Faculdade', async () => {
    await syncClassReminders([
      { name: 'cálculo', room: 'sala 2', schedule: [{ day: 1, start: '08:00', end: '10:00' }] },
    ]);

    const { notifications } = scheduledPayload();
    expect(notifications[0].schedule.on).toEqual({ weekday: 2, hour: 7, minute: 50 });
    expect(notifications[0].extra).toEqual({ family: 'class', target: { tab: 'faculdade' } });
    expect(notifications[0].title).toContain('cálculo');
  });

  it('resumo diário: 14 dias materializados, com o conteúdo do dia', async () => {
    await syncDailySummary(
      {
        courses: [{ name: 'cálculo', schedule: [{ day: 1, start: '08:00' }] }],
        exams: [],
        tasks: [],
        thesis: { chapters: [], tasks: [] },
      },
      { enabled: true, time: '19:00' },
      '2026-10-26'
    );

    const { notifications } = scheduledPayload();
    expect(notifications).toHaveLength(14);
    expect(notifications[0].id).toBe(1000);
    expect(notifications[0].body).toContain('aula de cálculo às 08:00');
    expect(notifications[0].extra).toEqual({ family: 'daily', target: { tab: 'home' } });
  });

  it('auditoria: classifica por faixa e reporta ids desconhecidos', async () => {
    h.getPending.mockResolvedValue({
      notifications: [{ id: 1001 }, { id: 2000 }, { id: 3000 }, { id: 9999 }],
    });
    const audit = await auditPendingNotifications();
    expect(audit).toEqual({
      total: 4,
      byFamily: { daily: 1, class: 1, thesis: 1 },
      unknown: [9999],
      dropped: [],
      exactAlarm: 'granted',
    });
  });

  it('orçamento iOS: preserva resumo/aulas e corta os mais distantes', async () => {
    h.platform.value = 'ios';
    const day = 24 * 60 * 60 * 1000;
    const notifications = [
      ...Array.from({ length: 14 }, (_, i) => ({ id: 1000 + i, schedule: { at: new Date(Date.now() + i * day) } })),
      ...Array.from({ length: 10 }, (_, i) => ({ id: 2000 + i, schedule: { at: new Date(Date.now() + i * day) } })),
      ...Array.from({ length: 46 }, (_, i) => ({ id: 4000 + i, schedule: { at: new Date(Date.now() + i * day) } })),
    ];
    h.getPending.mockResolvedValue({ notifications });

    const dropped = await enforcePendingBudget();

    expect(dropped).toHaveLength(6);
    expect(dropped).toEqual([4040, 4041, 4042, 4043, 4044, 4045]);
    expect(h.cancel).toHaveBeenCalledWith({
      notifications: dropped.map((id) => ({ id })),
    });
  });

  it('D9: abrir a tela do sistema só acontece por chamada explícita', async () => {
    h.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'denied' });
    await syncTaskReminders(
      [{ id: 't1', title: 'resenha', dueDate: '2026-10-25' }],
      { enabled: true, time: '19:00' },
      '2026-10-23'
    );
    expect(h.changeExactNotificationSetting).not.toHaveBeenCalled();

    h.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'granted' });
    await expect(openExactAlarmSettings()).resolves.toBe(true);
    expect(h.changeExactNotificationSetting).toHaveBeenCalledTimes(1);
  });

  it('orçamento: no-op em Android e web', async () => {
    h.platform.value = 'android';
    await expect(enforcePendingBudget()).resolves.toEqual([]);
    expect(h.getPending).not.toHaveBeenCalled();
  });

  it('orçamento: uma passada com debounce depois do lote de sync', async () => {
    h.platform.value = 'ios';
    await syncFamily('task', {
      tasks: [{ id: 't1', title: 'resenha', dueDate: '2026-10-25' }],
      prefs: { enabled: true, time: '19:00' },
      today: '2026-10-23',
    });

    expect(h.getPending).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(h.getPending).toHaveBeenCalledTimes(1);
  });
});
