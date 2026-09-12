import React, { useMemo } from 'react';
import { Home, GraduationCap, Brain, Library, FileText, BookOpen, Check, HeartHandshake } from 'lucide-react';
import { NavTab, WizardFlow } from '../types';
import { BottomNavBar, NavItem } from '@/components/ui/bottom-nav-bar';
import FloatingActionMenu from '@/components/ui/floating-action-menu';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenWizard?: (type: WizardFlow) => void;
  onOpenTaskExamWizard?: () => void;
  onOpenCompose?: () => void;
}

// Config estática das abas (ícones importados no módulo = referências estáveis).
const TABS: (NavItem & { id: NavTab })[] = [
  { id: 'home', label: 'home', icon: Home },
  { id: 'faculdade', label: 'faculdade', icon: GraduationCap },
  { id: 'estudos', label: 'estudos', icon: Brain },
  { id: 'biblioteca', label: 'biblioteca', icon: Library },
];

// Ícones dos itens do menu FAB (JSX estático no módulo).
const MENU_ICON_STAGE = <HeartHandshake className="w-4 h-4 text-ceci-border-brand" />;
const MENU_ICON_CARD = <Brain className="w-4 h-4 text-ceci-border-brand" />;
const MENU_ICON_EVENT = <Check className="w-4 h-4 text-ceci-border-brand" />;
const MENU_ICON_READ = <BookOpen className="w-4 h-4 text-ceci-border-brand" />;
const MENU_ICON_NOTE = <FileText className="w-4 h-4 text-ceci-border-brand" />;

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenWizard,
  onOpenTaskExamWizard,
  onOpenCompose,
}) => {
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  const menuOptions = useMemo(
    () => [
      {
        label: 'Novo estágio',
        Icon: MENU_ICON_STAGE,
        onClick: () => onOpenWizard?.('internship'),
      },
      {
        label: 'Novo flashcard',
        Icon: MENU_ICON_CARD,
        onClick: () => onOpenWizard?.('flashcard'),
      },
      {
        label: 'Nova prova / atividade',
        Icon: MENU_ICON_EVENT,
        onClick: () => onOpenTaskExamWizard?.(),
      },
      {
        label: 'Novo livro / leitura',
        Icon: MENU_ICON_READ,
        onClick: () => onOpenWizard?.('reading'),
      },
      {
        label: 'Nova aula / nota',
        Icon: MENU_ICON_NOTE,
        onClick: () => onOpenCompose?.(),
      },
    ],
    [onOpenWizard, onOpenTaskExamWizard, onOpenCompose]
  );

  return (
    <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 flex items-center justify-center gap-2 px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2">
        <BottomNavBar
          items={TABS}
          activeIndex={activeIndex >= 0 ? activeIndex : 0}
          onChange={(index) => {
            if (TABS[index]) {
              onChangeTab(TABS[index].id);
            }
          }}
        />

        <FloatingActionMenu
          className="relative bottom-0 right-0 z-50 shrink-0"
          options={menuOptions}
        />
      </div>
    </div>
  );
};

