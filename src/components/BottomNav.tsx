import React from 'react';
import { Home, GraduationCap, Brain, Library, User } from 'lucide-react';
import { NavTab } from '../types';
import { BottomNavBar, NavItem } from '@/components/ui/bottom-nav-bar';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: (NavItem & { id: NavTab })[] = [
    { id: 'home', label: 'home', icon: Home },
    { id: 'faculdade', label: 'faculdade', icon: GraduationCap },
    { id: 'estudos', label: 'estudos', icon: Brain },
    { id: 'biblioteca', label: 'biblioteca', icon: Library },
    { id: 'perfil', label: 'perfil', icon: User },
  ];

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto">
        <BottomNavBar
          items={tabs}
          activeIndex={activeIndex >= 0 ? activeIndex : 0}
          onChange={(index) => {
            if (tabs[index]) {
              onChangeTab(tabs[index].id);
            }
          }}
        />
      </div>
    </div>
  );
};

