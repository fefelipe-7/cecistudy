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
import { clampTermOrdinal, makeId, MAX_TERM_ORDINAL } from '../../core/domain';

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
    undoLastRollover,
    openTermHistory,
    openFirstTerm,
  } = useMobileApp();

  const activeTerm = useActiveTerm(academicTerms);
  const history = sortedTerms(academicTerms).filter((t) => t.status === 'encerrado');

  /**
   * Sem período ativo o wizard **não é uma virada** — é a abertura do primeiro
   * período (SPEC-008 F4.2). Os passos 1–3 (o que continua, o que fica pra trás)
   * não têm o que decidir, então a tela inteira colapsa para um passo só.
   */
  const isFirstTerm = !activeTerm;

  /**
   * O `ordinal` que o wizard abre com edição. Sem período ativo é o **1º** (é
   * literalmente o primeiro); com período aberto é o próximo número.
   *
   * O rascunho persiste (`draftKey: 'semester'`): uma virada tem 4 passos e
   * decisões caras (uma por disciplina). Sair no meio e voltar para achá-la
   * zerada é o tipo de coisa que faz a usuária desistir. `clearDraft` roda no
   * save, então um rascunho nunca sobrevive a uma virada gravada.
   *
   * `defaultOrdinal` é a referência do `isDirty` — se os dois divergirem, o
   * wizard abre sujo e o "descartar?" aparece sem a usuária ter mexido em nada.
   */
  const defaultOrdinal = activeTerm ? activeTerm.ordinal + 1 : 1;
  const { values, patch, step, setStep, clearDraft, isDirty } = useWizardForm<{
    ordinal: number;
    label: string;
    decisions: Record<string, TermCourseDecision>;
    carryTasks: boolean;
    carryReadings: boolean;
    carryCards: boolean;
  }>({
    draftKey: 'semester',
    isDirty: (v) =>
      v.ordinal !== defaultOrdinal ||
      v.label.trim() !== '' ||
      Object.keys(v.decisions).length > 0,
    initial: {
      ordinal: clampTermOrdinal(defaultOrdinal),
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
  /**
   * Flashcards **não revisados neste semestre** (SPEC-008 F4.6).
   *
   * Antes entrava o baralho inteiro — `flashcards` não tem filtro de status, só
   * escopo — então uma matéria de três anos atrás, já respondida vezes, continuava
   * aparecendo como "N flashcards no baralho" para adiar. `lastReviewed` é o
   * único jeito de saber o que é velho; sem ele, conta como pendente.
   */
  const termStartedAt = activeTerm?.startedAt;
  const openCards = flashcards.filter((f) => {
    if (f.courseId && !travelling.has(f.courseId)) return false;
    if (!termStartedAt) return true;
    const last = f.lastReviewed?.slice(0, 10);
    return !last || last < termStartedAt;
  });

  /**
   * Recado do clamp, anunciado por `role="status"` (SPEC-008 F4.4): digitar `20`
   * não pode falhar em silêncio nem com um número que ela não escolheu. O texto
   * some quando o próximo digito já está dentro da faixa.
   */
  const [clampNote, setClampNote] = useState('');

  const setOrdinal = (raw: number) => {
    const requested = Math.trunc(Number(raw));
    const next = clampTermOrdinal(Number.isFinite(requested) ? requested : 1);
    setClampNote(
      Number.isFinite(requested) && requested !== next
        ? `deixei em ${next}º — o semestre vai de 1 a ${MAX_TERM_ORDINAL}`
        : '',
    );
    patch({ ordinal: next });
  };

  /** Rótulo do período que vai ser criado (o wizard não depende do usuário lembrar). */
  const nextLabel = values.label.trim() || `${values.ordinal}º semestre`;

  const carryOf = (on: boolean): PendingCarry => (on ? 'adiar' : 'deixar');

  const canNext = isFirstTerm
    ? true // a abertura do 1º período não tem o que validar: um passo só
    : step === 0
      ? true // o ordinal do próximo é editável e já vem clampado
      : step === 1
        ? undecided.length === 0
        : true;

  const blockedReason = !isFirstTerm && step === 1 && undecided.length > 0
    ? `faltam ${undecided.length} disciplina${undecided.length === 1 ? '' : 's'} pra decidir`
    : '';

  /** Abrir o 1º período não é virada: grava e fecha, sem desfazer. */
  const handleOpenFirstTerm = () => {
    openFirstTerm(values.ordinal);
    clearDraft();
    showToast(`${nextLabel} aberto ♡`);
    closeWizard();
  };

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
      nextLabel,
      // `totalSemesters` **não** é passado (SPEC-008 D3). Ele já foi o teto do
      // `nextOrdinal` (SPEC-006 D8), e a remoção é deliberada: com o total
      // errado, a usuária digita 9, este passo promete "9º semestre" e a
      // gravação guardava 8 — sem nenhum rastro de onde o 8 veio. O limite é o
      // teto global, e o número acima do curso vira aviso no passo 1, que tem
      // link para corrigir o total.
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
    // O rascunho é de uma virada **não gravada**: depois de gravar ele só faria
    // a próxima abertura do wizard vir suja, com as decisões do semestre passado.
    clearDraft();
    // SPEC-006 D8: a virada oferece desfazer por 8s. O toast é o lugar da
    // decisão — Some em silêncio quando some (2600ms) seria perfeito para
    // "guardado ♡" e revocável demais para fechar um semestre.
    showToast(`semestre virado ♡ ${values.ordinal}º aberto`, {
      action: { label: 'desfazer', onClick: undoLastRollover },
    });
    closeWizard();
  };

  /**
   * Campo do `ordinal`, compartilhado pelos dois caminhos (virada e 1º período).
   *
   * `max` é o teto **global** (`MAX_TERM_ORDINAL`), nunca `totalSemesters`:
   * quem está no 9º de um curso de 8 precisa conseguir escrever 9 — o total se
   * corrige no cartão do Perfil, e avisar é melhor do que travar (SPEC-008 D3).
   */
  const ordinalField = (
    <div className="rounded-2xl bg-surface-muted border border-ceci-border-subtle px-4 py-3 space-y-2">
      <FieldLabel>qual semestre entra?</FieldLabel>
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_TERM_ORDINAL}
          value={values.ordinal}
          onChange={(e) => setOrdinal(Number(e.target.value))}
          aria-label="número do próximo semestre"
          aria-describedby="semester-ordinal-hint"
          className="w-24 rounded-xl border border-ceci-border-default bg-white px-3 py-2 text-lg font-display font-bold text-ceci-primary"
        />
        <span className="text-sm text-ceci-secondary">
          {values.ordinal > profile.totalSemesters ? (
            <span className="text-ceci-brand-strong">
              além dos {profile.totalSemesters} do curso — dá pra ajustar o total no cartão do perfil ♡
            </span>
          ) : (
            <>{`vai abrir ${nextLabel}`}</>
          )}
        </span>
      </div>
      <p id="semester-ordinal-hint" role="status" className="min-h-[1rem] text-[11px] text-ceci-tertiary">
        {clampNote}
      </p>
    </div>
  );

  const steps: WizardStep[] = useMemo(() => {
    // Sem período ativo: um passo só, com a abertura do 1º (F4.2).
    if (isFirstTerm) {
      return [
        {
          id: 'sem-first',
          title: 'abrir meu 1º semestre',
          headline: 'começamos pelo começo ♡',
          subtitle: 'o app abre o seu primeiro período letivo — nada mais precisa ser decidido aqui.',
          content: (
            <div className="space-y-4">
              {ordinalField}
              <p className="text-sm text-ceci-secondary">
                seus períodos anteriores, se existirem:
              </p>
              {history.length > 0 ? (
                <ul className="space-y-1 text-xs text-ceci-secondary">
                  {history.map((t) => (
                    <li key={t.id}>
                      {t.label}
                      {t.summary ? ` · ${t.summary.courses} disciplinas · ${t.summary.focusMinutes}min de foco` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ceci-tertiary">nenhum período guardado ainda — esse é o primeiro.</p>
              )}
            </div>
          ),
        },
      ];
    }
    return [
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
          ) : null}
          {ordinalField}
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
              {/*
                `radiogroup` + `radio` (SPEC-008 F4.7): as três opções são
                mutuamente exclusivas e **uma** é a resposta. Com `aria-pressed` em
                botões soltos, o leitor de tela anuncia três "botões alternados
                pressionados: 1 de 3" e não diz que é uma escolha única. O
                `tabIndex` só na selecionada é o roving tabindex do padrão — Tab
                entra no grupo uma vez, as setas circulam dentro.
              */}
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={`decisão para ${c.name}`}>
                {DECISIONS.map((d, i) => {
                  const selected = decisionOf(c.id) === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => patch({ decisions: { ...values.decisions, [c.id]: d.value } })}
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                        e.preventDefault();
                        const delta = e.key === 'ArrowRight' ? 1 : DECISIONS.length - 1;
                        const nextDecision = DECISIONS[(i + delta) % DECISIONS.length];
                        patch({ decisions: { ...values.decisions, [c.id]: nextDecision.value } });
                        // o foco segue a seleção: sem isso, o teclado para no botão
                        // que saiu do grupo.
                        e.currentTarget.parentElement
                          ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                          ?.item((i + delta) % DECISIONS.length)
                          ?.focus();
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-ceci-primary text-white'
                          : 'bg-surface-muted text-ceci-secondary border border-ceci-border-default'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
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
              {/* `role="status"`: a contagem é o conteúdo do botão e muda quando a
                  pendência é adiada ou não — o leitor precisa ouvir o número junto
                  com o rótulo, não como um número solto (SPEC-008 F4.7). */}
              <span role="status" className="text-xs text-ceci-secondary">
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
  ];
  }, [activeTerm, archived.length, carried.length, clampNote, history, inTerm, isFirstTerm, nextLabel, openCards.length, openReadings.length, openTasks.length, openTermHistory, ordinalField, profile.totalSemesters, undecided.length, values]);

  return (
    <WizardScaffold
      title={isFirstTerm ? 'abrir meu 1º semestre' : 'virar o semestre'}
      subtitle={isFirstTerm ? 'o começo da linha do tempo' : 'um capítulo novo, com o anterior inteiro guardado'}
      icon={<Sparkles className="w-3.5 h-3.5" />}
      iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      blockedReason={blockedReason}
      saveLabel={isFirstTerm ? 'abrir meu 1º semestre ♡' : 'virar o semestre ♡'}
      onSave={isFirstTerm ? handleOpenFirstTerm : handleSave}
      onClose={closeWizard}
      isDirty={isDirty}
    />
  );
};
