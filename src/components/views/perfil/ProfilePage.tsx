// Perfil — página composta (SPEC-013 D1/D10).
//
// A ordem aqui é a narrativa, não a ordem de chegada dos componentes: **eu sou**
// (hero) → **eu estou** (jornada) → **eu construí** (ritmo, memória, conquistas) →
// **eu cuido do meu cantinho** (preferências, dados). A partir de 900 px a
// narrativa vira duas colunas 7/5 — história à esquerda, cuidado à direita — e o
// contorno fecha em 1120 px a partir de 1200 px (D10).
//
// Esta página é apresentação pura: recebe o view model e handlers prontos. Toda
// derivação mora em `src/lib/profileViewModel.ts` (D2); toda ação mora em
// `PerfilView.tsx` (D12).
import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { ProfileViewModel } from '../../../lib/profileViewModel';
import type { ReminderSettings } from '../../../context/DataClientProvider';
import type { ThemeId } from '../../../lib/themes';
import type { ProfileEditValues } from './ProfileEditSheet';
import ProfileEditSheet from './ProfileEditSheet';
import ProfileHero from './ProfileHero';
import JourneyNow from './JourneyNow';
import ProgressPulse from './ProgressPulse';
import JourneyHistory from './JourneyHistory';
import AchievementsPreview from './AchievementsPreview';
import ProfilePreferences from './ProfilePreferences';
import ProfileDataMaintenance from './ProfileDataMaintenance';

export interface ProfilePageProps {
  vm: ProfileViewModel;
  /** Id do tema atual — o seletor em sheet escolhe por id. */
  themePref: ThemeId;
  /** Valores atuais de identidade para o rascunho do sheet. */
  editInitial: ProfileEditValues;
  editOpen: boolean;
  onEditOpen: () => void;
  onEditClose: () => void;
  onEditSave: (values: ProfileEditValues) => void;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
  onCorrectOrdinal: (termId: string, ordinal: number) => void;
  onSetTotalSemesters: (total: number) => void;
  onOpenSemesterWizard: () => void;
  onOpenTermHistory: () => void;
  onShowToast: (message: string) => void;
  onOpenSessions: () => void;
  onOpenReadings: () => void;
  onOpenTasks: () => void;
  onOpenExams: () => void;
  onOpenStickers: () => void;
  onOpenStreak: () => void;
  onUpdateReminder: (settings: ReminderSettings) => void;
  onSetGcalEnabled: (enabled: boolean) => void;
  onThemeSelect: (id: ThemeId) => void;
  onOpenSync: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onReset: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  vm,
  themePref,
  editInitial,
  editOpen,
  onEditOpen,
  onEditClose,
  onEditSave,
  onPickPhoto,
  onRemovePhoto,
  onCorrectOrdinal,
  onSetTotalSemesters,
  onOpenSemesterWizard,
  onOpenTermHistory,
  onShowToast,
  onOpenSessions,
  onOpenReadings,
  onOpenTasks,
  onOpenExams,
  onOpenStickers,
  onOpenStreak,
  onUpdateReminder,
  onSetGcalEnabled,
  onThemeSelect,
  onOpenSync,
  onExport,
  onImport,
  onReset,
}) => (
  <div className="w-full min-[1200px]:max-w-[1120px] min-[1200px]:mx-auto pb-1">
    <div className="grid grid-cols-1 min-[900px]:grid-cols-12 min-[900px]:gap-5 space-y-5 min-[900px]:space-y-0">
      {/* A história: identidade → agora → o que foi construído (coluna 7). */}
      <div className="min-[900px]:col-span-7 space-y-5">
        <ProfileHero
          identity={vm.identity}
          onEdit={onEditOpen}
          onPickPhoto={onPickPhoto}
          onRemovePhoto={onRemovePhoto}
        />

        <JourneyNow
          journey={vm.journey}
          onCorrectOrdinal={onCorrectOrdinal}
          onSetTotalSemesters={onSetTotalSemesters}
          onOpenSemesterWizard={onOpenSemesterWizard}
          onShowToast={onShowToast}
        />

        <ProgressPulse
          pulse={vm.pulse}
          onOpenSessions={onOpenSessions}
          onOpenReadings={onOpenReadings}
          onOpenTasks={onOpenTasks}
          onOpenExams={onOpenExams}
        />

        <JourneyHistory journey={vm.journey} onOpenTermHistory={onOpenTermHistory} />

        <AchievementsPreview
          achievements={vm.achievements}
          onOpenStickers={onOpenStickers}
          onOpenStreak={onOpenStreak}
        />
      </div>

      {/* O cuidado: preferências e dados (coluna 5). */}
      <div className="min-[900px]:col-span-5 space-y-5">
        <ProfilePreferences
          preferences={vm.preferences}
          themePref={themePref}
          onUpdateReminder={onUpdateReminder}
          onSetGcalEnabled={onSetGcalEnabled}
          onThemeSelect={onThemeSelect}
        />

        <ProfileDataMaintenance
          maintenance={vm.maintenance}
          onOpenSync={onOpenSync}
          onExport={onExport}
          onImport={onImport}
          onReset={onReset}
        />
      </div>
    </div>

    {/* rodapé carinhoso (ProfileFooterNote, §5.2) */}
    <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-ceci-tertiary">
      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
      <span>tudo aqui nasce do que você anota, com carinho ♡</span>
      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
    </div>

    {/* Sheet de edição de identidade (D5) — a página é a dona da composição. */}
    <ProfileEditSheet
      open={editOpen}
      onClose={onEditClose}
      initial={editInitial}
      onSave={onEditSave}
    />
  </div>
);

export default ProfilePage;
