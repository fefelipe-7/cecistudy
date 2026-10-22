// Perfil - casca de rota (SPEC-013 D12).
//
// A view responde a `mode="profile"` e `mode="stickers"` (I1), derivados da pilha
// de navegação pelo `SharedScreenLayers`. A página em si é a composição de
// `perfil/ProfilePage.tsx`; os handlers ficam **aqui**, preservando os contratos
// existentes (SPEC-013 D12): nada de domínio novo, nada de contexto novo — quem
// decide continua sendo `packages/*`, quem deriva é `profileViewModel` (D2).
//
// O `mode` não faz early return antes dos hooks: cada rota é um componente
// próprio, então re-renderizar o mesmo `PerfilView` com `mode` diferente nunca
// quebra a ordem de hooks ("Rendered fewer hooks than expected" derrubaria a
// árvore inteira atrás do ErrorBoundary).
import React, { useState } from 'react';
import { CELEBRACAO, frase } from '../../lib/voice';
import {
  useDataClientApp,
  useDataClientCourses,
  useDataClientStudy,
} from '@/context/DataClientProvider';
import {
  useAppActions,
  useNavValue,
  useStudyActions,
  useTermActions,
} from '@/context/shellNavContexts';
import { isGcalConfigured } from '../../lib/gcal';
import { isReminderSupported } from '../../lib/notifications';
import { isNativePlatform } from '../../lib/storage';
import { pickProfilePhoto } from '../../lib/photo';
import { useProfileViewModel } from '../../lib/profileViewModel';
import { useActiveTerm } from '../../lib/termScope';
import { StickersView } from './StickersView';
import ProfilePage from './perfil/ProfilePage';
import type { ProfileEditValues } from './perfil/ProfileEditSheet';

export type PerfilViewMode = 'profile' | 'stickers';

interface PerfilViewProps {
  /** Tela derivada da pilha `perfil` renderizada no lugar da página. */
  mode?: PerfilViewMode;
}

export const PerfilView: React.FC<PerfilViewProps> = ({ mode = 'profile' }) => {
  if (mode === 'stickers') {
    return <StickersRoute />;
  }

  return <PerfilProfileRoute />;
};

const StickersRoute: React.FC = () => <StickersView />;

const PerfilProfileRoute: React.FC = () => {
  const {
    profile,
    stickers,
    reminderSettings,
    gcalEnabled,
    resetApp,
    exportData,
    importData,
    themePref,
    setThemePref,
    academicTerms,
  } = useDataClientApp();
  // Períodos letivos (SPEC-005) — a fonte de verdade do "em que semestre estou".
  const activeTerm = useActiveTerm(academicTerms);
  const { courses, classes, tasks, exams } = useDataClientCourses();
  const { readings, flashcards, sessions } = useDataClientStudy();
  const { streakStats } = useStudyActions();
  const { handleUpdateProfile, showToast, updateReminder, setGcalEnabled } = useAppActions();
  const { correctTermOrdinal, setTotalSemesters } = useTermActions();
  const {
    handleNavigate,
    openStickersScreen,
    openStreak,
    openWizard,
    openTermHistory,
    openSyncScreen,
  } = useNavValue();

  const [editOpen, setEditOpen] = useState(false);

  // Uma única derivação memoizada (SPEC-013 D2). `native` entra como **dado**
  // do VM (via o wrapper `isNativePlatform` de `src/lib/storage`) e o componente
  // nunca brancha a renderização por plataforma — quem decide o que existe é o
  // `maintenance.native` (regra de fronteira do `check-boundaries.mjs`).
  const vm = useProfileViewModel({
    profile,
    activeTerm,
    academicTerms,
    courses,
    classes,
    tasks,
    exams,
    readings,
    flashcards,
    sessions,
    stickers,
    streak: streakStats,
    themePref,
    reminderSettings,
    reminderSupported: isReminderSupported(),
    gcalConfigured: isGcalConfigured(),
    gcalEnabled,
    native: isNativePlatform,
  });

  // Identidade — SPEC-006 D6: `semester` não entra em nenhuma escrita de perfil;
  // quem manda é o `AcademicTerm` ativo. Reescrever o legado aqui fazia a
  // migração 18 → 19 recriar o período com o número antigo na importação.
  const handleEditSave = (values: ProfileEditValues) => {
    handleUpdateProfile({
      name: values.name,
      university: values.university,
      dailyQuote: values.dailyQuote,
      photoUrl: profile.photoUrl,
      // `SPEC-C-014 D8`: a autorização viaja com o perfil. Opcional no tipo, então
      // não exige backfill — quem nunca mexeu continua com "você".
      nomeAutorizado: values.nomeAutorizado,
    });
    showToast(frase(CELEBRACAO, 'configuracoesGuardadas'));
  };

  const handlePickPhoto = async () => {
    try {
      const dataUrl = await pickProfilePhoto();
      if (dataUrl) {
        handleUpdateProfile({ photoUrl: dataUrl });
        showToast(frase(CELEBRACAO, 'fotoAtualizada'));
      }
    } catch {
      // usuário cancelou ou erro — nada muda
    }
  };

  const handleRemovePhoto = () => {
    handleUpdateProfile({ photoUrl: '' });
    showToast(frase(CELEBRACAO, 'fotoRemovida'));
  };

  return (
    <ProfilePage
      vm={vm}
      themePref={themePref}
      editInitial={{
        name: profile.name,
        university: profile.university,
        dailyQuote: profile.dailyQuote,
        nomeAutorizado: profile.nomeAutorizado === true,
      }}
      editOpen={editOpen}
      onEditOpen={() => setEditOpen(true)}
      onEditClose={() => setEditOpen(false)}
      onEditSave={handleEditSave}
      onPickPhoto={handlePickPhoto}
      onRemovePhoto={handleRemovePhoto}
      onCorrectOrdinal={correctTermOrdinal}
      onSetTotalSemesters={setTotalSemesters}
      onOpenSemesterWizard={() => openWizard('semester')}
      onOpenTermHistory={() => openTermHistory()}
      onShowToast={showToast}
      onOpenSessions={() => handleNavigate('estudos', 'sessoes')}
      onOpenReadings={() => handleNavigate('estudos', 'leituras')}
      onOpenTasks={() => handleNavigate('home')}
      onOpenExams={() => handleNavigate('faculdade')}
      onOpenStickers={openStickersScreen}
      onOpenStreak={openStreak}
      onUpdateReminder={updateReminder}
      onSetGcalEnabled={(enabled) => void setGcalEnabled(enabled)}
      onThemeSelect={setThemePref}
      onOpenSync={openSyncScreen}
      onExport={() => exportData()}
      onImport={(json) => importData(json)}
      onReset={resetApp}
    />
  );
};
