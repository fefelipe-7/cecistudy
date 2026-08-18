import React, { useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2, Sparkles, CalendarPlus2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Task, Exam, ManagedItem } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { createTaskCalendarEvent, createExamCalendarEvent } from '../../lib/calendar';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { Toggle } from '../ui/Toggle';
import {
  DateInput,
  FieldLabel,
  ReviewCard,
  TextInput,
} from './wizardFields';
import { ChoiceCardGrid } from '../ui/ChoiceCardGrid';
import { Picker } from '../ui/Picker';
import { TagField } from '../ui/TagField';

interface TaskExamWizardProps {
  /** Quando definido, pula a escolha entre tarefa e prova (vindo do picker). */
  preset?: 'task' | 'exam';
  /** Quando presente, hidrata o formulário para editar um item existente. */
  editing?: ManagedItem | null;
}

const TASK_CATEGORIES: { value: Task['category']; label: string; emoji?: string }[] = [
  { value: 'leitura', label: 'leitura', emoji: '📚' },
  { value: 'trabalho', label: 'trabalho', emoji: '📝' },
  { value: 'revisao', label: 'revisão', emoji: '🧠' },
  { value: 'estagio', label: 'estágio', emoji: '🩺' },
  { value: 'outro', label: 'outro', emoji: '✨' },
];

const PRIORITIES: { value: Task['priority']; label: string; emoji?: string }[] = [
  { value: 'baixa', label: 'baixa', emoji: '🌱' },
  { value: 'media', label: 'média', emoji: '⚖️' },
  { value: 'alta', label: 'alta', emoji: '🔥' },
];

const today = () => new Date().toISOString().split('T')[0];

