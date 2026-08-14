import React from 'react';
import { Home, GraduationCap, Brain, Library, User, FileText, BookOpen, Check, Sparkles } from 'lucide-react';
import { NavTab, QuickType } from '../types';
import { BottomNavBar, NavItem } from '@/components/ui/bottom-nav-bar';
import FloatingActionMenu from '@/components/ui/floating-action-menu';
import { TAB_ORDER } from '../lib/routing';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenQuickAddWithType?: (type: QuickType) => void;
}

const TAB_META: Record<NavTab, { label: string; icon: typeof Home }> = {
  home: { label: 'home', icon: Home },
  faculdade: { label: 'faculdade', icon: GraduationCap },
  estudos: { label: 'estudos', icon: Brain },
  biblioteca: { label: 'biblioteca', icon: Library },
  perfil: { label: 'perfil', icon: User },
};

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenQuickAddWithType,
}) => {
  const tabs: (NavItem & { id: NavTab })[] = TAB_ORDER.map((id) => ({
    id,
    label: TAB_META[id].label,
    icon: TAB_META[id].icon,
  }));

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const menuOptions = [
    {
      label: 'Nova aula / nota',
      Icon: <FileText className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenQuickAddWithType?.('class'),
    },
    {
      label: 'Novo livro / leitura',
      Icon: <BookOpen className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenQuickAddWithType?.('reading'),
    },
    {
      label: 'Nova prova / atividade',
      Icon: <Check className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenQuickAddWithType?.('task'),
    },
    {
      label: 'Novo flashcard',
      Icon: <Brain className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenQuickAddWithType?.('flashcard'),
    },
    {
      label: 'Novo conceito',
      Icon: <Sparkles className="w-4 h-4 text-ceci-border-brand" />,
      onClick: () => onOpenQuickAddWithType?.('concept'),
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

