import React, { useMemo, useState } from 'react';
import { Bell, GraduationCap, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { StatusChip, type StatusTone } from '../ui/StatusChip';
import { ToggleRow } from '../ui/ToggleRow';
import { emptyThesisReminderPrefs, type ThesisChapter, type ThesisProject } from '../../types';
import { useMobileApp } from '../../context/mobileApp';
import { useWizardForm } from '../../lib/useWizardForm';
import { formatDateBR } from '../../lib/dateBR';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { DeadlineField, Field, FieldHint, FieldLabel, NumberInput, ReviewCard, TextArea, TextInput } from './wizardFields';

/**
 * Wizard de dados do TCC (SPEC-012).
 *
 * Substitui o antigo `EditTccModal` (um bottom-sheet gigante — F11) por um
 * registro em passos, no mesmo esqueleto dos outros wizards. O TCC é um
 * singleton (`D1`): aqui não há "criar" × "editar", é sempre a ficha do
 * trabalho. Foco: D4 (concluir com capítulo pendente pede confirmação) e
 * F3.6 (prazos e metas começam vazias = não informado, INV-T7).
 */

interface TccFormValues {
  title: string;
  advisor: string;
  field: string;
  problemStatement: string;
  objectives: string[];
  status: ThesisProject['status'];
  deliveryDate: string;
  defenseDate: string;
  wordGoalTotal: string;
  weeklyWordGoal: string;
  remindersEnabled: boolean;
}

const STATUS_OPTIONS: { value: ThesisProject['status']; label: string; emoji: string; caption: string }[] = [
  { value: 'em_andamento', label: 'em andamento', emoji: '✍️', caption: 'a escrita está rolando' },
  { value: 'revisao', label: 'em revisão', emoji: '🔍', caption: 'revisando com a orientadora' },
  { value: 'concluido', label: 'concluído', emoji: '🎓', caption: 'entregue e defendendo' },
];

const STATUS_TONE: Record<ThesisProject['status'], StatusTone> = {
  em_andamento: 'info',
  revisao: 'warning',
  concluido: 'success',
};

const STATUS_LABEL: Record<ThesisProject['status'], string> = {
  em_andamento: 'em andamento',
  revisao: 'em revisão',
  concluido: 'concluído',
};

/** Meta de palavras: inteiro ≥ 0 ou `undefined` (vazio = não informado, ≠ 0). */
const parseGoal = (raw: string): number | undefined => {
  const n = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(n) || n < 0) return undefined;
  return n;
};

const seedFromTcc = (tcc: ThesisProject): TccFormValues => ({
  title: tcc.title,
  advisor: tcc.advisor,
  field: tcc.field,
  problemStatement: tcc.problemStatement,
  objectives: tcc.objectives.length ? tcc.objectives : [''],
  status: tcc.status,
  deliveryDate: tcc.deliveryDate ?? '',
  defenseDate: tcc.defenseDate ?? '',
  wordGoalTotal: tcc.wordGoalTotal != null ? String(tcc.wordGoalTotal) : '',
  weeklyWordGoal: tcc.weeklyWordGoal != null ? String(tcc.weeklyWordGoal) : '',
  remindersEnabled: tcc.reminderPrefs?.enabled ?? false,
});

/**
 * Uma expressão por passo: a mesma mascote nas quatro telas diz que o wizard
 * não olha para onde você está. O índice acompanha `steps`.
 */
const STEP_MASCOTES = ['field-prepare', 'research-tcc', 'writing-flow', 'review-card'] as const;

