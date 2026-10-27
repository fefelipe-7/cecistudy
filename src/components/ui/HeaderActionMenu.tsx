import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { HeaderAction } from '../../types';
import { pushOverlay, removeOverlay } from '@/lib/overlayStack';

interface HeaderActionMenuProps {
  actions: HeaderAction[];
}

export const HeaderActionMenu: React.FC<HeaderActionMenuProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const overlayIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const id = pushOverlay(() => setOpen(false), 'popover');
    overlayIdRef.current = id;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        removeOverlay(id);
        setOpen(false);
      }
    };
    // `Esc` fecha o topo da pilha via handler global da `overlayStack`;
    // o menu não tem listener próprio (SPEC-M-028 F5.4/F5.5).
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      if (overlayIdRef.current !== null) {
        removeOverlay(overlayIdRef.current);
        overlayIdRef.current = null;
      }
    };
  }, [open]);

  if (!actions.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-2xl bg-surface-default border border-ceci-border-default hover:border-ceci-border-brand flex items-center justify-center shadow-2xs hover:bg-surface-rose tap-interactive cursor-pointer active:scale-95"
        title="mais ações"
        aria-label="mais ações"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4 text-ceci-secondary" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 bg-surface-default rounded-2xl border border-ceci-border-default shadow-floating overflow-hidden">
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
