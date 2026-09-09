import React from 'react';
import {
  Home,
  Brain,
  Library,
  CalendarDays,
  FolderKanban,
  Megaphone,
  ChevronRight,
  Sparkles,
  Plus,
  Inbox,
  Network,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { pickTip } from '../../lib/tips';
import { Panel } from './ui/Panel';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { computeSidebarBadges } from '../lib/sidebarBadges';

interface NavEntry {
  key: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onSelect: () => void;
  badge?: number;
}

/**
 * Sidebar da casca desktop, segundo cecistudy-desktop-shell.json: 240px, grupos
 * (Home, Base de Conhecimento, Calendário, Projetos/TCC, Estudos, Marketing),
 * item ativo usa fundo neutro (--ds-surface-active) com barrinha rosa de 3px à
 * esquerda e ícone rosa-strong — rosa como acento, nunca fundo de painel.
 * Reuso dos tokens semânticos existentes; novos tokens ficam em desktop-tokens.css.
 */
export const DesktopSidebar: React.FC = () => {
  const app = useDesktopApp();
  const pendingCount = app.suggestions.filter((s) => s.status === 'pending').length;
  const badges = computeSidebarBadges(app.exams, app.flashcards, app.savedBookIds.length);
  const {
    profile,
    activeTab,
    handleNavigate,
    subTabFaculdade,
    setSubTabFaculdade,
    openInbox,
    closeInbox,
    isInboxOpen,
    openKnowledgeGraph,
    closeKnowledgeGraph,
    isKnowledgeGraphOpen,
    openProjects,
    closeProjects,
    isProjectsOpen,
    openQuickAdd,
    openStudy,
  } = app;

  const baseTab = activeTab;

  // Os painéis auxiliares (grafo/inbox/projetos) tomam a tela inteira; ao navegar
  // para uma aba principal eles precisam fechar, senão a tela fica "presa" neles.
  const closeAuxPanels = () => {
    closeKnowledgeGraph();
    closeProjects();
    closeInbox();
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('ceci:open-command-palette'));
  };

  const entries: NavEntry[] = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      active: baseTab === 'home',
      onSelect: () => {
        closeAuxPanels();
        handleNavigate('home');
      },
    },
    {
      key: 'conhecimento',
      label: 'Base de Conhecimento',
      icon: Library,
      active: baseTab === 'biblioteca',
      badge: badges.biblioteca,
      onSelect: () => {
        closeAuxPanels();
        handleNavigate('biblioteca');
      },
    },
    {
      key: 'calendario',
      label: 'Calendário',
      icon: CalendarDays,
      active: baseTab === 'faculdade' && subTabFaculdade === 'calendario',
      badge: badges.faculdade,
      onSelect: () => {
        closeAuxPanels();
        if (app.focusedCourseId) app.closeCourseDetail();
        setSubTabFaculdade('calendario');
        handleNavigate('faculdade');
      },
    },
    {
      key: 'projetos',
      label: 'Projetos & TCC',
      icon: FolderKanban,
      active: isProjectsOpen,
      onSelect: () => (isProjectsOpen ? closeProjects() : openProjects()),
    },
    {
      key: 'estudos',
      label: 'Estudos',
      icon: Brain,
      active: baseTab === 'estudos',
      badge: badges.estudos,
      onSelect: () => {
        closeAuxPanels();
        handleNavigate('estudos');
      },
    },
    {
      key: 'marketing',
      label: 'Marketing',
      icon: Megaphone,
      active: false,
      onSelect: () => app.showToast('marketing chega em breve ♡'),
    },
  ];

  const tip = pickTip({
    pendingTasks: app.tasks.filter((t) => !t.completed).length,
    streakDays: app.streakStats.current,
  });

  return (
    <aside
      className="flex h-full w-[240px] shrink-0 flex-col px-3 py-4 select-none"
      style={{ background: 'var(--ds-surface-sidebar)', borderRight: '1px solid var(--ds-border-default)' }}
    >
      {/* marca */}
      <div className="mb-4 flex items-center gap-2.5 px-1">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-2xl font-display text-lg font-bold"
          style={{ background: 'var(--ds-accent-subtle)', color: 'var(--ds-accent-strong)' }}
        >
          C
        </span>
        <span className="font-display font-bold text-ceci-primary">cecistudy ♡</span>
      </div>

      {/* busca (atalho ⌘K → command palette) */}
      <button
        onClick={openCommandPalette}
        aria-label="abrir busca e comandos"
        className="mb-3 flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-sm text-ceci-tertiary transition-colors hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
        style={{ borderColor: 'var(--ds-border-default)' }}
      >
        <Search className="h-[18px] w-[18px]" />
        <span className="flex-1 text-left">buscar…</span>
        <kbd className="rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      {/* seletor de workspace */}
      <WorkspaceSwitcher />

      {/* inbox & grafo (aceleradores secundários) */}
      <button
        onClick={() => (isInboxOpen ? closeInbox() : openInbox())}
        aria-label="abrir inbox de conhecimento"
        aria-current={isInboxOpen ? 'page' : undefined}
        className="relative mt-2 flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
        style={
          isInboxOpen
            ? { background: 'var(--ds-surface-active)', color: 'var(--ds-text-primary)' }
            : { color: 'var(--ds-text-secondary)' }
        }
      >
        {isInboxOpen && (
          <span
            aria-hidden
            className="absolute left-0 w-[3px] rounded-full"
            style={{ height: '60%', background: 'var(--ds-accent-strong)' }}
          />
        )}
        <Inbox
          className="h-[18px] w-[18px]"
          style={isInboxOpen ? { color: 'var(--ds-accent-strong)' } : undefined}
        />
        inbox de conhecimento
        {pendingCount > 0 && (
          <span
            className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            style={
              isInboxOpen
                ? { background: 'var(--ds-accent-subtle)', color: 'var(--ds-accent-strong)' }
                : { background: 'var(--ds-surface-raised)', color: 'var(--ds-text-secondary)' }
            }
          >
            {pendingCount}
          </span>
        )}
      </button>

      <button
        onClick={() => (isKnowledgeGraphOpen ? closeKnowledgeGraph() : openKnowledgeGraph())}
        aria-label="abrir grafo de conhecimento"
        aria-current={isKnowledgeGraphOpen ? 'page' : undefined}
        className="relative flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
        style={
          isKnowledgeGraphOpen
            ? { background: 'var(--ds-surface-active)', color: 'var(--ds-text-primary)' }
            : { color: 'var(--ds-text-secondary)' }
        }
      >
        {isKnowledgeGraphOpen && (
          <span
            aria-hidden
            className="absolute left-0 w-[3px] rounded-full"
            style={{ height: '60%', background: 'var(--ds-accent-strong)' }}
          />
        )}
        <Network
          className="h-[18px] w-[18px]"
          style={isKnowledgeGraphOpen ? { color: 'var(--ds-accent-strong)' } : undefined}
        />
        grafo de conhecimento
      </button>

      {/* grupo de navegação principal */}
      <span className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted">
        navegação
      </span>

      <nav className="flex flex-col gap-0.5" aria-label="navegação principal">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.key}
              onClick={entry.onSelect}
              aria-label={`ir para ${entry.label}`}
              aria-current={entry.active ? 'page' : undefined}
              className="relative flex items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
              style={
                entry.active
                  ? { background: 'var(--ds-surface-active)', color: 'var(--ds-text-primary)' }
                  : { color: 'var(--ds-text-secondary)' }
              }
            >
              {entry.active && (
                <span
                  aria-hidden
                  className="absolute left-0 w-[3px] rounded-full"
                  style={{ height: '60%', background: 'var(--ds-accent-strong)' }}
                />
              )}
              <Icon
                className="h-[18px] w-[18px]"
                style={entry.active ? { color: 'var(--ds-accent-strong)' } : undefined}
              />
              {entry.label}
              {entry.badge !== undefined && entry.badge > 0 && (
                <span
                  className="ml-auto rounded-full px-1.5 text-[10px] font-mono"
                  style={{ background: 'var(--ds-surface-raised)', color: 'var(--ds-text-secondary)' }}
                >
                  {entry.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* perfil */}
      <button
        onClick={() => handleNavigate('perfil')}
        aria-label="abrir perfil"
        aria-current={baseTab === 'perfil' ? 'page' : undefined}
        className="mt-3 flex w-full items-center gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-colors hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
        style={
          baseTab === 'perfil'
            ? { background: 'var(--ds-surface-active)', borderColor: 'var(--ds-border-default)' }
            : { borderColor: 'transparent', background: 'var(--ds-surface-raised)' }
        }
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border"
          style={{ borderColor: 'var(--ds-border-default)' }}
          aria-hidden
        >
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm">🌷</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-ceci-primary">
            {profile.name || 'seu cantinho'}
          </span>
          <span className="block truncate text-[11px] text-ceci-muted">
            semestre {profile.semester} de {profile.totalSemesters}
          </span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ceci-muted" />
      </button>

      {/* ação rápida + dica do cecinho */}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        <button
          onClick={openQuickAdd}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ceci-primary-hover focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring)]"
          style={{ background: 'var(--color-ceci-primary)' }}
        >
          <Plus className="h-4 w-4" />
          novo registro
          <kbd className="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-normal">⌘N</kbd>
        </button>

        <Panel dashed className="p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none" aria-hidden>✨</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ceci-primary">dica do cecinho</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ceci-secondary line-clamp-2">{tip}</p>
            </div>
          </div>
          <button
            onClick={() => openStudy('focus')}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring)]"
            style={{ background: 'var(--ds-accent-subtle)', color: 'var(--ds-accent-strong)' }}
          >
            <Sparkles className="h-3 w-3" />
            bora focar?
          </button>
        </Panel>
      </div>
    </aside>
  );
};
