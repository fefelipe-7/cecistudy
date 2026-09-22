import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Wrench } from 'lucide-react';
import type { TempleTechnique, TempleTechniqueCategory } from '../../../types';
import {
  getTempleTechniqueCategories,
  getTempleTechniques,
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

/** Blocos do detalhe da técnica (ordem de exibição). */
const DETAIL_FIELDS: Array<[keyof TempleTechnique, string]> = [
  ['definicao', 'definição'],
  ['objetivo', 'objetivo'],
  ['comoFunciona', 'como funciona'],
  ['quandoEUtilizada', 'quando é utilizada'],
  ['comoEAplicada', 'como é aplicada'],
  ['exemploPratico', 'exemplo prático'],
  ['origem', 'origem'],
  ['evidencias', 'evidências'],
  ['limitacoes', 'limitações'],
];

/** Seções que ganham destaque visual no detalhe. */
const HIGHLIGHT_FIELDS = new Set<keyof TempleTechnique>(['comoFunciona']);

export const TechniquesScreen: React.FC = () => {
  const [categories, setCategories] = useState<TempleTechniqueCategory[]>([]);
  const [techniques, setTechniques] = useState<TempleTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  /** categoria aberta (null = todas recolhidas) */
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<TempleTechnique | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [cats, techs] = await Promise.all([
        getTempleTechniqueCategories(),
        getTempleTechniques(),
      ]);
      if (!alive) return;
      setCategories(cats);
      setTechniques(techs);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return techniques;
    const catNameById = new Map(categories.map((c) => [c.id, c.nome.toLowerCase()]));
    return techniques.filter(
      (t) =>
        t.nome.toLowerCase().includes(q) ||
        (t.emUmaFrase ?? '').toLowerCase().includes(q) ||
        (catNameById.get(t.dominioId) ?? '').includes(q)
    );
  }, [techniques, categories, q]);

  const byCategory = useMemo(() => {
    const map = new Map<string, TempleTechnique[]>();
    for (const t of filtered) {
      const list = map.get(t.dominioId) ?? [];
      list.push(t);
      map.set(t.dominioId, list);
    }
    return map;
  }, [filtered]);

  const nameById = useMemo(() => new Map(techniques.map((t) => [t.id, t.nome])), [techniques]);

  if (selected) {
    const related = (selected.tecnicasRelacionadasIds ?? [])
      .map((id) => nameById.get(id))
      .filter(Boolean) as string[];
    return (
      <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-1 relative">
        <TempleBackButton
          onClick={() => setSelected(null)}
          label="voltar às técnicas"
          ariaLabel="voltar para a lista de técnicas"
        />

        <div className="bg-surface-default rounded-2xl p-5 border border-ceci-border-default space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold font-display text-ceci-primary leading-tight min-w-0">
              {selected.nome}
            </h1>
            <span className="shrink-0 mt-0.5">
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-status-success-surface text-status-success-strong border border-status-success-border whitespace-nowrap">
                {categories.find((c) => c.id === selected.dominioId)?.nome ?? selected.dominioId}
              </span>
            </span>
          </div>
          {selected.emUmaFrase && (
            <TempleLead accent="success" icon={<Sparkles />}>
              {selected.emUmaFrase}
            </TempleLead>
          )}
        </div>

        <div className="space-y-3">
          {DETAIL_FIELDS.map(([key, label]) => {
            const body = selected[key];
            if (typeof body !== 'string' || !body.trim()) return null;
            return (
              <TempleSectionCard
                key={String(key)}
                title={label}
                accent="success"
                highlighted={HIGHLIGHT_FIELDS.has(key)}
              >
                <MarkdownBlock source={body} />
              </TempleSectionCard>
            );
          })}

          {related.length > 0 && (
            <div className="bg-status-success-surface border border-status-success-border rounded-xl p-4">
              <h2 className="text-xs uppercase tracking-wider font-bold text-status-success-strong mb-2">
                técnicas relacionadas
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {related.map((name) => (
                  <span
                    key={name}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-surface-default text-ceci-secondary border border-ceci-border-subtle"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-1 relative">
      <TempleIntroCard
        accent="success"
        icon={<Wrench />}
        title={loading ? 'técnicas' : `${techniques.length} técnicas clínicas`}
        subtitle={`instrumentos da prática em ${categories.length} categorias`}
      />

      <TempleSearchInput
        value={query}
        onChange={setQuery}
        label="procurar técnica"
        placeholder="procurar técnica…"
      />

      {loading && <TempleLoading label="carregando técnicas…" />}

      {/* Lista por categoria */}
      <div className="space-y-3 px-1">
        {!loading &&
          categories.map((category) => {
            const list = byCategory.get(category.id) ?? [];
            if (list.length === 0) return null;
            const isOpen = openCategory === category.id || q.length > 0;
            return (
              <div
                key={category.id}
                className="bg-surface-default rounded-xl border border-ceci-border-default shadow-2xs overflow-hidden"
              >
                <TempleAccordionHeader
                  title={category.nome}
                  meta={category.descricaoCurta || undefined}
                  count={list.length}
                  countLabel="técnicas"
                  open={isOpen}
                  onToggle={() => setOpenCategory(isOpen && !q ? null : category.id)}
                />
                {isOpen && (
                  <div className="border-t border-ceci-border-subtle divide-y divide-ceci-border-subtle">
                    {list.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => setSelected(tech)}
                        className="w-full text-left px-4 py-3 hover:bg-status-success-surface transition-colors cursor-pointer group"
                      >
                        <h3 className="text-sm font-semibold text-ceci-primary group-hover:text-status-success-strong transition-colors truncate">
                          {tech.nome}
                        </h3>
                        {tech.emUmaFrase && (
                          <p className="text-xs text-ceci-secondary mt-0.5 line-clamp-2">{tech.emUmaFrase}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && byCategory.size === 0 && (
          <TempleEmptyState message="nenhuma técnica com esse nome ♡" />
        )}
      </div>
    </div>
  );
};
