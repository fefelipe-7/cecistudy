import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Pencil,
  Check,
  ArrowRight,
  FileText,
  BookOpen,
  Brain,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SupervisionNotebook } from '../../types';
import { TagField } from '../ui/TagField';
import { DateInput, FieldLabel, TextArea, TextInput } from '../wizards/wizardFields';
import { Mascote } from '../ui/Mascote';

const today = () => new Date().toISOString().split('T')[0];

const emptyEntry = (): SupervisionNotebook => ({
  id: 'sup-' + Date.now(),
  date: today(),
  supervisor: '',
  questions: [],
  conceptIds: [],
  referenceIds: [],
  nextSteps: [],
  selfAssessment: {},
});

/** Cria entidade a partir de um próximo passo (elo "transformar em próximo passo"). */
const useNextStepActions = () => {
  const { handleAddTask, handleAddReading, handleAddSession, showToast } = useApp();
  const toTask = (text: string) => {
    handleAddTask({ id: 'task_' + Date.now(), title: text, completed: false, priority: 'media', category: 'estagio' });
    showToast('virou tarefa ♡');
  };
  const toReading = (text: string) => {
    handleAddReading({ id: 'r-' + Date.now(), title: text, author: '', type: 'artigo', status: 'nao_iniciado' });
    showToast('virou leitura ♡');
  };
  const toFocus = (text: string) => {
    handleAddSession({ id: 'ss-' + Date.now(), topic: text, date: today(), durationMinutes: 30 });
    showToast('virou sessão de foco ♡');
  };
  return { toTask, toReading, toFocus };
};

