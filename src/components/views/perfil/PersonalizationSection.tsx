// Perfil — "personalize seu cantinho" (lembrete + agenda + dados do perfil) (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React from 'react';
import { Settings } from 'lucide-react';
import type { ReminderSettings } from '../../../context/DataClientProvider';
import type { ThemeId } from '../../../lib/themes';
import { ToggleRow } from '../../ui/ToggleRow';
import ThemePickerCard from './ThemePickerCard';

interface PersonalizationSectionProps {
  reminderSettings: ReminderSettings;
  onUpdateReminder: (r: ReminderSettings) => void;
  reminderSupported: boolean;
  gcalEnabled: boolean;
  onSetGcalEnabled: (enabled: boolean) => void;
  gcalConfigured: boolean;
  name: string;
  onNameChange: (v: string) => void;
  semester: number;
  onSemesterChange: (v: number) => void;
  university: string;
  onUniversityChange: (v: string) => void;
  dailyQuote: string;
  onDailyQuoteChange: (v: string) => void;
  onSaveProfile: (e: React.FormEvent) => void;
  themePref: ThemeId;
  onThemeSelect: (id: ThemeId) => void;
}

const PersonalizationSection: React.FC<PersonalizationSectionProps> = ({
  reminderSettings,
  onUpdateReminder,
  reminderSupported,
  gcalEnabled,
  onSetGcalEnabled,
  gcalConfigured,
  name,
  onNameChange,
  semester,
  onSemesterChange,
  university,
  onUniversityChange,
  dailyQuote,
  onDailyQuoteChange,
  onSaveProfile,
  themePref,
  onThemeSelect,
}) => (
  <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4">
    <div className="flex items-center gap-2">
      <Settings className="w-4 h-4 text-ceci-brand-strong" />
      <h2 className="font-display font-bold text-xl text-ceci-primary">
        personalize seu cantinho
      </h2>
    </div>

    {/* Tema do app (TEM-001) — acima do formulário, antes do lembrete */}
    <ThemePickerCard currentTheme={themePref} onSelect={onThemeSelect} />

    {/* Lembrete diário de estudo (app nativo) */}
    <div className={`rounded-2xl p-4 border ${reminderSupported ? 'bg-surface-rose border-ceci-border-brand' : 'bg-surface-muted border-ceci-border-default'} space-y-3`}>
      <ToggleRow
        label="lembrete diário de estudo ♡"
        description={
          reminderSupported
            ? 'um carinho do cecistudy na hora de estudar.'
            : 'ativável no aplicativo nativo (android/ios).'
        }
        checked={reminderSettings.enabled}
        onChange={() => onUpdateReminder({ ...reminderSettings, enabled: !reminderSettings.enabled })}
        disabled={!reminderSupported}
        className=""
      />

      {reminderSupported && (
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-ceci-secondary">horário:</span>
          <input
            type="time"
            value={reminderSettings.time}
            onChange={(e) => onUpdateReminder({ ...reminderSettings, time: e.target.value })}
            disabled={!reminderSettings.enabled}
            className="bg-surface-default border border-ceci-border-default focus:outline-none focus:border-ceci-brand rounded-xl px-3 py-1.5 text-sm text-ceci-primary disabled:opacity-50"
          />
          <span className="text-[11px] text-ceci-tertiary">todas as noites</span>
        </div>
      )}
    </div>

    {/* Agenda do Google (provas e tarefas) */}
    <div className={`rounded-2xl p-4 border ${gcalEnabled ? 'bg-surface-blue border-ceci-border-academic' : 'bg-surface-muted border-ceci-border-default'} space-y-3`}>
      <ToggleRow
        label="agenda do google ♡"
        description={
          gcalConfigured
            ? 'suas provas e tarefas viram eventos na agenda.'
            : 'precisa configurar o client id do google primeiro.'
        }
        checked={gcalEnabled}
        onChange={() => void onSetGcalEnabled(!gcalEnabled)}
        disabled={!gcalConfigured}
        className=""
      />
      {!gcalConfigured && (
        <p className="text-[11px] text-ceci-tertiary">
          adicione <code className="rounded bg-surface-default px-1 border border-ceci-border-default">VITE_GOOGLE_CLIENT_ID_WEB</code> no ambiente.
        </p>
      )}
    </div>

    <form onSubmit={onSaveProfile} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-ceci-secondary mb-1">seu nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-ceci-brand rounded-xl px-3.5 py-2 text-sm text-ceci-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ceci-secondary mb-1">semestre atual</label>
          <input
            type="number"
            value={semester}
            onChange={(e) => onSemesterChange(Number(e.target.value))}
            className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-ceci-brand rounded-xl px-3.5 py-2 text-sm text-ceci-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ceci-secondary mb-1">universidade</label>
          <input
            type="text"
            value={university}
            onChange={(e) => onUniversityChange(e.target.value)}
            className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-ceci-brand rounded-xl px-3.5 py-2 text-sm text-ceci-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-ceci-secondary mb-1">frase motivacional de entrada</label>
        <textarea
          rows={2}
          value={dailyQuote}
          onChange={(e) => onDailyQuoteChange(e.target.value)}
          className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-ceci-brand rounded-xl px-3.5 py-2 text-xs text-ceci-primary"
        />
      </div>

      <button
        type="submit"
        className="bg-ceci-brand hover:bg-ceci-brand text-ceci-on-brand px-5 py-2.5 rounded-xl text-xs font-medium shadow-2xs cursor-pointer"
      >
        guardar configurações do cantinho
      </button>
    </form>
  </div>
);

export default PersonalizationSection;