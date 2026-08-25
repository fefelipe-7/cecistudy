import React from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './ui/StatusBadge';
import type { NavTab } from '../../types';

const TAB_TITLES: Record<NavTab, string> = {
  home: 'hoje',
  faculdade: 'faculdade',
  estudos: 'study corner',
  biblioteca: 'biblioteca',
  perfil: 'perfil',
};

/** Título contextual da tela atual (auxiliares incluídas). */
function useScreenTitle(): string {
  const app = useApp();
  if (app.isInternshipDiaryOpen) return 'diário de estágio';
  if (app.isTccScreenOpen) return 'tcc';
  if (app.focusedStudyScreen) {
    const labels: Record<string, string> = {
      focus: 'sessão de foco',
      revisar: 'revisar',
      leituras: 'leituras',
      historico: 'histórico',
    };
    return labels[app.focusedStudyScreen] ?? 'estudos';
  }
  if (!app.isBottomNavVisible) return TAB_TITLES[app.activeTab];
  if (app.activeTab === 'faculdade') {
    if (app.subTabFaculdade === 'calendario') return 'calendário acadêmico';
    if (app.focusedCourse) return app.focusedCourse.name;
    return 'faculdade';
  }
  return TAB_TITLES[app.activeTab];
}

/**
 * Cabeçalho da shell desktop, no padrão "premium SaaS":
 * título de página grande (display), campo de busca com atalho visível
 * e badges discretos à direita.
 */
export const DesktopTopbar: React.FC = () => {
  const app = useApp();
  const title = useScreenTitle();

  return (
    <header className="flex items-center gap-5 px-8 py-6 shrink-0">
      <h1 className="font-display font-bold text-[26px] leading-tight tracking-tight text-ceci-primary truncate">
        {title}
      </h1>

      <div className="flex-1" />

      {/* busca global */}
      <button
        onClick={app.openSearch}
        aria-label="buscar (ctrl+k)"
        className="hidden md:flex items-center gap-2 w-72 px-3.5 py-2 rounded-[10px] bg-white border border-ceci-border-default text-xs text-ceci-muted cursor-pointer hover:border-ceci-border-strong transition-colors shadow-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">buscar no cantinho…</span>
        <kbd className="px-1.5 py-0.5 rounded-md bg-surface-muted border border-ceci-border-subtle text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={app.openSearch}
        aria-label="buscar"
        className="md:hidden w-9 h-9 rounded-[10px] flex items-center justify-center text-ceci-secondary hover:bg-surface-muted cursor-pointer transition-colors"
      >
        <Search className="w-[18px] h-[18px]" />
      </button>

      {/* streak resumido */}
      <StatusBadge variant="brand" title={`${app.streakStats.total} dias ativos no total`}>
        {app.streakStats.current} dias em sequência ♡
      </StatusBadge>
    </header>
  );
};
