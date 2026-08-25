import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Wrench } from 'lucide-react';
import type { TempleTechnique, TempleTechniqueCategory } from '../../../types';
import {
  getTempleTechniqueCategories,
  getTempleTechniques,
} from '../../../lib/templeData';

/** Blocos do detalhe da técnica (ordem de exibição). */
const DETAIL_FIELDS: Array<[keyof TempleTechnique, string]> = [
  ['emUmaFrase', 'em uma frase'],
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

export const TechniquesScreen: React.FC = () => {
  const [categories, setCategories] = useState<TempleTechniqueCategory[]>([]);
  const [techniques, setTechniques] = useState<TempleTechnique[]>([]);
  const [loading, setLoading] = useState(true);
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

  const byCategory = useMemo(() => {
    const map = new Map<string, TempleTechnique[]>();
    for (const t of techniques) {
      const list = map.get(t.dominioId) ?? [];
      list.push(t);
      map.set(t.dominioId, list);
    }
    return map;
  }, [techniques]);

  const nameById = useMemo(() => new Map(techniques.map((t) => [t.id, t.nome])), [techniques]);

  if (selected) {
    const related = (selected.tecnicasRelacionadasIds ?? [])
      .map((id) => nameById.get(id))
      .filter(Boolean) as string[];
    return (
      <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4 pb-1 relative">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-semibold text-ceci-brand-strong hover:text-ceci-primary transition-colors cursor-pointer px-1 py-2"
          aria-label="voltar para a lista de técnicas"
        >
          <ArrowLeft className="w-4 h-4" /> voltar às técnicas
        </button>

        <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-2 shadow-2xs">
          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-mint-soft text-success-deep border border-ceci-border-academic">
            {categories.find((c) => c.id === selected.dominioId)?.nome ?? selected.dominioId}
          </span>
          <h1 className="text-xl font-bold font-display text-ceci-primary leading-tight">
            {selected.nome}
          </h1>
          {selected.emUmaFrase && (
            <p className="text-sm text-ceci-secondary leading-relaxed">{selected.emUmaFrase}</p>
          )}
        </div>

        <div className="space-y-3">
          {DETAIL_FIELDS.map(([key, label]) => {
            const body = selected[key];
            if (typeof body !== 'string' || !body.trim() || key === 'emUmaFrase') return null;
            return (
              <div key={String(key)} className="bg-white rounded-[22px] p-4 border border-ceci-border-default shadow-2xs">
                <h2 className="text-xs uppercase tracking-wider font-bold text-ceci-secondary mb-1.5">
                  {label}
                </h2>
                <p className="text-sm text-ceci-primary leading-relaxed whitespace-pre-line">{body}</p>
              </div>
            );
          })}

          {related.length > 0 && (
            <div className="bg-surface-mint-soft border border-ceci-border-academic rounded-[22px] p-4">
              <h2 className="text-xs uppercase tracking-wider font-bold text-success-deep mb-2">
                técnicas relacionadas
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {related.map((name) => (
                  <span
                    key={name}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white text-ceci-secondary border border-ceci-border-subtle"
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
      {/* Intro */}
      <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-surface-mint-soft border border-ceci-border-academic flex items-center justify-center text-success-deep shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight">
              {loading ? 'técnicas' : `${techniques.length} técnicas clínicas`}
            </h1>
            <p className="text-xs text-ceci-secondary">
              instrumentos da prática, organizados em {categories.length} categorias
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-ceci-secondary">
          <Loader2 className="w-4 h-4 animate-spin" /> carregando técnicas…
        </div>
      )}

      {/* Lista por categoria */}
      <div className="space-y-3 px-1">
        {!loading &&
          categories.map((category) => {
            const list = byCategory.get(category.id) ?? [];
            if (list.length === 0) return null;
            const isOpen = openCategory === category.id;
            return (
              <div key={category.id} className="bg-white rounded-[22px] border border-ceci-border-default shadow-2xs overflow-hidden">
                <button
                  onClick={() => setOpenCategory(isOpen ? null : category.id)}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-surface-muted transition-colors text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0 pr-2">
                    <h2 className="text-sm font-bold text-ceci-primary font-display">{category.nome}</h2>
                    {category.descricaoCurta && (
                      <p className="text-xs text-ceci-secondary mt-0.5 line-clamp-2">{category.descricaoCurta}</p>
                    )}
                    <p className="text-[11px] text-ceci-muted mt-0.5">{list.length} técnicas</p>
                  </div>
                  <ArrowLeft
                    className={`w-4 h-4 text-ceci-tertiary transition-transform shrink-0 ${isOpen ? '-rotate-90' : 'rotate-90'}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-ceci-border-subtle divide-y divide-ceci-border-subtle">
                    {list.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => setSelected(tech)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-rose transition-colors cursor-pointer group"
                      >
                        <h3 className="text-sm font-semibold text-ceci-primary group-hover:text-success-deep transition-colors">
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
      </div>
    </div>
  );
};
