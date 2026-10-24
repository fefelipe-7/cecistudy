// Perfil — "eu cuido do meu cantinho": preferências em rows (SPEC-013 D1/D6).
//
// O que era `PersonalizationSection` (tema inline + dois cartões de interruptor +
// formulário de identidade no fim) vira um bloco de rows leves. A edição de
// identidade migrou para o `ProfileHero`/`ProfileEditSheet` (D5); o tema abre em
// sheet reaproveitando `ThemePickerCard` (D6, consequência aceita).
import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Palette,
  PenLine,
  Settings,
} from 'lucide-react';
import type { ReminderCategories, ReminderSettings } from '../../../context/DataClientProvider';
import type { ThemeId } from '../../../lib/themes';
import type { ProfilePreferences as ProfilePreferencesVm } from '../../../lib/profileViewModel';
import { checkExactAlarmStatus, openExactAlarmSettings, supportsExactAlarmPrompt } from '../../../lib/notifications';
import { NOTIFICACAO, frase } from '../../../lib/voice';
import { Modal } from '../../ui/Modal';
import PreferenceRow from './PreferenceRow';
import ThemePickerCard from './ThemePickerCard';

interface ProfilePreferencesProps {
  preferences: ProfilePreferencesVm;
  /** Id do tema atual — o `ThemePickerCard` seleciona por id. */
  themePref: ThemeId;
  onUpdateReminder: (settings: ReminderSettings) => void;
  onSetGcalEnabled: (enabled: boolean) => void;
  onThemeSelect: (id: ThemeId) => void;
}

const CATEGORIAS: { key: keyof ReminderCategories; label: string; icon: React.ReactNode }[] = [
  { key: 'class', label: 'aulas', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'exam', label: 'provas', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'task', label: 'tarefas e prazos', icon: <ClipboardCheck className="w-4 h-4" /> },
  { key: 'thesis', label: 'tcc', icon: <PenLine className="w-4 h-4" /> },
  { key: 'internship', label: 'estágio', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'summary', label: 'resumo do dia', icon: <CalendarCheck className="w-4 h-4" /> },
];

