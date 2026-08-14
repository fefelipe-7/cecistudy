import React from 'react';
import { cn } from '@/lib/utils';

export interface PillTab<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface PillTabBarProps<T extends string> {
  tabs: PillTab<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export const PillTabBar = <T extends string,>({
  tabs,
  active,
  onChange,
  className,
}: PillTabBarProps<T>) => (
  <div className={cn('flex gap-1.5 overflow-x-auto scrollbar-none', className)}>
    {tabs.map((tab) => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          aria-pressed={isActive}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap tap-interactive cursor-pointer',
            isActive
              ? 'bg-ceci-primary text-white shadow-xs'
              : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      );
    })}
  </div>
);