export const SupervisionView: React.FC = () => {
  const { supervision, addSupervision, updateSupervision, deleteSupervision } = useApp();
  const [form, setForm] = useState<SupervisionNotebook | null>(null);
  const actions = useNextStepActions();

  const openNew = () => setForm(emptyEntry());
  const openEdit = (entry: SupervisionNotebook) => setForm({ ...entry });
  const closeForm = () => setForm(null);

  const save = () => {
    if (!form) return;
    if (form.id.startsWith('sup-') && !supervision.some((s) => s.id === form.id)) {
      addSupervision(form);
    } else {
      updateSupervision(form);
    }
    closeForm();
  };

  const sorted = [...supervision].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-[24px] p-4 bg-white border border-ceci-border-default shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong shrink-0">
            <Compass className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-ceci-primary leading-tight">caderno de supervisão</h2>
            <p className="text-[11px] text-ceci-secondary">teoria, prática e responsabilidade ♡</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-ink text-white px-3.5 py-2 rounded-full text-xs font-semibold shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> anotar
        </button>
      </div>

      {form && (
        <div className="space-y-4 p-4 rounded-[24px] bg-white border border-ceci-border-default shadow-sm">
          <FieldLabel>data</FieldLabel>
          <DateInput value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div>
            <FieldLabel>supervisora / orientadora</FieldLabel>
            <TextInput value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} placeholder="ex: supervisora do estágio básico" />
          </div>
          <div>
            <FieldLabel>perguntas que você levou</FieldLabel>
            <TagField tags={form.questions} onChange={(t) => setForm({ ...form, questions: t })} placeholder="ex: caso de ansiedade" emptyMessage="toque em + para adicionar" />
          </div>
          <div>
            <FieldLabel>antes da supervisão — o que você trouxe?</FieldLabel>
            <TextArea rows={3} value={form.beforeNotes ?? ''} onChange={(e) => setForm({ ...form, beforeNotes: e.target.value })} placeholder="suas hipóteses e dúvidas de preparação..." />
          </div>
          <div>
            <FieldLabel>depois da supervisão — o que ficou?</FieldLabel>
            <TextArea rows={3} value={form.afterNotes ?? ''} onChange={(e) => setForm({ ...form, afterNotes: e.target.value })} placeholder="a decisão que a supervisão produziu..." />
          </div>
          <div>
            <FieldLabel>próximos passos</FieldLabel>
            <TagField tags={form.nextSteps} onChange={(t) => setForm({ ...form, nextSteps: t })} placeholder="ex: revisar capítulo de TCC" emptyMessage="toque em + para adicionar" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <FieldLabel>confiança</FieldLabel>
              <TextArea rows={2} value={form.selfAssessment.confidence ?? ''} onChange={(e) => setForm({ ...form, selfAssessment: { ...form.selfAssessment, confidence: e.target.value } })} placeholder="o que já consigo..." />
            </div>
            <div>
              <FieldLabel>limites</FieldLabel>
              <TextArea rows={2} value={form.selfAssessment.limits ?? ''} onChange={(e) => setForm({ ...form, selfAssessment: { ...form.selfAssessment, limits: e.target.value } })} placeholder="o que ainda hesito..." />
            </div>
            <div>
              <FieldLabel>temas</FieldLabel>
              <TextArea rows={2} value={form.selfAssessment.themes ?? ''} onChange={(e) => setForm({ ...form, selfAssessment: { ...form.selfAssessment, themes: e.target.value } })} placeholder="temas para retomar..." />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} className="flex-1 bg-rose-500 hover:bg-ceci-brand text-white py-2.5 rounded-full text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" /> guardar
            </button>
            <button onClick={closeForm} className="px-4 py-2.5 rounded-full text-xs font-semibold text-ceci-secondary border border-ceci-border-default cursor-pointer">cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((entry) => (
          <div key={entry.id} className="p-4 rounded-2xl bg-white border border-ceci-border-default shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic px-2.5 py-1 rounded-full">
                <Compass className="w-3.5 h-3.5" /> supervisão
              </span>
              <span className="text-[11px] font-medium text-ceci-tertiary">
                {new Date(entry.date).toLocaleDateString('pt-BR')}
                {entry.supervisor ? ` • com ${entry.supervisor}` : ''}
              </span>
            </div>

            {entry.questions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entry.questions.map((q) => (
                  <span key={q} className="px-2.5 py-1 rounded-full bg-surface-muted border border-ceci-border-subtle text-[11px] text-ceci-secondary">{q}</span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-surface-muted border border-ceci-border-default rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1">antes</p>
                <p className="text-xs text-ceci-secondary leading-relaxed">{entry.beforeNotes || '—'}</p>
              </div>
              <div className="bg-surface-rose border border-ceci-border-brand rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-brand-strong mb-1">depois</p>
                <p className="text-xs text-ceci-secondary leading-relaxed">{entry.afterNotes || '—'}</p>
              </div>
            </div>

            {entry.nextSteps.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">próximos passos</p>
                {entry.nextSteps.map((step) => (
                  <div key={step} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-muted border border-ceci-border-subtle">
                    <span className="text-xs text-ceci-primary truncate">{step}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => actions.toTask(step)} title="virar tarefa" className="w-7 h-7 rounded-lg bg-white border border-ceci-border-default flex items-center justify-center text-ceci-primary hover:border-ceci-border-brand cursor-pointer"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => actions.toReading(step)} title="virar leitura" className="w-7 h-7 rounded-lg bg-white border border-ceci-border-default flex items-center justify-center text-ceci-primary hover:border-ceci-border-brand cursor-pointer"><BookOpen className="w-3.5 h-3.5" /></button>
                      <button onClick={() => actions.toFocus(step)} title="virar foco" className="w-7 h-7 rounded-lg bg-white border border-ceci-border-default flex items-center justify-center text-ceci-primary hover:border-ceci-border-brand cursor-pointer"><Brain className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(entry.selfAssessment.confidence || entry.selfAssessment.limits || entry.selfAssessment.themes) && (
              <div className="flex flex-wrap gap-1.5 text-[10px] text-ceci-tertiary">
                {entry.selfAssessment.confidence && <span>💪 {entry.selfAssessment.confidence}</span>}
                {entry.selfAssessment.limits && <span>🚧 {entry.selfAssessment.limits}</span>}
                {entry.selfAssessment.themes && <span>🔎 {entry.selfAssessment.themes}</span>}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button onClick={() => openEdit(entry)} className="flex items-center gap-1 text-[11px] font-semibold text-ceci-secondary hover:text-ceci-primary cursor-pointer">
                <Pencil className="w-3.5 h-3.5" /> editar
              </button>
              <button onClick={() => deleteSupervision(entry.id)} className="flex items-center gap-1 text-[11px] font-semibold text-ceci-brand-strong hover:text-ceci-brand cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> apagar
              </button>
            </div>
          </div>
        ))}

        {supervision.length === 0 && !form && (
          <div className="bg-surface-muted border border-ceci-border-subtle rounded-2xl p-5 text-center space-y-2">
            <Mascote expression="supervision-reflect" className="w-14 h-14 mx-auto" decorative />
            <p className="text-xs text-ceci-secondary">ainda não tem supervisão anotada — que tal registrar a próxima? ♡</p>
          </div>
        )}
      </div>
    </div>
  );
};