export const TccWizard: React.FC = () => {
  const { tcc, thesisChapters, handleUpdateTcc, closeWizard, showToast } = useMobileApp();
  const [confirmingConclusion, setConfirmingConclusion] = useState(false);

  const { values, patch, step, setStep } = useWizardForm<TccFormValues>({
    // Singleton (D1): sem draftKey — "cancelar" descarta tudo, como a sheet antiga.
    initial: seedFromTcc(tcc),
  });

  // D4: conta **viva** da coleção — o capítulo tem sheet própria desde a F4.
  const pendingChapters = thesisChapters.filter((ch: ThesisChapter) => ch.stage !== 'pronto').length;

  const canNext = step !== 0 || values.title.trim().length > 0;

  const updateObjective = (index: number, value: string) =>
    patch({ objectives: values.objectives.map((o, i) => (i === index ? value : o)) });

  /**
   * Eco das metas: os dois números viram um plano legível. "6000 palavras" é
   * abstração; "≈ 12 semanas no seu ritmo" é a informação que ela esconde. E
   * cada meta traz o que dá pra tirar dela — o total sozinho não diz o quanto
   * por semana, e a semanal sozinha não diz em quanto tempo você entrega.
   */
  const totalGoal = parseGoal(values.wordGoalTotal);
  const weeklyGoal = parseGoal(values.weeklyWordGoal);
  const weekEcho =
    totalGoal !== undefined && weeklyGoal && weeklyGoal > 0
      ? `≈ ${Math.round(totalGoal / weeklyGoal)} semanas no seu ritmo`
      : null;
  const totalEcho =
    totalGoal !== undefined && totalGoal > 0
      ? weeklyGoal && weeklyGoal > 0
        ? `≈ ${Math.round(totalGoal / weeklyGoal)} palavras por semana`
        : 'defina a meta semanal para ela virar plano'
      : null;

  const buildDraft = (): ThesisProject => ({
    ...tcc,
    title: values.title.trim(),
    advisor: values.advisor.trim(),
    field: values.field.trim(),
    problemStatement: values.problemStatement.trim(),
    status: values.status,
    objectives: values.objectives.map((o) => o.trim()).filter(Boolean),
    // Vazio = não informado: o campo some do objeto, não vira zero (INV-T7).
    deliveryDate: values.deliveryDate || undefined,
    defenseDate: values.defenseDate || undefined,
    wordGoalTotal: parseGoal(values.wordGoalTotal),
    weeklyWordGoal: parseGoal(values.weeklyWordGoal),
    // O interruptor viaja com as preferências (§6.4); o resto dos defaults
    // (dias de antecedência, horário) continua vindo do domínio.
    reminderPrefs: { ...(tcc.reminderPrefs ?? emptyThesisReminderPrefs()), enabled: values.remindersEnabled },
  });

  const doSave = () => {
    setConfirmingConclusion(false);
    handleUpdateTcc(buildDraft());
    // A ação se chama "guardar tcc ♡" no botão, então o aviso se chama igual —
    // é assim que a pessoa aprende o vocabulário do app.
    showToast('tcc guardado ♡');
    closeWizard();
  };

  const handleSave = () => {
    // D4: marcar concluído com capítulo pendente pede confirmação. Sem pendência,
    // salva direto — o caminho feliz não ganha fricção.
    if (values.status === 'concluido' && pendingChapters > 0) {
      setConfirmingConclusion(true);
      return;
    }
    doSave();
  };

  /**
   * Revisão: o que a pessoa escreveu acima, em **palavras dela** — a linha em
   * branco vira "ainda não definido" (e é clique para o passo que falta), não um
   * travessão. Um "—" não diz o que fazer; "ainda não definido" diz que dá para
   * deixar assim.
   */
  const notSet = 'ainda não definido';
  const reviewRows = useMemo(
    () => [
      { label: 'título', value: values.title.trim() || notSet },
      { label: 'orientador(a)', value: values.advisor.trim() || notSet },
      { label: 'área', value: values.field.trim() || notSet },
      { label: 'entrega final', value: values.deliveryDate ? formatDateBR(values.deliveryDate) : notSet },
      { label: 'banca', value: values.defenseDate ? formatDateBR(values.defenseDate) : notSet },
      {
        label: 'meta de palavras',
        value: [
          values.wordGoalTotal.trim() ? `${values.wordGoalTotal.trim()} no total` : null,
          values.weeklyWordGoal.trim() ? `${values.weeklyWordGoal.trim()}/semana` : null,
        ]
          .filter(Boolean)
          .join(' • ') || notSet,
      },
      { label: 'problema de pesquisa', value: values.problemStatement.trim() || notSet },
      {
        label: 'objetivos',
        value:
          values.objectives
            .map((o) => o.trim())
            .filter(Boolean)
            .join(' · ') || notSet,
      },
    ],
    [values],
  );

  /** O que ainda falta, em uma frase — e não como bloqueio. */
  const faltando = [
    values.deliveryDate.trim() ? null : 'entrega final',
    values.weeklyWordGoal.trim() || values.wordGoalTotal.trim() ? null : 'meta de palavras',
  ].filter(Boolean) as string[];

  const steps: WizardStep[] = [
    {
      id: 'identificacao',
      title: 'identificação',
      headline: 'qual é o tema do seu tcc?',
      subtitle: 'comece como dá — o resto a gente ajusta no caminho.',
      content: (
        <div className="space-y-5">
          <Field label="título do trabalho" htmlFor="tcc-titulo">
            <TextInput
              id="tcc-titulo"
              value={values.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="ex: a reestruturação cognitiva na ansiedade acadêmica"
              autoFocus
            />
            <FieldHint>o título é o começo — dá pra ajustar depois.</FieldHint>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="orientador(a)" htmlFor="tcc-orientador">
              <TextInput
                id="tcc-orientador"
                value={values.advisor}
                onChange={(e) => patch({ advisor: e.target.value })}
                placeholder="ex: profa. camilla"
              />
            </Field>
            <Field label="área" htmlFor="tcc-area">
              <TextInput
                id="tcc-area"
                value={values.field}
                onChange={(e) => patch({ field: e.target.value })}
                placeholder="ex: psicologia clínica"
              />
            </Field>
          </div>

          <ChoiceCardGrid
            label="situação"
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(v) => patch({ status: v })}
            columns={1}
          />
        </div>
      ),
    },
    {
      id: 'prazos-metas',
      title: 'prazos e metas',
      headline: 'quando você quer chegar lá?',
      subtitle: 'tudo opcional — datas e metas ajudam o tcc virar plano, não fantasia.',
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <DeadlineField
              id="tcc-entrega"
              label="entrega final"
              value={values.deliveryDate}
              onChange={(v) => patch({ deliveryDate: v })}
            />
            <DeadlineField
              id="tcc-banca"
              label="banca"
              value={values.defenseDate}
              onChange={(v) => patch({ defenseDate: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="meta total de palavras" htmlFor="tcc-meta-total">
              <NumberInput
                id="tcc-meta-total"
                min={0}
                step={1}
                value={values.wordGoalTotal}
                onChange={(e) => patch({ wordGoalTotal: e.target.value })}
                placeholder="opcional"
              />
              {totalEcho && <FieldHint>{totalEcho}</FieldHint>}
            </Field>
            <Field label="meta semanal" htmlFor="tcc-meta-semanal">
              <NumberInput
                id="tcc-meta-semanal"
                min={0}
                step={1}
                value={values.weeklyWordGoal}
                onChange={(e) => patch({ weeklyWordGoal: e.target.value })}
                placeholder="opcional"
              />
              {weekEcho && <FieldHint>{weekEcho}</FieldHint>}
            </Field>
          </div>

          {/* F4.6: o interruptor dos lembretes (§6.4). Desligado é o default —
              ligar pede permissão na hora de agendar (`ensureNotificationPermission`,
              o adaptador cuida; recusa não é erro). */}
          <ToggleRow
            label="lembretes de prazo"
            description="o app avisa de capítulos, reuniões, entrega e banca — no ritmo que você escolher depois"
            icon={<Bell className="w-4 h-4" />}
            iconClassName="bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong"
            checked={values.remindersEnabled}
            onChange={() => patch({ remindersEnabled: !values.remindersEnabled })}
            className="rounded-2xl border border-ceci-border-default bg-surface-default p-4"
          />
        </div>
      ),
    },
    {
      id: 'pergunta',
      title: 'a pergunta',
      headline: 'o que o seu tcc quer responder?',
      subtitle: 'um bom problema de pesquisa guia o texto inteiro.',
      content: (
        <div className="space-y-5">
          <Field label="problema de pesquisa" htmlFor="tcc-problema">
            <TextArea
              id="tcc-problema"
              rows={3}
              value={values.problemStatement}
              onChange={(e) => patch({ problemStatement: e.target.value })}
              placeholder="qual pergunta seu tcc quer responder?"
            />
            <FieldHint>
              um problema de pesquisa bom é o que guia cada capítulo — dá pra deixar
              em branco e voltar depois.
            </FieldHint>
          </Field>

          <div>
            <FieldLabel>objetivos</FieldLabel>
            <div className="space-y-2">
              {values.objectives.map((obj, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-2"
                >
                  <span className="w-6 h-6 shrink-0 rounded-full bg-surface-rose border border-ceci-border-brand text-[11px] font-semibold text-ceci-brand-strong flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <TextInput
                    value={obj}
                    onChange={(e) => updateObjective(idx, e.target.value)}
                    placeholder={`objetivo ${idx + 1}`}
                    aria-label={`objetivo ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => patch({ objectives: values.objectives.filter((_, i) => i !== idx) })}
                    className="w-9 h-9 rounded-xl border border-ceci-border-default text-ceci-tertiary hover:text-status-danger-strong hover:border-status-danger flex items-center justify-center shrink-0 cursor-pointer transition-colors focus-visible:opacity-100 opacity-60 md:opacity-0 md:group-hover:opacity-100"
                    aria-label={`remover objetivo ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => patch({ objectives: [...values.objectives, ''] })}
                className="flex items-center gap-1.5 text-xs font-semibold text-ceci-brand-strong hover:text-ceci-brand px-3 py-2.5 rounded-xl bg-surface-rose border border-ceci-border-brand cursor-pointer transition-colors active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" /> adicionar objetivo
              </button>
              {values.objectives.every((o) => !o.trim()) && (
                <FieldHint>
                  opcional — objetivo é o que você quer mostrar ter conquistado.
                </FieldHint>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'revisar',
      title: 'revisão',
      headline: 'olha só como ficou',
      subtitle: 'confere antes de guardar — depois dá pra mudar na tela do tcc.',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-ceci-tertiary uppercase tracking-wider">
              situação
            </span>
            <StatusChip tone={STATUS_TONE[values.status]} label={STATUS_LABEL[values.status]} />
          </div>

          <ReviewCard rows={reviewRows} />

          {/* Faltou algo? A revisão é um convite, não uma cobrança — por isso
              o aviso é informação e não bloqueio: dá pra guardar assim mesmo. */}
          {faltando.length > 0 && (
            <p className="flex items-start gap-2 rounded-2xl bg-surface-muted border border-ceci-border-subtle px-4 py-3 text-[11px] leading-relaxed text-ceci-secondary">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-ceci-brand-strong" />
              <span>
                dá pra guardar assim — só que {faltando.join(' e ')}{' '}
                {faltando.length === 1 ? 'fica' : 'ficam'} em branco, e são eles
                que a aba de escrita usa pra te chamar.
              </span>
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <WizardScaffold
        title="meu tcc"
        icon={<GraduationCap className="w-3.5 h-3.5" />}
        iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
        mascote={STEP_MASCOTES[step] ?? 'writing-flow'}
        steps={steps}
        step={step}
        onStepChange={setStep}
        canNext={canNext}
        blockedReason="o título é o começo — conta o tema do seu trabalho"
        saveLabel="guardar tcc ♡"
        onSave={handleSave}
        onClose={closeWizard}
      />

      <Modal
        open={confirmingConclusion}
        onClose={() => setConfirmingConclusion(false)}
        position="bottom"
        className="w-full max-w-sm"
      >
        <div className="bg-canvas rounded-2xl border border-ceci-border-default shadow-xl p-5 text-ceci-primary space-y-3">
          <h3 className="font-display font-bold text-base leading-tight">
            ainda tem {pendingChapters}{' '}
            {pendingChapters === 1 ? 'capítulo' : 'capítulos'} sem pronto
          </h3>
          <p className="text-xs text-ceci-secondary leading-relaxed">
            concluir agora marca o tcc como concluído. dá pra mudar depois, mas bora
            conferir se não ficou nada pra trás?
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingConclusion(false)}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              voltar
            </button>
            <button
              type="button"
              onClick={doSave}
              className="bg-status-warning hover:bg-status-warning-strong text-ceci-primary px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
            >
              concluir mesmo assim
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};