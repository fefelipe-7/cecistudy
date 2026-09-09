import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  BookOpen,
  Brain,
  CircleHelp,
  ExternalLink,
  GitCompare,
  Lightbulb,
  Link2,
  MessageCircleQuestion,
  Quote,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { COMPARISON_AXES } from '../../../types';
import type { TempleAuthor, TempleComparison, TempleEntityReference } from '../../../types';
import { getTempleAuthors, getTempleConcept, getTempleTechniques, resolveApproach } from '../../../lib/templeData';
import { MarkdownBlock } from './MarkdownBlock';
import {
  TempleBackButton,
  TempleBadge,
  TempleEmptyState,
  TempleLead,
  TempleLoading,
  TempleNeutralBadge,
  TempleSectionCard,
} from './TempleShared';

interface ResolvedEntity {
  ref: TempleEntityReference;
  name: string;
  subtitle: string;
  description?: string;
  icon: React.ReactNode;
}

type Axis = (typeof COMPARISON_AXES)[number];

const TYPE_LABELS: Record<TempleEntityReference['tipoEntidade'], string> = {
  abordagem: 'abordagem',
  autor: 'autor',
  conceito: 'conceito',
  tecnica: 'técnica',
  fenomeno: 'fenômeno',
};

const AXIS_LABELS: Record<string, { label: string; question: string }> = Object.fromEntries(
  COMPARISON_AXES.map((axis) => [axis.key, { label: axis.label, question: axis.question }])
);

const TYPE_ICONS: Record<TempleEntityReference['tipoEntidade'], React.ReactNode> = {
  abordagem: <Brain className="w-4 h-4" />,
  autor: <UserRound className="w-4 h-4" />,
  conceito: <Lightbulb className="w-4 h-4" />,
  tecnica: <Wrench className="w-4 h-4" />,
  fenomeno: <Sparkles className="w-4 h-4" />,
};

