import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Lightbulb, Loader2 } from 'lucide-react';
import type { TempleConcept, TempleConceptDomain, TempleConceptIndexEntry } from '../../../types';
import {
  getTempleConceptDomains,
  getTempleConceptIndex,
  getTempleConceptsByDomain,
} from '../../../lib/templeData';

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
    return (
      <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-1 relative">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-semibold text-ceci-brand-strong hover:text-ceci-primary transition-colors cursor-pointer px-1 py-2"
          aria-label="voltar para a lista de conceitos"
        >
          <ArrowLeft className="w-4 h-4" /> voltar aos conceitos
        </button>

        <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-2 shadow-2xs">
          <span
            className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic"
          >
            {selected.domainName ?? selected.domainId}
          </span>
          <h1 className="text-xl font-bold font-display text-ceci-primary leading-tight">
            {selected.name}
          </h1>
          <p className="text-sm text-ceci-secondary leading-relaxed">{selected.definition}</p>
        </div>

        <div className="space-y-3 px-0">
          {SECTION_LABELS.map(([key, label]) => {
            const body = selected.sections?.[key];
            if (!body || !body.trim()) return null;
            return (
              <div key={key} className="bg-white rounded-[22px] p-4 border border-ceci-border-default shadow-2xs">
                <h2 className="text-xs uppercase tracking-wider font-bold text-ceci-secondary mb-1.5">
                  {label}
                </h2>
                <p className="text-sm text-ceci-primary leading-relaxed whitespace-pre-line">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-1 relative">
      {/* Intro */}
      <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight">
              {loading ? 'conceitos' : `${index.length} conceitos, ${domains.length} domínios`}
            </h1>
            <p className="text-xs text-ceci-secondary">
              ideias-chave organizadas por domínio da psicologia
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="procurar conceito…"
        className="w-full bg-white border border-ceci-border-default rounded-2xl px-4 py-3 text-sm text-ceci-primary placeholder:text-ceci-muted focus:border-ceci-border-academic focus:outline-none shadow-2xs mx-auto block"
        aria-label="procurar conceito"
      />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-ceci-secondary">
          <Loader2 className="w-4 h-4 animate-spin" /> carregando conceitos…
        </div>
      )}

      {/* Lista por domínio */}
      <div className="space-y-3 px-1">
        {!loading &&
          domains.map((domain) => {
            const entries = byDomain.get(domain.id) ?? [];
            if (entries.length === 0) return null;
            const isOpen = openDomain === domain.id || q.length > 0;
            return (
              <div key={domain.id} className="bg-white rounded-[22px] border border-ceci-border-default shadow-2xs overflow-hidden">
                <button
                  onClick={() => setOpenDomain(isOpen && !q ? null : domain.id)}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-surface-muted transition-colors text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-ceci-primary font-display">{domain.name}</h2>
                    <p className="text-xs text-ceci-secondary">{entries.length} conceitos</p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-ceci-tertiary transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-ceci-border-subtle divide-y divide-ceci-border-subtle">
                    {entries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => void openConcept(entry)}
                        disabled={loadingDetail}
                        className="w-full text-left px-4 py-3 hover:bg-surface-rose transition-colors cursor-pointer group disabled:opacity-60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-ceci-primary group-hover:text-ceci-academic-strong transition-colors truncate">
                            {entry.name}
                          </h3>
                          {loadingDetail && <Loader2 className="w-3.5 h-3.5 animate-spin text-ceci-muted shrink-0" />}
                        </div>
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

        {!loading && Object.keys(Object.fromEntries(byDomain)).length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-ceci-secondary">nada por aqui com esse nome ♡</p>
          </div>
        )}
      </div>
    </div>
  );
};
