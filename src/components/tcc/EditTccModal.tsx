import React, { useEffect, useState } from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { TccData } from '../../types';
import { Modal } from '../ui/Modal';

interface EditTccModalProps {
  isOpen: boolean;
  tcc: TccData;
  onClose: () => void;
  onSave: (updated: TccData) => void;
}

const inputClass =
  'w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

const STATUS_OPTIONS: { value: TccData['status']; label: string }[] = [
  { value: 'em_andamento', label: 'em andamento' },
  { value: 'revisao', label: 'em revisão' },
  { value: 'concluido', label: 'concluído' },
];

export const EditTccModal: React.FC<EditTccModalProps> = ({ isOpen, tcc, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [advisor, setAdvisor] = useState('');
  const [field, setField] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [status, setStatus] = useState<TccData['status']>('em_andamento');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [chapters, setChapters] = useState<TccData['chapters']>([]);
  const [references, setReferences] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen) {
      setTitle(tcc.title);
      setAdvisor(tcc.advisor);
      setField(tcc.field);
      setProblemStatement(tcc.problemStatement);
      setStatus(tcc.status);
      setObjectives(tcc.objectives.length ? tcc.objectives : ['']);
      setChapters(tcc.chapters);
      setReferences(tcc.references.length ? tcc.references : ['']);
    }
  }, [isOpen, tcc]);

  const updateAt = <T,>(list: T[], index: number, value: T): T[] =>
    list.map((item, i) => (i === index ? value : item));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      advisor: advisor.trim(),
      field: field.trim(),
      problemStatement: problemStatement.trim(),
      status,
      objectives: objectives.map((o) => o.trim()).filter(Boolean),
      chapters: chapters.filter((c) => c.title.trim()),
      references: references.map((r) => r.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-[24px] border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary">
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
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium tap-interactive cursor-pointer transition-colors ${
                      status === opt.value
                        ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
                        : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
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
                    className="w-9 h-9 rounded-xl border border-ceci-border-default text-ceci-tertiary hover:text-red-700 hover:border-red-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
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

          {/* cronograma de capítulos */}
          <div>
            <label className={labelClass}>cronograma de capítulos</label>
            <div className="space-y-2">
              {chapters.map((ch, idx) => (
                <div key={idx} className="rounded-xl border border-ceci-border-default p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) => setChapters(updateAt(chapters, idx, { ...ch, title: e.target.value }))}
                      className={inputClass}
                      placeholder="título do capítulo"
                    />
                    <button
                      type="button"
                      onClick={() => setChapters(chapters.filter((_, i) => i !== idx))}
                      className="w-9 h-9 rounded-xl border border-ceci-border-default text-ceci-tertiary hover:text-red-700 hover:border-red-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      aria-label="remover capítulo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-ceci-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ch.completed}
                        onChange={(e) => setChapters(updateAt(chapters, idx, { ...ch, completed: e.target.checked }))}
                        className="accent-rose-500 w-4 h-4"
                      />
                      capítulo pronto
                    </label>
                    <input
                      type="date"
                      value={ch.dueDate ?? ''}
                      onChange={(e) => setChapters(updateAt(chapters, idx, { ...ch, dueDate: e.target.value || undefined }))}
                      className="flex-1 bg-white border border-ceci-border-default rounded-xl px-3 py-1.5 text-xs text-ceci-secondary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setChapters([...chapters, { title: '', completed: false }])}
                className="flex items-center gap-1.5 text-xs font-medium text-ceci-brand-strong hover:text-ceci-brand px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> adicionar capítulo
              </button>
            </div>
          </div>

          {/* referências ABNT */}
          <div>
            <label className={labelClass}>referências (abnt)</label>
            <div className="space-y-2">
              {references.map((ref, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setReferences(updateAt(references, idx, e.target.value))}
                    className={inputClass}
                    placeholder="autor, a. (ano). título. editora."
                  />
                  <button
                    type="button"
                    onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                    className="w-9 h-9 rounded-xl border border-ceci-border-default text-ceci-tertiary hover:text-red-700 hover:border-red-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    aria-label="remover referência"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setReferences([...references, ''])}
                className="flex items-center gap-1.5 text-xs font-medium text-ceci-brand-strong hover:text-ceci-brand px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> adicionar referência
              </button>
            </div>
          </div>

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
              className="bg-rose-500 hover:bg-ceci-brand-strong text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer"
            >
              guardar tcc ♡
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};