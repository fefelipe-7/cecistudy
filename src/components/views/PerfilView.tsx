import React, { useState } from 'react';
import {
  Clock,
  Database,
  Download,
  FileText,
  Upload,
  RotateCcw,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  ListChecks,
  Sparkles,
  Settings,
  ChevronRight,
  Camera,
  Trash2,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Toggle } from '../ui/Toggle';
import { isReminderSupported } from '../../lib/notifications';
import { isNativePlatform } from '../../lib/storage';
import { pickProfilePhoto } from '../../lib/photo';
import {
  applyNow,
  checkForUpdates,
  formatVersionLabel,
  useOtaStatus,
} from '../../lib/ota';
import { StudyStatsWidget } from '../widgets/StudyStatsWidget';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { ProgressBar } from '../ui/ProgressBar';
import { Kitty } from '../ui/Kitty';
import { InternshipLogCard } from '../InternshipLogCard';
import { InternshipDiaryView } from './InternshipDiaryView';
import { TccView } from './TccView';
import { StickersView } from './StickersView';

/** Formata minutos de estudo em "Xh Ymin" / "Xmin". */
const formatStudyTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
};

/** Reflexão de jornada derivada do semestre atual (voz carinhosa do cantinho). */
const getJourneyReflection = (semester: number, total: number): string => {
  const half = Math.ceil(total / 2);
  if (semester < half) {
    return `no ${semester}º semestre, cada aula e leitura é um alicerce novo — a teoria vai se transformando em forma de ver o mundo. sem pressa, com carinho.`;
  }
  if (semester === half) {
    return `metade da graduação! no ${semester}º semestre a teoria ganha vida na prática do estágio e na estruturação do tcc. cada aula é um tijolinho na construção da profissional que estou me tornando.`;
  }
  return `no ${semester}º semestre, a caminhada está bem encaminhada — entre estágio, tcc e práticas, cada registro vira cuidado e conhecimento. falta pouco para a formatura ♡`;
};

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
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
            className="flex items-center gap-2 bg-white border border-ceci-border-default text-ceci-primary px-4 py-2.5 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-ceci-border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export const PerfilView: React.FC = () => {
  const {
    profile,
    courses,
    classes,
    tasks,
    exams,
    readings,
    flashcards,
    sessions,
    internshipLogs,
    tcc,
    stickers,
    handleUpdateProfile,
    handleNavigate,
    openQuickAdd,
    openInternshipDiary,
    isInternshipDiaryOpen,
    isTccScreenOpen,
    openTccScreen,
    isStickersScreenOpen,
    openStickersScreen,
    reminderSettings,
    updateReminder,
    showToast,
    loadDemoData,
    resetApp,
    exportData,
    importData,
  } = useApp();

  const [name, setName] = useState(profile.name);
  const [semester, setSemester] = useState(profile.semester);
  const [university, setUniversity] = useState(profile.university);
  const [dailyQuote, setDailyQuote] = useState(profile.dailyQuote);

  // Tela cheia do diário de estágio (empilhada sobre o perfil)
  if (isInternshipDiaryOpen) {
    return <InternshipDiaryView />;
  }

  // Tela cheia do meu TCC (empilhada sobre o perfil)
  if (isTccScreenOpen) {
    return <TccView />;
  }

  // Tela cheia de stickers & conquistas (empilhada sobre o perfil)
  if (isStickersScreenOpen) {
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
  const avgCourseProgress = courses.length
    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
    : 0;
  const totalInternshipHours = internshipLogs.reduce((acc, l) => acc + l.hours, 0);
  const tccChaptersDone = tcc.chapters.filter((ch) => ch.completed).length;
  const tccChaptersTotal = tcc.chapters.length;
  const stickersUnlocked = stickers.filter((s) => s.unlocked).length;
  const hasTcc = tcc.title.trim().length > 0;

  const tccStatusLabel =
    tcc.status === 'concluido' ? 'concluído' : tcc.status === 'revisao' ? 'em revisão' : 'em andamento';

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
      onClick: () => handleNavigate('faculdade', 'aulas')
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
      onClick: () => handleNavigate('faculdade', 'avaliacoes')
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
      onClick: () => scrollToSection('perfil-estagio')
    },
    {
      Icon: ListChecks,
      label: 'capítulos do tcc',
      display: `${tccChaptersDone}/${tccChaptersTotal}`,
      onClick: () => scrollToSection('perfil-tcc')
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
      {/* ===== Header compacto ===== */}
      <div className="rounded-[24px] p-5 bg-gradient-to-r from-white via-surface-muted to-surface-rose/80 border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-3xl bg-surface-rose border-2 border-ceci-border-brand flex items-center justify-center font-display font-bold text-3xl text-ceci-primary shadow-2xs overflow-hidden">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={`foto de ${profile.name}`} className="w-full h-full object-cover" />
              ) : (
                profile.name.trim().charAt(0).toUpperCase() || 'C'
              )}
            </div>
            <button
              onClick={handlePickPhoto}
              aria-label="trocar foto de perfil"
              title="trocar foto"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ceci-primary hover:bg-ceci-primary-hover text-white flex items-center justify-center shadow-xs border-2 border-white tap-interactive cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            {profile.photoUrl && (
              <button
                onClick={handleRemovePhoto}
                aria-label="remover foto de perfil"
                title="remover foto"
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-ceci-border-default text-ceci-secondary hover:text-red-700 hover:border-red-400 flex items-center justify-center shadow-xs tap-interactive cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ceci-primary truncate">
              meu espaço • {profile.name} <span className="text-rose-500 font-normal">♡</span>
            </h1>
            <p className="text-xs text-ceci-secondary mt-0.5">
              {profile.targetCareer} • {profile.university}
            </p>
          </div>
        </div>

        {/* progresso da graduação — inline */}
        <div className="rounded-2xl bg-white p-3.5 border border-ceci-border-default space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-ceci-tertiary">progresso da graduação</span>
            <span className="font-display font-bold text-sm text-ceci-brand-strong">
              {percentDegree}% concluído
            </span>
          </div>
          <ProgressBar value={percentDegree} />
          <p className="text-[11px] text-ceci-secondary">
            {profile.semester}º de {profile.totalSemesters} semestres
          </p>
        </div>

        <p className="text-xs text-ceci-secondary leading-relaxed italic border-t border-ceci-border-subtle pt-3">
          “{profile.dailyQuote}”
        </p>
      </div>

      {/* ===== Resumo da jornada (métricas reais) ===== */}
      <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
        <div>
          <h2 className="font-display font-bold text-xl text-ceci-primary">
            resumo da minha jornada
          </h2>
          <p className="text-xs text-ceci-secondary">
            tudo anotado com carinho ao longo dos semestres, reunido aqui ♡
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              role="button"
              tabIndex={0}
              onClick={tile.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  tile.onClick();
                }
              }}
              className="p-3 rounded-2xl bg-surface-muted border border-ceci-border-default hover:border-ceci-border-brand tap-interactive cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-ceci-border-subtle flex items-center justify-center mb-1.5">
                <tile.Icon className="w-3.5 h-3.5 text-ceci-brand-strong" />
              </div>
              <p className="font-display font-bold text-lg text-ceci-primary leading-none">
                {tile.animate ? <AnimatedNumber value={tile.display as number} /> : tile.display}
              </p>
              <p className="text-[10px] font-medium text-ceci-secondary mt-0.5 leading-tight">
                {tile.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-ceci-border-subtle pt-3">
          <p className="text-[10px] text-ceci-tertiary">
            média de progresso das disciplinas: {avgCourseProgress}%
          </p>
          <span className="text-[11px] font-semibold text-ceci-brand-strong">
            {profile.totalSemesters - profile.semester} semestres restantes
          </span>
        </div>
      </div>

      {/* ===== Ofensiva de estudos (streak real) ===== */}
      <StudyStatsWidget />

      {/* ===== Linha do tempo da graduação ===== */}
      <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-xl text-ceci-primary">
              linha do tempo da minha graduação
            </h2>
            <p className="text-xs text-ceci-secondary">
              acompanhando a caminhada desde o primeiro dia até a formação clínica.
            </p>
          </div>
          <span className="text-xs bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand px-3 py-1 rounded-full font-medium shrink-0">
            {percentDegree}% do caminho 🎓
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {Array.from({ length: profile.totalSemesters }, (_, i) => i + 1).map((sem) => {
            const isPast = sem < profile.semester;
            const isCurrent = sem === profile.semester;

            return (
              <div
                key={sem}
                className={`p-3.5 rounded-2xl border text-center ${
                  isCurrent
                    ? 'bg-surface-rose border-2 border-ceci-border-brand text-ceci-brand-strong shadow-2xs font-bold'
                    : isPast
                    ? 'bg-surface-blue/80 border-ceci-border-academic text-ceci-academic-strong'
                    : 'bg-white border-ceci-border-default opacity-60 text-ceci-secondary'
                }`}
              >
                <p className="text-xs opacity-80">semestre</p>
                <p className="font-display text-2xl font-bold my-1">{sem}º</p>
                <p className="text-[10px] font-medium">
                  {isCurrent ? '🌸 em andamento' : isPast ? '✓ concluído' : 'aguardando'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-surface-muted border border-ceci-border-default text-xs space-y-2">
          <p className="font-semibold text-ceci-primary">💭 reflexão de jornada:</p>
          <p className="text-ceci-secondary leading-relaxed">
            “{getJourneyReflection(profile.semester, profile.totalSemesters)}”
          </p>
        </div>
      </div>

      {/* ===== Diário de estágio ===== */}
      <div id="perfil-estagio" className="scroll-mt-4 rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl text-ceci-primary">
              diário de estágio
            </h2>
            <p className="text-xs text-ceci-secondary">
              horas, diário de campo e reflexões da clínica escola.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-surface-blue px-3.5 py-1.5 rounded-2xl border border-ceci-border-academic text-xs text-right">
              <p className="text-[10px] lowercase font-bold text-ceci-secondary">total de horas</p>
              <p className="font-bold text-ceci-academic-strong text-sm">{totalInternshipHours} horas anotadas</p>
            </div>

            <button
              onClick={openQuickAdd}
              className="bg-rose-500 hover:bg-ceci-brand text-white px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
            >
              + nova anotação
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {internshipLogs.slice(0, 2).map((log) => (
            <InternshipLogCard key={log.id} log={log} />
          ))}

          {internshipLogs.length > 2 && (
            <button
              onClick={openInternshipDiary}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong text-xs font-bold tap-interactive hover:bg-ceci-border-brand/40 active:scale-[0.98] cursor-pointer"
            >
              ver mais {internshipLogs.length - 2} registros
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {internshipLogs.length === 0 && (
            <p className="text-xs text-ceci-secondary bg-surface-muted border border-ceci-border-subtle rounded-2xl p-4 text-center flex items-center justify-center gap-2">
              <Kitty expression="feliz" className="w-7 h-7 shrink-0" decorative />
              ainda não tem registro de estágio — que tal anotar o primeiro? ♡
            </p>
          )}
        </div>
      </div>

      {/* ===== Meu TCC ===== */}
      <div id="perfil-tcc" className="scroll-mt-4 rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-xl text-ceci-primary">
              meu tcc
            </h2>
            <p className="text-xs text-ceci-secondary">
              plantando e cuidando do seu trabalho ♡
            </p>
          </div>
          <button
            onClick={openTccScreen}
            className="flex items-center gap-1 text-xs font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-3.5 py-2 rounded-xl tap-interactive cursor-pointer hover:bg-ceci-border-brand/40 active:scale-[0.98] transition-colors shrink-0"
          >
            {hasTcc ? 'ver tcc' : 'criar tcc'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {hasTcc ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand shrink-0">
                {tccStatusLabel}
              </span>
              <span className="text-xs text-ceci-primary font-semibold truncate">{tcc.title}</span>
            </div>
            <ProgressBar value={tccChaptersTotal ? Math.round((tccChaptersDone / tccChaptersTotal) * 100) : 0} />
            <p className="text-[11px] text-ceci-secondary">
              {tccChaptersDone}/{tccChaptersTotal} capítulos concluídos
            </p>
          </>
        ) : (
          <p className="text-xs text-ceci-secondary bg-surface-muted border border-ceci-border-subtle rounded-2xl p-4 text-center flex items-center justify-center gap-2">
            <Kitty expression="curiosa" className="w-7 h-7 shrink-0" decorative />
            ainda não tem tcc — que tal começar a plantar o seu? ♡
          </p>
        )}
      </div>

      {/* ===== Stickers & conquistas ===== */}
      <div id="perfil-stickers" className="scroll-mt-4 rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-xl text-ceci-primary">
              stickers & conquistas
            </h2>
            <p className="text-xs text-ceci-secondary">
              celebrando cada passo do cantinho ♡
            </p>
          </div>
          <button
            onClick={openStickersScreen}
            className="flex items-center gap-1 text-xs font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-3.5 py-2 rounded-xl tap-interactive cursor-pointer hover:bg-ceci-border-brand/40 active:scale-[0.98] transition-colors shrink-0"
          >
            ver conquistas
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {stickers.filter((s) => s.unlocked).slice(0, 6).map((st) => (
            <span
              key={st.id}
              title={st.name}
              className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-2xl"
            >
              {st.emoji}
            </span>
          ))}
          {stickers.filter((s) => !s.unlocked).slice(0, 3).map((st) => (
            <span
              key={st.id}
              title={st.name}
              className="w-11 h-11 rounded-2xl bg-surface-muted border border-dashed border-ceci-border-default flex items-center justify-center text-2xl opacity-50 grayscale"
            >
              {st.emoji}
            </span>
          ))}
        </div>

        <p className="text-[11px] text-ceci-secondary">
          {stickersUnlocked} de {stickers.length} desbloqueados — bora buscar as próximas? ♡
        </p>
      </div>

      {/* ===== Personalização do cantinho ===== */}
      <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-rose-500" />
          <h2 className="font-display font-bold text-xl text-ceci-primary">
            personalize seu cantinho
          </h2>
        </div>

        {/* Lembrete diário de estudo (app nativo) */}
        <div className={`rounded-2xl p-4 border ${isReminderSupported() ? 'bg-surface-rose border-ceci-border-brand' : 'bg-surface-muted border-ceci-border-default'} space-y-3`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-sm text-ceci-primary">
                lembrete diário de estudo ♡
              </h3>
              <p className="text-[11px] text-ceci-secondary leading-tight mt-0.5">
                {isReminderSupported()
                  ? 'um carinho do cecistudy na hora de estudar.'
                  : 'ativável no aplicativo nativo (android/ios).'}
              </p>
            </div>

            <Toggle
              checked={reminderSettings.enabled}
              onChange={() => updateReminder({ ...reminderSettings, enabled: !reminderSettings.enabled })}
              disabled={!isReminderSupported()}
              label="ativar lembrete diário de estudo"
            />
          </div>

          {isReminderSupported() && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-ceci-secondary">horário:</span>
              <input
                type="time"
                value={reminderSettings.time}
                onChange={(e) => updateReminder({ ...reminderSettings, time: e.target.value })}
                disabled={!reminderSettings.enabled}
                className="bg-white border border-ceci-border-default focus:outline-none focus:border-rose-500 rounded-xl px-3 py-1.5 text-sm text-ceci-primary disabled:opacity-50"
              />
              <span className="text-[11px] text-ceci-tertiary">todas as noites</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-ceci-secondary mb-1">seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-rose-500 rounded-xl px-3.5 py-2 text-sm text-ceci-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ceci-secondary mb-1">semestre atual</label>
              <input
                type="number"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-rose-500 rounded-xl px-3.5 py-2 text-sm text-ceci-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ceci-secondary mb-1">universidade</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-rose-500 rounded-xl px-3.5 py-2 text-sm text-ceci-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ceci-secondary mb-1">frase motivacional de entrada</label>
            <textarea
              rows={2}
              value={dailyQuote}
              onChange={(e) => setDailyQuote(e.target.value)}
              className="w-full bg-surface-muted border border-ceci-border-default focus:outline-none focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-ceci-primary"
            />
          </div>

          <button
            type="submit"
            className="bg-rose-500 hover:bg-ceci-brand text-white px-5 py-2.5 rounded-xl text-xs font-medium shadow-2xs cursor-pointer"
          >
            guardar configurações do cantinho
          </button>
        </form>
      </div>

      {/* ===== Atualização do app (OTA — só no app nativo) ===== */}
      {isNativePlatform && <OtaSection />}

      {/* ===== Dados do cantinho (backup / exemplos / reset) ===== */}
      <div className="rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-ceci-academic-strong" />
          <h2 className="font-display font-bold text-xl text-ceci-primary">
            seus dados
          </h2>
        </div>
        <p className="text-xs text-ceci-secondary leading-relaxed -mt-1">
          tudo fica guardado só no seu dispositivo. faça um backup para migrar ou comece de novo quando quiser ♡
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => exportData()}
            className="flex items-center gap-2 bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:bg-ceci-academic-strong hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            exportar backup
          </button>

          <label className="flex items-center gap-2 bg-white border border-ceci-border-default text-ceci-primary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-ceci-border-brand transition-colors">
            <Upload className="w-4 h-4" />
            importar backup
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => importData(String(reader.result));
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>

          <button
            onClick={() => {
              if (confirm('quer carregar os dados de exemplo? isso substitui o conteúdo atual do cantinho.')) loadDemoData();
            }}
            className="flex items-center gap-2 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:bg-ceci-brand-strong hover:text-white transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            carregar exemplos
          </button>

          <button
            onClick={() => {
              if (confirm('tem certeza? isso apaga todo o conteúdo do cantinho e não dá para desfazer.')) resetApp();
            }}
            className="flex items-center gap-2 bg-white border border-ceci-border-default text-ceci-secondary px-4 py-3 rounded-2xl text-xs font-semibold tap-interactive cursor-pointer hover:border-red-400 hover:text-red-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            resetar cantinho
          </button>
        </div>
      </div>

      {/* rodapé carinhoso */}
      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-ceci-tertiary">
        <Sparkles className="w-3.5 h-3.5" />
        <span>tudo aqui nasce do que você anota, com carinho ♡</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
