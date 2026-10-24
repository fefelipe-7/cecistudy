// Sheet pequeno de fundo (position="bottom") para criar uma tarefa na tela de
// home. Substitui o formulário inline "adicionar sem nada".
import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { Task } from '@/types';
import { Modal } from '../../ui/Modal';
import { TextInput, DeadlineField } from '../../wizards/wizardFields';
import { ChoiceCardGrid } from '../../ui/ChoiceCardGrid';
import { CourseSelect } from '../../wizards/CourseSelect';
import { PRIORITIES, TASK_CATEGORIES } from '../../wizards/note/constants';
import { hapticSuccess } from '@/lib/haptics';
import { CELEBRACAO, frase } from '@/lib/voice';

interface TaskSheetValues {
  taskTitle: string;
  taskCategory: Task['category'];
  taskPriority: Task['priority'];
  taskDueDate: string;
  courseId: string;
}

interface TaskSheetProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_VALUES: TaskSheetValues = {
  taskTitle: '',
  taskCategory: 'outro',
  taskPriority: 'media',
  taskDueDate: '',
  courseId: '',
};

export const TaskSheet: React.FC<TaskSheetProps> = ({ open, onClose }) => {
  const { courses, handleAddTask, showToast } = useMobileApp();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [triedNext, setTriedNext] = useState(false);

  const [values, setValues] = useState<TaskSheetValues>(EMPTY_VALUES);

  // Reabrir começa do zero — sem o passo e o título do registro anterior.
  useEffect(() => {
    if (!open) {
      setStep(0);
      setTriedNext(false);
      setValues(EMPTY_VALUES);
    }
  }, [open]);

  const patch = useCallback((p: Partial<TaskSheetValues>) => {
    setValues((prev) => ({ ...prev, ...p }));
  }, []);

  const { taskTitle, taskCategory, taskPriority, taskDueDate, courseId } = values;
  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';
  const isLast = step === 3;
  const canNext = taskTitle.trim().length > 0;

  const steps = [
    { id: 'titulo', title: 'o que fazer?', hint: 'anota numa frase' },
    { id: 'categoria', title: 'categoria', hint: 'onde essa tarefa se encaixa' },
    { id: 'prioridade', title: 'prioridade', hint: 'onde começar primeiro' },
    { id: 'prazo', title: 'disciplina e prazo', hint: 'quando precisa estar pronta' },
  ];

  const handleSave = useCallback(() => {
    if (busy || !taskTitle.trim()) return;
    setBusy(true);
    handleAddTask({
      id: 't-' + Date.now(),
      title: taskTitle.trim(),
      disciplineId: courseId || undefined,
      category: taskCategory,
      dueDate: taskDueDate || undefined,
      completed: false,
      priority: taskPriority,
    });
    hapticSuccess();
    showToast(frase(CELEBRACAO, 'tarefaSalva'));
    onClose();
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    busy,
    taskTitle,
    courseId,
    taskCategory,
    taskDueDate,
    taskPriority,
    handleAddTask,
    showToast,
    onClose,
  ]);

  const next = () => {
    if (!canNext) {
      setTriedNext(true);
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => {
    if (step === 0) onClose();
    else setStep((s) => s - 1);
  };

  if (!open) return null;

  const current = steps[step];

  return (
    <Modal
      open={open}
      onClose={onClose}
      position="bottom"
      showGrabber
      className="w-full sm:max-w-lg bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden text-ceci-primary"
    >
      <div className="flex flex-col gap-3 p-4 sm:p-6">
        {/* Cabeçalho compacto */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-lg sm:text-xl leading-snug text-ceci-primary">
              {current.title}
            </h2>
            <p className="text-[12px] text-ceci-secondary leading-relaxed mt-1">{current.hint}</p>
          </div>
        </div>

        {/* Conteúdo do passo */}
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[60vh]">
          {step === 0 && (
            <div className="space-y-2">
              <TextInput
                value={taskTitle}
                onChange={(e) => patch({ taskTitle: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                placeholder="ex: ler capítulo 4 de psicopatologia"
                autoFocus
              />
              {!canNext && triedNext && (
                <p className="text-[11px] text-status-danger-strong">
                  preencha o título para continuar
                </p>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <ChoiceCardGrid
                label="categoria"
                options={TASK_CATEGORIES}
                value={taskCategory}
                onChange={(v) => patch({ taskCategory: v })}
              />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <ChoiceCardGrid
                label="prioridade"
                options={PRIORITIES}
                value={taskPriority}
                onChange={(v) => patch({ taskPriority: v })}
              />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <CourseSelect
                value={courseId}
                onChange={(v) => patch({ courseId: v })}
                placeholder="sem disciplina — tarefa avulsa"
              />
              <DeadlineField
                label="data limite (prazo)"
                value={taskDueDate}
                onChange={(v) => patch({ taskDueDate: v })}
              />
            </div>
          )}
        </div>

        {/* Rodapé com navegação entre steps */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-ceci-border-subtle">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="text-xs font-medium text-ceci-tertiary hover:text-ceci-primary disabled:opacity-40 cursor-pointer"
          >
            {step === 0 ? (
              'fechar'
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> voltar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={isLast ? handleSave : next}
            className="bg-ceci-brand hover:bg-ceci-brand text-ceci-on-brand px-4 py-2.5 rounded-xl text-sm font-semibold tap-interactive cursor-pointer shrink-0"
          >
            {isLast ? 'guardar tarefa ♡' : 'continuar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
