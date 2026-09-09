import React, { useEffect, useMemo, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import type { TempleConcept, TempleConceptDomain, TempleConceptIndexEntry } from '../../../types';
import {
  getTempleConceptDomains,
  getTempleConceptIndex,
  getTempleConceptsByDomain,
} from '../../../lib/templeData';
import { MarkdownBlock } from './MarkdownBlock';
import {
  TempleAccordionHeader,
  TempleBackButton,
  TempleEmptyState,
  TempleIntroCard,
  TempleLead,
  TempleLoading,
  TempleSearchInput,
  TempleSectionCard,
} from './TempleShared';

/** Rótulos pt-BR das seções do detalhe (ordem de exibição). */
const SECTION_LABELS: Array<[string, string]> = [
  ['definition', 'definição'],
  ['explanation', 'explicação'],
  ['understanding', 'entendendo melhor'],
  ['manifestations', 'como se manifesta'],
  ['importance', 'por que importa'],
  ['historicalContext', 'contexto histórico'],
  ['perspectives', 'perspectivas'],
  ['example', 'exemplo'],
  ['distinctions', 'distinções'],
  ['relatedConcepts', 'conceitos relacionados'],
  ['practice', 'na prática'],
  ['literatureDebates', 'debates na literatura'],
  ['sources', 'fontes'],
];

/** Seções que ganham destaque visual no detalhe. */
const HIGHLIGHT_SECTIONS = new Set(['importance']);

export const ConceptsScreen: React.FC = () => {
  const [domains, setDomains] = useState<TempleConceptDomain[]>([]);
  const [index, setIndex] = useState<TempleConceptIndexEntry[]>([]);
  const [query, setQuery] = useState('');
  const [openDomain, setOpenDomain] = useState<string | null>(null);
  /** Conceito aberto no detalhe (corpo carregado sob demanda). */
  const [selected, setSelected] = useState<TempleConcept | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [d, i] = await Promise.all([getTempleConceptDomains(), getTempleConceptIndex()]);
      if (!alive) return;
      setDomains(d);
      setIndex(i);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const byDomain = useMemo(() => {
    const map = new Map<string, TempleConceptIndexEntry[]>();
    for (const entry of index) {
      if (
        q &&
        !entry.name.toLowerCase().includes(q) &&
        !entry.definition.toLowerCase().includes(q)
      )
        continue;
      const list = map.get(entry.domainId) ?? [];
      list.push(entry);
      map.set(entry.domainId, list);
    }
    return map;
  }, [index, q]);

  const openConcept = async (entry: TempleConceptIndexEntry) => {
    setLoadingDetail(true);
    try {
      const concepts = await getTempleConceptsByDomain(entry.domainId);
      setSelected(concepts.find((c) => c.id === entry.id) ?? null);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (selected) {
    const highlightKeys = new Set(
      SECTION_LABELS.filter(([key]) => HIGHLIGHT_SECTIONS.has(key)).map(([, label]) => label)
    );
    return (
      <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-1 relative">
        <TempleBackButton
          onClick={() => setSelected(null)}
          label="voltar aos conceitos"
          ariaLabel="voltar para a lista de conceitos"
        />

        <div className="bg-surface-default rounded-2xl p-5 border border-ceci-border-default space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold font-display text-ceci-primary leading-tight min-w-0">
              {selected.name}
            </h1>
            <span className="shrink-0 mt-0.5">
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic whitespace-nowrap">
                {selected.domainName ?? selected.domainId}
              </span>
            </span>
          </div>
          <TempleLead accent="academic" icon={<Lightbulb />}>
            <MarkdownBlock source={selected.definition} />
          </TempleLead>
        </div>

        <div className="space-y-3">
          {SECTION_LABELS.map(([key, label]) => {
            const body = selected.sections?.[key];
            if (!body || !body.trim()) return null;
            return (
              <TempleSectionCard
                key={key}
                title={label}
                accent="academic"
                highlighted={highlightKeys.has(label)}
              >
                <MarkdownBlock source={body} />
              </TempleSectionCard>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-1 relative">
      <TempleIntroCard
        accent="academic"
        icon={<Lightbulb />}
        title={loading ? 'conceitos' : `${index.length} conceitos`}
        subtitle={`ideias-chave da psicologia em ${domains.length} domínios`}
      />

      <TempleSearchInput value={query} onChange={setQuery} label="procurar conceito" placeholder="procurar conceito…" />

      {loading && <TempleLoading label="carregando conceitos…" />}

      {/* Lista por domínio */}
      <div className="space-y-3 px-1">
        {!loading &&
          domains.map((domain) => {
            const entries = byDomain.get(domain.id) ?? [];
            if (entries.length === 0) return null;
            const isOpen = openDomain === domain.id || q.length > 0;
            return (
              <div
                key={domain.id}
                className="bg-surface-default rounded-xl border border-ceci-border-default shadow-2xs overflow-hidden"
              >
                <TempleAccordionHeader
                  title={domain.name}
                  count={entries.length}
                  countLabel="conceitos"
                  open={isOpen}
                  onToggle={() => setOpenDomain(isOpen && !q ? null : domain.id)}
                />
                {isOpen && (
                  <div className="border-t border-ceci-border-subtle divide-y divide-ceci-border-subtle">
                    {entries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => void openConcept(entry)}
                        disabled={loadingDetail}
                        className="w-full text-left px-4 py-3 hover:bg-surface-blue transition-colors cursor-pointer group disabled:opacity-60"
                      >
                        <h3 className="text-sm font-semibold text-ceci-primary group-hover:text-ceci-academic-strong transition-colors truncate">
                          {entry.name}
                        </h3>
                        {entry.definition && (
                          <p className="text-xs text-ceci-secondary mt-0.5 line-clamp-2">{entry.definition}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && byDomain.size === 0 && (
          <TempleEmptyState message="nada por aqui com esse nome ♡" />
        )}
      </div>
    </div>
  );
};
