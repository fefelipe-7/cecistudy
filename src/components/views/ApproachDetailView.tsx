import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  UserCheck,
  AlertCircle,
  HeartHandshake,
  Lightbulb,
  User,
  BrainCircuit,
  Wrench,
  Landmark,
  Compass,
  CheckCircle2,
  GitCompare,
  TrendingUp,
  Layers,
  Eye,
  X,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { PsicoterapiaFieldKey } from '../../types';

interface SectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, children }) => (
  <div className="space-y-2">
    <h2 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
      <Icon className="w-4 h-4 text-ceci-brand-strong" />
      <span>{title}</span>
    </h2>
    <p className="text-ceci-secondary leading-relaxed whitespace-pre-line">{children}</p>
  </div>
);

interface BlockLabelProps {
  index: number;
  title: string;
  hint: string;
}

const BlockLabel: React.FC<BlockLabelProps> = ({ index, title, hint }) => (
  <div className="flex items-center gap-2.5">
    <span className="w-8 h-8 rounded-xl bg-ceci-primary text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
      {index}
    </span>
    <div className="min-w-0">
      <h2 className="font-display font-bold text-base text-ceci-primary leading-tight">{title}</h2>
      <p className="text-[11px] text-ceci-tertiary leading-tight">{hint}</p>
    </div>
  </div>
);

