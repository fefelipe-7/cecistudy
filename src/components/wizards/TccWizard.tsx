import React, { useMemo, useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { emptyThesisReminderPrefs, type ThesisChapter, type ThesisProject } from '../../types';
import { useMobileApp } from '../../context/mobileApp';
import { useWizardForm } from '../../lib/useWizardForm';
import { formatDateBR } from '../../lib/dateBR';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { DateField, Field, NumberInput, ReviewCard, TextArea, TextInput } from './wizardFields';

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

const STATUS_OPTIONS: { value: ThesisProject['status']; label: string }[] = [
  { value: 'em_andamento', label: 'em andamento' },
  { value: 'revisao', label: 'em revisão' },
  { value: 'concluido', label: 'concluído' },
];

/** Meta de palavras: inteiro ≥ 0 ou `undefined` (vazio = não informado, ≠ 0). */
const parseGoal = (raw: string): number | undefined => {
  const n = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(n) || n < 0) return undefined;
  return n;
};

const STATUS_LABEL: Record<ThesisProject['status'], string> = {
  em_andamento: 'em andamento',
  revisao: 'em revisão',
  concluido: 'concluído',
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

export const TccWizard: React.FC = () => {
  const { tcc, thesisChapters, handleUpdateTcc, closeWizard } = useMobileApp();
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

  const reviewRows = useMemo(
    () => [
      { label: 'título', value: values.title.trim() },
      { label: 'orientador(a)', value: values.advisor.trim() },
      { label: 'área', value: values.field.trim() },
      { label: 'situação', value: STATUS_LABEL[values.status] },
      { label: 'entrega final', value: values.deliveryDate ? formatDateBR(values.deliveryDate) : '—' },
      { label: 'banca', value: values.defenseDate ? formatDateBR(values.defenseDate) : '—' },
      { label: 'meta total de palavras', value: values.wordGoalTotal.trim() || '—' },
      { label: 'meta semanal', value: values.weeklyWordGoal.trim() || '—' },
      { label: 'lembretes', value: values.remindersEnabled ? 'ligados' : 'desligados' },
      { label: 'problema de pesquisa', value: values.problemStatement.trim() || '—' },
      { label: 'objetivos', value: values.objectives.map((o) => o.trim()).filter(Boolean).join(' · ') || '—' },
    ],
    [values],
  );

  const steps: WizardStep[] = [
    {
      id: 'identificacao',
      title: 'identificação',
      headline: 'qual é o tema do seu tcc?',
      subtitle: 'comece como dá — o resto a gente ajusta no caminho.',
      content: (
        <div className="space-y-4">
          <Field label="título do trabalho">
            <TextInput
              value={values.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="ex: a reestruturação cognitiva na ansiedade acadêmica"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="orientador(a)">
              <TextInput
                value={values.advisor}
                onChange={(e) => patch({ advisor: e.target.value })}
                placeholder="ex: profa. camilla"
              />
            </Field>
            <Field label="área">
              <TextInput
                value={values.field}
                onChange={(e) => patch({ field: e.target.value })}
                placeholder="ex: psicologia clínica"
              />
            </Field>
          </div>

          <Field label="situação">
            <SegmentedControl
              variant="rose"
              ariaLabel="situação do tcc"
              className="w-full [&>button]:flex-1"
              value={values.status}
              onChange={(v) => patch({ status: v })}
              options={STATUS_OPTIONS}
            />
          </Field>
        </div>
      ),
    },
    {
      id: 'prazos-metas',
      title: 'prazos e metas',
      headline: 'quando você quer chegar lá?',
      subtitle: 'tudo opcional — datas e metas ajudam o tcc virar plano, não fantasia.',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <DateField
              id="tcc-entrega"
              label="entrega final"
              value={values.deliveryDate}
              onChange={(v) => patch({ deliveryDate: v })}
            />
            <DateField
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
            </Field>
          </div>

          {/* F4.6: o interruptor dos lembretes (§6.4). Desligado é o default —
              ligar pede permissão na hora de agendar. */}
          <label
            htmlFor="tcc-lembretes"
            className="flex items-center gap-2 text-xs text-ceci-secondary cursor-pointer"
          >
            <input
              id="tcc-lembretes"
              type="checkbox"
              checked={values.remindersEnabled}
              onChange={(e) => patch({ remindersEnabled: e.target.checked })}
              className="accent-ceci-brand w-4 h-4"
            />
            lembretes de prazos (capítulos, reuniões, entrega e banca)
          </label>
        </div>
      ),
    },
    {
      id: 'pergunta',
      title: 'a pergunta',
      headline: 'o que o seu tcc quer responder?',
      subtitle: 'um bom problema de pesquisa guia o texto inteiro.',
      content: (
        <div className="space-y-4">
          <Field label="problema de pesquisa">
            <TextArea
              rows={3}
              value={values.problemStatement}
              onChange={(e) => patch({ problemStatement: e.target.value })}
              placeholder="qual pergunta seu tcc quer responder?"
            />
          </Field>

          <Field label="objetivos">
            <div className="space-y-2">
              {values.objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <TextInput
                    value={obj}
                    onChange={(e) => updateObjective(idx, e.target.value)}
                    placeholder={`objetivo ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => patch({ objectives: values.objectives.filter((_, i) => i !== idx) })}
                    className="w-9 h-9 rounded-xl border border-ceci-border-default text-ceci-tertiary hover:text-status-danger-strong hover:border-status-danger flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    aria-label="remover objetivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => patch({ objectives: [...values.objectives, ''] })}
                className="flex items-center gap-1.5 text-xs font-medium text-ceci-brand-strong hover:text-ceci-brand px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> adicionar objetivo
              </button>
            </div>
          </Field>
        </div>
      ),
    },
    {
      id: 'revisar',
      title: 'revisão',
      headline: 'olha só como ficou',
      subtitle: 'confere antes de guardar — depois dá pra mudar na tela do tcc.',
      content: <ReviewCard rows={reviewRows} />,
    },
  ];

  return (
    <>
      <WizardScaffold
        title="meu tcc"
        icon={<GraduationCap className="w-5 h-5" />}
        iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
        mascote="writing-flow"
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