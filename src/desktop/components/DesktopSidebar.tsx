import React from 'react';
import {
  Home,
  GraduationCap,
  Brain,
  Library,
  User,
  ChevronRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavTab } from '../../types';
import { useApp } from '../../context/AppContext';
import { pickTip } from '../../lib/tips';
import { Panel } from './ui/Panel';

interface NavChild {
  label: string;
  active: boolean;
  onSelect: () => void;
}

interface NavEntry {
  tab: NavTab;
  label: string;
  icon: LucideIcon;
}

const ENTRIES: NavEntry[] = [
  { tab: 'home', label: 'hoje', icon: Home },
  { tab: 'faculdade', label: 'faculdade', icon: GraduationCap },
  { tab: 'estudos', label: 'estudos', icon: Brain },
  { tab: 'biblioteca', label: 'biblioteca', icon: Library },
];

const ESTUDOS_LABELS: Record<string, string> = {
  sessoes: 'sessões',
  leituras: 'leituras',
  flashcards: 'flashcards',
  questoes: 'questões',
  historico: 'histórico',
};

const BIBLIOTECA_LABELS: Record<string, string> = {
  materiais: 'materiais',
  autores: 'autores',
  conceitos: 'conceitos',
  abordagens: 'abordagens',
  mapa: 'mapa',
};

/**
 * Sidebar da casca desktop (plataforma Tauri) — visual "premium SaaS":
 * perfil no topo, grupo de navegação com item ativo rosa suave e card
 * de dica do cecinho no fim. Não é o espelho responsivo do BottomNav
 * (esse papel é do `components/DesktopSidebar.tsx` no web ≥ lg).
 */
