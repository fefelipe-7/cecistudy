import React, { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import type { WorkspaceKind } from '../../core/domain/workspace';

const KIND_LABEL: Record<WorkspaceKind, string> = {
  academico: 'acadêmico',
  profissional: 'profissional',
  pessoal: 'pessoal',
};

/** Seletor de workspace (Fase 3) — troca o contexto ativo da área de trabalho. */
export const WorkspaceSwitcher: React.FC = () => {
  const app = useDesktopApp();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const current = app.currentWorkspace;

  const submitCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    app.createWorkspace(trimmed, 'profissional');
    setName('');
    setCreating(false);
    setOpen(false);
  };

  return (
    <div className="relative px-1 mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="trocar workspace"
        className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-ceci-border-default bg-surface-muted transition-colors text-left hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
      >
        <span
          className="w-7 h-7 rounded-lg bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong flex items-center justify-center text-xs font-bold shrink-0"
          aria-hidden
        >
          {current.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-ceci-primary truncate">{current.name}</span>
          <span className="block text-[10px] text-ceci-muted truncate">
            workspace · {KIND_LABEL[current.kind]}
          </span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-ceci-muted shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 mt-1.5 w-full rounded-[14px] border border-ceci-border-default bg-white p-1.5"
          style={{ boxShadow: 'var(--ds-elevation-md)' }}
        >
          {app.workspaces.map((ws) => (
            <button
              key={ws.id}
              role="menuitem"
              onClick={() => {
                app.switchWorkspace(ws.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)] ${
                ws.id === current.id
                  ? 'bg-[var(--ds-surface-active)] text-ceci-primary font-semibold'
                  : 'text-ceci-secondary hover:bg-[var(--ds-surface-hover)]'
              }`}
            >
              <span
                className="w-6 h-6 rounded-md bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0"
                aria-hidden
              >
                {ws.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1 text-left truncate">{ws.name}</span>
              {ws.id === current.id && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}

          {creating ? (
            <div className="p-1.5 flex flex-col gap-1.5">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCreate();
                  if (e.key === 'Escape') setCreating(false);
                }}
                placeholder="nome do workspace"
                className="w-full px-2.5 py-1.5 rounded-[10px] border border-ceci-border-default text-xs text-ceci-primary focus:outline-none focus:ring-2 focus:ring-ceci-border-brand"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={submitCreate}
                  className="flex-1 px-2 py-1.5 rounded-[10px] bg-ceci-primary text-white text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring)]"
                >
                  criar
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-2 py-1.5 rounded-[10px] border border-ceci-border-default text-xs text-ceci-secondary cursor-pointer focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
                >
                  cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              role="menuitem"
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-xs text-ceci-secondary cursor-pointer hover:bg-[var(--ds-surface-hover)] focus-visible:outline-none focus-visible:[box-shadow:var(--ds-focus-ring-neutral)]"
            >
              <Plus className="w-3.5 h-3.5" />
              novo workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
};
