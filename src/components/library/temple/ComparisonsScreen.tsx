import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, GitCompare, Layers3, Sparkles } from 'lucide-react';
import type { TempleComparison } from '../../../types';
import { getTempleComparisons } from '../../../lib/templeData';
import {
  TempleBadge,
  TempleChip,
  TempleEmptyState,
  TempleIntroCard,
  TempleLoading,
  TempleSearchInput,
} from './TempleShared';

export type ComparisonEntityFilter = 'todos' | 'abordagem' | 'autor' | 'conceito' | 'tecnica' | 'fenomeno';
export type ComparisonKindFilter = 'todos' | TempleComparison['tipo'];

const ENTITY_FILTERS: Array<{ id: ComparisonEntityFilter; label: string }> = [
  { id: 'todos', label: 'todas' },
  { id: 'abordagem', label: 'abordagens' },
  { id: 'autor', label: 'autores' },
  { id: 'conceito', label: 'conceitos' },
  { id: 'tecnica', label: 'técnicas' },
  { id: 'fenomeno', label: 'fenômenos' },
];

const KIND_FILTERS: Array<{ id: ComparisonKindFilter; label: string }> = [
  { id: 'todos', label: 'mais relevantes' },
  { id: 'divergencia', label: 'divergências' },
  { id: 'convergencia', label: 'convergências' },
  { id: 'complementaridade', label: 'complementaridades' },
  { id: 'perspectivas', label: 'perspectivas' },
];

const KIND_LABELS: Record<TempleComparison['tipo'], string> = {
  divergencia: 'divergência',
  convergencia: 'convergência',
  complementaridade: 'complementaridade',
  perspectivas: 'múltiplas perspectivas',
};

const ENTITY_LABELS: Record<ComparisonEntityFilter, string> = {
  todos: 'comparação',
  abordagem: 'abordagens',
  autor: 'autores',
  conceito: 'conceitos',
  tecnica: 'técnicas',
  fenomeno: 'fenômeno',
};

const isEntityFilter = (value: string): value is ComparisonEntityFilter =>
  ENTITY_FILTERS.some((filter) => filter.id === value);

const isKindFilter = (value: string): value is ComparisonKindFilter =>
  KIND_FILTERS.some((filter) => filter.id === value);

const ComparisonCard: React.FC<{
  comparison: TempleComparison;
  onOpen: () => void;
  featured?: boolean;
}> = ({ comparison, onOpen, featured = false }) => (
  <button
    onClick={onOpen}
    className={`w-full text-left rounded-xl p-4 border shadow-2xs transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-sm ${
      featured
        ? 'bg-surface-gold border-ceci-border-gold'
        : 'bg-white border-ceci-border-default hover:border-ceci-border-brand'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <TempleBadge accent={featured ? 'brand' : 'academic'}>
          {KIND_LABELS[comparison.tipo]}
        </TempleBadge>
        <span className="text-[11px] text-ceci-muted">fase {comparison.fase}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-ceci-tertiary group-hover:text-ceci-brand-strong group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
    <h3 className="text-sm font-bold font-display text-ceci-primary mt-3 leading-snug group-hover:text-ceci-brand-strong transition-colors">
      {comparison.titulo}
    </h3>
    <p className="text-xs text-ceci-secondary leading-relaxed mt-2 line-clamp-3">
      {comparison.perguntaCentral}
    </p>
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {comparison.itens.slice(0, 3).map((item) => (
        <span
          key={`${comparison.id}-${item.tipoEntidade}-${item.entidadeId}`}
          className="text-[10px] px-2 py-1 rounded-full bg-white/70 border border-ceci-border-subtle text-ceci-secondary"
        >
          {ENTITY_LABELS[item.tipoEntidade]}
        </span>
      ))}
      {comparison.itens.length > 3 && (
        <span className="text-[10px] text-ceci-muted">+{comparison.itens.length - 3}</span>
      )}
    </div>
  </button>
);

export const ComparisonsScreen: React.FC<{ onOpen: (slug: string) => void }> = ({ onOpen }) => {
  const [comparisons, setComparisons] = useState<TempleComparison[]>([]);
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<ComparisonEntityFilter>('todos');
  const [kindFilter, setKindFilter] = useState<ComparisonKindFilter>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    void getTempleComparisons()
      .then((items) => {
        if (!alive) return;
        setComparisons(items);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return comparisons
      .filter((comparison) => {
        const entityMatches =
          entityFilter === 'todos' || comparison.itens.some((item) => item.tipoEntidade === entityFilter);
        const kindMatches = kindFilter === 'todos' || comparison.tipo === kindFilter;
        const textMatches =
          !normalizedQuery ||
          [comparison.titulo, comparison.perguntaCentral, comparison.slug]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
        return entityMatches && kindMatches && textMatches;
      })
      .sort((a, b) => {
        if (a.prioridade !== b.prioridade) return a.prioridade === 'P1' ? -1 : 1;
        return a.id.localeCompare(b.id);
      });
  }, [comparisons, entityFilter, kindFilter, query]);

  const featured = filtered.find((comparison) => comparison.slug === 'psicanalise-terapia-cognitiva-beck') ?? filtered[0];
  const rest = featured ? filtered.filter((comparison) => comparison.id !== featured.id) : filtered;
  const activeFilterLabel = entityFilter === 'todos' ? 'todas as comparações' : ENTITY_LABELS[entityFilter];

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-1 relative">
      <TempleIntroCard
        accent="brand"
        icon={<GitCompare />}
        title={loading ? 'comparações' : `${comparisons.length} comparações`}
        subtitle="entenda diferenças, pontes e perspectivas na psicologia"
      />

      <div className="px-1 space-y-3">
        <TempleSearchInput
          value={query}
          onChange={setQuery}
          label="buscar comparação"
          placeholder="buscar comparação…"
        />
        <div>
          <p className="text-[11px] uppercase tracking-wider font-bold text-ceci-secondary mb-2 px-1">
            explorar por
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {ENTITY_FILTERS.map((filter) => (
              <TempleChip
                key={filter.id}
                label={filter.label}
                active={entityFilter === filter.id}
                onClick={() => setEntityFilter(filter.id)}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setKindFilter(filter.id)}
              aria-pressed={kindFilter === filter.id}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                kindFilter === filter.id
                  ? 'bg-surface-gold border-ceci-border-gold text-gold'
                  : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-gold'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <TempleLoading label="carregando comparações…" />}
      {error && <TempleEmptyState message="não foi possível carregar as comparações agora ♡" />}

      {!loading && !error && (
        <>
          {featured && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-4 h-4 text-gold" />
                <h2 className="text-sm uppercase tracking-wider font-bold text-ceci-primary">em destaque</h2>
              </div>
              <ComparisonCard comparison={featured} featured onOpen={() => onOpen(featured.slug)} />
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <Layers3 className="w-4 h-4 text-ceci-brand-strong" />
                <h2 className="text-sm uppercase tracking-wider font-bold text-ceci-primary">explore</h2>
              </div>
              <span className="text-[11px] text-ceci-muted">{filtered.length} {activeFilterLabel}</span>
            </div>
            {rest.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {rest.map((comparison) => (
                  <ComparisonCard
                    key={comparison.id}
                    comparison={comparison}
                    onOpen={() => onOpen(comparison.slug)}
                  />
                ))}
              </div>
            ) : (
              <TempleEmptyState message="nada encontrado com esses filtros ♡" />
            )}
          </section>
        </>
      )}
    </div>
  );
};

