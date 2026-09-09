import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';

interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

const GROUP_ORDER = ['navegação', 'projetos & tcc', 'ações'] as const;
type CommandGroupLabel = (typeof GROUP_ORDER)[number];

const GROUP_OF: Record<string, CommandGroupLabel> = {
  home: 'navegação',
  conhecimento: 'navegação',
  calendario: 'navegação',
  estudos: 'navegação',
  perfil: 'navegação',
  projetos: 'projetos & tcc',
  inbox: 'ações',
  grafo: 'ações',
  foco: 'ações',
  novo: 'ações',
};

/** Linha de resultado — memoizada e definida fora do render (skill: sem subcomponente inline). */
const CommandRow = React.memo(function CommandRow({
  command,
  active,
  onHover,
  onSelect,
}: {
  command: Command;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        onMouseEnter={onHover}
        onClick={onSelect}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm"
        style={
          active
            ? { background: 'var(--ds-accent-subtle)', color: 'var(--ds-accent-strong)' }
            : { color: 'var(--ds-text-secondary)' }
        }
      >
        <span className="flex-1">{command.label}</span>
        {command.hint && <span className="text-[11px] text-ceci-muted">{command.hint}</span>}
        {active && <CornerDownLeft className="h-3.5 w-3.5" />}
      </button>
    </li>
  );
});

/**
 * Command Palette desktop (⌘K / Ctrl+K) — acelerador secundário de navegação,
 * não substitui a sidebar (JSON). Autocontido: abre via atalho ou evento
 * `ceci:open-command-palette` (disparado pela busca da sidebar). Só monta no desktop.
 */
export const CommandPalette: React.FC = () => {
  const app = useDesktopApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (fn: () => void) => () => {
      fn();
      setOpen(false);
    };
    return [
      { id: 'home', label: 'Ir para Home', run: go(() => app.handleNavigate('home')) },
      {
        id: 'conhecimento',
        label: 'Base de Conhecimento',
        run: go(() => app.handleNavigate('biblioteca')),
      },
      {
        id: 'calendario',
        label: 'Calendário',
        hint: 'faculdade',
        run: go(() => {
          app.setSubTabFaculdade('calendario');
          app.handleNavigate('faculdade');
        }),
      },
      { id: 'projetos', label: 'Projetos & TCC', run: go(() => app.openProjects()) },
      { id: 'estudos', label: 'Estudos', run: go(() => app.handleNavigate('estudos')) },
      { id: 'perfil', label: 'Perfil', run: go(() => app.handleNavigate('perfil')) },
      { id: 'inbox', label: 'Inbox de conhecimento', run: go(() => app.openInbox()) },
      { id: 'grafo', label: 'Grafo de conhecimento', run: go(() => app.openKnowledgeGraph()) },
      { id: 'foco', label: 'Iniciar foco (pomodoro)', run: go(() => app.openStudy('focus')) },
      { id: 'novo', label: 'Novo registro', run: go(() => app.openQuickAdd()) },
    ];
  }, [app]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [query, commands]);

  // Agrupa os resultados por domínio (JSON: resultados agrupados por domínio, label caption).
  // Mantém a lista plana `filtered` para a navegação por teclado (índice ativo).
  const groups = useMemo(() => {
    const buckets: Record<string, Command[]> = {};
    for (const c of filtered) {
      const g = GROUP_OF[c.id] ?? 'ações';
      (buckets[g] ??= []).push(c);
    }
    return GROUP_ORDER.map((label) => ({ label, items: buckets[label] ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [filtered]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('ceci:open-command-palette', onOpen as EventListener);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ceci:open-command-palette', onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(40,32,34,0.15)' }}
        onClick={() => setOpen(false)}
      >
        <motion.div
          className="w-full max-w-[560px] overflow-hidden rounded-[16px] bg-surface-default"
          style={{ boxShadow: 'var(--ds-elevation-md)', border: '1px solid var(--ds-border-default)' }}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onKeyDown}
        >
          <div
            className="flex items-center gap-2 border-b px-4"
            style={{ borderColor: 'var(--ds-border-subtle)' }}
          >
            <Search className="h-4 w-4 text-ceci-tertiary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="buscar ou executar um comando…"
              className="w-full bg-transparent py-3.5 text-sm text-ceci-primary outline-none placeholder:text-ceci-muted"
            />
          </div>
          <ul className="max-h-[320px] overflow-y-auto py-2">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-ceci-muted">nada encontrado ✨</li>
            )}
            {groups.map((g) => (
              <li key={g.label}>
                <div className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-ceci-muted">
                  {g.label}
                </div>
                <ul>
                  {g.items.map((c) => {
                    const i = filtered.indexOf(c);
                    return (
                      <CommandRow
                        key={c.id}
                        command={c}
                        active={i === active}
                        onHover={() => setActive(i)}
                        onSelect={() => c.run()}
                      />
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
