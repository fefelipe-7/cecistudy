import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { FieldHint, FieldLabel, ReviewCard } from './wizardFields';
import { useActiveTerm, sortedTerms, degreeProgress, semestersLeft } from '../../lib/termScope';
import {
  planTermRollover,
  type TermCourseDecision,
  type PendingCarry,
} from '../../lib/termRollover';
import { makeId } from '../../core/domain';

const DECISIONS: Array<{ value: TermCourseDecision; label: string; hint: string }> = [
  { value: 'continuar', label: 'continua', hint: 'viaja pro próximo semestre' },
  { value: 'arquivar', label: 'arquiva', hint: 'sai da grade, some do plano — some do histórico' },
  { value: 'depois', label: 'depois', hint: 'deixa pra decidir na hora da virada' },
];

/**
 * Virada de semestre (SPEC-005).
 *
 * Quatro passos, do mais leve ao mais definitivo:
 * 1. **onde você está** — resumo do semestre que está acabando (read-only),
 *    com o histórico de períodos logo abaixo;
 * 2. **o que continua** — uma decisão por disciplina (continuar/arquivar/depois);
 * 3. **o que fica pra trás** — tarefas/leituras/flashcards pendentes: adiar ou
 *    deixar como estão;
 * 4. **revisão** — o diff em linguagem natural, com desfazer disponível.
 *
 * Nada é apagado (§D5 da spec): arquivar sai da grade mas continua pesquisável,
 * e a virada grava por registro para poder ser desfeita.
 */
