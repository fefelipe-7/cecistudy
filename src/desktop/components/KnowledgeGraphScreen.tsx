import React, { useMemo, useState } from 'react';
import { Plus, Network, ArrowLeft } from 'lucide-react';
import { useDesktopApp } from '@/context/desktopApp';
import { SplitLayout } from '../layouts/SplitLayout';
import { Panel } from './ui/Panel';
import type { RelationKind } from '../../core/domain';

interface GraphNode {
  id: string;
  label: string;
  type: string;
}

const KIND_OPTIONS: { value: RelationKind; label: string }[] = [
  { value: 'explicita', label: 'explícita' },
  { value: 'deterministica', label: 'determinística' },
  { value: 'semantica', label: 'semântica (inbox)' },
  { value: 'user-defined', label: 'personalizada' },
];

const TYPE_COLORS: Record<string, string> = {
  conceito: 'bg-blue-50 text-ceci-academic-strong border-ceci-border-academic',
  disciplina: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand',
  autor: 'bg-beige-50 text-ceci-secondary border-ceci-border-default',
  leitura: 'bg-green-50 text-green-700 border-green-200',
  nota: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

/** Tela desktop do Grafo de Conhecimento — SplitLayout com lista de entidades + grafo SVG + detalhe. */
export const KnowledgeGraphScreen: React.FC = () => {
  const app = useDesktopApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [kind, setKind] = useState<RelationKind>('explicita');

  const entities: GraphNode[] = useMemo(() => {
    const list: GraphNode[] = [
      ...app.concepts.map((c) => ({ id: c.id, label: c.name, type: 'conceito' })),
      ...app.courses.map((c) => ({ id: c.id, label: c.name, type: 'disciplina' })),
      ...app.authors.map((a) => ({ id: a.id, label: a.name, type: 'autor' })),
      ...app.readings.map((r) => ({ id: r.id, label: r.title, type: 'leitura' })),
      ...app.looseNotes.map((n) => ({ id: n.id, label: n.title, type: 'nota' })),
    ];
    return list;
  }, [app.concepts, app.courses, app.authors, app.readings, app.looseNotes]);

  const labelOf = (id: string) => entities.find((e) => e.id === id)?.label ?? id;
  const typeOf = (id: string) => entities.find((e) => e.id === id)?.type ?? 'entidade';

  const accepted = useMemo(
    () => app.relations.filter((r) => r.workspaceId === app.currentWorkspaceId && r.accepted),
    [app.relations, app.currentWorkspaceId]
  );

  const nodes: GraphNode[] = useMemo(() => {
    const ids = new Set<string>();
    accepted.forEach((r) => {
      ids.add(r.sourceId);
      ids.add(r.targetId);
    });
    return Array.from(ids).map((id) => ({ id, label: labelOf(id), type: typeOf(id) }));
  }, [accepted, entities]);

  const positions = useMemo(() => {
    const cx = 400;
    const cy = 250;
    const radius = Math.max(120, Math.min(200, 160 + nodes.length * 8));
    const map: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      map[n.id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    });
    return map;
  }, [nodes]);

  const neighbors = useMemo(() => {
    const set = new Set<string>();
    if (selectedId) {
      accepted.forEach((r) => {
        if (r.sourceId === selectedId) set.add(r.targetId);
        if (r.targetId === selectedId) set.add(r.sourceId);
      });
    }
    return set;
  }, [selectedId, accepted]);

  const selectedEntity = selectedId ? entities.find((e) => e.id === selectedId) : null;
  const selectedRelations = selectedId
    ? accepted.filter((r) => r.sourceId === selectedId || r.targetId === selectedId)
    : [];

  const handleRelate = () => {
    if (!sourceId || !targetId || sourceId === targetId) {
      app.showToast('escolhe duas entidades diferentes ♡');
      return;
    }
    const rel = app.addExplicitRelation({ sourceId, targetId, kind });
    setSourceId('');
    setTargetId('');
    if (kind === 'semantica') {
      app.showToast('relação semântica enviada para o inbox ♡');
    } else {
      app.showToast(`relação criada: ${labelOf(rel.sourceId)} → ${labelOf(rel.targetId)}`);
    }
  };

  const master = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-ceci-border-subtle">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-ceci-brand-strong" />
          <p className="font-display font-bold text-ceci-primary text-sm">grafo</p>
        </div>
        <p className="text-[11px] text-ceci-muted mt-0.5">
          {nodes.length} nó{nodes.length !== 1 ? 's' : ''} · {accepted.length} relação{accepted.length !== 1 ? 'ões' : ''}
        </p>
      </div>

      {/* formulário de criação */}
      <div className="px-4 py-3 border-b border-ceci-border-subtle flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-ceci-muted">
          origem
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="rounded-[10px] border border-ceci-border-default px-2.5 py-1.5 text-xs text-ceci-primary bg-surface-default focus:outline-none focus:ring-2 focus:ring-ceci-border-brand"
          >
            <option value="">selecione…</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-ceci-muted">
          destino
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="rounded-[10px] border border-ceci-border-default px-2.5 py-1.5 text-xs text-ceci-primary bg-surface-default focus:outline-none focus:ring-2 focus:ring-ceci-border-brand"
          >
            <option value="">selecione…</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-ceci-muted">
          tipo
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as RelationKind)}
            className="rounded-[10px] border border-ceci-border-default px-2.5 py-1.5 text-xs text-ceci-primary bg-surface-default focus:outline-none focus:ring-2 focus:ring-ceci-border-brand"
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <button
          onClick={handleRelate}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] bg-ceci-primary text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          relacionar
        </button>
      </div>

      {/* lista de entidades */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {entities.length === 0 ? (
          <p className="text-xs text-ceci-secondary text-center py-6">nenhuma entidade ainda ♡</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {entities.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelectedId(selectedId === e.id ? null : e.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs transition-colors ${
                    selectedId === e.id
                      ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                      : 'text-ceci-secondary hover:bg-surface-muted hover:text-ceci-primary'
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${TYPE_COLORS[e.type] ?? 'bg-surface-muted text-ceci-muted border-ceci-border-default'}`}>
                    {e.type}
                  </span>
                  <span className="truncate flex-1">{e.label}</span>
                  <span className="text-[10px] text-ceci-muted">
                    {accepted.filter((r) => r.sourceId === e.id || r.targetId === e.id).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const detail = (
    <div className="flex flex-col h-full">
      {/* grafo SVG */}
      <div className="flex-1 rounded-[18px] border border-ceci-border-subtle bg-surface-muted overflow-hidden m-4 mb-2">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-8 text-center">
            <span className="text-3xl" aria-hidden>🧠</span>
            <p className="text-sm text-ceci-secondary">ainda não há relações por aqui ♡</p>
            <p className="text-xs text-ceci-muted">crie uma usando o formulário ao lado</p>
          </div>
        ) : (
          <svg viewBox="0 0 800 500" className="w-full h-full min-h-[400px]" role="img" aria-label="grafo de conhecimento">
            {accepted.map((r) => {
              const a = positions[r.sourceId];
              const b = positions[r.targetId];
              if (!a || !b) return null;
              const dim = selectedId && selectedId !== r.sourceId && selectedId !== r.targetId;
              return (
                <line
                  key={r.id}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={dim ? '#E9DFDC' : '#D85F79'}
                  strokeWidth={dim ? 1 : 2}
                />
              );
            })}
            {nodes.map((n) => {
              const p = positions[n.id];
              if (!p) return null;
              const isSel = selectedId === n.id;
              const isNeighbor = neighbors.has(n.id);
              const dim = selectedId && !isSel && !isNeighbor;
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  onClick={() => setSelectedId(isSel ? null : n.id)}
                  className="cursor-pointer"
                  opacity={dim ? 0.35 : 1}
                >
                  <circle r={isSel ? 14 : 10} fill={isSel ? '#B94862' : '#FFF5F7'} stroke="#D85F79" strokeWidth={2} />
                  <text x={0} y={26} textAnchor="middle" className="fill-ceci-primary" style={{ fontSize: 11, fontWeight: isSel ? 700 : 500 }}>
                    {n.label.length > 18 ? `${n.label.slice(0, 17)}…` : n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* detalhe do nó selecionado */}
      {selectedEntity ? (
        <div className="mx-4 mb-4 rounded-[16px] border border-ceci-border-subtle bg-surface-default p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[selectedEntity.type] ?? 'bg-surface-muted text-ceci-muted border-ceci-border-default'}`}>
              {selectedEntity.type}
            </span>
            <p className="font-display font-bold text-ceci-primary text-sm">{selectedEntity.label}</p>
          </div>
          <p className="text-xs text-ceci-secondary mb-2">
            conectado a {neighbors.size} entidade{neighbors.size !== 1 ? 's' : ''}
          </p>
          {selectedRelations.length > 0 && (
            <ul className="flex flex-col gap-1">
              {selectedRelations.map((r) => {
                const otherId = r.sourceId === selectedId ? r.targetId : r.sourceId;
                return (
                  <li key={r.id} className="flex items-center gap-2 text-xs text-ceci-secondary">
                    <span className="text-ceci-muted">→</span>
                    <span className="font-medium text-ceci-primary">{labelOf(otherId)}</span>
                    <span className="text-[10px] text-ceci-muted">({r.kind})</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <Panel dashed className="mx-4 mb-4 p-4 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-xs text-ceci-muted">clique em um nó para ver seus detalhes</p>
        </Panel>
      )}
    </div>
  );

  return <SplitLayout master={master} detail={detail} masterWidth={280} />;
};