export const DesktopSidebar: React.FC = () => {
  const app = useApp();
  const {
    profile,
    activeTab,
    handleNavigate,
    subTabFaculdade,
    setSubTabFaculdade,
    subTabEstudos,
    setSubTabEstudos,
    subTabBiblioteca,
    setSubTabBiblioteca,
  } = app;

  // A aba base da pilha (mesmo com tela auxiliar aberta, ex.: curso em detalhe)
  const baseTab = app.activeTab;

  const childrenFor = (tab: NavTab): NavChild[] => {
    if (baseTab !== tab) return [];
    if (tab === 'faculdade') {
      return [
        {
          label: 'disciplinas',
          active: subTabFaculdade === 'disciplinas',
          onSelect: () => handleNavigate('faculdade', 'disciplinas'),
        },
        {
          label: 'calendário',
          active: subTabFaculdade === 'calendario',
          onSelect: () => {
            setSubTabFaculdade('calendario');
            if (app.focusedCourseId) app.closeCourseDetail();
            else handleNavigate('faculdade');
          },
        },
        {
          label: 'diário de estágio',
          active: app.isInternshipDiaryOpen,
          onSelect: () => app.openInternshipDiary(),
        },
      ];
    }
    if (tab === 'estudos') {
      return [
        ...(Object.keys(ESTUDOS_LABELS) as Array<keyof typeof ESTUDOS_LABELS>).map((key) => ({
          label: ESTUDOS_LABELS[key],
          active: subTabEstudos === key && !app.focusedStudyScreen && !app.isTccScreenOpen,
          onSelect: () => {
            setSubTabEstudos(key as typeof subTabEstudos);
            if (app.focusedStudyScreen) app.closeStudy();
            if (app.isTccScreenOpen) app.closeTccScreen();
          },
        })),
        {
          label: 'tcc',
          active: app.isTccScreenOpen,
          onSelect: () => app.openTccScreen(),
        },
      ];
    }
    if (tab === 'biblioteca') {
      return [
        ...(Object.keys(BIBLIOTECA_LABELS) as Array<keyof typeof BIBLIOTECA_LABELS>).map((key) => ({
          label: BIBLIOTECA_LABELS[key],
          active: subTabBiblioteca === key && !app.isNotesScreenOpen && !app.isTempleScreenOpen,
          onSelect: () => {
            setSubTabBiblioteca(key as typeof subTabBiblioteca);
            if (app.isNotesScreenOpen) app.closeNotesScreen();
            if (app.isTempleScreenOpen) app.closeTemple();
          },
        })),
        {
          label: 'notas avulsas',
          active: app.isNotesScreenOpen,
          onSelect: () => app.openNotesScreen(),
        },
        {
          label: 'templo',
          active: app.isTempleScreenOpen,
          onSelect: () => app.openTemple(),
        },
      ];
    }
    return [];
  };

  const tip = pickTip({
    pendingTasks: app.tasks.filter((t) => !t.completed).length,
    streakDays: app.streakStats.current,
  });

  return (
    <aside className="flex flex-col shrink-0 w-[264px] h-full bg-white border-r border-ceci-border-subtle px-5 py-5 select-none">
      {/* marca */}
      <div className="flex items-center gap-2.5 px-1 mb-5">
        <span className="w-9 h-9 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center font-display font-bold text-ceci-brand-strong text-lg">
          C
        </span>
        <span className="font-display font-bold text-ceci-primary">cecistudy ♡</span>
      </div>

      {/* user profile card */}
      <button
        onClick={() => handleNavigate('perfil')}
        aria-label="abrir perfil"
        aria-current={baseTab === 'perfil' ? 'page' : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
          baseTab === 'perfil'
            ? 'bg-surface-rose border-ceci-border-brand'
            : 'bg-surface-muted border-transparent hover:bg-beige-50'
        }`}
      >
        <span className="w-8 h-8 rounded-full bg-surface-rose border border-ceci-border-brand overflow-hidden flex items-center justify-center shrink-0" aria-hidden>
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">🌷</span>
          )}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-xs font-bold text-ceci-primary truncate">
            {profile.name || 'seu cantinho'}
          </span>
          <span className="block text-[11px] text-ceci-muted truncate">
            semestre {profile.semester} de {profile.totalSemesters}
          </span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-ceci-muted shrink-0" />
      </button>

      {/* grupo de navegação */}
      <span className="px-3 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ceci-muted">
        navegação
      </span>

      <nav className="flex flex-col gap-0.5 overflow-y-auto" aria-label="navegação principal">
        {ENTRIES.map((entry) => {
          const Icon = entry.icon;
          const isActive = baseTab === entry.tab;
          const children = childrenFor(entry.tab);
          const expanded = children.length > 0;
          return (
            <div key={entry.tab}>
              <button
                onClick={() => handleNavigate(entry.tab)}
                aria-label={`ir para ${entry.label}`}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={expanded}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                    : 'text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {entry.label}
              </button>

              {expanded && (
                <div className="flex flex-col mt-0.5 mb-1 ml-[22px] pl-3 border-l border-ceci-border-subtle">
                  {children.map((child) => (
                    <button
                      key={child.label}
                      onClick={child.onSelect}
                      aria-current={child.active ? 'true' : undefined}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs cursor-pointer transition-colors text-left ${
                        child.active
                          ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                          : 'text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary font-normal'
                      }`}
                    >
                      {!child.active && <span className="w-3" aria-hidden />}
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ação rápida + dica do cecinho */}
      <div className="mt-auto pt-4 flex flex-col gap-3">
        <button
          onClick={app.openQuickAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-ceci-primary text-white text-sm font-semibold cursor-pointer hover:bg-ceci-primary-hover transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          novo registro
          <kbd className="ml-auto px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-normal">⌘N</kbd>
        </button>

        {/* CTA/promo card (borda tracejada) */}
        <Panel dashed className="p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5" aria-hidden>✨</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ceci-primary">dica do cecinho</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ceci-secondary line-clamp-2">
                {tip}
              </p>
            </div>
          </div>
          <button
            onClick={() => app.openStudy('focus')}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong text-xs font-semibold cursor-pointer hover:bg-rose-100 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            bora focar?
          </button>
        </Panel>

        <span className="flex items-center justify-center gap-1.5 text-[10px] text-ceci-muted">
          <User className="w-3 h-3" aria-hidden />
          atalhos: ⌘K · ⌘N · ⌘1–4 · esc
        </span>
      </div>
    </aside>
  );
};