export const SemesterWizard: React.FC = () => {
  const {
    academicTerms,
    courses,
    tasks,
    readings,
    flashcards,
    sessions,
    classes,
    exams,
    streakStats,
    profile,
    closeWizard,
    showToast,
    applyTermRollover,
    openTermHistory,
  } = useMobileApp();

  const activeTerm = useActiveTerm(academicTerms);
  const history = sortedTerms(academicTerms).filter((t) => t.status === 'encerrado');

  const { values, patch, step, setStep } = useWizardForm<{
    ordinal: number;
    label: string;
    decisions: Record<string, TermCourseDecision>;
    carryTasks: boolean;
    carryReadings: boolean;
    carryCards: boolean;
  }>({
    initial: {
      ordinal: (activeTerm?.ordinal ?? profile.semester ?? 1) + 1,
      label: '',
      decisions: {},
      carryTasks: true,
      carryReadings: true,
      carryCards: true,
    },
  });

  /** Decisão por disciplina: 'depois' vira 'continuar' só na virada (padrão seguro). */
  const decisionOf = (courseId: string): TermCourseDecision => values.decisions[courseId] ?? 'depois';

  // Id do novo período: fixo por montagem do wizard (se regerasse a cada render,
  // o "desfazer" não encontraria o período para remover).
  const nextTermId = useMemo(() => makeId('trm'), []);

  const inTerm = useMemo(
    () => courses.filter((c) => c.termId === activeTerm?.id && (c.status ?? 'ativo') === 'ativo'),
    [courses, activeTerm]
  );

  const carried = inTerm.filter((c) => decisionOf(c.id) === 'continuar');
  const archived = inTerm.filter((c) => decisionOf(c.id) === 'arquivar');
  const undecided = inTerm.filter((c) => decisionOf(c.id) === 'depois');

  /** Ids que viajam pro período novo: `continuar` + as indecisas (viram `continuar`
   *  no momento de gravar). Disciplina arquivada leva as pendências junto. */
  const travelling = new Set([...carried, ...undecided].map((c) => c.id));

  /**
   * Pendências **do semestre que está fechando** — não do banco inteiro: uma
   * tarefa de uma disciplina de outro período não é responsabilidade desta
   * virada, e uma tarefa sem disciplina (pessoal) sempre viaja junto.
   */
  const openTasks = tasks.filter(
    (t) => !t.completed && (!t.disciplineId || travelling.has(t.disciplineId)),
  );
  const openReadings = readings.filter(
    (r) => r.status !== 'concluido' && (!r.courseId || travelling.has(r.courseId)),
  );
  const openCards = flashcards.filter((f) => !f.courseId || travelling.has(f.courseId));

  const carryOf = (on: boolean): PendingCarry => (on ? 'adiar' : 'deixar');

  const canNext =
    step === 0
      ? Boolean(activeTerm)
      : step === 1
        ? undecided.length === 0
        : true;

  const blockedReason =
    step === 0
      ? 'seu semestre ativo ainda não foi aberto — dá pra olhar o histórico'
      : step === 1 && undecided.length > 0
        ? `faltam ${undecided.length} disciplina${undecided.length === 1 ? '' : 's'} pra decidir`
        : '';

  const handleSave = () => {
    if (!activeTerm) return;
    // 'depois' vira 'continuar' no momento de gravar: ninguém perde matéria por
    // pular a decisão, e dá pra arquivar depois.
    const decisions: Record<string, TermCourseDecision> = {};
    for (const c of inTerm) {
      const d = values.decisions[c.id];
      decisions[c.id] = !d || d === 'depois' ? 'continuar' : d;
    }
    const finalPlan = planTermRollover({
      terms: academicTerms,
      courses: courses.map((c) => ({ id: c.id, termId: c.termId, status: c.status ?? 'ativo' })),
      decisions,
      newTermId: nextTermId,
      nextOrdinal: values.ordinal,
      nextLabel: values.label.trim() || `${values.ordinal}º semestre`,
      // `closedAt` é a data (YYYY-MM-DD) que vai no resumo congelado; `now` é o
      // carimbo ISO das transições.
      closedAt: new Date().toISOString().slice(0, 10),
      now: new Date().toISOString(),
      // Passo 3 entra no diff: sem isto, marcar "adiar" não mudava nada.
      pendingDecisions: {
        tasks: openTasks.map((t) => ({
          id: t.id,
          disciplineId: t.disciplineId,
          completed: t.completed,
          carry: carryOf(values.carryTasks),
        })),
        readings: openReadings.map((r) => ({
          id: r.id,
          courseId: r.courseId,
          status: r.status,
          carry: carryOf(values.carryReadings),
        })),
        cards: openCards.map((f) => ({
          id: f.id,
          courseId: f.courseId,
          carry: carryOf(values.carryCards),
        })),
      },
      summaryInput: {
        courses: courses.map((c) => ({
          id: c.id,
          name: c.name,
          termId: c.termId,
          status: c.status ?? 'ativo',
          attendance: c.attendance,
        })),
        classNotes: classes,
        tasks,
        exams,
        readings,
        sessions,
        // Agregado entra pela porta: `computeStreak` mora em `src/lib` e um
        // pacote não pode depender do app (boundary check).
        bestStreak: streakStats.longest,
      },
    });
    applyTermRollover(finalPlan);
    showToast(`prontinho, ${values.ordinal}º semestre aberto ♡`);
    closeWizard();
  };

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'sem-1',
      title: 'onde você está',
      headline: activeTerm ? `seu ${activeTerm.label} tá pra acabar` : 'seu semestre ainda não foi aberto',
      subtitle: activeTerm
        ? 'olha como foi antes de virar a página — nada some, tudo fica no histórico.'
        : 'dá uma olhada no que você já construiu até aqui.',
      content: (
        <div className="space-y-4">
          {activeTerm ? (
            <ReviewCard
              rows={[
                { label: 'período', value: `${activeTerm.label} (${activeTerm.ordinal}º)` },
                { label: 'disciplinas', value: `${inTerm.length} ativas` },
                { label: 'progresso', value: `${degreeProgress(activeTerm.ordinal, profile.totalSemesters)}% do curso` },
                { label: 'falta', value: `${semestersLeft(activeTerm.ordinal, profile.totalSemesters)} semestre(s)` },
              ]}
            />
          ) : (
            <p className="text-sm text-ceci-secondary">
              nenhum período ativo no momento. você pode abrir o primeiro pelo histórico abaixo.
            </p>
          )}
          {history.length > 0 && (
            <div className="rounded-2xl bg-surface-muted border border-ceci-border-subtle px-4 py-3 space-y-2">
              <FieldLabel>seus períodos anteriores</FieldLabel>
              <ul className="space-y-1 text-xs text-ceci-secondary">
                {history.map((t) => (
                  <li key={t.id}>
                    {t.label}
                    {t.summary ? ` · ${t.summary.courses} disciplinas · ${t.summary.focusMinutes}min de foco` : ''}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => openTermHistory()}
                className="w-full rounded-full border border-ceci-border-default bg-white py-2 text-xs font-semibold text-ceci-brand-strong hover:bg-surface-rose"
              >
                ver o histórico completo
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'sem-2',
      title: 'o que continua',
      headline: 'qual matéria viaja pro próximo semestre?',
      subtitle: 'o que você continuar mantém o mesmo id — tudo que você anotou fica junto.',
      content: (
        <div className="space-y-3">
          {inTerm.map((c) => (
            <div key={c.id} className="rounded-2xl border border-ceci-border-default bg-white p-3">
              <p className="text-sm font-semibold text-ceci-primary">{c.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DECISIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => patch({ decisions: { ...values.decisions, [c.id]: d.value } })}
                    aria-pressed={decisionOf(c.id) === d.value}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      decisionOf(c.id) === d.value
                        ? 'bg-ceci-primary text-white'
                        : 'bg-surface-muted text-ceci-secondary border border-ceci-border-default'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <FieldHint>
                {DECISIONS.find((d) => d.value === decisionOf(c.id))?.hint}
              </FieldHint>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'sem-3',
      title: 'o que fica pra trás',
      headline: 'as pendências ficam esperando?',
      subtitle: 'posso adiar as pendências pro próximo período, ou deixá-las aqui virarem histórico.',
      content: (
        <div className="space-y-3">
          {[
            { key: 'carryTasks' as const, label: 'adiar tarefas', count: openTasks.length, unit: 'pendente' },
            { key: 'carryReadings' as const, label: 'adiar leituras', count: openReadings.length, unit: 'em aberto' },
            { key: 'carryCards' as const, label: 'adiar flashcards', count: openCards.length, unit: 'no baralho' },
          ].map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={() => patch({ [row.key]: !values[row.key] })}
              aria-pressed={values[row.key]}
              className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                values[row.key] ? 'border-ceci-border-brand bg-surface-rose' : 'border-ceci-border-default bg-white'
              }`}
            >
              <span className="text-sm font-semibold text-ceci-primary">{row.label}</span>
              <span className="text-xs text-ceci-secondary">
                {row.count} {row.unit}
                {row.count === 1 ? '' : 's'}
              </span>
            </button>
          ))}
          <FieldHint>o que não for adiado fica no semestre que acabou, como histórico.</FieldHint>
        </div>
      ),
    },
    {
      id: 'sem-4',
      title: 'revisão',
      headline: `prontinho, ${values.ordinal}º semestre?`,
      subtitle: 'confere antes de gravar — dá pra desfazer logo depois.',
      content: (
        <div className="space-y-4">
          <ReviewCard
            rows={[
              { label: 'vai abrir', value: values.label.trim() || `${values.ordinal}º semestre` },
              { label: 'continuam', value: `${carried.length + undecided.length} disciplina(s)` },
              { label: 'saem da grade', value: archived.length > 0 ? `${archived.length} arquivada(s)` : 'nenhuma' },
              {
                label: 'tarefas adiadas',
                value: values.carryTasks ? `${openTasks.length}` : 'ficam como histórico',
              },
              {
                label: 'leituras adiadas',
                value: values.carryReadings ? `${openReadings.length}` : 'ficam como histórico',
              },
              {
                label: 'flashcards adiados',
                value: values.carryCards ? `${openCards.length}` : 'ficam como histórico',
              },
              { label: 'o que fica', value: 'tudo guardado no histórico do semestre' },
            ]}
          />
          <FieldHint>
            nada é apagado: o que você não adiar continua guardando no semestre que fechou, e dá pra
            desfazer a virada inteira.
          </FieldHint>
        </div>
      ),
    },
  ], [activeTerm, archived.length, carried.length, history, inTerm, openCards.length, openReadings.length, openTasks.length, openTermHistory, undecided.length, values]);

  return (
    <WizardScaffold
      title="virar o semestre"
      subtitle="um capítulo novo, com o anterior inteiro guardado"
      icon={<Sparkles className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      blockedReason={blockedReason}
      onSave={handleSave}
      onClose={closeWizard}
    />
  );
};