const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({
  preferences,
  themePref,
  onUpdateReminder,
  onSetGcalEnabled,
  onThemeSelect,
}) => {
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [pendingReminder, setPendingReminder] = useState<ReminderSettings | null>(null);
  const [alarmDenied, setAlarmDenied] = useState(false);

  // T5.5: o estado `denied` aparece no texto, mas nada abre sozinho (D9).
  useEffect(() => {
    if (!preferences.reminderSupported || !preferences.reminderEnabled) {
      setAlarmDenied(false);
      return;
    }
    let alive = true;
    void checkExactAlarmStatus().then((status) => {
      if (alive) setAlarmDenied(status === 'denied');
    });
    return () => {
      alive = false;
    };
  }, [preferences.reminderSupported, preferences.reminderEnabled]);

  const reminderDescription = preferences.reminderSupported
    ? preferences.reminderEnabled
      ? alarmDenied
        ? `todos os dias às ${preferences.reminderTime}. o android pode atrasar o aviso até você liberar alarmes.`
        : `todos os dias às ${preferences.reminderTime}.`
      : 'um carinho do cecistudy na hora de estudar.'
    : 'ativável no aplicativo nativo (android/ios).';

  /**
   * D9: ao ligar o master ou uma categoria, pergunta antes de abrir a tela do
   * sistema. "Agora não" mantém o lembrete ligado; só não abre nada.
   */
  const requestChange = (patch: Partial<ReminderSettings>) => {
    const next: ReminderSettings = {
      enabled: patch.enabled ?? preferences.reminderEnabled,
      time: patch.time ?? preferences.reminderTime,
      categories: patch.categories ?? preferences.reminderCategories,
    };
    const turningOn =
      (next.enabled && !preferences.reminderEnabled) ||
      (Object.keys(next.categories) as (keyof ReminderCategories)[]).some(
        (key) => next.categories[key] && !preferences.reminderCategories[key]
      );

    const apply = (settings: ReminderSettings) => onUpdateReminder(settings);
    if (!turningOn || !supportsExactAlarmPrompt()) {
      apply(next);
      return;
    }
    void (async () => {
      const status = await checkExactAlarmStatus();
      if (status === 'denied') setPendingReminder(next);
      else apply(next);
    })();
  };

  const updateCategories = (key: keyof ReminderCategories) =>
    requestChange({
      categories: { ...preferences.reminderCategories, [key]: !preferences.reminderCategories[key] },
    });

  /** "Agora não" (e fechar o modal) mantém o lembrete ligado; só não abre nada. */
  const dismissPending = () => {
    if (pendingReminder) onUpdateReminder(pendingReminder);
    setAlarmDenied(true);
    setPendingReminder(null);
  };

  return (
    <section
      aria-labelledby="perfil-preferencias-titulo"
      className="rounded-3xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-3"
    >
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-ceci-brand-strong" aria-hidden="true" />
        <h2
          id="perfil-preferencias-titulo"
          className="font-display font-bold text-xl text-ceci-primary"
        >
          cuidado do cantinho
        </h2>
      </div>

      <PreferenceRow
        icon={<Palette className="w-4 h-4" />}
        label="tema do cantinho"
        value={preferences.themeLabel}
        ariaLabel={`tema do cantinho, atual: ${preferences.themeLabel}. abrir seletor de tema.`}
        onClick={() => setThemeSheetOpen(true)}
      />

      <div className="space-y-1">
        <PreferenceRow
          icon={<Bell className="w-4 h-4" />}
          label="lembretes ♡"
          description={reminderDescription}
          ariaLabel={`lembretes, ${preferences.reminderEnabled ? 'ligados' : 'desligados'}${
            preferences.reminderSupported ? ` às ${preferences.reminderTime}` : ''
          }`}
          toggle={{
            checked: preferences.reminderEnabled,
            disabled: !preferences.reminderSupported,
            onChange: () => requestChange({ enabled: !preferences.reminderEnabled }),
          }}
        />

        {preferences.reminderSupported && preferences.reminderEnabled ? (
          <div className="space-y-1 pt-1">
            <div className="flex items-center gap-2 pl-16 pr-3 pb-1">
              <label htmlFor="perfil-lembrete-horario" className="text-[11px] text-ceci-secondary">
                horário:
              </label>
              <input
                id="perfil-lembrete-horario"
                type="time"
                value={preferences.reminderTime}
                onChange={(e) => requestChange({ time: e.target.value })}
                className="bg-surface-default border border-ceci-border-default focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand rounded-xl px-2.5 py-1 text-sm text-ceci-primary"
              />
              <span className="text-[11px] text-ceci-tertiary">no horário local</span>
            </div>

            {CATEGORIAS.map(({ key, label, icon }) => (
              <PreferenceRow
                key={key}
                icon={icon}
                label={label}
                ariaLabel={`lembrete de ${label}, ${
                  preferences.reminderCategories[key] ? 'ligado' : 'desligado'
                }`}
                toggle={{
                  checked: preferences.reminderCategories[key],
                  onChange: () => updateCategories(key),
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <PreferenceRow
        icon={<CalendarDays className="w-4 h-4" />}
        label="agenda do google ♡"
        description={
          preferences.calendarConfigured
            ? 'suas provas e tarefas viram eventos na agenda.'
            : 'precisa configurar o client id do google primeiro.'
        }
        ariaLabel={`agenda do google, ${
          preferences.calendarEnabled ? 'ligada' : 'desligada'
        }${preferences.calendarConfigured ? '' : ', não configurada neste ambiente'}`}
        toggle={{
          checked: preferences.calendarEnabled,
          disabled: !preferences.calendarConfigured,
          onChange: () => onSetGcalEnabled(!preferences.calendarEnabled),
        }}
      />

      <Modal
        open={themeSheetOpen}
        onClose={() => setThemeSheetOpen(false)}
        position="bottom"
        showGrabber
        labelledBy="perfil-tema-titulo"
      >
        <div className="w-full bg-surface-default rounded-t-3xl sm:rounded-3xl shadow-floating p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4">
          <h2 id="perfil-tema-titulo" className="sr-only">
            trocar tema
          </h2>
          <ThemePickerCard currentTheme={themePref} onSelect={onThemeSelect} />
          <button
            type="button"
            onClick={() => setThemeSheetOpen(false)}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-ceci-on-primary bg-ceci-primary hover:bg-ceci-primary-hover cursor-pointer active:scale-95 transition-transform"
          >
            prontinho ♡
          </button>
        </div>
      </Modal>

      <Modal
        open={pendingReminder !== null}
        onClose={dismissPending}
        position="center"
        labelledBy="perfil-alarme-titulo"
      >
        <div className="w-full max-w-sm bg-surface-default rounded-3xl shadow-floating p-6 space-y-4">
          <h2
            id="perfil-alarme-titulo"
            className="font-display font-bold text-lg text-ceci-primary"
          >
            {frase(NOTIFICACAO, 'alarmeTitulo')}
          </h2>
          <p className="text-sm text-ceci-secondary">{frase(NOTIFICACAO, 'alarmeCorpo')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismissPending}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-muted hover:bg-surface-rose cursor-pointer"
            >
              {frase(NOTIFICACAO, 'alarmeDepois')}
            </button>
            <button
              type="button"
              onClick={() => {
                const settings = pendingReminder;
                setPendingReminder(null);
                if (settings) onUpdateReminder(settings);
                void openExactAlarmSettings().then((opened) => setAlarmDenied(!opened));
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-primary bg-ceci-primary hover:bg-ceci-primary-hover cursor-pointer"
            >
              {frase(NOTIFICACAO, 'alarmeAbrir')}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ProfilePreferences;
