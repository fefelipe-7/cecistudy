import React from 'react';
import { Home, GraduationCap, Brain, Library, FileText, BookOpen, Check, HeartHandshake } from 'lucide-react';
import { NavTab, WizardFlow } from '../types';
import { FloatingActionMenu } from '@/components/ui/floating-action-menu';

interface DesktopSidebarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenWizard?: (type: WizardFlow) => void;
  onOpenTaskExamWizard?: () => void;
  onOpenCompose?: () => void;
}

/**
 * Sidebar do desktop (≥ lg): substitui a barra inferior + FAB do mobile.
 * Renderizada com `hidden lg:flex` — abaixo de lg o BottomNav continua mandando.
 */
export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onChangeTab,
  onOpenWizard,
  onOpenTaskExamWizard,
  onOpenCompose,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'home', icon: Home },
    { id: 'faculdade' as NavTab, label: 'faculdade', icon: GraduationCap },
    { id: 'estudos' as NavTab, label: 'estudos', icon: Brain },
    { id: 'biblioteca' as NavTab, label: 'biblioteca', icon: Library },
  ];

  const menuOptions = [
    {
      label: 'Novo estágio',
      Icon: <HeartHandshake className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenWizard?.('internship'),
    },
    {
      label: 'Novo flashcard',
      Icon: <Brain className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenWizard?.('flashcard'),
    },
    {
      label: 'Nova prova / atividade',
      Icon: <Check className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenTaskExamWizard?.(),
    },
    {
      label: 'Novo livro / leitura',
      Icon: <BookOpen className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenWizard?.('reading'),
    },
    {
      label: 'Nova aula / nota',
      Icon: <FileText className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenCompose?.(),
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 z-40 bg-white border-r border-ceci-border-subtle px-4 py-6">
      {/* marca */}
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <span className="w-9 h-9 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center font-display font-bold text-ceci-brand-strong text-lg">
          C
        </span>
        <span className="font-display font-bold text-ceci-primary">cecistudy ♡</span>
      </div>

      {/* abas */}
      <nav className="flex flex-col gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChangeTab(t.id)}
              aria-label={`ir para ${t.label}`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                isActive
                  ? 'bg-ceci-primary text-white'
                  : 'text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* ação rápida (substitui o FAB) */}
      <div className="mt-auto relative">
        <FloatingActionMenu
          className="relative bottom-0 right-0"
          options={menuOptions}
        />
      </div>
    </aside>
  );
};
