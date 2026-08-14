import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { HeaderAction } from '../../types';

interface HeaderActionMenuProps {
  actions: HeaderAction[];
}

export const HeaderActionMenu: React.FC<HeaderActionMenuProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!actions.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center shadow-2xs hover:bg-surface-rose transition-all cursor-pointer active:scale-95"
        title="mais ações"
        aria-label="mais ações"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4 text-ceci-secondary" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 bg-white rounded-2xl border border-ceci-border-default shadow-floating overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {actions.map((action, i) => {
            const Icon = action.Icon;
            return (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-medium text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
              >
                {Icon && <Icon className="w-4 h-4 text-ceci-brand" />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};