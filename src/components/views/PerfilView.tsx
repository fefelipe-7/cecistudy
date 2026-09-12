import React, { useState, useMemo } from 'react';
import {
  Clock,
  FileText,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  ListChecks,
  Sparkles,
  ChevronRight,
  Smartphone,
  RefreshCw,
  Layers,
  Users,
} from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { useDataClientApp, useDataClientCourses, useDataClientStudy } from '@/context/DataClientProvider';
import { useAppActions, useNavValue } from '@/context/shellNavContexts';
import { DitherFunnelChart } from '../ui/dither-funnel';
import { CHART_PASTELS, formatCount } from '../../lib/ditherChart';
import { isReminderSupported } from '../../lib/notifications';
import { isGcalConfigured } from '../../lib/gcal';
import { isNativePlatform } from '../../lib/storage';

import { pickProfilePhoto } from '../../lib/photo';
import { formatStudyTime } from '../../lib/profileMeta';
import {
  applyNow,
  checkForUpdates,
  formatVersionLabel,
  useOtaStatus,
} from '../../lib/ota';
import { StudyStatsWidget } from '../widgets/StudyStatsWidget';
import { ProgressBar } from '../ui/ProgressBar';
import { StickersView } from './StickersView';
import { GithubSyncCard } from './GithubSyncCard';
import ProfileHeader from './perfil/ProfileHeader';
import JourneySummary from './perfil/JourneySummary';
import JourneyTimeline from './perfil/JourneyTimeline';
import StickersSection from './perfil/StickersSection';
import PersonalizationSection from './perfil/PersonalizationSection';
import DataSection from './perfil/DataSection';

import { deriveCases } from '../../lib/internshipCases';

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Renderiza a seção extra injetada pela casca (ex.: card de atualização do
 * desktop Tauri). Isolada num leaf para o PerfilView não depender do valor
 * agregado do app (que muda a cada alteração de qualquer domínio).
 */
const ShellExtrasSection: React.FC = () => {
  const { shellExtras } = useMobileApp();
  return <>{shellExtras?.updateSection && <shellExtras.updateSection />}</>;
};

