import React, { useEffect, useState } from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { ThesisChapter, ThesisProject, emptyThesisReminderPrefs } from '../../types';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';

interface EditTccModalProps {
  isOpen: boolean;
  tcc: ThesisProject;
  /** Capítulos da coleção (leitura): alimenta a confirmação da D4. */
  chapters: ThesisChapter[];
  onClose: () => void;
  /** Salva o singleton — **uma** escrita (D5: capítulo tem sheet própria). */
  onSave: (updated: ThesisProject) => void;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

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

export const EditTccModal: React.FC<EditTccModalProps> = ({ isOpen, tcc, chapters, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [advisor, setAdvisor] = useState('');
  const [field, setField] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [status, setStatus] = useState<ThesisProject['status']>('em_andamento');
  const [objectives, setObjectives] = useState<string[]>(['']);
  // F3.6: prazos do trabalho e metas. Data civil via `input type=date`
  // (o navegador devolve `YYYY-MM-DD` local); metas **começam vazias** (INV-T7:
  // vazio = não informado, ≠ zero) e rejeitam negativo.
  const [deliveryDate, setDeliveryDate] = useState('');
  const [defenseDate, setDefenseDate] = useState('');
  const [wordGoalTotal, setWordGoalTotal] = useState('');
  const [weeklyWordGoal, setWeeklyWordGoal] = useState('');
  // F4.6: o motor existe (`planThesisReminders` + `syncThesisReminders`);
  // este é o interruptor. Desligado é o default (§6.4) — nada agenda sem ela.
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  // D4: concluir o tcc com capítulo pendente pede confirmação, não bloqueia nem
  // deixa passar batido. Estado local desta sheet; não é domínio.
  const [confirmingConclusion, setConfirmingConclusion] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(tcc.title);
      setAdvisor(tcc.advisor);
      setField(tcc.field);
      setProblemStatement(tcc.problemStatement);
      setStatus(tcc.status);
      setObjectives(tcc.objectives.length ? tcc.objectives : ['']);
      setDeliveryDate(tcc.deliveryDate ?? '');
      setDefenseDate(tcc.defenseDate ?? '');
      setWordGoalTotal(tcc.wordGoalTotal != null ? String(tcc.wordGoalTotal) : '');
      setWeeklyWordGoal(tcc.weeklyWordGoal != null ? String(tcc.weeklyWordGoal) : '');
      setRemindersEnabled(tcc.reminderPrefs?.enabled ?? false);
      setConfirmingConclusion(false);
    }
  }, [isOpen, tcc]);

  const updateAt = <T,>(list: T[], index: number, value: T): T[] =>
    list.map((item, i) => (i === index ? value : item));

  // D4: conta **viva** da coleção — o capítulo tem sheet própria desde a F4.
  const pendingChapters = chapters.filter((ch) => ch.stage !== 'pronto').length;

  const buildDraft = (): ThesisProject => ({
    ...tcc,
    title: title.trim(),
    advisor: advisor.trim(),
    field: field.trim(),
    problemStatement: problemStatement.trim(),
    status,
    objectives: objectives.map((o) => o.trim()).filter(Boolean),
    // Vazio = não informado: o campo some do objeto, não vira zero (INV-T7).
    deliveryDate: deliveryDate || undefined,
    defenseDate: defenseDate || undefined,
    wordGoalTotal: parseGoal(wordGoalTotal),
    weeklyWordGoal: parseGoal(weeklyWordGoal),
    // O interruptor viaja com as preferências (§6.4); o resto dos defaults
    // (dias de antecedência, horário) continua vindo do domínio.
    reminderPrefs: { ...(tcc.reminderPrefs ?? emptyThesisReminderPrefs()), enabled: remindersEnabled },
  });

  const doSave = () => {
    onSave(buildDraft());
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // D4: marcar concluído com capítulo pendente pede confirmação. Sem pendência,
    // salva direto — o caminho feliz não ganha fricção.
    if (status === 'concluido' && pendingChapters > 0) {
      setConfirmingConclusion(true);
      return;
    }
    doSave();
  };

  return (
    <Modal open={isOpen} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary">
        <div className="flex items-center justify-between border-b border-ceci-border-subtle pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-ceci-primary leading-tight">meu tcc</h3>
              <p className="text-xs text-ceci-secondary">plante e cultive seu trabalho com carinho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-full hover:bg-surface-muted text-ceci-secondary transition-colors cursor-pointer"
            aria-label="fechar"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* cabeçalho */}
          <div className="space-y-3">
            <div>
              <label className={labelClass}>título do trabalho</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="ex: a reestruturação cognitiva na ansiedade acadêmica" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>orientador(a)</label>
                <input type="text" value={advisor} onChange={(e) => setAdvisor(e.target.value)} className={inputClass} placeholder="ex: profa. camilla" />
              </div>
              <div>
                <label className={labelClass}>área</label>
                <input type="text" value={field} onChange={(e) => setField(e.target.value)} className={inputClass} placeholder="ex: psicologia clínica" />
              </div>
            </div>

            <div>
              <label className={labelClass}>situação</label>
              <SegmentedControl
                variant="rose"
                ariaLabel="situação do tcc"
                className="w-full [&>button]:flex-1"
                value={status}
                onChange={(v) => setStatus(v)}
                options={STATUS_OPTIONS}
              />
            </div>

            {/* F3.6: prazos do trabalho e metas. `htmlFor`/`id` associam o
                rótulo ao campo — leitor de tela e o teste leem juntos. */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tcc-entrega" className={labelClass}>entrega final</label>
                <input
                  id="tcc-entrega"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="tcc-banca" className={labelClass}>banca</label>
                <input
                  id="tcc-banca"
                  type="date"
                  value={defenseDate}
                  onChange={(e) => setDefenseDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tcc-meta-total" className={labelClass}>meta total de palavras</label>
                <input
                  id="tcc-meta-total"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={wordGoalTotal}
                  onChange={(e) => setWordGoalTotal(e.target.value)}
                  className={inputClass}
                  placeholder="opcional"
                />
              </div>
              <div>
                <label htmlFor="tcc-meta-semanal" className={labelClass}>meta semanal</label>
                <input
                  id="tcc-meta-semanal"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={weeklyWordGoal}
                  onChange={(e) => setWeeklyWordGoal(e.target.value)}
                  className={inputClass}
                  placeholder="opcional"
                />
              </div>
            </div>

            {/* F4.6: o interruptor dos lembretes (§6.4). Desligado é o default —
                ligar pede permissão na hora de agendar (`ensureNotificationPermission`,
                o adaptador cuida; recusa não é erro). */}
            <label
              htmlFor="tcc-lembretes"
              className="flex items-center gap-2 text-xs text-ceci-secondary cursor-pointer"
            >
              <input
                id="tcc-lembretes"
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="accent-ceci-brand w-4 h-4"
              />
              lembretes de prazos (capítulos, reuniões, entrega e banca)
            </label>
          </div>

          {/* problema de pesquisa */}
          <div>
            <label className={labelClass}>problema de pesquisa</label>
            <textarea
              rows={3}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              className={inputClass}
              placeholder="qual pergunta seu tcc quer responder?"
            />
          </div>

          {/* objetivos */}
          <div>
            <label className={labelClass}>objetivos</label>
            <div className="space-y-2">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => setObjectives(updateAt(objectives, idx, e.target.value))}
                    className={inputClass}
                    placeholder={`objetivo ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                    className="w-9 h-9 rounded-xl border border-ceci-border-default text-ceci-tertiary hover:text-status-danger-strong hover:border-status-danger flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    aria-label="remover objetivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setObjectives([...objectives, ''])}
                className="flex items-center gap-1.5 text-xs font-medium text-ceci-brand-strong hover:text-ceci-brand px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> adicionar objetivo
              </button>
            </div>
          </div>

          {/* D5 (SPEC-012 F4): capítulos têm sheet própria (`ChapterSheet`),
              na aba capítulos. Esta ficha é só dos dados do trabalho. */}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ceci-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="submit"
              className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer"
            >
              guardar tcc ♡
            </button>
          </div>
        </form>
      </div>

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
    </Modal>
  );
};
