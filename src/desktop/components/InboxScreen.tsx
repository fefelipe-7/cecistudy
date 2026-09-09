import React, { useState } from 'react';
import { Inbox, CheckCircle, XCircle, Archive } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { SplitLayout } from '../layouts/SplitLayout';
import { Panel } from './ui/Panel';
import type { Suggestion } from '../../core/domain';

function describeSuggestion(s: Suggestion): string {
  const p = s.payload as Record<string, unknown>;
  if (s.type === 'relation' && p.sourceId && p.targetId) {
    return `relação entre ${String(p.sourceId)} e ${String(p.targetId)}`;
  }
  if (typeof p.summary === 'string') return p.summary;
  return 'nova sugestão de conhecimento';
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'pendente',
  accepted: 'aceita',
  rejected: 'rejeitada',
  ignored: 'ignorada',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  ignored: 'bg-surface-muted text-ceci-muted border-ceci-border-default',
};

/** Tela desktop do Inbox de Curadoria — SplitLayout com lista de sugestões + detalhe + ações. */
export const InboxScreen: React.FC = () => {
  const app = useDesktopApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const allSuggestions = app.suggestions.filter((s) => s.workspaceId === app.currentWorkspaceId);
  const filtered = filter === 'all' ? allSuggestions : allSuggestions.filter((s) => s.status === filter);
  const pendingCount = allSuggestions.filter((s) => s.status === 'pending').length;
  const selected = filtered.find((s) => s.id === selectedId) ?? null;

  const master = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-ceci-border-subtle">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-ceci-brand-strong" />
          <p className="font-display font-bold text-ceci-primary text-sm">inbox</p>
        </div>
        <p className="text-[11px] text-ceci-muted mt-0.5">
          {pendingCount === 0 ? 'tudo em dia' : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* filtros */}
      <div className="px-4 py-2 border-b border-ceci-border-subtle flex gap-1.5">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
              filter === f
                ? 'bg-ceci-primary text-white'
                : 'bg-surface-muted text-ceci-secondary hover:bg-beige-50'
            }`}
          >
            {f === 'all' ? 'todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* lista de sugestões */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {filtered.length === 0 ? (
          <Panel dashed className="p-4 flex flex-col items-center justify-center gap-1 text-center">
            <p className="text-xs text-ceci-secondary">
              {filter === 'pending' ? 'tudo tranquilo ♡' : 'nenhuma sugestão nesta categoria'}
            </p>
          </Panel>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                  className={`w-full text-left flex items-start gap-2 px-3 py-2.5 rounded-[10px] text-xs transition-colors ${
                    selectedId === s.id
                      ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                      : 'text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary'
                  }`}
                >
                  <span className="mt-0.5" aria-hidden>✨</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize">{s.type}</p>
                    <p className="text-[11px] text-ceci-muted truncate">{describeSuggestion(s)}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border shrink-0 ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const detail = selected ? (
    <div className="flex flex-col h-full p-4 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-display font-bold text-ceci-primary capitalize">{selected.type}</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLOR[selected.status]}`}>
            {STATUS_LABEL[selected.status]}
          </span>
        </div>
        <p className="text-xs text-ceci-secondary">{describeSuggestion(selected)}</p>
      </div>

      {/* payload detalhado */}
      <div className="rounded-[16px] border border-ceci-border-subtle bg-surface-muted p-4">
        <p className="font-display font-semibold text-ceci-primary text-sm mb-2">detalhes</p>
        <pre className="text-[11px] text-ceci-secondary whitespace-pre-wrap font-mono">
          {JSON.stringify(selected.payload, null, 2)}
        </pre>
      </div>

      {/* ações */}
      {selected.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              app.acceptSuggestion(selected.id);
              setSelectedId(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-ceci-primary text-white text-xs font-semibold cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            aceitar
          </button>
          <button
            onClick={() => {
              app.rejectSuggestion(selected.id);
              setSelectedId(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-ceci-border-default text-xs text-ceci-secondary cursor-pointer hover:bg-surface-muted"
          >
            <XCircle className="w-3.5 h-3.5" />
            rejeitar
          </button>
        </div>
      )}

      {selected.status !== 'pending' && (
        <p className="text-xs text-ceci-muted">
          esta sugestão já foi {selected.status === 'accepted' ? 'aceita' : selected.status === 'rejected' ? 'rejeitada' : 'arquivada'}
        </p>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center">
      <span className="text-3xl" aria-hidden>📬</span>
      <p className="font-display font-semibold text-ceci-primary">selecione uma sugestão</p>
      <p className="text-xs text-ceci-muted max-w-[240px]">
        escolha uma sugestão na lista ao lado para ver detalhes e decidir se aceita ou rejeita
      </p>
    </div>
  );

  return <SplitLayout master={master} detail={detail} masterWidth={280} />;
};
