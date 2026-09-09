import React, { useState } from 'react';
import { Plus, FolderKanban, Trash2 } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { SplitLayout } from '../layouts/SplitLayout';
import { Panel } from './ui/Panel';
import { MAX_ACTIVE_PROJECTS, activeProjectCount } from '../../core/domain';
import type { ProjectType } from '../../core/domain';

const TYPE_LABEL: Record<ProjectType, string> = {
  tcc: 'tcc',
  artigo: 'artigo',
  iniciacao: 'iniciação científica',
  relatorio: 'relatório',
  revisao: 'revisão',
  caso: 'relato de caso',
  apresentacao: 'apresentação',
  livre: 'livre',
};

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-surface-rose text-ceci-brand-strong',
  pausado: 'bg-beige-50 text-ceci-secondary',
  concluido: 'bg-green-100 text-green-700',
  arquivado: 'bg-surface-muted text-ceci-muted',
};

/** Tela desktop de Projetos & TCC — SplitLayout com lista de projetos + detalhe com saídas. */
export const ProjectsScreen: React.FC = () => {
  const app = useDesktopApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectType>('tcc');
  const [outputName, setOutputName] = useState('');

  const active = activeProjectCount(app.projects);
  const selected = app.projects.find((p) => p.id === selectedId) ?? null;
  const selectedOutputs = app.outputs.filter((o) => o.projectId === selectedId);

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const p = app.createProject({ title: trimmed, type });
    if (p) {
      setTitle('');
      setSelectedId(p.id);
    }
  };

  const handleCreateOutput = () => {
    if (!selected || !outputName.trim()) return;
    app.createOutput({ projectId: selected.id, name: outputName.trim(), type: selected.type });
    setOutputName('');
  };

  const master = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-ceci-border-subtle">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-ceci-brand-strong" />
          <p className="font-display font-bold text-ceci-primary text-sm">projetos</p>
        </div>
        <p className="text-[11px] text-ceci-muted mt-0.5">
          {active} de {MAX_ACTIVE_PROJECTS} ativos
        </p>
      </div>

      {/* novo projeto */}
      <div className="px-4 py-3 border-b border-ceci-border-subtle flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-ceci-muted">
          título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="meu tcc"
            className="rounded-[10px] border border-ceci-border-default px-2.5 py-1.5 text-xs text-ceci-primary bg-surface-default focus:outline-none focus:ring-2 focus:ring-ceci-border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-ceci-muted">
          tipo
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProjectType)}
            className="rounded-[10px] border border-ceci-border-default px-2.5 py-1.5 text-xs text-ceci-primary bg-surface-default focus:outline-none focus:ring-2 focus:ring-ceci-border-brand"
          >
            {(Object.keys(TYPE_LABEL) as ProjectType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </label>
        <button
          onClick={handleCreate}
          disabled={active >= MAX_ACTIVE_PROJECTS}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] bg-ceci-primary text-white text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          novo projeto
        </button>
      </div>

      {/* lista de projetos */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {app.projects.length === 0 ? (
          <Panel dashed className="p-4 flex flex-col items-center justify-center gap-1 text-center">
            <p className="text-xs text-ceci-secondary">nenhum projeto ainda ♡</p>
            <p className="text-[11px] text-ceci-muted">crie seu tcc ou artigo para começar</p>
          </Panel>
        ) : (
          <ul className="flex flex-col gap-1">
            {app.projects.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-xs transition-colors ${
                    selectedId === p.id
                      ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                      : 'text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{p.title}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_BADGE[p.status]}`}>
                    {p.status}
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
      {/* cabeçalho do projeto */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-display font-bold text-ceci-primary">{selected.title}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[selected.status]}`}>
              {selected.status}
            </span>
          </div>
          <p className="text-xs text-ceci-muted">{TYPE_LABEL[selected.type]} · {selectedOutputs.length} saída{selectedOutputs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* saídas */}
      <div className="rounded-[16px] border border-ceci-border-subtle bg-surface-muted p-4">
        <p className="font-display font-semibold text-ceci-primary text-sm mb-3">saídas</p>
        <div className="flex items-end gap-2 mb-3">
          <label className="flex flex-col gap-1 text-[11px] text-ceci-muted flex-1">
            nome da saída
            <input
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateOutput(); }}
              placeholder="texto final"
              className="rounded-[10px] border border-ceci-border-default px-2.5 py-1.5 text-xs text-ceci-primary bg-surface-default focus:outline-none focus:ring-2 focus:ring-ceci-border-brand"
            />
          </label>
          <button
            onClick={handleCreateOutput}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-ceci-primary text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            nova saída
          </button>
        </div>

        {selectedOutputs.length === 0 ? (
          <p className="text-xs text-ceci-secondary">nenhuma saída ainda ♡</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {selectedOutputs.map((o) => (
              <li key={o.id} className="flex items-center gap-2 rounded-[10px] bg-surface-default border border-ceci-border-default px-3 py-2">
                <span className="text-xs font-medium text-ceci-primary flex-1 truncate">{o.name}</span>
                <span className="text-[10px] text-ceci-muted uppercase">{o.format}</span>
                <button
                  onClick={() => app.deleteOutput(o.id)}
                  aria-label={`excluir saída ${o.name}`}
                  className="text-ceci-muted hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* placeholder para árvore acadêmica e editor */}
      <Panel dashed className="p-6 flex flex-col items-center justify-center gap-2 text-center">
        <span className="text-2xl" aria-hidden>📝</span>
        <p className="text-sm text-ceci-secondary font-semibold">árvore acadêmica & editor</p>
        <p className="text-xs text-ceci-muted max-w-[280px]">
          a árvore configurável de seções e o editor visual paginado serão implementados na próxima etapa ♡
        </p>
      </Panel>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center">
      <span className="text-3xl" aria-hidden>🎓</span>
      <p className="font-display font-semibold text-ceci-primary">selecione um projeto</p>
      <p className="text-xs text-ceci-muted max-w-[240px]">
        escolha um projeto na lista ao lado para ver saídas, árvore acadêmica e configurações
      </p>
    </div>
  );

  return <SplitLayout master={master} detail={detail} masterWidth={280} />;
};
