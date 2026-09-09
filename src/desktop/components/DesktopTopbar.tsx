import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { useDesktopSession } from '../../../apps/desktop/src/desktopSessionState';
import { StatusBadge } from './ui/StatusBadge';
import type { NavTab } from '../../types';

const TAB_TITLES: Record<NavTab, string> = {
  home: 'hoje',
  faculdade: 'faculdade',
  estudos: 'study corner',
  biblioteca: 'biblioteca',
  perfil: 'perfil',
};

interface Crumb {
  label: string;
  onClick?: () => void;
}

/** Título contextual da tela atual com trilha de breadcrumb (somente leitura). */
function useBreadcrumb(): { parents: Crumb[]; title: string } {
  const app = useDesktopApp();
  if (app.isKnowledgeGraphOpen) return { parents: [], title: 'grafo de conhecimento' };
  if (app.isProjectsOpen) return { parents: [], title: 'projetos & tcc' };
  if (app.isInboxOpen) return { parents: [], title: 'inbox de conhecimento' };
  if (app.isInternshipDiaryOpen)
    return { parents: [{ label: 'faculdade', onClick: () => app.closeInternshipDiary() }], title: 'diário de estágio' };
  if (app.isTccScreenOpen)
    return { parents: [{ label: 'estudos', onClick: () => app.closeTccScreen() }], title: 'tcc' };
  if (app.focusedStudyScreen) {
    const labels: Record<string, string> = {
      focus: 'sessão de foco',
      revisar: 'revisar',
      leituras: 'leituras',
      historico: 'histórico',
    };
    return {
      parents: [{ label: 'estudos', onClick: () => app.closeStudy() }],
      title: labels[app.focusedStudyScreen] ?? 'estudos',
    };
  }
  if (app.activeTab === 'faculdade') {
    if (app.focusedCourse)
      return {
        parents: [{ label: 'faculdade', onClick: () => app.closeCourseDetail() }],
        title: app.focusedCourse.name,
      };
    if (app.subTabFaculdade === 'calendario')
      return {
        parents: [
          {
            label: 'faculdade',
            onClick: () => {
              app.setSubTabFaculdade('disciplinas');
              app.handleNavigate('faculdade');
            },
          },
        ],
        title: 'calendário acadêmico',
      };
    return { parents: [], title: 'faculdade' };
  }
  return { parents: [], title: TAB_TITLES[app.activeTab] };
}

/**
 * Cabeçalho da shell desktop, no padrão "premium SaaS":
 * breadcrumb contextual (último item = título Plus Jakarta 22px/600),
 * preferências de visualização, ícone compacto de busca (⌘K — entrada
 * única fica na sidebar) e badge de streak discreto à direita.
 */
export const DesktopTopbar: React.FC = () => {
  const app = useDesktopApp();
  const { session, patch } = useDesktopSession();
  const { parents, title } = useBreadcrumb();
  const [viewOpen, setViewOpen] = React.useState(false);

  const clarityOptions: { value: 'calmo' | 'foco' | 'denso'; label: string }[] = [
    { value: 'calmo', label: 'calmo' },
    { value: 'foco', label: 'foco' },
    { value: 'denso', label: 'denso' },
  ];
  const densityOptions: { value: 'conforto' | 'compacto'; label: string }[] = [
    { value: 'conforto', label: 'conforto' },
    { value: 'compacto', label: 'compacto' },
  ];

  return (
    <header className="flex h-11 items-center gap-5 px-8 shrink-0">
      <nav aria-label="trilha de navegação" className="flex items-center gap-1.5 min-w-0">
        {parents.map((crumb, i) => (
          <React.Fragment key={i}>
            <button
              type="button"
              onClick={crumb.onClick}
              className="rounded px-1 text-[13px] font-medium text-ceci-secondary transition-colors hover:text-ceci-primary focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)] cursor-pointer"
            >
              {crumb.label}
            </button>
            <span
              className="shrink-0"
              style={{ color: 'var(--ds-text-tertiary)' }}
              aria-hidden
            >
              ›
            </span>
          </React.Fragment>
        ))}
        <h1 className="truncate font-display font-semibold text-[22px] leading-tight tracking-tight text-ceci-primary">
          {title}
        </h1>
      </nav>

      <div className="flex-1" />

      {/* preferências de visualização (clareza + densidade) — G3/G6 */}
      <div className="relative">
        <button
          onClick={() => setViewOpen((v) => !v)}
          aria-label="preferências de visualização"
          aria-expanded={viewOpen}
          className="flex items-center gap-1.5 px-2.5 h-9 rounded-[10px] border border-ceci-border-default bg-white text-xs text-ceci-secondary hover:border-ceci-border-strong transition-colors cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{session.canvasClarity}</span>
        </button>
        {viewOpen && (
          <>
            <button
              aria-label="fechar preferências"
              className="fixed inset-0 z-20 cursor-default"
              onClick={() => setViewOpen(false)}
              tabIndex={-1}
            />
            <div
              role="menu"
              className="absolute right-0 z-30 mt-1.5 w-56 rounded-[14px] border border-ceci-border-default bg-white p-3 flex flex-col gap-3"
              style={{ boxShadow: 'var(--ds-elevation-md)' }}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted mb-1.5">clareza da tela</p>
                <div className="flex gap-1 rounded-[10px] bg-surface-muted p-1">
                  {clarityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => patch({ canvasClarity: opt.value })}
                      aria-pressed={session.canvasClarity === opt.value}
                      className={`flex-1 rounded-[8px] px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)] ${
                        session.canvasClarity === opt.value
                          ? 'bg-white text-ceci-brand-strong shadow-xs'
                          : 'text-ceci-secondary hover:text-ceci-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ceci-muted mb-1.5">densidade</p>
                <div className="flex gap-1 rounded-[10px] bg-surface-muted p-1">
                  {densityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => patch({ density: opt.value })}
                      aria-pressed={session.density === opt.value}
                      className={`flex-1 rounded-[8px] px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)] ${
                        session.density === opt.value
                          ? 'bg-white text-ceci-brand-strong shadow-xs'
                          : 'text-ceci-secondary hover:text-ceci-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* busca global — entrada única fica na sidebar (⌘K); topbar só o ícone compacto */}
      <button
        onClick={app.openSearch}
        aria-label="buscar (ctrl+k)"
        className="flex items-center justify-center gap-2 w-9 h-9 rounded-[10px] text-ceci-secondary transition-colors hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)] cursor-pointer"
      >
        <Search className="w-[18px] h-[18px]" />
      </button>

      {/* streak resumido */}
      <StatusBadge variant="neutral" title={`${app.streakStats.total} dias ativos no total`}>
        {app.streakStats.current} dias em sequência{' '}
        <span style={{ color: 'var(--ds-accent-strong)' }} aria-hidden>
          ♡
        </span>
      </StatusBadge>
    </header>
  );
};
