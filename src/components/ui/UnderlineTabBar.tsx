import React from 'react';
import { cn } from '@/lib/utils';

export interface UnderlineTab<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface UnderlineTabBarProps<T extends string> {
  tabs: UnderlineTab<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export const UnderlineTabBar = <T extends string,>({
  tabs,
  active,
  onChange,
  className,
}: UnderlineTabBarProps<T>) => (
  <div className={cn('flex items-center gap-4 overflow-x-auto scrollbar-none border-b border-ceci-border-default px-1', className)}>
    {tabs.map((tab) => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          aria-pressed={isActive}
          className={cn(
            'relative pb-3 text-xs font-semibold whitespace-nowrap tap-interactive cursor-pointer flex items-center gap-1.5',
            isActive ? 'text-ceci-primary font-bold' : 'text-ceci-tertiary hover:text-ceci-primary'
          )}
        >
          {tab.icon}
          {tab.label}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ceci-primary rounded-full" />
          )}
        </button>
      );
    })}
  </div>
);