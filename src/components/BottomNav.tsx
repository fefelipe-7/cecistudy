import React from 'react';
import { Home, GraduationCap, Brain, Library, User, FileText, BookOpen, Check, HeartHandshake } from 'lucide-react';
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

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenWizard,
  onOpenTaskExamWizard,
  onOpenCompose,
}) => {
  const tabs: (NavItem & { id: NavTab })[] = [
    { id: 'home', label: 'home', icon: Home },
    { id: 'faculdade', label: 'faculdade', icon: GraduationCap },
    { id: 'estudos', label: 'estudos', icon: Brain },
    { id: 'biblioteca', label: 'biblioteca', icon: Library },
    { id: 'perfil', label: 'perfil', icon: User },
  ];

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

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
    <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 flex items-center justify-center gap-2 px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2">
        <BottomNavBar
          items={tabs}
          activeIndex={activeIndex >= 0 ? activeIndex : 0}
          onChange={(index) => {
            if (tabs[index]) {
              onChangeTab(tabs[index].id);
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