const titleFromPhenomenon = (id: string) =>
  id
    .replace(/^fenomeno-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeAuthorStem = (value: string) => value.replace(/^cecistudy_ficha_/, '').toLowerCase();

const authorMatchesRef = (author: TempleAuthor, refId: string) => {
  const stem = normalizeAuthorStem(refId);
  return author.id === refId || author.slug.toLowerCase() === stem || author.id === `author-${stem}`;
};

const authorDescription = (author: TempleAuthor) => {
  if (author.oneLiner) return author.oneLiner;
  const preferred = ['A grande ideia', 'Em uma frase', 'Visão geral', 'Contribuições'];
  const section = preferred
    .map((title) => author.sections.find((candidate) => candidate.title.toLowerCase() === title.toLowerCase()))
    .find(Boolean);
  return section?.body;
};

async function resolveEntity(ref: TempleEntityReference): Promise<ResolvedEntity> {
  if (ref.tipoEntidade === 'abordagem') {
    const approach = await resolveApproach(ref.entidadeId);
    return {
      ref,
      name: approach?.name ?? ref.entidadeNome ?? ref.entidadeId,
      subtitle: approach?.familyId ? `família ${approach.familyId}` : 'registro de abordagem',
      icon: TYPE_ICONS[ref.tipoEntidade],
    };
  }
  if (ref.tipoEntidade === 'autor') {
    const authors = await getTempleAuthors();
    const author = authors.find((candidate) => authorMatchesRef(candidate, ref.entidadeId));
    return {
      ref,
      name: author?.name ?? ref.entidadeNome ?? ref.entidadeId,
      subtitle: author?.family ?? 'autor do acervo',
      description: author ? authorDescription(author) : undefined,
      icon: TYPE_ICONS[ref.tipoEntidade],
    };
  }
  if (ref.tipoEntidade === 'conceito') {
    const concept = await getTempleConcept(ref.entidadeId);
    return {
      ref,
      name: concept?.name ?? ref.entidadeNome ?? ref.entidadeId,
      subtitle: concept?.domainName ?? 'conceito do Templo',
      description: concept?.definition,
      icon: TYPE_ICONS[ref.tipoEntidade],
    };
  }
  if (ref.tipoEntidade === 'tecnica') {
    const techniques = await getTempleTechniques();
    const technique = techniques.find((candidate) => candidate.id === ref.entidadeId);
    return {
      ref,
      name: technique?.nome ?? ref.entidadeNome ?? ref.entidadeId,
      subtitle: technique?.dominioNomes?.[0] ?? 'técnica clínica',
      description: technique?.definicao ?? technique?.comoFunciona,
      icon: TYPE_ICONS[ref.tipoEntidade],
    };
  }
  return {
    ref,
    name: titleFromPhenomenon(ref.entidadeId),
    subtitle: 'fenômeno editorial',
    icon: TYPE_ICONS[ref.tipoEntidade],
  };
}

const getEntityAnswer = (comparison: TempleComparison, axis: string, entityId: string) => {
  const structuredAxis = comparison.eixos?.find((entry) => entry.key === axis || entry.id === axis);
  const structuredAnswer = structuredAxis?.respostas.find((entry) => entry.entidadeId === entityId);
  if (structuredAnswer?.conteudo) return structuredAnswer.conteudo;
  const divergence = comparison.divergencias?.find((entry) =>
    `${entry.tema} ${axis}`.toLowerCase().includes(axis.toLowerCase())
  );
  return divergence?.porEntidade[entityId]?.join(' ');
};

const QualitativeDots: React.FC<{ level: number }> = ({ level }) => (
  <span className="inline-flex gap-0.5" aria-label={`ênfase qualitativa nível ${level} de 5`}>
    {[1, 2, 3, 4, 5].map((dot) => (
      <span
        key={dot}
        className={`w-1.5 h-1.5 rounded-full ${dot <= level ? 'bg-ceci-brand-strong' : 'bg-ceci-border-default'}`}
      />
    ))}
  </span>
);

const PerspectiveCard: React.FC<{
  entity: ResolvedEntity;
  answer?: string;
  featured?: boolean;
}> = ({ entity, answer, featured = false }) => (
  <div className={`rounded-xl p-4 border min-w-0 ${featured ? 'bg-surface-rose border-ceci-border-brand' : 'bg-white border-ceci-border-default'}`}>
    <div className="flex items-center gap-2 text-ceci-brand-strong">
      {entity.icon}
      <span className="text-[10px] uppercase tracking-wider font-bold">{TYPE_LABELS[entity.ref.tipoEntidade]}</span>
    </div>
    <h3 className="text-sm font-bold font-display text-ceci-primary mt-2 leading-snug">{entity.name}</h3>
    <p className="text-[11px] text-ceci-secondary mt-1 line-clamp-2">{entity.subtitle}</p>
    <div className="mt-3 text-xs text-ceci-primary leading-relaxed">
      {answer ? <MarkdownBlock source={answer} /> : entity.description ? <MarkdownBlock source={entity.description} /> : <span className="text-ceci-secondary">conteúdo específico deste eixo em preparação.</span>}
    </div>
  </div>
);

const ComparisonMap: React.FC<{ entities: ResolvedEntity[] }> = ({ entities }) => (
  <TempleSectionCard title="mapa da comparação" accent="brand" highlighted>
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="rounded-2xl bg-white border border-ceci-border-brand px-4 py-2.5 shadow-2xs">
        <p className="text-[10px] uppercase tracking-wider font-bold text-ceci-brand-strong">fenômeno ou pergunta</p>
        <p className="text-xs text-ceci-primary mt-0.5">o que está sendo compreendido?</p>
      </div>
      <ArrowDown className="w-4 h-4 text-ceci-brand-strong" />
      <div className={`grid gap-2 w-full ${entities.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {entities.map((entity) => (
          <div key={`${entity.ref.tipoEntidade}-${entity.ref.entidadeId}`} className="bg-white rounded-2xl border border-ceci-border-default p-3">
            <p className="text-xs font-bold text-ceci-primary truncate">{entity.name}</p>
            <p className="text-[11px] text-ceci-secondary mt-1">perspectiva</p>
          </div>
        ))}
      </div>
      <ArrowDown className="w-4 h-4 text-ceci-brand-strong" />
      <div className="rounded-2xl bg-white border border-ceci-border-brand px-4 py-2.5 shadow-2xs">
        <p className="text-[10px] uppercase tracking-wider font-bold text-ceci-brand-strong">leitura e mudança</p>
        <p className="text-xs text-ceci-primary mt-0.5">o que cada modelo torna visível?</p>
      </div>
    </div>
  </TempleSectionCard>
);

export const ComparisonDetailScreen: React.FC<{
  comparison: TempleComparison;
  onBack: () => void;
}> = ({ comparison, onBack }) => {
  const [entities, setEntities] = useState<ResolvedEntity[]>([]);
  const [relatedEntities, setRelatedEntities] = useState<ResolvedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.all(comparison.itens.map(resolveEntity)).then((resolved) => {
      if (!alive) return;
      setEntities(resolved);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [comparison.itens]);

  useEffect(() => {
    let alive = true;
    const related = comparison.relacionados ?? [];
    if (related.length === 0) {
      setRelatedEntities([]);
      return;
    }
    void Promise.all(related.map((item) => resolveEntity({ tipoEntidade: item.tipo, entidadeId: item.id }))).then((resolved) => {
      if (alive) setRelatedEntities(resolved);
    });
    return () => {
      alive = false;
    };
  }, [comparison.relacionados]);

  const axisEntries = useMemo(() => {
    if (comparison.eixos?.length) {
      return comparison.eixos.map((axis) => ({
        key: axis.key,
        label: axis.titulo,
        question: axis.pergunta,
      }));
    }
    return comparison.eixosRecomendados
      .map((key) => AXIS_LABELS[key] ? { key, ...AXIS_LABELS[key] } : null)
      .filter(Boolean) as Array<{ key: Axis['key']; label: string; question: string }>;
  }, [comparison.eixos, comparison.eixosRecomendados]);

  const sourcesById = useMemo(
    () => new Map((comparison.fontesDetalhadas ?? []).map((source) => [source.id, source])),
    [comparison.fontesDetalhadas]
  );

  const statusLabel = comparison.statusPesquisa.includes('revis') ? 'em revisão' : 'pesquisa selecionada';
  const isMultiPerspective = entities.length > 2 || comparison.itens.some((item) => item.tipoEntidade === 'fenomeno');

  if (loading) return <TempleLoading label="organizando a comparação…" />;

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-5 pb-1 relative">
      <TempleBackButton onClick={onBack} label="voltar às comparações" ariaLabel="voltar para a lista de comparações" />

      <header className="bg-white rounded-2xl p-5 border border-ceci-border-default shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-ceci-brand-strong">
          <GitCompare className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-wider font-bold">{isMultiPerspective ? 'múltiplas perspectivas' : 'comparação editorial'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {entities.map((entity) => (
            <React.Fragment key={`${entity.ref.tipoEntidade}-${entity.ref.entidadeId}`}>
              <div className="min-w-[120px] flex-1 rounded-2xl bg-surface-muted border border-ceci-border-default p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-ceci-secondary">{TYPE_LABELS[entity.ref.tipoEntidade]}</p>
                <p className="text-sm font-bold font-display text-ceci-primary mt-1 leading-snug">{entity.name}</p>
                <p className="text-[11px] text-ceci-secondary mt-1 line-clamp-2">{entity.subtitle}</p>
              </div>
              {entity !== entities[entities.length - 1] && <span className="text-lg font-display text-ceci-brand-strong">×</span>}
            </React.Fragment>
          ))}
        </div>
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <TempleBadge accent="brand">{comparison.tipo}</TempleBadge>
            <TempleNeutralBadge>{statusLabel}</TempleNeutralBadge>
            <TempleNeutralBadge>fase {comparison.fase}</TempleNeutralBadge>
            {comparison.evidenciaNivel && <TempleNeutralBadge>evidência {comparison.evidenciaNivel}</TempleNeutralBadge>}
          </div>
          <h1 className="text-2xl font-bold font-display text-ceci-primary leading-tight">{comparison.titulo}</h1>
          <p className="text-sm text-ceci-secondary leading-relaxed mt-2">{comparison.perguntaCentral}</p>
        </div>
      </header>

      {comparison.visaoGeral ? (
        <TempleSectionCard title="visão geral" accent="brand" highlighted>
          <MarkdownBlock source={comparison.visaoGeral} />
        </TempleSectionCard>
      ) : (
        <TempleLead accent="brand" icon={<CircleHelp />}>
          <strong className="font-semibold">uma pergunta para guiar a leitura:</strong>{' '}
          compare as perspectivas sem transformar a diferença em uma disputa. Este registro já possui os eixos preparados e receberá o texto editorial progressivamente.
        </TempleLead>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <MessageCircleQuestion className="w-4 h-4 text-ceci-brand-strong" />
          <h2 className="text-sm uppercase tracking-wider font-bold text-ceci-primary">eixos de leitura</h2>
        </div>
        {axisEntries.map((axis, index) => (
          <section key={axis.key} className="rounded-xl bg-white border border-ceci-border-default shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-surface-muted border-b border-ceci-border-subtle">
              <p className="text-[10px] uppercase tracking-wider font-bold text-ceci-brand-strong">{String(index + 1).padStart(2, '0')} · {axis.label}</p>
              <h2 className="text-sm font-bold font-display text-ceci-primary mt-1">{axis.question}</h2>
            </div>
            <div className={`grid gap-3 p-3 ${entities.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {entities.map((entity, entityIndex) => (
                <PerspectiveCard
                  key={`${axis.key}-${entity.ref.entidadeId}`}
                  entity={entity}
                  featured={entityIndex === 0}
                  answer={getEntityAnswer(comparison, axis.key, entity.ref.entidadeId)}
                />
              ))}
            </div>
          </section>
        ))}
      </section>

      <ComparisonMap entities={entities} />

      {comparison.convergencias && comparison.convergencias.length > 0 && (
        <TempleSectionCard title="onde elas se aproximam?" accent="success" highlighted>
          <MarkdownBlock source={comparison.convergencias.join('\n\n')} />
        </TempleSectionCard>
      )}

      {comparison.divergencias && comparison.divergencias.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <GitCompare className="w-4 h-4 text-ceci-brand-strong" />
            <h2 className="text-sm uppercase tracking-wider font-bold text-ceci-primary">pontos de divergência</h2>
          </div>
          {comparison.divergencias.map((entry, index) => (
            <div key={`${entry.tema}-${index}`} className="rounded-xl bg-white border border-ceci-border-default shadow-2xs p-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-ceci-brand-strong">{String(index + 1).padStart(2, '0')} · {entry.tema}</p>
              <div className="space-y-3 mt-3">
                {entities.map((entity) => {
                  const answer = entry.porEntidade[entity.ref.entidadeId];
                  if (!answer?.length) return null;
                  return (
                    <div key={entity.ref.entidadeId}>
                      <p className="text-xs font-bold text-ceci-primary">{entity.name}</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-ceci-secondary leading-relaxed">
                        {answer.map((text) => <li key={text}>{text}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {comparison.pratica ? (
        <TempleSectionCard title="na prática" accent="academic" highlighted>
          <MarkdownBlock source={comparison.pratica} />
        </TempleSectionCard>
      ) : (
        <TempleSectionCard title="na prática" accent="academic">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-ceci-academic-strong shrink-0 mt-0.5" />
            <p className="text-sm text-ceci-secondary leading-relaxed">a aplicação concreta será descrita aqui sem transformar a comparação em protocolo ou indicação universal.</p>
          </div>
        </TempleSectionCard>
      )}

      {(comparison.evidenciaSintese || comparison.evidencias?.length) && (
        <TempleSectionCard title="evidência e limites" accent="academic" highlighted>
          <div className="space-y-4">
            {comparison.evidenciaSintese && <MarkdownBlock source={comparison.evidenciaSintese} />}
            {comparison.evidencias?.map((evidence) => {
              const source = sourcesById.get(evidence.fonteId);
              return (
                <article key={`${comparison.id}-${evidence.ordem}`} className="rounded-2xl bg-surface-muted border border-ceci-border-subtle p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-ceci-primary">{evidence.afirmacao}</p>
                  <dl className="grid gap-2 text-xs text-ceci-secondary sm:grid-cols-3">
                    <div><dt className="font-semibold text-ceci-primary">contexto</dt><dd>{evidence.populacaoOuContexto}</dd></div>
                    <div><dt className="font-semibold text-ceci-primary">desfecho</dt><dd>{evidence.desfecho}</dd></div>
                    <div><dt className="font-semibold text-ceci-primary">resultado</dt><dd>{evidence.resultado}</dd></div>
                  </dl>
                  {source && <p className="text-[11px] text-ceci-secondary">fonte: {source.titulo}{source.url ? <> · <a href={source.url} target="_blank" rel="noreferrer" className="text-ceci-brand-strong underline underline-offset-2">abrir</a></> : null}</p>}
                </article>
              );
            })}
          </div>
        </TempleSectionCard>
      )}

      {comparison.criticasELimitacoes?.length ? (
        <TempleSectionCard title="críticas e limitações" accent="academic">
          <ul className="list-disc pl-5 space-y-2 text-sm text-ceci-primary leading-relaxed marker:text-gold">
            {comparison.criticasELimitacoes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </TempleSectionCard>
      ) : null}

      {comparison.enfases && comparison.enfases.length > 0 && (
        <TempleSectionCard title="o que cada perspectiva enfatiza?" accent="brand">
          <div className="space-y-3">
            {comparison.enfases.map((entry) => (
              <div key={entry.dimensao} className="grid gap-2 sm:grid-cols-2">
                {entities.map((entity) => {
                  const emphasis = entry.porEntidade[entity.ref.entidadeId];
                  if (!emphasis) return null;
                  return (
                    <div key={`${entry.dimensao}-${entity.ref.entidadeId}`} className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2">
                      <span className="text-xs text-ceci-primary"><strong>{entity.name}</strong><br />{emphasis.label ?? entry.dimensao}</span>
                      <QualitativeDots level={Math.max(0, Math.min(5, emphasis.level))} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </TempleSectionCard>
      )}

      <TempleSectionCard title="para pensar" accent="brand" highlighted>
        {comparison.paraPensar?.length ? (
          <div className="space-y-3">
            {!showReflection && <p className="text-sm text-ceci-primary leading-relaxed">a comparação termina com perguntas abertas para transformar leitura em estudo ativo.</p>}
            {showReflection ? (
              <ul className="list-disc pl-5 space-y-2 text-sm text-ceci-primary leading-relaxed marker:text-ceci-brand-strong">
                {comparison.paraPensar.map((question) => <li key={question}>{question}</li>)}
              </ul>
            ) : (
              <button onClick={() => setShowReflection(true)} className="inline-flex items-center gap-2 rounded-full bg-ceci-brand-strong text-white px-4 py-2 text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                <MessageCircleQuestion className="w-3.5 h-3.5" /> refletir
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-ceci-secondary leading-relaxed">as perguntas de reflexão serão adicionadas quando o artigo editorial for publicado.</p>
        )}
      </TempleSectionCard>

      <TempleSectionCard title="fontes" accent="academic">
        {comparison.fontesDetalhadas?.length ? (
          <ul className="space-y-3 text-xs text-ceci-secondary leading-relaxed">
            {comparison.fontesDetalhadas.map((source) => (
              <li key={source.id} className="flex items-start gap-2">
                <Quote className="w-3.5 h-3.5 text-ceci-academic-strong shrink-0 mt-0.5" />
                <span><strong className="text-ceci-primary">{source.titulo}</strong>{source.autor ? ` — ${source.autor}` : ''}{source.ano ? ` (${source.ano})` : ''}<br />{source.escopo}{source.url ? <> · <a href={source.url} target="_blank" rel="noreferrer" className="text-ceci-brand-strong underline underline-offset-2">abrir fonte</a></> : null}</span>
              </li>
            ))}
          </ul>
        ) : comparison.fontes?.length || comparison.fontesIniciais.length ? (
          <ul className="space-y-2 text-xs text-ceci-secondary leading-relaxed">
            {(comparison.fontes ?? comparison.fontesIniciais).map((source) => (
              <li key={source} className="flex items-start gap-2"><Quote className="w-3.5 h-3.5 text-ceci-academic-strong shrink-0 mt-0.5" />{source}</li>
            ))}
          </ul>
        ) : <p className="text-sm text-ceci-secondary">fontes em preparação.</p>}
      </TempleSectionCard>

      <TempleSectionCard title="relacionado" accent="brand">
        <div className="space-y-2">
          {comparison.relacionados?.length ? (relatedEntities.length > 0 ? relatedEntities : comparison.relacionados.map((item) => ({
            ref: { tipoEntidade: item.tipo, entidadeId: item.id } as TempleEntityReference,
            name: item.id,
            subtitle: item.tipo,
            icon: TYPE_ICONS[item.tipo],
          }))).map((related) => (
            <div key={`${related.ref.tipoEntidade}-${related.ref.entidadeId}`} className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted border border-ceci-border-subtle px-3 py-2">
              <div className="flex items-center gap-2 min-w-0"><Link2 className="w-3.5 h-3.5 text-ceci-brand-strong shrink-0" /><span className="text-xs text-ceci-primary truncate">{related.name}</span></div>
              <span className="text-[10px] text-ceci-muted shrink-0">ver {TYPE_LABELS[related.ref.tipoEntidade]}</span>
            </div>
          )) : (
            <p className="text-sm text-ceci-secondary leading-relaxed">os vínculos com abordagens, autores, conceitos e técnicas aparecerão aqui conforme o artigo for enriquecido.</p>
          )}
        </div>
      </TempleSectionCard>

      {comparison.observacaoEditorial && (
        <div className="flex items-start gap-2 rounded-2xl bg-surface-gold border border-ceci-border-gold p-3.5 text-xs text-ceci-primary leading-relaxed">
          <ExternalLink className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <span><strong className="font-semibold">nota editorial:</strong> {comparison.observacaoEditorial}</span>
        </div>
      )}

      <button onClick={onBack} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-ceci-brand-strong py-3 cursor-pointer hover:text-ceci-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> voltar às comparações
      </button>
    </div>
  );
};