/** Card de atualização OTA (auto-suficiente; renderizado só no app nativo). */
const OtaSection: React.FC = () => {
  const ota = useOtaStatus();

  const statusText =
    ota.status === 'checking'
      ? 'procurando novidades…'
      : ota.status === 'downloading'
        ? `baixando atualização (${ota.progress}%)…`
        : ota.status === 'ready'
          ? `a versão ${ota.availableVersion} está pronta ♡`
          : ota.status === 'error'
            ? 'não consegui verificar agora — tenta de novo.'
            : ota.availableVersion && ota.availableVersion !== ota.currentVersion
              ? `novidade disponível: ${ota.availableVersion}`
              : 'tudo em dia ✨';

  const busy = ota.status === 'checking' || ota.status === 'downloading';

  return (
    <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-ceci-academic-strong" />
        <h2 className="font-display font-bold text-xl text-ceci-primary">
          atualização do app
        </h2>
      </div>

      <div className="rounded-2xl p-4 border bg-surface-blue border-ceci-border-academic space-y-3">
        <div>
          <h3 className="font-display font-bold text-sm text-ceci-primary">
            versão web: {formatVersionLabel(ota.currentVersion)}
          </h3>
          <p className="text-[11px] text-ceci-secondary leading-tight mt-0.5">
            {statusText}
          </p>
        </div>

        {ota.status === 'downloading' && <ProgressBar value={ota.progress} className="h-2" />}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void checkForUpdates({ manual: true })}
            disabled={busy}
            className="flex items-center gap-2 bg-surface-default border border-ceci-border-default text-ceci-primary px-4 py-2.5 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-ceci-border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            verificar atualização
          </button>

          {ota.status === 'ready' && (
            <button
              onClick={() => void applyNow()}
              className="flex items-center gap-2 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-4 py-2.5 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer transition-colors"
            >
              aplicar agora
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-ceci-tertiary -mt-1">
        mudanças de interface chegam direto pelo cantinho; mudanças nativas precisam de atualização pela loja.
      </p>
    </div>
  );
};

export type PerfilViewMode = 'profile' | 'stickers';
interface PerfilViewProps {
  /** Tela derivada da pilha `perfil` renderizada no lugar da página. */
  mode?: PerfilViewMode;
}

export const PerfilView: React.FC<PerfilViewProps> = ({ mode = 'profile' }) => {
  const {
    profile,
    internshipLogs,
    tcc,
    stickers,
    reminderSettings,
    gcalEnabled,
    resetApp,
    exportData,
    importData,
  } = useDataClientApp();
  const { courses, classes, tasks, exams } = useDataClientCourses();
  const { readings, flashcards, sessions } = useDataClientStudy();
  const { handleUpdateProfile, showToast, updateReminder, setGcalEnabled } = useAppActions();
  const {
    handleNavigate,
    openInternshipDiary,
    openTccScreen,
    openStickersScreen,
    openSyncScreen,
  } = useNavValue();

  const [name, setName] = useState(profile.name);
  const [semester, setSemester] = useState(profile.semester);
  const [university, setUniversity] = useState(profile.university);
  const [dailyQuote, setDailyQuote] = useState(profile.dailyQuote);

  // Tela cheia de stickers & conquistas (empilhada sobre o perfil)
  if (mode === 'stickers') {
    return <StickersView />;
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateProfile({
      name,
      semester: Number(semester),
      university,
      dailyQuote,
      photoUrl: profile.photoUrl
    });
    showToast('guardei suas configurações com carinho ♡');
  };

  const handlePickPhoto = async () => {
    try {
      const dataUrl = await pickProfilePhoto();
      if (dataUrl) {
        handleUpdateProfile({ photoUrl: dataUrl });
        showToast('foto de perfil atualizada ♡');
      }
    } catch {
      // usuário cancelou ou erro — nada muda
    }
  };

  const handleRemovePhoto = () => {
    handleUpdateProfile({ photoUrl: '' });
    showToast('foto removida — tudo bem, sem pressa ♡');
  };

  // ---- métricas reais derivadas do estado ----
  const percentDegree = Math.round((profile.semester / profile.totalSemesters) * 100);
  const studyMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const pagesRead = readings.reduce((acc, r) => acc + (r.readPages || 0), 0);
  const flashcardsReviewed = flashcards.reduce((acc, f) => acc + (f.timesReviewed || 0), 0);
  const tasksDone = tasks.filter((t) => t.completed).length;
  const examsPending = exams.filter((e) => !e.completed).length;
  const totalInternshipHours = internshipLogs.reduce((acc, l) => acc + l.hours, 0);
  const cases = useMemo(() => deriveCases(internshipLogs), [internshipLogs]);
  const patientsCount = cases.length;
  const pendingReflection = cases.reduce((a, c) => a + c.pendingReflection, 0);
  const pendingSupervision = cases.reduce((a, c) => a + c.pendingSupervision, 0);
  const tccChaptersDone = tcc.chapters.filter((ch) => ch.completed).length;
  const tccChaptersTotal = tcc.chapters.length;
  const stickersUnlocked = stickers.filter((s) => s.unlocked).length;

  // ---- funil da jornada (dithered) ----
  const doneReadings = readings.filter((r) => r.status === 'concluido').length;
  const journeyStages = [
    { label: 'disciplinas', value: courses.length, color: CHART_PASTELS[0] },
    { label: 'aulas anotadas', value: classes.length, color: CHART_PASTELS[1] },
    { label: 'leituras concluídas', value: doneReadings, color: CHART_PASTELS[2] },
    { label: 'flashcards revisados', value: flashcardsReviewed, color: CHART_PASTELS[3] },
  ];

  const tiles: {
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
    display: React.ReactNode;
    animate?: boolean;
    colorClass?: string;
    onClick: () => void;
  }[] = [
    {
      Icon: Clock,
      label: 'horas estudadas',
      display: formatStudyTime(studyMinutes),
      onClick: () => handleNavigate('estudos', 'sessoes')
    },
    {
      Icon: FileText,
      label: 'anotações de aula',
      display: classes.length,
      animate: true,
      onClick: () => handleNavigate('faculdade')
    },
    {
      Icon: BookOpen,
      label: 'páginas lidas',
      display: pagesRead,
      animate: true,
      onClick: () => handleNavigate('estudos', 'leituras')
    },
    {
      Icon: Brain,
      label: 'flashcards revisados',
      display: flashcardsReviewed,
      animate: true,
      onClick: () => handleNavigate('estudos', 'flashcards')
    },
    {
      Icon: CheckCircle2,
      label: 'tarefas concluídas',
      display: `${tasksDone}/${tasks.length}`,
      onClick: () => handleNavigate('home')
    },
    {
      Icon: ClipboardList,
      label: 'provas pendentes',
      display: examsPending,
      animate: true,
      onClick: () => handleNavigate('faculdade')
    },
    {
      Icon: GraduationCap,
      label: 'disciplinas',
      display: courses.length,
      animate: true,
      onClick: () => handleNavigate('faculdade')
    },
    {
      Icon: HeartHandshake,
      label: 'horas de estágio',
      display: totalInternshipHours,
      animate: true,
      onClick: () => openInternshipDiary()
    },
    {
      Icon: Users,
      label: 'pacientes atendidos',
      display: patientsCount,
      animate: true,
      onClick: () => openInternshipDiary()
    },
    {
      Icon: ListChecks,
      label: 'capítulos do tcc',
      display: `${tccChaptersDone}/${tccChaptersTotal}`,
      onClick: () => openTccScreen()
    },
    {
      Icon: Sparkles,
      label: 'stickers desbloqueados',
      display: stickersUnlocked,
      animate: true,
      onClick: () => scrollToSection('perfil-stickers')
    }
  ];

  return (
    <div className="space-y-5 pb-1">
      <ProfileHeader
        profile={profile}
        percentDegree={percentDegree}
        onPickPhoto={handlePickPhoto}
        onRemovePhoto={handleRemovePhoto}
      />
      <JourneySummary tiles={tiles} semestersLeft={profile.totalSemesters - profile.semester} />
      <DitherFunnelChart
        stages={journeyStages}
        title="sua jornada até aqui"
        subtitle="do começo aos revisados"
        icon={<Layers className="w-4 h-4" />}
        formatValue={(n) => formatCount(n)}
      />

      <StudyStatsWidget />

      <JourneyTimeline profile={profile} percentDegree={percentDegree} />

      <StickersSection stickers={stickers} unlocked={stickersUnlocked} onOpen={openStickersScreen} />

      <PersonalizationSection
        reminderSettings={reminderSettings}
        onUpdateReminder={updateReminder}
        reminderSupported={isReminderSupported()}
        gcalEnabled={gcalEnabled}
        onSetGcalEnabled={setGcalEnabled}
        gcalConfigured={isGcalConfigured()}
        name={name}
        onNameChange={setName}
        semester={semester}
        onSemesterChange={setSemester}
        university={university}
        onUniversityChange={setUniversity}
        dailyQuote={dailyQuote}
        onDailyQuoteChange={setDailyQuote}
        onSaveProfile={handleSaveProfile}
      />

      {isNativePlatform && <OtaSection />}
      <ShellExtrasSection />
      <GithubSyncCard />

      <DataSection
        onOpenSync={openSyncScreen}
        onExport={() => exportData()}
        onImport={(json) => importData(json)}
        onReset={resetApp}
      />
      {/* rodapé carinhoso */}
      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-ceci-tertiary">
        <Sparkles className="w-3.5 h-3.5" />
        <span>tudo aqui nasce do que você anota, com carinho ♡</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