export const TaskExamWizard: React.FC<TaskExamWizardProps> = ({ preset, editing }) => {
  const {
    courses,
    tasks,
    exams,
    wizardCourseId,
    handleAddTask,
    handleAddExam,
    handleUpdateTask,
    handleUpdateExam,
    closeWizard,
    showToast,
  } = useApp();
  const editingTask = editing?.kind === 'task' ? tasks.find((t) => t.id === editing.id) : undefined;
  const editingExam = editing?.kind === 'exam' ? exams.find((e) => e.id === editing.id) : undefined;
  const initialKind: 'task' | 'exam' | null =
    editing?.kind === 'task' ? 'task' : editing?.kind === 'exam' ? 'exam' : preset ?? null;
  const [kind, setKind] = useState<'task' | 'exam' | null>(initialKind);
  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState(
    editingTask?.disciplineId ?? editingExam?.courseId ?? (wizardCourseId || courses[0]?.id || '')
  );

  // tarefa
  const [taskTitle, setTaskTitle] = useState(editingTask?.title ?? '');
  const [taskCategory, setTaskCategory] = useState<Task['category']>(editingTask?.category ?? 'leitura');
  const [taskDueDate, setTaskDueDate] = useState(editingTask?.dueDate ?? '');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>(editingTask?.priority ?? 'media');
  const [addToAgenda, setAddToAgenda] = useState(false);

  // prova
  const [examTitle, setExamTitle] = useState(editingExam?.title ?? '');
  const [examDate, setExamDate] = useState(editingExam?.date ?? '');
  const [examWeight, setExamWeight] = useState(editingExam?.weight ?? '1,0');
  const [examTopics, setExamTopics] = useState<string[]>(editingExam?.topics ?? []);

  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';

  const agendaStep: WizardStep = {
    id: 'agenda',
    title: 'agenda',
    headline: 'quer guardar isso direto na sua agenda do Google?',
    content: (
      <div className="space-y-4">
        <div className="rounded-[22px] border border-ceci-border-default bg-white p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong shrink-0">
              <CalendarPlus2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-display font-bold text-base text-ceci-primary">lembrete para a agenda</p>
              <p className="text-xs text-ceci-secondary leading-relaxed">
                adiciona esse compromisso no Google Agenda com o título, data e disciplina.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ceci-primary">
                {addToAgenda ? 'sim, adicionar ao Google Agenda' : 'não, só guardar no app'}
              </p>
            </div>
            <Toggle
              checked={addToAgenda}
              onChange={() => setAddToAgenda((prev) => !prev)}
              label="adicionar ao Google Agenda"
            />
          </div>
        </div>
      </div>
    ),
  };

  const choiceStep: WizardStep = {
    id: 'tipo',
    title: 'tipo',
    headline: 'o que você quer registrar agora?',
    content: (
      <div className="space-y-3">
        <button
          onClick={() => {
            setKind('task');
            setStep(0);
          }}
          className="w-full flex items-center gap-4 p-5 rounded-[24px] bg-white border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <span className="w-12 h-12 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </span>
          <span>
            <span className="block font-display font-bold text-base text-ceci-primary">tarefa</span>
            <span className="block text-xs text-ceci-secondary mt-0.5 leading-snug">
              um compromisso, prazo ou atividade para fazer
            </span>
          </span>
        </button>
        <button
          onClick={() => {
            setKind('exam');
            setStep(0);
          }}
          className="w-full flex items-center gap-4 p-5 rounded-[24px] bg-white border-2 border-ceci-border-default hover:border-ceci-border-academic text-left transition-all active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <span className="w-12 h-12 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong shrink-0">
            <ClipboardList className="w-6 h-6" />
          </span>
          <span>
            <span className="block font-display font-bold text-base text-ceci-primary">
              prova / avaliação pontuada
            </span>
            <span className="block text-xs text-ceci-secondary mt-0.5 leading-snug">
              avaliação que vale nota, com data e peso
            </span>
          </span>
        </button>
      </div>
    ),
  };

  const taskSteps: WizardStep[] = [
    {
      id: 'tarefa-titulo',
      title: 'tarefa',
      headline: 'o que você precisa fazer?',
      content: (
        <div className="space-y-2">
          <TextInput
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="ex: ler capítulo 4 de psicopatologia"
            autoFocus
          />
          <p className="text-[11px] text-ceci-tertiary">
            dá para guardar sem prazo depois, se quiser ✨
          </p>
        </div>
      ),
    },
    {
      id: 'tarefa-categoria',
      title: 'categoria & foco',
      headline: 'como essa tarefa se encaixa no seu dia?',
      content: (
        <div className="space-y-5">
          <ChoiceCardGrid
            label="categoria"
            options={TASK_CATEGORIES}
            value={taskCategory}
            onChange={(v) => setTaskCategory(v)}
          />
          <ChoiceCardGrid
            label="prioridade"
            options={PRIORITIES}
            value={taskPriority}
            onChange={(v) => setTaskPriority(v)}
          />
        </div>
      ),
    },
    {
      id: 'tarefa-prazo',
      title: 'disciplina & prazo',
      headline: 'qual disciplina e quando precisa estar pronta?',
      content: (
        <div className="space-y-4">
          <Picker
            label="disciplina"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
          />
          <div>
            <FieldLabel>data limite (prazo)</FieldLabel>
            <DateInput value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
          </div>
        </div>
      ),
    },
    agendaStep,
    {
      id: 'tarefa-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'tarefa', value: taskTitle.trim() },
            { label: 'categoria', value: taskCategory },
            { label: 'disciplina', value: courseName },
            { label: 'prazo', value: taskDueDate ? new Date(taskDueDate).toLocaleDateString('pt-BR') : 'sem prazo definido' },
            { label: 'prioridade', value: taskPriority },
            { label: 'agenda', value: addToAgenda ? 'sim' : 'não' },
          ]}
        />
      ),
    },
  ];

  const examSteps: WizardStep[] = [
    {
      id: 'prova-titulo',
      title: 'prova',
      headline: 'vamos começar com o básico da avaliação.',
      content: (
        <div className="space-y-4">
          <TextInput
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="ex: prova teórica ii — transtornos de ansiedade"
            autoFocus
          />
          <DateInput value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>
      ),
    },
    {
      id: 'prova-contexto',
      title: 'disciplina & peso',
      headline: 'qual disciplina e quanto vale?',
      content: (
        <div className="space-y-4">
          <Picker
            label="disciplina"
            value={courseId}
            onChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            emptyMessage="ainda não há disciplinas cadastradas."
          />
          <div>
            <FieldLabel>peso</FieldLabel>
            <TextInput
              value={examWeight}
              onChange={(e) => setExamWeight(e.target.value)}
              placeholder="ex: 40% da nota"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'prova-topicos',
      title: 'tópicos',
      headline: 'o que vai cair nessa prova?',
      content: (
        <TagField
          tags={examTopics}
          onChange={setExamTopics}
          placeholder="ex: pensamentos automáticos"
          emptyMessage="não precisa preencher tudo, pode deixar vazio ♡"
        />
      ),
    },
    agendaStep,
    {
      id: 'prova-revisar',
      title: 'revisar',
      headline: 'confere se está tudo certinho ♡',
      content: (
        <ReviewCard
          rows={[
            { label: 'prova', value: examTitle.trim() },
            { label: 'disciplina', value: courseName },
            { label: 'data', value: examDate ? new Date(examDate).toLocaleDateString('pt-BR') : 'a confirmar' },
            { label: 'peso', value: examWeight.trim() || '1,0' },
            { label: 'tópicos', value: examTopics.length ? examTopics.join(' · ') : 'ainda sem tópicos' },
            { label: 'agenda', value: addToAgenda ? 'sim' : 'não' },
          ]}
        />
      ),
    },
  ];

  const steps = kind === null ? [choiceStep] : kind === 'task' ? taskSteps : examSteps;
  const stepsForEdit = editing ? steps.filter((s) => s.id !== 'agenda') : steps;

  const canNext =
    kind === null
      ? false
      : kind === 'task'
        ? taskTitle.trim().length > 0
        : examTitle.trim().length > 0;

  const handleSave = async () => {
    if (editingTask && kind === 'task') {
      handleUpdateTask(editingTask.id, {
        title: taskTitle.trim(),
        disciplineId: courseId,
        category: taskCategory,
        dueDate: taskDueDate || today(),
        priority: taskPriority,
      });
      hapticSuccess();
      closeWizard();
      showToast('tarefa atualizada ♡');
      return;
    }
    if (editingExam && kind === 'exam') {
      handleUpdateExam({
        ...editingExam,
        courseId: courseId || editingExam.courseId,
        title: examTitle.trim(),
        date: examDate || today(),
        weight: examWeight.trim() || '1,0',
        topics: examTopics,
      });
      hapticSuccess();
      closeWizard();
      showToast('prova atualizada ♡');
      return;
    }
    if (kind === 'task') {
      handleAddTask({
        id: 't-' + Date.now(),
        title: taskTitle.trim(),
        disciplineId: courseId,
        category: taskCategory,
        dueDate: taskDueDate || today(),
        completed: false,
        priority: taskPriority,
      });
      if (addToAgenda) {
        const ok = await createTaskCalendarEvent(taskTitle.trim(), courseName, taskDueDate || today());
        if (ok) {
          showToast('tarefa salva e marcada na sua agenda ♡');
        } else {
          showToast('tarefa salva no app — não consegui marcar na agenda ♡');
        }
        hapticSuccess();
        closeWizard();
        return;
      }
    } else {
      handleAddExam({
        id: 'e-' + Date.now(),
        courseId: courseId || 'c1',
        title: examTitle.trim(),
        date: examDate || today(),
        weight: examWeight.trim() || '1,0',
        topics: examTopics,
        completed: false,
      });
      if (addToAgenda) {
        const ok = await createExamCalendarEvent(examTitle.trim(), courseName, examDate || today());
        if (ok) {
          showToast('prova salva e marcada na sua agenda ♡');
        } else {
          showToast('prova salva no app — não consegui marcar na agenda ♡');
        }
        hapticSuccess();
        closeWizard();
        return;
      }
    }
    hapticSuccess();
    closeWizard();
    showToast(kind === 'task' ? 'tarefa guardada no plano ♡' : 'prova anotada no cantinho ♡');
  };

  return (
    <WizardScaffold
      steps={stepsForEdit}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      hideNext={kind === null}
      onSave={handleSave}
      onClose={closeWizard}
      title={
        editing
          ? kind === 'exam'
            ? 'editar prova'
            : 'editar tarefa'
          : kind === null
            ? 'novo registro'
            : kind === 'exam'
              ? 'nova prova / avaliação'
              : 'nova tarefa'
      }
      subtitle={kind === null ? 'prova ou atividade?' : undefined}
      icon={
        kind === 'exam' ? (
          <ClipboardList className="w-3.5 h-3.5" />
        ) : kind === 'task' ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )
      }
      iconClass={
        kind === 'exam'
          ? 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong'
          : 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
      }
      saveLabel={editing ? 'guardar alterações ♡' : kind === 'task' ? 'guardar tarefa ♡' : 'guardar prova ♡'}
    />
  );
};