export const ApproachDetailView: React.FC<{ approachId: string }> = ({ approachId }) => {
  const { approaches, openApproach } = useApp();
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  const approach = approaches.find((a) => a.id === approachId);

  if (!approach) {
    return (
      <div className="max-w-md sm:max-w-xl mx-auto px-1 py-10 text-center text-sm text-ceci-secondary">
        não achei essa abordagem por aqui ♡
      </div>
    );
  }

  const d = approach.detail ?? {};

  // Bloco 1 — visão geral
  const overview = [
    { title: 'o que é?', key: 'definicao' as PsicoterapiaFieldKey, icon: BookOpen, lead: true },
    { title: 'como entende a pessoa?', key: 'visao_ser_humano' as PsicoterapiaFieldKey, icon: UserCheck },
    { title: 'como entende o sofrimento?', key: 'visao_sofrimento' as PsicoterapiaFieldKey, icon: AlertCircle },
    { title: 'como entende a psique?', key: 'visao_psique' as PsicoterapiaFieldKey, icon: BrainCircuit },
    { title: 'como vê o desenvolvimento?', key: 'visao_desenvolvimento' as PsicoterapiaFieldKey, icon: TrendingUp },
  ].filter((s) => d[s.key]);

  // Bloco 2 — na prática
  const practice = [
    { title: 'como acontece a mudança?', key: 'teoria_da_mudanca' as PsicoterapiaFieldKey, icon: Sparkles },
    { title: 'como se apresenta na prática?', key: 'apresentacao_pratica' as PsicoterapiaFieldKey, icon: Layers },
    { title: 'o que o terapeuta observa?', key: 'papel_terapeuta' as PsicoterapiaFieldKey, icon: Eye },
    { title: 'papel da pessoa na terapia', key: 'papel_paciente' as PsicoterapiaFieldKey, icon: User },
    { title: 'a relação terapêutica', key: 'relacao_terapeutica' as PsicoterapiaFieldKey, icon: HeartHandshake },
    { title: 'foco clínico', key: 'foco_clinico' as PsicoterapiaFieldKey, icon: Compass },
  ].filter((s) => d[s.key]);

  // Bloco 4 — visão acadêmica
  const academic = [
    { title: 'posição histórica', key: 'contexto_historico' as PsicoterapiaFieldKey, icon: Landmark },
    { title: 'estado atual', key: 'perspectiva_academica' as PsicoterapiaFieldKey, icon: Compass },
    { title: 'evidências', key: 'evidencias' as PsicoterapiaFieldKey, icon: CheckCircle2 },
    { title: 'debates', key: 'debates' as PsicoterapiaFieldKey, icon: GitCompare },
    { title: 'limitações', key: 'criticas_limitacoes' as PsicoterapiaFieldKey, icon: AlertCircle },
  ].filter((s) => d[s.key]);

  // Bloco 5 — aprofundamento
  const relatedIds = approach.relationsWithOtherApproaches?.similar ?? [];
  const related = relatedIds
    .map((rid) => approaches.find((a) => a.id === rid))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const hasReading = Boolean(d.leituras_fundamentais);
  const hasRelated = related.length > 0;

  // Bloco 3 — conhecimento (só o que tiver dados)
  const authors = approach.foundingAuthors ?? [];
  const hasAuthors = authors.length > 0;

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-8 pb-1 relative animate-in fade-in duration-300">
      {/* Intro */}
      <div className="space-y-3 px-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ceci-primary leading-tight">
          {approach.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className="px-2.5 py-1 rounded-full border text-ceci-primary inline-flex items-center gap-1.5"
            style={{ backgroundColor: `${approach.color}33`, borderColor: approach.color }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: approach.color }} />
            {approach.family ?? 'abordagem'}
          </span>
          {approach.historicalPeriod && (
            <span className="bg-surface-blue text-ceci-academic-strong px-2.5 py-1 rounded-full">
              {approach.historicalPeriod}
            </span>
          )}
        </div>
        {d.descricao_curta && (
          <p className="text-sm text-ceci-secondary leading-relaxed">{d.descricao_curta}</p>
        )}
        {approach.summary && !d.descricao_curta && (
          <p className="text-sm text-ceci-secondary leading-relaxed">{approach.summary}</p>
        )}
      </div>

      {/* Bloco 1 — visão geral */}
      {overview.length > 0 && (
        <section className="space-y-5 px-1">
          <BlockLabel index={1} title="visão geral" hint="o ponto de partida para entender a abordagem" />
          <div className="space-y-5">
            {d.ideia_central && (
              <div className="bg-surface-rose/40 border-l-4 border-ceci-border-brand pl-4 py-3">
                <h3 className="font-display font-bold text-sm text-ceci-brand-strong mb-1.5">ideia central</h3>
                <p className="text-ceci-secondary leading-relaxed whitespace-pre-line">{d.ideia_central}</p>
              </div>
            )}
            {overview.map((s) => (
              <Section key={s.key} icon={s.icon} title={s.title}>
                {d[s.key]}
              </Section>
            ))}
          </div>
        </section>
      )}

      {/* Bloco 2 — na prática */}
      {practice.length > 0 && (
        <section className="space-y-5 px-1">
          <BlockLabel index={2} title="na prática" hint="como isso se traduz no trabalho clínico" />
          <div className="space-y-5">
            {practice.map((s) => (
              <Section key={s.key} icon={s.icon} title={s.title}>
                {d[s.key]}
              </Section>
            ))}
          </div>
        </section>
      )}

      {/* Bloco 3 — conhecimento */}
      {hasAuthors && (
        <section className="space-y-5 px-1">
          <BlockLabel index={3} title="conhecimento" hint="quem criou e o que sustenta esta visão" />
          <div className="space-y-3">
            <h2 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-ceci-brand-strong" />
              <span>autores e referências</span>
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {authors.map((author) => (
                <button
                  key={author}
                  onClick={() => setSelectedAuthor(author)}
                  className="text-left bg-white rounded-2xl p-3 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs tap-interactive active:scale-[0.98] cursor-pointer group flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-ceci-primary pr-1">{author}</span>
                  <ChevronRight className="w-4 h-4 text-ceci-tertiary shrink-0 group-hover:text-ceci-brand-strong" />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ceci-tertiary">
              conceitos e técnicas desta abordagem chegam em breve ♡
            </p>
          </div>
        </section>
      )}

      {/* Bloco 4 — visão acadêmica */}
      {academic.length > 0 && (
        <section className="space-y-5 px-1">
          <BlockLabel index={4} title="visão acadêmica" hint="como a pesquisa e a universidade enxergam" />
          <div className="space-y-5">
            {academic.map((s) => (
              <Section key={s.key} icon={s.icon} title={s.title}>
                {d[s.key]}
              </Section>
            ))}
          </div>
        </section>
      )}

      {/* Bloco 5 — aprofundamento */}
      {(hasReading || hasRelated) && (
        <section className="space-y-5 px-1">
          <BlockLabel index={5} title="aprofundamento" hint="por onde continuar e com quem conversar" />
          <div className="space-y-5">
            {d.leituras_fundamentais && (
              <div className="space-y-2">
                <h2 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-ceci-academic-strong" />
                  <span>leituras fundamentais</span>
                </h2>
                <p className="text-ceci-secondary leading-relaxed whitespace-pre-line">{d.leituras_fundamentais}</p>
              </div>
            )}
            {hasRelated && (
              <div className="space-y-2.5">
                <h2 className="font-display font-bold text-sm text-ceci-primary flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-ceci-academic-strong" />
                  <span>conversando com outras abordagens</span>
                </h2>
                <div className="space-y-2.5">
                  {related.map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => openApproach(rel.id)}
                      className="w-full text-left bg-white rounded-2xl p-3.5 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs tap-interactive active:scale-[0.98] cursor-pointer group flex items-center justify-between"
                    >
                      <span className="text-sm font-semibold text-ceci-primary pr-1">{rel.name}</span>
                      <ChevronRight className="w-4 h-4 text-ceci-tertiary shrink-0 group-hover:text-ceci-brand-strong" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Rodapé acolhedor */}
      <div className="px-1 pt-2 pb-4 text-center">
        <p className="text-xs text-ceci-tertiary">
          tudo aqui nasce do que você anota: revisão, leitura e foco sempre conectados ♡
        </p>
      </div>

      {/* Modal de autor — contexto de origem da abordagem */}
      <Modal
        open={Boolean(selectedAuthor)}
        onClose={() => setSelectedAuthor(null)}
        className="w-full max-w-md bg-white rounded-[24px] p-5 space-y-3 shadow-floating"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-ceci-primary">{selectedAuthor}</h2>
          <button
            onClick={() => setSelectedAuthor(null)}
            className="w-9 h-9 rounded-2xl border border-ceci-border-default flex items-center justify-center text-ceci-tertiary hover:text-ceci-primary tap-interactive cursor-pointer"
            aria-label="fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-ceci-secondary leading-relaxed">
          {d.origem || 'referência fundamental para a construção desta abordagem.'}
        </p>
      </Modal>
    </div>
  );
};
