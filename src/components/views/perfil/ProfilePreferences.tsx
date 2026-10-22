// Perfil — "eu cuido do meu cantinho": preferências em rows (SPEC-013 D1/D6).
//
// O que era `PersonalizationSection` (tema inline + dois cartões de interruptor +
// formulário de identidade no fim) vira um bloco de rows leves. A edição de
// identidade migrou para o `ProfileHero`/`ProfileEditSheet` (D5); o tema abre em
// sheet reaproveitando `ThemePickerCard` (D6, consequência aceita).
import React, { useState } from 'react';
import { Bell, CalendarDays, Palette, Settings } from 'lucide-react';
import type { ReminderSettings } from '../../../context/DataClientProvider';
import type { ThemeId } from '../../../lib/themes';
import type { ProfilePreferences as ProfilePreferencesVm } from '../../../lib/profileViewModel';
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

const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({
  preferences,
  themePref,
  onUpdateReminder,
  onSetGcalEnabled,
  onThemeSelect,
}) => {
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);

  const reminderDescription = preferences.reminderSupported
    ? preferences.reminderEnabled
      ? `todos os dias às ${preferences.reminderTime}.`
      : 'um carinho do cecistudy na hora de estudar.'
    : 'ativável no aplicativo nativo (android/ios).';

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
          label="lembrete diário de estudo ♡"
          description={reminderDescription}
          ariaLabel={`lembrete diário de estudo, ${
            preferences.reminderEnabled ? 'ligado' : 'desligado'
          }${preferences.reminderSupported ? ` às ${preferences.reminderTime}` : ''}`}
          toggle={{
            checked: preferences.reminderEnabled,
            disabled: !preferences.reminderSupported,
            onChange: () => onUpdateReminder({ enabled: !preferences.reminderEnabled, time: preferences.reminderTime }),
          }}
        />

        {preferences.reminderSupported && preferences.reminderEnabled ? (
          <div className="flex items-center gap-2 pl-16 pr-3 pb-1">
            <label htmlFor="perfil-lembrete-horario" className="text-[11px] text-ceci-secondary">
              horário:
            </label>
            <input
              id="perfil-lembrete-horario"
              type="time"
              value={preferences.reminderTime}
              onChange={(e) =>
                onUpdateReminder({ enabled: preferences.reminderEnabled, time: e.target.value })
              }
              className="bg-surface-default border border-ceci-border-default focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand rounded-xl px-2.5 py-1 text-sm text-ceci-primary"
            />
            <span className="text-[11px] text-ceci-tertiary">todas as noites</span>
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
    </section>
  );
};

export default ProfilePreferences;
